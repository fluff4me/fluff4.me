import EndpointAuthorCreate from 'endpoint/author/EndpointAuthorCreate'
import EndpointAuthorUpdate from 'endpoint/author/EndpointAuthorUpdate'
import quilt from 'lang/en-nz'
import FormInputLengths from 'model/FormInputLengths'
import Session from 'model/Session'
import Component from 'ui/Component'
import Block from 'ui/component/core/Block'
import Checkbutton from 'ui/component/core/Checkbutton'
import GradientText from 'ui/component/core/ext/GradientText'
import Form from 'ui/component/core/Form'
import GradientInput from 'ui/component/core/GradientInput'
import LabelledTable from 'ui/component/core/LabelledTable'
import LabelledTextInputBlock from 'ui/component/core/LabelledTextInputBlock'
import TextEditor from 'ui/component/core/TextEditor'
import TextInput from 'ui/component/core/TextInput'
import { TOAST_SUCCESS } from 'ui/component/core/toast/Toast'
import SupportersOnlyLabel from 'ui/component/SupportersOnlyLabel'
import VanityInput, { FilterVanity } from 'ui/component/VanityInput'

type AccountViewFormType =
	| 'create'
	| 'update'

export default Component.Builder('form', (component, type: AccountViewFormType) => {
	const block = component.and(Block)
	const form = block.and(Form, block.title) as Component<HTMLFormElement> & Block & Form
	form.viewTransition('account-form')

	form.title.text.use(`view/account/${type}/title`)
	form.setName(quilt[`view/account/${type}/title`]().toString())
	if (type === 'create')
		form.description.text.use('view/account/create/description')

	form.submit.textWrapper.text.use(`view/account/${type}/submit`)

	const table = LabelledTable().appendTo(form.content)

	const nameInput = TextInput()
		.setRequired()
		.default.bind(Session.Auth.author.map(component, author => author?.name))
		.hint.use('view/account/name/hint')
		.setMaxLength(FormInputLengths.map(table, lengths => lengths?.author?.name))
	const nameDisplay = Component().and(GradientText).text.bind(nameInput.state).style('text-input-display')
	table.label(label => label.text.use('view/account/name/label'))
		.content((content, label) => content.append(nameInput
			.setLabel(label)
			.style('text-input--wrapped--hidden')
			.wrap()
			.append(nameDisplay)
		))

	const gradientInput = GradientInput()
		.default.bind(Session.Auth.author.map(component, author => author?.supporter?.username_colours))
	table
		.label(label => label.and(SupportersOnlyLabel).text.use('view/account/vanity-colours/label'))
		.content((content, label) => content.append(gradientInput.setLabel(label)))

	nameDisplay.useGradient(gradientInput.value)

	const vanityInput = VanityInput()
		.placeholder.bind(nameInput.state
			.map(component, name => FilterVanity(name)))
		.default.bind(Session.Auth.author.map(component, author => author?.vanity))
		.hint.use('view/account/vanity/hint')
		.setMaxLength(FormInputLengths.map(table, lengths => lengths?.author?.vanity))
	table.label(label => label.text.use('view/account/vanity/label'))
		.content((content, label) => content.append(vanityInput.setLabel(label)))

	const pronounsInput = TextInput()
		.default.bind(Session.Auth.author.map(component, author => author?.pronouns))
		.hint.use('view/account/pronouns/hint')
		.setMaxLength(FormInputLengths.map(table, lengths => lengths?.author?.pronouns))
	table.label(label => label.text.use('view/account/pronouns/label'))
		.content((content, label) => content.append(pronounsInput.setLabel(label)))

	const descriptionInput = TextEditor()
		.default.bind(Session.Auth.author.map(component, author => author?.description.body))
		.hint.use('view/account/description/hint')
		.setMaxLength(FormInputLengths.map(table, lengths => lengths?.author?.description))
	table.label(label => label.text.use('view/account/description/label'))
		.content((content, label) => content.append(descriptionInput.setLabel(label)))

	let supportLinkInput!: TextInput
	let supportMessageInput!: TextInput
	LabelledTextInputBlock()
		.style('labelled-row--in-labelled-table')
		.ariaLabel.use('view/account/external-link/label')
		.label(label => label.text.use('view/account/external-link/label'))
		.input(input => supportLinkInput = input
			.default.bind(Session.Auth.author.map(component, author => author?.support_link))
			.hint.use('view/account/external-link/hint')
			.setMaxLength(FormInputLengths.map(table, lengths => lengths?.author?.support_link)))
		.label(label => label.text.use('view/account/external-label/label'))
		.input(input => supportMessageInput = input
			.default.bind(Session.Auth.author.map(component, author => author?.support_message))
			.hint.use('view/account/external-label/hint')
			.setMaxLength(FormInputLengths.map(table, lengths => lengths?.author?.support_message)))
		.appendTo(table)

	const cardGradientInput = GradientInput()
		.default.bind(Session.Auth.author.map(component, author => author?.supporter?.card_colours))
	table
		.label(label => label.and(SupportersOnlyLabel).text.use('view/account/card-colours/label'))
		.content((content, label) => content.append(cardGradientInput.setLabel(label)))

	block.useGradient(cardGradientInput.value)

	let sixteenPlus!: Checkbutton
	let eighteenPlus!: Checkbutton
	table.label(label => label.text.use('view/account/age/label'))
		.content((content, label) => {
			label.setRequired()

			content.style('view-type-account-form-age-row')

			sixteenPlus = Checkbutton()
				.text.use('view/account/age/option/sixteen-plus')
				.setChecked(!!Session.Auth.author.value)
				.appendTo(content)

			eighteenPlus = Checkbutton()
				.text.use('view/account/age/option/eighteen-plus')
				.setChecked(Session.Auth.author.value?.age === 'eighteen_plus')
				.appendToWhen(sixteenPlus.checked, content)

			sixteenPlus.checked.use(content, checked => {
				sixteenPlus.setCustomInvalidMessage(checked ? undefined : quilt => quilt['view/account/age/invalid']())
				if (!checked) eighteenPlus.setChecked(false)
			})
		})

	if (type === 'create')
		table.label(label => label.text.use('view/account/terms/label'))
			.content((content, label) => {
				label.setRequired()

				const terms = Checkbutton()
					.text.use('view/account/terms/button')
					.appendTo(content)

				terms.checked.use(content, checked => {
					terms.setCustomInvalidMessage(checked ? undefined : quilt => quilt['view/account/terms/invalid']())
				})
			})

	form.event.subscribe('submit', async event => {
		event.preventDefault()

		const age = sixteenPlus.checked.value ? (eighteenPlus.checked.value ? 'eighteen_plus' : 'sixteen_plus') : undefined
		if (!age)
			return

		const response = await (type === 'create' ? EndpointAuthorCreate : EndpointAuthorUpdate).query({
			body: {
				name: nameInput.value,
				vanity: vanityInput.value,
				description: descriptionInput.useMarkdown(),
				pronouns: pronounsInput.value,
				support_link: supportLinkInput.value,
				support_message: supportMessageInput.value,
				username_colours: gradientInput.value.value.slice(),
				card_colours: cardGradientInput.value.value.slice(),
				age,
			},
		})

		if (toast.handleError(response, 'view/account/toast/failed-to-save'))
			return

		toast.success(TOAST_SUCCESS, 'view/account/toast/saved')
		Session.setAuthor(response.data)
	})

	return form
})
