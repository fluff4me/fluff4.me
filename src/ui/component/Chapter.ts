import type { Author, ChapterLite, Work } from 'api.fluff4.me'
import Session from 'model/Session'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import CanHasActionsMenu from 'ui/component/core/ext/CanHasActionsMenu'
import Link from 'ui/component/core/Link'
import Timestamp from 'ui/component/core/Timestamp'
import Maths from 'utility/maths/Maths'

interface ChapterExtensions {
	chapter: ChapterLite
	number: Component
	chapterName: Component
	timestamp?: Component
}

interface Chapter extends Component, ChapterExtensions { }

const Chapter = Component.Builder((component, chapter: ChapterLite, work: Work, author: Author): Chapter => {
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

	let timestamp: Timestamp | undefined
	if (chapter.visibility === 'Private')
		Component()
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
		.setActionsMenu((popover, button) => {
			if (author && author.vanity === Session.Auth.author.value?.vanity) {
				Button()
					.type('flush')
					.text.use('view/work/chapters/action/label/edit')
					.event.subscribe('click', () => navigate.toURL(`/work/${author.vanity}/${work.vanity}/chapter/${chapter.url}/edit`))
					.appendTo(popover)

				Button()
					.type('flush')
					.text.use('view/author/works/action/label/delete')
					.event.subscribe('click', () => { })
					.appendTo(popover)
			}
		})
		.extend<ChapterExtensions>(component => ({
			chapter,
			number,
			chapterName,
			timestamp,
		}))
})

export default Chapter
