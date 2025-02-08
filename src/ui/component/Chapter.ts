import type { Author, ChapterLite, Work } from 'api.fluff4.me'
import Chapters from 'model/Chapters'
import Session from 'model/Session'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import type { ActionsMenu, HasActionsMenuExtensions } from 'ui/component/core/ext/CanHasActionsMenu'
import CanHasActionsMenu from 'ui/component/core/ext/CanHasActionsMenu'
import Link from 'ui/component/core/Link'
import Timestamp from 'ui/component/core/Timestamp'
import Maths from 'utility/maths/Maths'

function initActions (actions: ActionsMenu<never>, chapter: ChapterLite, work: Work, author?: Author) {
	return actions

		.appendAction('edit', Session.Auth.author, (slot, self) => true
			&& author
			&& author.vanity === self?.vanity
			&& Button()
				.type('flush')
				.setIcon('pencil')
				.text.use('chapter/action/label/edit')
				.event.subscribe('click', () => navigate.toURL(`/work/${author.vanity}/${work.vanity}/chapter/${chapter.url}/edit`)))

		.appendAction('delete', Session.Auth.author, (slot, self) => true
			&& author
			&& author.vanity === self?.vanity
			&& Button()
				.type('flush')
				.setIcon('trash')
				.text.use('chapter/action/label/delete')
				.event.subscribe('click', () => Chapters.delete(chapter)))
}

interface ChapterExtensions {
	readonly chapter: ChapterLite
	readonly number: Component
	readonly chapterName: Component
	readonly timestamp?: Component
}

interface Chapter extends Component, ChapterExtensions, HasActionsMenuExtensions<'edit' | 'delete'> { }

const Chapter = Object.assign(
	Component.Builder((component, chapter: ChapterLite, work: Work, author: Author): Chapter => {
		component = Link(`/work/${author.vanity}/${work.vanity}/chapter/${chapter.url}`)
			.style('chapter')
			.style.toggle(chapter.visibility === 'Private', 'chapter--private')

		const chapterNumber = Maths.parseIntOrUndefined(chapter.url)
		const number = Component()
			.style('chapter-number')
			.text.set(chapterNumber ? `${chapterNumber.toLocaleString()}` : '')
			.appendTo(component)

		const chapterName = Component()
			.style('chapter-name')
			.text.set(chapter.name)
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
			timestamp = !chapter.time_last_update ? undefined
				: Timestamp(chapter.time_last_update)
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
