import { type Chapter, type ChapterCreateBody, type WorkMetadata } from 'api.fluff4.me'
import EndpointChapterCreate from 'endpoint/chapter/EndpointChapterCreate'
import EndpointChapterUpdate from 'endpoint/chapter/EndpointChapterUpdate'
import type { WorkParams } from 'endpoint/work/EndpointWorkGet'
import quilt from 'lang/en-nz'
import FormInputLengths from 'model/FormInputLengths'
import Session from 'model/Session'
import Component from 'ui/Component'
import Block from 'ui/component/core/Block'
import Form from 'ui/component/core/Form'
import Heading from 'ui/component/core/Heading'
import LabelledRow from 'ui/component/core/LabelledRow'
import LabelledTable from 'ui/component/core/LabelledTable'
import Placeholder from 'ui/component/core/Placeholder'
import RadioRow from 'ui/component/core/RadioRow'
import TextEditor from 'ui/component/core/TextEditor'
import TextInput from 'ui/component/core/TextInput'
import { TOAST_SUCCESS } from 'ui/component/core/toast/Toast'
import type { TagsState } from 'ui/component/TagsEditor'
import TagsEditor from 'ui/component/TagsEditor'
import type { VisibilityDataHost } from 'ui/component/VisibilityOptions'
import VisibilityOptions from 'ui/component/VisibilityOptions'
import WorkStatusDropdown from 'ui/component/WorkStatusDropdown'
import { type Quilt } from 'ui/utility/StringApplicator'
import type { ChapterDetailsAPINumber } from 'ui/view/ChapterNewBulkView'
import Functions from 'utility/Functions'
import Objects from 'utility/Objects'
import State from 'utility/State'

////////////////////////////////////
//#region Form Content

interface ChapterEditFormContentExtensions {
	readonly numbered: RadioRow<'numbered' | 'other'>
	readonly state: State<ChapterCreateBody>
	hasUnsavedChanges (): boolean
}

interface ChapterEditFormContent extends LabelledTable, ChapterEditFormContentExtensions { }

