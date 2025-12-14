import type { AuthorMetadata, ChapterCensorBody, Chapter as ChapterData, ChapterMetadata, ReportChapterBody, WorkMetadata } from 'api.fluff4.me'
import EndpointModerationChapter$authorVanity$workVanity$chapterUrlCensor from 'endpoint/moderation/chapter/$author_vanity/$work_vanity/$chapter_url/EndpointModerationChapter$authorVanity$workVanity$chapterUrlCensor'
import EndpointReportsChapter$authorVanity$workVanity$chapterUrlAdd from 'endpoint/reports/chapter/$author_vanity/$work_vanity/$chapter_url/EndpointReportsChapter$authorVanity$workVanity$chapterUrlAdd'
import type { AuthorReference } from 'model/Authors'
import Chapters from 'model/Chapters'
import Session from 'model/Session'
import Component from 'ui/Component'
import { ActionProviderList, type ActionProvider } from 'ui/component/ActionBlock'
import Button from 'ui/component/core/Button'
import Link from 'ui/component/core/Link'
import Timestamp from 'ui/component/core/Timestamp'
import ModerationDialog, { ModerationCensor, ModerationDefinition } from 'ui/component/ModerationDialog'
import ReportDialog, { ReportDefinition } from 'ui/component/ReportDialog'
import Maths from 'utility/maths/Maths'
import type { StateOr } from 'utility/State'
import State from 'utility/State'

const CHAPTER_REPORT = ReportDefinition<ReportChapterBody>({
	titleTranslation: 'shared/term/author',
	reasons: {
		'inadequate-tags': true,
		'inappropriate-field': true,
		'spam': true,
		'harassment': true,
		'plagiarism': true,
		'tos-violation': true,
	},
})

const CHAPTER_MODERATION = ModerationDefinition((chapter: ChapterData): ModerationDefinition => ({
	titleTranslation: 'shared/term/chapter',
	moderatedContentName: chapter.name ?? (quilt => quilt['view/chapter/number/label'](chapter.url)),
	censor: ModerationCensor<ChapterCensorBody>({
		properties: {
			name: ModerationCensor.plaintext(chapter.name),
			body: ModerationCensor.markdown(chapter.body),
			notes_before: ModerationCensor.markdown(chapter.notes_before),
			notes_after: ModerationCensor.markdown(chapter.notes_after),
		},
		async censor (censor) {
			const response = await EndpointModerationChapter$authorVanity$workVanity$chapterUrlCensor.query({ params: Chapters.reference(chapter), body: censor })
			toast.handleError(response)
		},
	}),
}))

interface ChapterExtensions extends ActionProvider {
	readonly chapter: ChapterMetadata
	readonly number: Component
	readonly chapterName: Component
	readonly timestamp?: Component
	bindEditMode (visible: StateOr<boolean>): this
	setReorderHandler (handler?: () => unknown): this
}

interface Chapter extends Component, ChapterExtensions
// , HasActionsMenuExtensions<'edit' | 'delete'>
{ }

