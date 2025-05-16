import type { Work, WorkFull } from 'api.fluff4.me'
import EndpointWorkCreate from 'endpoint/work/EndpointWorkCreate'
import EndpointWorkUpdate from 'endpoint/work/EndpointWorkUpdate'
import quilt from 'lang/en-nz'
import FormInputLengths from 'model/FormInputLengths'
import Session from 'model/Session'
import Component from 'ui/Component'
import Block from 'ui/component/core/Block'
import Form from 'ui/component/core/Form'
import GradientInput from 'ui/component/core/GradientInput'
import LabelledTable from 'ui/component/core/LabelledTable'
import type RadioButton from 'ui/component/core/RadioButton'
import RadioRow from 'ui/component/core/RadioRow'
import Textarea from 'ui/component/core/Textarea'
import TextEditor from 'ui/component/core/TextEditor'
import TextInput from 'ui/component/core/TextInput'
import { TOAST_SUCCESS } from 'ui/component/core/toast/Toast'
import SupportersOnlyLabel from 'ui/component/SupportersOnlyLabel'
import type { TagsState } from 'ui/component/TagsEditor'
import TagsEditor from 'ui/component/TagsEditor'
import { FilterVanity } from 'ui/component/VanityInput'
import type State from 'utility/State'

export default Component.Builder((component, state: State.Mutable<WorkFull | undefined>) => {
	const block = component.and(Block)
	const form = block.and(Form, block.title)
	form.viewTransition('work-edit-form')

	const type = state.value ? 'update' : 'create'

	form.title.text.use(`view/work-edit/${type}/title`)
	form.setName(quilt[`view/work-edit/${type}/title`]().toString())
	// if (params.type === "create")
	// 	form.description.text.use("view/work-edit/create/description")

	form.submit.textWrapper.text.use(`view/work-edit/${type}/submit`)

	const table = LabelledTable().appendTo(form.content)

	const nameInput = TextInput()
		.setRequired()
		.default.bind(state.map(component, work => work?.name))
		.hint.use('view/work-edit/shared/form/name/hint')
		.setMaxLength(FormInputLengths.map(table, lengths => lengths?.work.name))
	table.label(label => label.text.use('view/work-edit/shared/form/name/label'))
		.content((content, label) => content.append(nameInput.setLabel(label)))

	const vanityInput = TextInput()
		.placeholder.bind(nameInput.state
			.map(component, name => FilterVanity(name)))
		.default.bind(state.map(component, work => work?.vanity))
		.filter(FilterVanity)
		.hint.use('view/work-edit/shared/form/vanity/hint')
		.setMaxLength(FormInputLengths.map(table, lengths => lengths?.work.vanity))
	table.label(label => label.text.use('view/work-edit/shared/form/vanity/label'))
		.content((content, label) => content.append(vanityInput.setLabel(label)))

	const descriptionInput = Textarea()
		.setRequired()
		.default.bind(state.map(component, work => work?.description))
		.hint.use('view/work-edit/shared/form/description/hint')
		.setMaxLength(FormInputLengths.map(table, lengths => lengths?.work.description))
	table.label(label => label.text.use('view/work-edit/shared/form/description/label'))
		.content((content, label) => content.append(descriptionInput.setLabel(label)))

	const synopsisInput = TextEditor()
		.default.bind(state.map(component, work => work?.synopsis.body))
		.hint.use('view/work-edit/shared/form/synopsis/hint')
		.setMaxLength(FormInputLengths.map(table, lengths => lengths?.work.synopsis))
	table.label(label => label.text.use('view/work-edit/shared/form/synopsis/label'))
		.content((content, label) => content.append(synopsisInput.setLabel(label)))

	const tagsEditor = TagsEditor()
		.default.bind(state as State<TagsState>)
		.setMaxLengthGlobal(FormInputLengths.map(table, lengths => lengths?.work_tags.global))
		.setMaxLengthCustom(FormInputLengths.map(table, lengths => lengths?.work_tags.custom))
	table.label(label => label.text.use('view/work-edit/shared/form/tags/label'))
		.content((content, label) => content.append(tagsEditor.setLabel(label)))

	type Visibility = Work['visibility']
	const VisibilityRadioInitialiser = (radio: RadioButton, id: Visibility) => radio
		.text.use(`view/work-edit/shared/form/visibility/${id.toLowerCase() as Lowercase<Visibility>}`)

	const visibility = RadioRow()
		.hint.use('view/work-edit/shared/form/visibility/hint')
		.add('Public', VisibilityRadioInitialiser)
		.add('Patreon', (radio, id) => radio
			.tweak(VisibilityRadioInitialiser, id)
			.style('view-type-chapter-edit-visibility-patreon')
			.style('radio-row-option--hidden'))
		.add('Private', VisibilityRadioInitialiser)
		.default.bind(state.map(component, work => work?.visibility ?? 'Private'))
	table.label(label => label.text.use('view/work-edit/shared/form/visibility/label'))
		.content((content, label) => content.append(visibility.setLabel(label)))

	const cardGradientInput = GradientInput()
		.default.bind(state.map(component, work => work?.card_colours))
	table
		.label(label => label.and(SupportersOnlyLabel).text.use('view/work-edit/shared/form/card-colours/label'))
		.content((content, label) => content.append(cardGradientInput.setLabel(label)))

	block.useGradient(cardGradientInput.value)

	form.event.subscribe('submit', async event => {
		event.preventDefault()

		const name = nameInput.value

		const response = await (() => {
			switch (type) {
				case 'create':
					return EndpointWorkCreate.query({
						body: {
							name,
							vanity: vanityInput.value,
							description: descriptionInput.value,
							synopsis: synopsisInput.useMarkdown(),
							visibility: visibility.selection.value ?? 'Private',
							...tagsEditor.state.value,
							card_colours: cardGradientInput.value.value.length ? cardGradientInput.value.value.slice() : undefined,
						},
					})

				case 'update': {
					if (!state.value)
						return

					const authorVanity = Session.Auth.author.value?.vanity
					if (!authorVanity)
						return new Error('Cannot update a work when not signed in')

					return EndpointWorkUpdate.query({
						params: {
							author: authorVanity,
							vanity: state.value.vanity,
						},
						body: {
							name,
							vanity: vanityInput.value,
							description: descriptionInput.value,
							synopsis: synopsisInput.useMarkdown(),
							visibility: visibility.selection.value ?? 'Private',
							...tagsEditor.state.value,
							card_colours: cardGradientInput.value.value.length ? cardGradientInput.value.value.slice() : undefined,
						},
					})
				}
			}
		})()

		if (toast.handleError(response, quilt => quilt['view/work-edit/shared/toast/failed-to-save'](name)))
			return

		toast.success(TOAST_SUCCESS, quilt => quilt['view/work-edit/shared/toast/saved'](name))
		state.value = response?.data
	})

	return form
})