const ChapterEditFormContent = Component.Builder((component, inputState: State<ChapterData | undefined>, workData: WorkMetadata, number?: State<ChapterDetailsAPINumber>): ChapterEditFormContent => {
	const table = component.and(LabelledTable)

	const chapterURL = inputState.map(component, chapterData => {
		const chapter = getChapter(chapterData)
		if (!chapter)
			return 'N'

		return chapter.url
	})

	const fallbackChapterName = number
		? number.map(component, (number): Quilt.Handler => number.url.includes('.')
			? quilt => quilt['view/chapter/number/interlude/label'](number.url)
			: quilt => quilt['view/chapter/number/label'](number.chapterNumber)
		)
		: chapterURL.map(component, (url): Quilt.Handler => url.includes('.')
			? quilt => quilt['view/chapter/number/interlude/label'](url)
			: quilt => quilt['view/chapter/number/label'](_
				|| parseInt(url)
				|| (workData.chapter_count ? workData.chapter_count + 1 : 0)
				|| 'N'
			)
		)

	const type = RadioRow()
		.add('numbered', radio => radio
			.text.use('view/chapter-edit/shared/form/type/numbered')
			.append(Placeholder()
				.style('view-type-chapter-edit-type-example')
				.text.bind(number
					? number.map(radio, (number): Quilt.Handler => quilt => quilt['view/chapter-edit/shared/form/type/numbered/example'](number.chapterNumber))
					: chapterURL.map(radio, (url): Quilt.Handler => quilt => quilt['view/chapter-edit/shared/form/type/numbered/example'](Functions.resolve(() => {
						if (url.includes('.'))
							return parseInt(url) + 1

						return parseInt(url) || (workData.chapter_count ? workData.chapter_count + 1 : 0) || 'N'
					})))
				)
			)
		)
		.add('other', radio => radio
			.text.use('view/chapter-edit/shared/form/type/other')
			.append(Placeholder()
				.style('view-type-chapter-edit-type-example')
				.text.use('view/chapter-edit/shared/form/type/other/example'))
		)
		.default.bind(inputState.map(component, chapter => chapter?.is_numbered === false ? 'other' : 'numbered'))
	table.label(label => label.text.use('view/chapter-edit/shared/form/type/label'))
		.content((content, label) => content.append(type.setLabel(label)))

	const nameInput = TextInput()
		.default.bind(inputState.map(component, chapter => chapter?.name || ''))
		.hint.use('view/chapter-edit/shared/form/name/hint')
		.placeholder.bind(fallbackChapterName)
		.setMaxLength(FormInputLengths.map(table, lengths => lengths?.chapter?.name))
	table.label(label => label.text.use('view/chapter-edit/shared/form/name/label'))
		.content((content, label) => content.append(nameInput.setLabel(label)))

	const tagsEditor = TagsEditor()
		.default.bind(inputState as State<TagsState>)
		.setMaxLengthGlobal(FormInputLengths.map(table, lengths => lengths?.work_tags?.global))
		.setMaxLengthCustom(FormInputLengths.map(table, lengths => lengths?.work_tags?.custom))
	table.label(label => label.text.use('view/chapter-edit/shared/form/tags/label'))
		.content((content, label) => content.append(tagsEditor.setLabel(label)))

	const notesBeforeInput = TextEditor()
		.default.bind(inputState.map(component, chapter => chapter?.notes_before ?? undefined))
		.hint.use('view/chapter-edit/shared/form/notes/hint')
		.setMaxLength(FormInputLengths.map(table, lengths => lengths?.chapter?.notes))
		.setMinimalByDefault()
	table.label(label => label.text.use('view/chapter-edit/shared/form/notes/label'))
		.content((content, label) => content.append(notesBeforeInput.setLabel(label)))

	const bodyInput = TextEditor()
		.default.bind(inputState.map(component, chapter => chapter?.body ?? undefined))
		.hint.use('view/chapter-edit/shared/form/body/hint')
	table.label(label => label.text.use('view/chapter-edit/shared/form/body/label'))
		.content((content, label) => content.append(bodyInput.setLabel(label)))

	const notesAfterInput = TextEditor()
		.default.bind(inputState.map(component, chapter => chapter?.notes_after ?? undefined))
		.hint.use('view/chapter-edit/shared/form/notes/hint')
		.setMaxLength(FormInputLengths.map(table, lengths => lengths?.chapter?.notes))
		.setMinimalByDefault()
	table.label(label => label.text.use('view/chapter-edit/shared/form/notes/label'))
		.content((content, label) => content.append(notesAfterInput.setLabel(label)))

	const { patreonTiers, visibility } = VisibilityOptions(table, inputState.map(table, (chapter): VisibilityDataHost => ({ visibility: chapter?.visibility ?? 'Private', ...getPatreon(chapter) })))

	component.onRooted(() => {
		notesBeforeInput.ready()
		bodyInput.ready()
		notesAfterInput.ready()
	})

	const state = State.Use(component, {
		name: nameInput.state.map(component, name => name || false),
		body: bodyInput.content,
		notes_before: notesBeforeInput.content,
		notes_after: notesAfterInput.content,
		visibility: visibility.selection.coalesce('Private'),
		global_tags: tagsEditor.state.mapManual(tags => tags.global_tags),
		custom_tags: tagsEditor.state.mapManual(tags => tags.custom_tags),
		is_numbered: type.selection.equals('numbered'),
		tier_ids: patreonTiers?.selection,
	} satisfies { [KEY in keyof ChapterCreateBody]: State<ChapterCreateBody[KEY]> })

	return table.extend<ChapterEditFormContentExtensions>(component => ({
		state,
		numbered: type,
		hasUnsavedChanges,
	}))

	function hasUnsavedChanges () {
		if (!inputState.value)
			return true

		const data = state.value

		const basicFields = Objects.keys(data).filter(key => key !== 'custom_tags' && key !== 'global_tags' && key !== 'tier_ids')
		for (const field of basicFields) {
			let dataValue = data[field]
			let stateValue = inputState.value[field]

			if (dataValue === '') stateValue ??= ''
			if (stateValue === '') dataValue ??= ''

			if (typeof dataValue === 'string') dataValue = dataValue.trim()
			if (typeof stateValue === 'string') stateValue = stateValue.trim()

			if (dataValue !== stateValue)
				return true
		}

		const dataTiers = data.tier_ids ?? []
		const stateTiers = getChapter(inputState.value)?.patreon?.tiers.map(tier => tier.tier_id) ?? []

		if (dataTiers.length !== stateTiers.length)
			return true

		if (dataTiers.some(tier => !stateTiers.includes(tier)))
			return true

		if ((data.custom_tags?.length ?? 0) !== (inputState.value.custom_tags?.length ?? 0))
			return true

		if (data.custom_tags?.some(tag => !inputState.value?.custom_tags?.includes(tag)))
			return true

		if ((data.global_tags?.length ?? 0) !== (inputState.value.global_tags?.length ?? 0))
			return true

		if (data.global_tags?.some(tag => !inputState.value?.global_tags?.includes(tag)))
			return true

		return false
	}
})

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
const getPatreon = (chapterIn?: ChapterData): Pick<VisibilityDataHost, 'patreonTiers'> | undefined => {
	if (!chapterIn)
		return undefined

	const chapter = chapterIn as Partial<Chapter> & Partial<ChapterCreateBody>
	if (chapter.patreon)
		return {
			patreonTiers: chapter.patreon.tiers.map(tier => tier.tier_id),
		}

	return {
		patreonTiers: chapter.tier_ids,
	}
}

