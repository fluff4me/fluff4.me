import type { AuthorMetadata, ChapterCensorBody, Chapter as ChapterData, ChapterMetadata, ReportChapterBody, WorkMetadata } from 'api.fluff4.me'
import EndpointModerateChapterCensor from 'endpoint/moderation/EndpointModerateChapterCensor'
import EndpointReportChapter from 'endpoint/report/EndpointReportChapter'
import type { AuthorReference } from 'model/Authors'
import Chapters from 'model/Chapters'
import Session from 'model/Session'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import type { ActionsMenu, HasActionsMenuExtensions } from 'ui/component/core/ext/CanHasActionsMenu'
import CanHasActionsMenu from 'ui/component/core/ext/CanHasActionsMenu'
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
			const response = await EndpointModerateChapterCensor.query({ params: Chapters.reference(chapter), body: censor })
			toast.handleError(response)
		},
	}),
}))

function initActions (actions: ActionsMenu<never>, chapter: StateOr<ChapterMetadata>, work: WorkMetadata, author?: AuthorReference & Partial<AuthorMetadata>, isChapterView = false) {
	return actions

		.appendAction('patreon', State.get(chapter), (slot, chapter) => true
			&& !isChapterView
			&& chapter.visibility === 'Patreon'
			&& chapter.patreon
			&& Component()
				.style('chapter-patreon-tier', 'patreon-icon-after')
				.text.use(quilt => chapter.patreon && quilt['shared/term/patreon-tier']({
					NAME: chapter.patreon.tiers[0].tier_name,
					PRICE: `$${((chapter.patreon.tiers[0].amount ?? 0) / 100).toFixed(2)}`,
				})))

		.appendAction('edit', Session.Auth.author, (slot, self) => true
			&& author
			&& author.vanity === self?.vanity
			&& Button()
				.type('flush')
				.setIcon('pencil')
				.text.use('chapter/action/label/edit')
				.event.subscribe('click', () => navigate.toURL(`/work/${author.vanity}/${work.vanity}/chapter/${State.value(chapter).url}/edit`)))

		.appendAction('delete', Session.Auth.author, (slot, self) => true
			&& author
			&& author.vanity === self?.vanity
			&& Button()
				.type('flush')
				.setIcon('trash')
				.text.use('chapter/action/label/delete')
				.event.subscribe('click', () => Chapters.delete(State.value(chapter))))

		.appendAction('report', Session.Auth.author, (slot, self) => true
			&& self
			&& author?.vanity !== self?.vanity
			&& !Session.Auth.isModerator.value
			&& Button()
				.type('flush')
				.setIcon('flag')
				.text.use('chapter/action/label/report')
				.event.subscribe('click', event => ReportDialog.prompt(event.host, CHAPTER_REPORT, {
					reportedContentName: State.value(chapter).name ?? (quilt => quilt['view/chapter/number/label'](State.value(chapter).url)),
					async onReport (body) {
						const response = await EndpointReportChapter.query({ body, params: Chapters.reference(State.value(chapter)) })
						toast.handleError(response)
					},
				})))

		.appendAction('moderate', Session.Auth.author, (slot, self) => true
			&& Session.Auth.isModerator.value
			&& 'body' in State.value(chapter)
			&& Button()
				.type('flush')
				.setIcon('shield-halved')
				.text.use('chapter/action/label/moderate')
				.event.subscribe('click', event => ModerationDialog.prompt(event.host, CHAPTER_MODERATION.create(State.value(chapter) as ChapterData)))
		)
}

interface ChapterExtensions {
	readonly chapter: ChapterMetadata
	readonly number: Component
	readonly chapterName: Component
	readonly timestamp?: Component
}

interface Chapter extends Component, ChapterExtensions, HasActionsMenuExtensions<'edit' | 'delete'> { }

const Chapter = Object.assign(
	Component.Builder((component, chapter: ChapterMetadata, work: WorkMetadata, author: AuthorReference & Partial<AuthorMetadata>): Chapter => {
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
			.text.set(_
				|| chapter.name
				|| (!chapterNumber ? undefined : quilt => quilt['view/chapter/number/label'](chapterNumber))
				|| (chapter.url.includes('.') ? quilt => quilt['view/chapter/number/interlude/label'](chapter.url) : undefined)
			)
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

		return component
			.and(CanHasActionsMenu)
			.setActionsMenuButton(button => button
				.type('inherit-size')
				.style('chapter-actions-menu-button')
				.appendTo(right))
			.setActionsMenu((popover, button) => initActions(popover, chapter, work, author))
			.extend<ChapterExtensions>(component => ({
				chapter,
				number,
				chapterName,
				timestamp,
			}))
	}),
	{
		initActions,
	}
)

export default Chapter
