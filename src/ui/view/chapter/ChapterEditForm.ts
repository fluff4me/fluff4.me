import type { Chapter, ChapterCreateBody, ChapterLite } from 'api.fluff4.me'
import EndpointChapterCreate from 'endpoint/chapter/EndpointChapterCreate'
import EndpointChapterUpdate from 'endpoint/chapter/EndpointChapterUpdate'
import type { WorkParams } from 'endpoint/work/EndpointWorkGet'
import quilt from 'lang/en-nz'
import FormInputLengths from 'model/FormInputLengths'
import Session from 'model/Session'
import Component from 'ui/Component'
import Block from 'ui/component/core/Block'
import Dropdown from 'ui/component/core/Dropdown'
import Form from 'ui/component/core/Form'
import LabelledTable from 'ui/component/core/LabelledTable'
import Placeholder from 'ui/component/core/Placeholder'
import type RadioButton from 'ui/component/core/RadioButton'
import RadioRow from 'ui/component/core/RadioRow'
import TextEditor from 'ui/component/core/TextEditor'
import TextInput from 'ui/component/core/TextInput'
import { TOAST_SUCCESS } from 'ui/component/core/toast/Toast'
import type { TagsState } from 'ui/component/TagsEditor'
import TagsEditor from 'ui/component/TagsEditor'
import Objects from 'utility/Objects'
import State from 'utility/State'

interface ChapterEditFormExtensions {
	hasUnsavedChanges (): boolean
	save (): Promise<void>
}

type ChapterEditForm = Form & Block & ChapterEditFormExtensions