const ChapterEditForm = Object.assign(
	Component.Builder((component, state: State.Mutable<ChapterData | undefined>, workParams: WorkParams, workData: WorkMetadata): ChapterEditForm => {
		const block = component.and(Block)
		const form = block.and(Form, block.title)
		form.viewTransition('chapter-edit-form')

		const formType = state.value ? 'update' : 'create'

		form.title.text.use(`view/chapter-edit/${formType}/title`)
		state.use(form, chapter => form.setName(quilt[`view/chapter-edit/${formType}/title`](getChapter(chapter)?.url).toString()))

		// if (params.type === "create")
		// 	form.description.text.use("view/work-edit/create/description")

		form.submit.textWrapper.text.use(`view/chapter-edit/${formType}/submit`)

		const content = ChapterEditFormContent(state, workData)
			.appendTo(form.content)

		const work = Component().style('view-type-chapter-edit-work-changes').appendTo(form.content)
		Heading()
			.style('view-type-chapter-edit-work-changes-heading')
			.text.use(quilt => quilt['view/chapter-edit/shared/form/work/heading'](workData.name))
			.appendTo(work)

		const statusDropdown = WorkStatusDropdown.Radio(workData.status)

		LabelledRow()
			.tweak(row => row.label
				.style('view-type-chapter-edit-work-changes-status-label')
				.text.bind(statusDropdown.selection.map(row, status => {
					if (status === workData.status)
						return quilt => quilt['view/chapter-edit/shared/form/work/status/label/no-change']()

					return quilt => quilt['view/chapter-edit/shared/form/work/status/label/change']()
				}))
			)
			.tweak(row => row.content.append(statusDropdown))
			.appendTo(work)

		form.onSubmit(async event => {
			await save()
		})

		return form.extend<ChapterEditFormExtensions>(component => ({
			hasUnsavedChanges: content.hasUnsavedChanges,
			save,
		}))

		async function save () {
			const response = await (() => {
				switch (formType) {
					case 'create':
						return EndpointChapterCreate.query({
							params: workParams,
							body: {
								...content.state.value,
								work: { status: statusDropdown.selection.value },
							},
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
							body: {
								...content.state.value,
								work: { status: statusDropdown.selection.value },
							},
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
	}
)

//#endregion
////////////////////////////////////

export default ChapterEditForm
