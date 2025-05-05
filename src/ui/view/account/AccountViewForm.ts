import EndpointAuthorCreate from 'endpoint/author/EndpointAuthorCreate'
import EndpointAuthorUpdate from 'endpoint/author/EndpointAuthorUpdate'
import quilt from 'lang/en-nz'
import FormInputLengths from 'model/FormInputLengths'
import Session from 'model/Session'
import Component from 'ui/Component'
import Block from 'ui/component/core/Block'
import GradientText from 'ui/component/core/ext/GradientText'
import Form from 'ui/component/core/Form'
import GradientInput from 'ui/component/core/GradientInput'
import LabelledTable from 'ui/component/core/LabelledTable'
import LabelledTextInputBlock from 'ui/component/core/LabelledTextInputBlock'
import TextEditor from 'ui/component/core/TextEditor'
import TextInput from 'ui/component/core/TextInput'
import { TOAST_SUCCESS } from 'ui/component/core/toast/Toast'
import VanityInput, { FilterVanity } from 'ui/component/VanityInput'

type AccountViewFormType =
	| 'create'
	| 'update'

export default Component.Builder((component, type: AccountViewFormType) => {
	const block = component.and(Block)
	const form = block.and(Form, block.title)
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
		.setMaxLength(FormInputLengths.map(table, lengths => lengths?.author.name))
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
		.label(label => label
			.style('label--supporter')
			.append(Component().style('label-supporter').text.use('shared/term/supporters'))
			.append(Component().text.use('view/account/vanity-colours/label'))
		)
		.content((content, label) => content.append(gradientInput.setLabel(label)))

	nameDisplay.useGradient(gradientInput.value)

	const vanityInput = VanityInput()
		.placeholder.bind(nameInput.state
			.map(component, name => FilterVanity(name)))
		.default.bind(Session.Auth.author.map(component, author => author?.vanity))
		.hint.use('view/account/vanity/hint')
		.setMaxLength(FormInputLengths.map(table, lengths => lengths?.author.vanity))
	table.label(label => label.text.use('view/account/vanity/label'))
		.content((content, label) => content.append(vanityInput.setLabel(label)))

	const pronounsInput = TextInput()
		.default.bind(Session.Auth.author.map(component, author => author?.pronouns))
		.hint.use('view/account/pronouns/hint')
		.setMaxLength(FormInputLengths.map(table, lengths => lengths?.author.pronouns))
	table.label(label => label.text.use('view/account/pronouns/label'))
		.content((content, label) => content.append(pronounsInput.setLabel(label)))

	const descriptionInput = TextEditor()
		.default.bind(Session.Auth.author.map(component, author => author?.description.body))
		.hint.use('view/account/description/hint')
		.setMaxLength(FormInputLengths.map(table, lengths => lengths?.author.description))
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
			.setMaxLength(FormInputLengths.map(table, lengths => lengths?.author.support_link)))
		.label(label => label.text.use('view/account/external-label/label'))
		.input(input => supportMessageInput = input
			.default.bind(Session.Auth.author.map(component, author => author?.support_message))
			.hint.use('view/account/external-label/hint')
			.setMaxLength(FormInputLengths.map(table, lengths => lengths?.author.support_message)))
		.appendTo(table)

	form.event.subscribe('submit', async event => {
		event.preventDefault()

		const response = await (type === 'create' ? EndpointAuthorCreate : EndpointAuthorUpdate).query({
			body: {
				name: nameInput.value,
				vanity: vanityInput.value,
				description: descriptionInput.useMarkdown(),
				pronouns: pronounsInput.value,
				support_link: supportLinkInput.value,
				support_message: supportMessageInput.value,
				username_colours: gradientInput.value.value.length ? gradientInput.value.value.slice() : undefined,
			},
		})

		if (toast.handleError(response, 'view/account/toast/failed-to-save'))
			return

		toast.success(TOAST_SUCCESS, 'view/account/toast/saved')
		Session.setAuthor(response.data)
	})

	return form
})
