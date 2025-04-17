import type { Chapter, ChapterCreateBody, ChapterLite } from 'api.fluff4.me'
import EndpointChapterCreate from 'endpoint/chapter/EndpointChapterCreate'
import EndpointChapterUpdate from 'endpoint/chapter/EndpointChapterUpdate'
import type { WorkParams } from 'endpoint/work/EndpointWorkGet'
import quilt from 'lang/en-nz'
import FormInputLengths from 'model/FormInputLengths'
import Patreon from 'model/Patreon'
import Session from 'model/Session'
import Component from 'ui/Component'
import Block from 'ui/component/core/Block'
import { CheckDropdown } from 'ui/component/core/Dropdown'
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
import Arrays, { NonNullish } from 'utility/Arrays'
import Functions from 'utility/Functions'
import Objects from 'utility/Objects'
import State from 'utility/State'

////////////////////////////////////
//#region Form Content

interface ChapterEditFormContentExtensions {
	readonly numbered: RadioRow<'numbered' | 'other'>
	hasUnsavedChanges (): boolean
	getFormData (): ChapterCreateBody
}

interface ChapterEditFormContent extends LabelledTable, ChapterEditFormContentExtensions { }

const ChapterEditFormContent = Component.Builder((component, state: State.Mutable<ChapterData | undefined>): ChapterEditFormContent => {
	const table = component.and(LabelledTable)

	const nameInput = TextInput()
		.setRequired()
		.default.bind(state.map(component, work => work?.name))
		.hint.use('view/chapter-edit/shared/form/name/hint')
		.setMaxLength(FormInputLengths.map(table, lengths => lengths?.chapter.name))
	table.label(label => label.text.use('view/chapter-edit/shared/form/name/label'))
		.content((content, label) => content.append(nameInput.setLabel(label)))

	const type = RadioRow()
		.add('numbered', radio => radio
			.text.use('view/chapter-edit/shared/form/type/numbered')
			.append(Placeholder()
				.style('view-type-chapter-edit-type-example')
				.text.use(quilt => quilt['view/chapter-edit/shared/form/type/numbered/example'](Functions.resolve(() => {
					const chapter = getChapter(state.value)
					if (!chapter)
						return 'N'

					const url = chapter.url
					if (url.includes('.'))
						return parseInt(url) + 1

					return parseInt(url)
				}))))
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
		.setMaxLengthGlobal(FormInputLengths.map(table, lengths => lengths?.work_tags.global))
		.setMaxLengthCustom(FormInputLengths.map(table, lengths => lengths?.work_tags.custom))
	table.label(label => label.text.use('view/chapter-edit/shared/form/tags/label'))
		.content((content, label) => content.append(tagsEditor.setLabel(label)))

	const notesBeforeInput = TextEditor()
		.default.bind(state.map(component, chapter => chapter?.notes_before ?? undefined))
		.hint.use('view/chapter-edit/shared/form/notes/hint')
		.setMaxLength(FormInputLengths.map(table, lengths => lengths?.chapter.notes))
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
		.setMaxLength(FormInputLengths.map(table, lengths => lengths?.chapter.notes))
		.setMinimalByDefault()
	table.label(label => label.text.use('view/chapter-edit/shared/form/notes/label'))
		.content((content, label) => content.append(notesAfterInput.setLabel(label)))

	const { threshold, visibility } = applyVisibilityOptions(table, state)

	return table.extend<ChapterEditFormContentExtensions>(component => ({
		numbered: type,
		hasUnsavedChanges,
		getFormData,
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
			tier_id: Arrays.resolve(threshold?.selection.value)[0],
			tier_ids: threshold?.selection.value,
		} satisfies ChapterCreateBody
	}

	function hasUnsavedChanges () {
		if (!state.value)
			return true

		const data = getFormData()

		const basicFields = Objects.keys(getFormData()).filter(key => key !== 'custom_tags' && key !== 'global_tags' && key !== 'tier_id' && key !== 'tier_ids')
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

		const dataTiers = data.tier_ids ?? [data.tier_id].filter(NonNullish)
		const stateTiers = _
			?? getChapter(state.value)?.patreon?.tiers.map(tier => tier.tier_id)
			?? [getChapter(state.value)?.patreon?.tier.tier_id].filter(NonNullish)

		if (dataTiers.length !== stateTiers.length)
			return true

		if (dataTiers.some(tier => !stateTiers.includes(tier)))
			return true

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
})

const applyVisibilityOptions = (table: LabelledTable, state: State<ChapterData | undefined>) => {
	type Visibility = ChapterLite['visibility']
	const VisibilityRadioInitialiser = (radio: RadioButton, id: Visibility) => radio
		.text.use(`view/chapter-edit/shared/form/visibility/${id.toLowerCase() as Lowercase<Visibility>}`)

	const campaign = Session.Auth.author.map(table, author => author?.patreon_campaign)
	const visibility = RadioRow()
		.add('Public', VisibilityRadioInitialiser)
		.add('Patreon', (radio, id) => radio
			.tweak(VisibilityRadioInitialiser, id)
			.style('view-type-chapter-edit-visibility-patreon')
			.style.bind(campaign.falsy, 'radio-row-option--hidden'))
		.add('Private', VisibilityRadioInitialiser)
		.default.bind(state.map(table, chapter => chapter?.visibility ?? 'Private'))
	table.label(label => label.text.use('view/chapter-edit/shared/form/visibility/label'))
		.content((content, label) => content.append(visibility.setLabel(label)))

	const visibilityStateIsPatreon = visibility.selection.map(table, selection => selection === 'Patreon')
	const tiers = State.Use(table, { campaign, visibilityStateIsPatreon })
		.map(table, ({ campaign, visibilityStateIsPatreon }) =>
			campaign && visibilityStateIsPatreon ? campaign.tiers : undefined)

	const threshold = CheckDropdown<string>({
		translateSelection (dropdown, selection) {
			return Patreon.translateTiers(selection, tiers.value ?? [])
		},
	})
	table.label(label => label.text.use('view/chapter-edit/shared/form/visibility-patreon-tier/label'))
		.if(tiers.truthy)
		.content((content, label) => content.append(
			threshold.tweak(dropdown => {
				tiers.use(dropdown, tiers => {
					dropdown.clear()
					for (const tier of tiers ?? [])
						dropdown.add(tier.tier_id, {
							translation: quilt['shared/term/patreon-tier']({
								NAME: tier.tier_name,
								PRICE: `$${(tier.amount / 100).toFixed(2)}`,
							}),
						})
				})

				dropdown.selection.subscribeManual((selection, oldSelection) => {
					if (oldSelection?.length || selection?.length !== 1)
						return

					const selectedTier = tiers.value?.find(tier => tier.tier_id === selection[0])
					if (!selectedTier)
						return

					const higherTiers = tiers.value?.filter(tier => tier.amount > selectedTier.amount).sort((a, b) => a.amount - b.amount)
					if (higherTiers?.length)
						dropdown.selection.value = [...selection, ...higherTiers.map(tier => tier.tier_id)]
				})
			})
				.default.bind(state.map(table, chapter => _
					?? getPatreon(chapter)?.tier_ids
					?? [getPatreon(chapter)?.tier_id].filter(NonNullish)
				))
				.setLabel(label)
		))

	return {
		threshold,
		visibility,
	}
}

//#endregion
////////////////////////////////////

////////////////////////////////////
//#region Form

interface ChapterEditFormExtensions {
	hasUnsavedChanges (): boolean
	save (): Promise<void>
}

type ChapterEditForm = Form & Block & ChapterEditFormExtensions

type ChapterData = Chapter | ChapterCreateBody
const getChapter = (chapter?: ChapterData) =>
	chapter && 'url' in chapter ? chapter : undefined
const getPatreon = (chapterIn?: ChapterData) => {
	if (!chapterIn)
		return undefined

	const chapter = chapterIn as Partial<Chapter> & Partial<ChapterCreateBody>
	if (chapter.patreon)
		return {
			tier_id: chapter.patreon.tier.tier_id,
			tier_ids: chapter.patreon.tiers.map(tier => tier.tier_id),
		}

	return {
		tier_id: chapter.tier_id,
		tier_ids: chapter.tier_ids,
	}
}

const ChapterEditForm = Object.assign(
	Component.Builder((component, state: State.Mutable<ChapterData | undefined>, workParams: WorkParams): ChapterEditForm => {
		const block = component.and(Block)
		const form = block.and(Form, block.title)
		form.viewTransition('chapter-edit-form')

		const formType = state.value ? 'update' : 'create'

		form.title.text.use(`view/chapter-edit/${formType}/title`)
		state.use(form, chapter => form.setName(quilt[`view/chapter-edit/${formType}/title`](getChapter(chapter)?.url).toString()))

		// if (params.type === "create")
		// 	form.description.text.use("view/work-edit/create/description")

		form.submit.textWrapper.text.use(`view/chapter-edit/${formType}/submit`)

		const content = ChapterEditFormContent(state)
			.appendTo(form.content)

		form.event.subscribe('submit', async event => {
			event.preventDefault()
			await save()
		})

		return form.extend<ChapterEditFormExtensions>(component => ({
			hasUnsavedChanges: content.hasUnsavedChanges,
			getFormData: content.getFormData,
			save,
		}))

		async function save () {
			const response = await (() => {
				switch (formType) {
					case 'create':
						return EndpointChapterCreate.query({
							params: workParams,
							body: content.getFormData(),
						})

					case 'update': {
						const chapter = getChapter(state.value)
						if (!chapter)
							return

						const authorVanity = Session.Auth.author.value?.vanity
						if (!authorVanity)
							return new Error('Cannot update a work when not signed in')

						return EndpointChapterUpdate.query({
							params: {
								author: workParams.author,
								work: workParams.vanity,
								url: chapter.url,
							},
							body: content.getFormData(),
						})
					}
				}
			})()

			if (toast.handleError(response, 'view/chapter-edit/shared/toast/failed-to-save'))
				return

			toast.success(TOAST_SUCCESS, 'view/chapter-edit/shared/toast/saved')
			state.value = response?.data
		}
	}),
	{
		Content: ChapterEditFormContent,
		applyVisibilityOptions,
	}
)

//#endregion
////////////////////////////////////

export default ChapterEditForm