export default Component.Builder((component, state: State.Mutable<Chapter | undefined>, workParams: WorkParams): ChapterEditForm => {
	const block = component.and(Block)
	const form = block.and(Form, block.title)
	form.viewTransition('chapter-edit-form')

	const formType = state.value ? 'update' : 'create'

	form.title.text.use(`view/chapter-edit/${formType}/title`)
	form.setName(quilt[`view/chapter-edit/${formType}/title`]().toString())
	// if (params.type === "create")
	// 	form.description.text.use("view/work-edit/create/description")

	form.submit.textWrapper.text.use(`view/chapter-edit/${formType}/submit`)

	const table = LabelledTable().appendTo(form.content)

	const nameInput = TextInput()
		.setRequired()
		.default.bind(state.map(component, work => work?.name))
		.hint.use('view/chapter-edit/shared/form/name/hint')
		.setMaxLength(FormInputLengths.value?.chapter.name)
	table.label(label => label.text.use('view/chapter-edit/shared/form/name/label'))
		.content((content, label) => content.append(nameInput.setLabel(label)))

	const type = RadioRow()
		.add('numbered', radio => radio
			.text.use('view/chapter-edit/shared/form/type/numbered')
			.append(Placeholder()
				.style('view-type-chapter-edit-type-example')
				.text.use(quilt => quilt['view/chapter-edit/shared/form/type/numbered/example'](state.value?.index ?? 'N')))
		)
		.add('other', radio => radio
			.text.use('view/chapter-edit/shared/form/type/other')
			.append(Placeholder()
				.style('view-type-chapter-edit-type-example')
				.text.use('view/chapter-edit/shared/form/type/other/example'))
		)
		.default.bind(state.map(component, chapter => chapter?.is_numbered === false ? 'other' : 'numbered'))
	table.label(label => label.text.use('view/chapter-edit/shared/form/type/label'))
		.content((content, label) => content.append(type.setLabel(label)))

	const tagsEditor = TagsEditor()
		.default.bind(state as State<TagsState>)
		.setMaxLengthGlobal(FormInputLengths.value?.work_tags.global)
		.setMaxLengthCustom(FormInputLengths.value?.work_tags.custom)
	table.label(label => label.text.use('view/chapter-edit/shared/form/tags/label'))
		.content((content, label) => content.append(tagsEditor.setLabel(label)))

	const notesBeforeInput = TextEditor()
		.default.bind(state.map(component, chapter => chapter?.notes_before ?? undefined))
		.hint.use('view/chapter-edit/shared/form/notes/hint')
		.setMaxLength(FormInputLengths.value?.chapter.notes)
		.setMinimalByDefault()
	table.label(label => label.text.use('view/chapter-edit/shared/form/notes/label'))
		.content((content, label) => content.append(notesBeforeInput.setLabel(label)))

	const bodyInput = TextEditor()
		.default.bind(state.map(component, chapter => chapter?.body ?? undefined))
		.hint.use('view/chapter-edit/shared/form/body/hint')
	table.label(label => label.text.use('view/chapter-edit/shared/form/body/label'))
		.content((content, label) => content.append(bodyInput.setLabel(label)))

	const notesAfterInput = TextEditor()
		.default.bind(state.map(component, chapter => chapter?.notes_after ?? undefined))
		.hint.use('view/chapter-edit/shared/form/notes/hint')
		.setMaxLength(FormInputLengths.value?.chapter.notes)
		.setMinimalByDefault()
	table.label(label => label.text.use('view/chapter-edit/shared/form/notes/label'))
		.content((content, label) => content.append(notesAfterInput.setLabel(label)))

	type Visibility = ChapterLite['visibility']
	const VisibilityRadioInitialiser = (radio: RadioButton, id: Visibility) => radio
		.text.use(`view/chapter-edit/shared/form/visibility/${id.toLowerCase() as Lowercase<Visibility>}`)

	const campaign = Session.Auth.author.map(component, author => author?.patreon_campaign)
	const visibility = RadioRow()
		.add('Public', VisibilityRadioInitialiser)
		.add('Patreon', (radio, id) => radio
			.tweak(VisibilityRadioInitialiser, id)
			.style('view-type-chapter-edit-visibility-patreon')
			.style.bind(campaign.falsy, 'radio-row-option--hidden'))
		.add('Private', VisibilityRadioInitialiser)
		.default.bind(state.map(component, chapter => chapter?.visibility ?? 'Private'))
	table.label(label => label.text.use('view/chapter-edit/shared/form/visibility/label'))
		.content((content, label) => content.append(visibility.setLabel(label)))

	const visibilityStateIsPatreon = visibility.selection.map(component, selection => selection === 'Patreon')
	const tiers = State.Use(component, { campaign, visibilityStateIsPatreon })
		.map(component, ({ campaign, visibilityStateIsPatreon }) =>
			campaign && visibilityStateIsPatreon ? campaign.tiers : undefined)

	const threshold = Dropdown()
		.tweak(dropdown => {
			tiers.use(dropdown, tiers => {
				dropdown.clear()
				for (const tier of tiers ?? [])
					dropdown.add(tier.tier_id, radio => radio.text.set(`${tier.tier_name}: $${(tier.amount / 100).toFixed(2)}`))
			})
		})
	table.label(label => label.text.use('view/chapter-edit/shared/form/visibility-patreon-tier/label'))
		.if(tiers.truthy)
		.content((content, label) => content.append(threshold.setLabel(label)))

	form.event.subscribe('submit', async event => {
		event.preventDefault()
		await save()
	})

	return form.extend<ChapterEditFormExtensions>(component => ({
		hasUnsavedChanges,
		save,
	}))

	function getFormData () {
		return {
			name: nameInput.value,
			...tagsEditor.state.value,
			body: bodyInput.useMarkdown(),
			notes_before: notesBeforeInput.useMarkdown(),
			notes_after: notesAfterInput.useMarkdown(),
			visibility: visibility.selection.value ?? 'Private',
			is_numbered: type.selection.value === 'numbered',
		} satisfies ChapterCreateBody
	}

	function hasUnsavedChanges () {
		if (!state.value)
			return true

		const data = getFormData()

		const basicFields = Objects.keys(getFormData()).filter(key => key !== 'custom_tags' && key !== 'global_tags')
		for (const field of basicFields) {
			let dataValue = data[field]
			let stateValue = state.value[field]

			if (dataValue === '') stateValue ??= ''
			if (stateValue === '') dataValue ??= ''

			if (typeof dataValue === 'string') dataValue = dataValue.trim()
			if (typeof stateValue === 'string') stateValue = stateValue.trim()

			if (dataValue !== stateValue)
				return true
		}

		if ((data.custom_tags?.length ?? 0) !== (state.value.custom_tags?.length ?? 0))
			return true

		if (data.custom_tags?.some(tag => !state.value?.custom_tags?.includes(tag)))
			return true

		if ((data.global_tags?.length ?? 0) !== (state.value.global_tags?.length ?? 0))
			return true

		if (data.global_tags?.some(tag => !state.value?.global_tags?.includes(tag)))
			return true

		return false
	}

	async function save () {
		const response = await (() => {
			switch (formType) {
				case 'create':
					return EndpointChapterCreate.query({
						params: workParams,
						body: getFormData(),
					})

				case 'update': {
					if (!state.value)
						return

					const authorVanity = Session.Auth.author.value?.vanity
					if (!authorVanity)
						return new Error('Cannot update a work when not signed in')

					return EndpointChapterUpdate.query({
						params: {
							author: workParams.author,
							work: workParams.vanity,
							url: state.value.url,
						},
						body: getFormData(),
					})
				}
			}
		})()

		if (toast.handleError(response, 'view/chapter-edit/shared/toast/failed-to-save'))
			return

		toast.success(TOAST_SUCCESS, 'view/chapter-edit/shared/toast/saved')
		state.value = response?.data
	}
})
