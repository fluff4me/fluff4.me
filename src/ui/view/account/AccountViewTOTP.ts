import EndpointTOTPCreate from "endpoint/auth/EndpointTOTPCreate"
import EndpointTOTPDelete from "endpoint/auth/EndpointTOTPDelete"
import EndpointTOTPEnable from "endpoint/auth/EndpointTOTPEnable"
import Session from "model/Session"
import Component from "ui/Component"
import Block from "ui/component/core/Block"
import Button from "ui/component/core/Button"
import CodeInput from "ui/component/core/CodeInput"
import ConfirmDialog from "ui/component/core/ConfirmDialog"
import Loading from "ui/component/core/Loading"
import Paragraph from "ui/component/core/Paragraph"
import Placeholder from "ui/component/core/Placeholder"
import TextInput from "ui/component/core/TextInput"
import State from "utility/State"


export default Component.Builder((component, session: State<Session | undefined>) => {
	const block = component.and(Block)

	block.title.text.use('view/account/totp/title')

	if (session.value?.author?.totp_state === 'disabled')
		// need to restart totp setup since we don't have the qr code uri anymore
		delete session.value.author.totp_state

	const hasStartedSettingUpTOTP = State(false)
	const state = State.Map(block, [session, hasStartedSettingUpTOTP], (session, hasStarted) => {
		if (!session)
			return undefined

		if (!session.author)
			return session.partial_login?.totp_required ? 'login' : undefined

		const state = session.author.totp_state
		if (state === 'enabled')
			return 'secured'

		if (state !== 'disabled')
			return 'none'

		if (hasStarted)
			return 'enter'

		return 'starting'
	})

	block.content.style.bindFrom(state.mapManual(state => !state ? undefined
		: `view-type-account-totp-content--state-${state}` as const))

	const guide = Component()
		.style('view-type-account-totp-content-guide')
		.append(Paragraph().append(Placeholder()
			.text.bind(state.mapManual(state =>
				!state ? '' : quilt => quilt[`view/account/totp/${state}/description`]()
			))))
		.appendTo(block.content)

	////////////////////////////////////
	//#region None

	Button()
		.type('primary')
		.text.use('view/account/totp/none/action/setup')
		.event.subscribe('click', async () => {
			if (state.value !== 'none')
				return

			const response = await EndpointTOTPCreate.query()
			if (toast.handleError(response))
				return

			const author = Session.state.value?.author
			if (!author)
				return

			const uri = response.data.uri
			const secretKey = new URL(uri).searchParams.get('secret')
			if (!secretKey)
				return

			author.totp_state = 'disabled'
			Session.state.emit()

			keyHidden.value = true
			secret.value = secretKey
			qrcodeURL.value = await QRCode.toDataURL(uri, { color: { dark: '#fff', light: '#0000' } })
		})
		.appendToWhen(state.equals('none'), block.footer.right)

	//#endregion
	////////////////////////////////////

	////////////////////////////////////
	//#region Starting

	const qrcodeURL = State<string | undefined>(undefined)
	const secret = State<string | undefined>(undefined)
	Loading()
		.style('view-type-account-totp-qrcode')
		.appendToWhen(State.Every(component, state.equals('starting'), qrcodeURL.falsy), block.content)

	Component('img')
		.attributes.bind('src', qrcodeURL)
		.style('view-type-account-totp-qrcode')
		.appendToWhen(State.Every(component, state.equals('starting'), qrcodeURL.truthy), block.content)

	const shouldShowKeyGuide = State.Every(component, state.equals('starting'), secret.truthy)
	const keyHidden = State(true)
	Paragraph()
		.append(Placeholder()
			.text.use('view/account/totp/starting/or-enter-key'))
		.append(Button()
			.type('inline', 'primary')
			.text.bind(keyHidden.mapManual(hidden => quilt => quilt[hidden ? 'view/account/totp/starting/action/reveal-key' : 'view/account/totp/starting/action/hide-key']()))
			.event.subscribe('click', () =>
				keyHidden.value = !keyHidden.value
			))
		.appendToWhen(shouldShowKeyGuide, guide)

	TextInput()
		.style('view-type-account-totp-key')
		.attributes.bind(keyHidden, 'inert')
		.style.bind(keyHidden, 'view-type-account-totp-key--disabled')
		.placeholder.use('view/account/totp/starting/key-placeholder')
		.setReadonly()
		.tweak(input => State.UseManual({ keyHidden, secret })
			.useManual(({ secret, keyHidden }) => input.value = keyHidden ? '' : secret ?? ''))
		.appendToWhen(shouldShowKeyGuide, guide)

	Button()
		.text.use('view/account/totp/starting/action/cancel')
		.event.subscribe('click', async () => {
			if (state.value !== 'starting')
				return

			EndpointTOTPDelete.query()
			const author = Session.state.value?.author
			if (!author)
				return

			delete author.totp_state
			Session.state.emit()
			hasStartedSettingUpTOTP.value = false
			qrcodeURL.value = undefined
			secret.value = undefined
		})
		.appendToWhen(state.equals('starting'), block.footer.right)

	Button()
		.type('primary')
		.text.use('view/account/totp/starting/action/continue')
		.event.subscribe('click', () => {
			if (state.value !== 'starting')
				return

			hasStartedSettingUpTOTP.value = true
		})
		.appendToWhen(state.equals('starting'), block.footer.right)

	//#endregion
	////////////////////////////////////

	////////////////////////////////////
	//#region Enter

	const codeInput: CodeInput = CodeInput()
		.event.subscribe('Enter', () => enableTOTPButton.element.click())
		.appendToWhen(state.equals('enter'), block.content)

	Button()
		.text.use('view/account/totp/enter/action/cancel')
		.event.subscribe('click', async () => {
			if (state.value !== 'enter')
				return

			EndpointTOTPDelete.query()
			const author = Session.state.value?.author
			if (!author)
				return

			delete author.totp_state
			Session.state.emit()
			hasStartedSettingUpTOTP.value = false
			qrcodeURL.value = undefined
			secret.value = undefined
			codeInput.clear()
		})
		.appendToWhen(state.equals('enter'), block.footer.right)

	const enableTOTPButton = Button()
		.type('primary')
		.text.use('view/account/totp/enter/action/enable')
		.bindDisabled(codeInput.valid.falsy, 'invalid code')
		.event.subscribe('click', async () => {
			if (state.value !== 'enter')
				return

			if (!codeInput.valid.value)
				return

			const dangerToken = await ConfirmDialog.ensureDangerToken(component, { dangerToken: 'totp-enable' })
			if (!dangerToken)
				return

			const response = await EndpointTOTPEnable.query({ body: { token: codeInput.state.value } })
			if (toast.handleError(response))
				return

			const author = Session.state.value?.author
			if (!author)
				return

			author.totp_state = 'enabled'
			Session.state.emit()
		})
		.appendToWhen(state.equals('enter'), block.footer.right)

	//#endregion
	////////////////////////////////////

	////////////////////////////////////
	//#region Secured

	Button()
		.text.use('view/account/totp/secured/action/disable')
		.event.subscribe('click', async () => {
			if (state.value !== 'secured')
				return

			const dangerToken = await ConfirmDialog.ensureDangerToken(component, { dangerToken: 'totp-delete' })
			if (!dangerToken)
				return

			const response = await EndpointTOTPDelete.query()
			if (toast.handleError(response))
				return

			delete Session.state.value?.author?.totp_state
			Session.state.emit()
			hasStartedSettingUpTOTP.value = false
			qrcodeURL.value = undefined
			secret.value = undefined
			codeInput.clear()
		})
		.appendToWhen(state.equals('secured'), block.footer.right)

	//#endregion
	////////////////////////////////////

	return block
})