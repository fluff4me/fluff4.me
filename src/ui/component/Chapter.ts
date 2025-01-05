import type { Author, ChapterLite, Work } from 'api.fluff4.me'
import Session from 'model/Session'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import CanHasActionsMenuButton from 'ui/component/core/ext/CanHasActionsMenuButton'
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

	const timestamp = !chapter.time_last_update ? undefined
		: Timestamp(chapter.time_last_update)
			.style('chapter-timestamp')
			.appendTo(right)

	return component
		.and(CanHasActionsMenuButton, button => button
			.type('inherit-size')
			.style('chapter-actions-menu-button')
			.style.bind(component.hoveredOrHasFocused.not, 'chapter-actions-menu-button--not-focused')
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
		.tweak(component => component.actionsMenuButton)
		.extend<ChapterExtensions>(component => ({
			chapter,
			number,
			chapterName,
			timestamp,
		}))
})

export default Chapter