const Chapter = Component.Builder((component, chapter: ChapterMetadata, work: WorkMetadata, author: AuthorReference & Partial<AuthorMetadata>): Chapter => {
	component = Link(`/work/${author.vanity}/${work.vanity}/chapter/${chapter.url}`)
		.style('chapter')
		.style.toggle(chapter.visibility === 'Private', 'chapter--private')
		.style.toggle(chapter.visibility === 'Patreon', 'chapter--patreon', 'patreon-icon-after')

	const chapterNumber = Maths.parseIntOrUndefined(chapter.url)
	const number = Component()
		.style('chapter-number')
		.text.set(chapterNumber ? `${chapterNumber.toLocaleString(navigator.language)}` : '')
		.appendTo(component)

	const chapterName = Component()
		.style('chapter-name')
		.style.toggle(!chapter.name, 'chapter-name--auto')
		.text.set(Chapters.getName(chapter))
		.appendTo(component)

	const right = Component()
		.style('chapter-right')
		.appendTo(component)

	let timestamp: Component | undefined
	if (chapter.visibility === 'Private')
		timestamp = Component()
			.style('timestamp', 'chapter-timestamp')
			.text.use('chapter/state/private')
			.appendTo(right)
	else
		timestamp = !chapter.time_publish ? undefined
			: Timestamp(chapter.time_publish)
				.style('chapter-timestamp')
				.appendTo(right)

	const editMode = State(false)
	const reorderActionHandler = State<(() => unknown) | undefined>(undefined)
	return component
		.style.bind(editMode, 'chapter--edit-mode')
		// .and(CanHasActionsMenu)
		// .setActionsMenuButton(button => button
		// 	.type('inherit-size')
		// 	.style('chapter-actions-menu-button')
		// 	.appendTo(right))
		// .setActionsMenu((popover, button) => initActions(popover, chapter, work, author))
		.extend<ChapterExtensions>(component => ({
			chapter,
			number,
			chapterName,
			timestamp,
			bindEditMode (visible) {
				if (State.is(visible))
					editMode.bind(component, State.get(visible))
				else
					editMode.value = visible
				return component
			},
			setReorderHandler (handler?: () => unknown) {
				reorderActionHandler.value = handler
				return component
			},
			getActions (owner, actions) {
				const isOwnChapter = Session.Auth.loggedInAs(owner, chapter.author)
				const shouldShowReorder = State.Every(owner, isOwnChapter, reorderActionHandler.truthy)
				actions.addWhen(shouldShowReorder, Button()
					.type('flush')
					.setIcon('arrow-up-arrow-down')
					.text.use('chapter/action/label/reorder')
					.event.subscribe('click', () => reorderActionHandler.value?.())
				)

				actions.addWhen(isOwnChapter,
					(Button()
						.type('flush')
						.setIcon('pencil')
						.text.use('chapter/action/label/edit')
						.event.subscribe('click', () => navigate.toURL(`/work/${author.vanity}/${work.vanity}/chapter/${State.value(chapter).url}/edit`))
					),
					(Button()
						.type('flush')
						.setIcon('trash')
						.text.use('chapter/action/label/delete')
						.event.subscribe('click', () => Chapters.delete(State.value(chapter)))
					),
				)

				const isOthersChapter = State.Every(owner, isOwnChapter.falsy, Session.Auth.loggedIn)
				const shouldShowReporting = State.Every(owner, isOthersChapter, Session.Auth.isModerator.falsy)
				const shouldShowModeration = State.Every(owner, isOthersChapter, Session.Auth.isModerator)
				actions.addWhen(shouldShowReporting, Button()
					.type('flush')
					.setIcon('flag')
					.text.use('chapter/action/label/report')
					.event.subscribe('click', event => ReportDialog.prompt(event.host, CHAPTER_REPORT, {
						reportedContentName: State.value(chapter).name ?? (quilt => quilt['view/chapter/number/label'](State.value(chapter).url)),
						async onReport (body) {
							const response = await EndpointReportsChapter$authorVanity$workVanity$chapterUrlAdd.query({ body, params: Chapters.reference(State.value(chapter)) })
							toast.handleError(response)
						},
					}))
				)

				actions.addWhen(shouldShowModeration, Button()
					.type('flush')
					.setIcon('shield-halved')
					.text.use('chapter/action/label/moderate')
					.event.subscribe('click', event => ModerationDialog.prompt(event.host, CHAPTER_MODERATION.create(State.value(chapter) as ChapterData)))
				)
			},
		}))
		.tweak(component => {
			Component()
				.style('chapter-actions')
				.tweak(chapterComponent => ActionProviderList()
					.provide(component, component)
					.renderTo(chapterComponent, chapterComponent)
				)
				.appendToWhen(editMode, component)
		})
})

export default Chapter
