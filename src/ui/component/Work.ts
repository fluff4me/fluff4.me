import type { Author as AuthorData, Work as WorkData, WorkFull } from 'api.fluff4.me'
import quilt from 'lang/en-nz'
import Follows from 'model/Follows'
import FormInputLengths from 'model/FormInputLengths'
import Session from 'model/Session'
import Works from 'model/Works'
import Component from 'ui/Component'
import AuthorLink from 'ui/component/AuthorLink'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import Popover from 'ui/component/core/Popover'
import Slot from 'ui/component/core/Slot'
import TextLabel from 'ui/component/core/TextLabel'
import Timestamp from 'ui/component/core/Timestamp'
import FollowingBookmark from 'ui/component/FollowingBookmark'
import Tags from 'ui/component/Tags'
import type { TagsState } from 'ui/component/TagsEditor'

interface WorkExtensions {
	work: WorkData
}

interface Work extends Block, WorkExtensions { }

const Work = Component.Builder((component, work: WorkData & Partial<WorkFull>, author?: AuthorData, notFullOverride?: true): Work => {
	author = author ?? work.synopsis?.mentions[0]

	component
		.viewTransition('work')
		.style('work')
		.style.toggle(work.visibility === 'Private' || !work.chapter_count_public, 'work--private')

	const block = component.and(Block)
	const isFlush = block.type.state.mapManual(types => types.has('flush'))

	block.header.style('work-header')
	block.title
		.style('work-name')
		.text.set(work.name)
		.setResizeRange(32, Math.min(FormInputLengths.value?.work.name ?? Infinity, 128))

	FollowingBookmark(follows => follows.followingWork(work))
		.appendTo(block.header)

	if (author)
		block.description
			.style('work-author-list')
			.style.bind(isFlush, 'work-author-list--flush')
			.append(AuthorLink(author)
				.style('work-author'))

	block.content.style('work-content')

	Slot()
		.use(isFlush, (slot, isFlush) => {
			const actuallyIsFlush = isFlush

			isFlush ||= notFullOverride ?? false

			const shouldShowDescription = isFlush || (work.synopsis?.body && work.description)
			if (shouldShowDescription)
				Component()
					.style('work-description')
					.style.toggle(actuallyIsFlush, 'work-description--flush')
					.style.toggle(!work.description, 'placeholder')
					.tweak(component => {
						if (work.description)
							component.text.set(work.description)
						else
							component.text.use('work/description/empty')
					})
					.appendTo(slot)

			if (!isFlush)
				Component()
					.style('work-synopsis')
					.style.toggle(!work.synopsis?.body && !work.description, 'placeholder')
					.append(Slot().tweak(slot => {
						const synopsis = work.synopsis ?? work.description
						if (typeof synopsis === 'string')
							slot.text.set(synopsis)
						else if (!synopsis.body)
							slot.text.use('work/description/empty')
						else
							slot.setMarkdownContent(synopsis)
					}))
					.appendTo(slot)
		})
		.appendTo(block.content)

	Tags()
		.set(work as TagsState, {
			initialiseGlobalTags: component => component
				.style.bind(isFlush, 'work-tags--flush'),
			initialiseCustomTags: component => component
				.style.bind(isFlush, 'work-tags--flush'),
		})
		.appendTo(block.content)

	TextLabel()
		.tweak(textLabel => textLabel.label.text.use('work/chapters/label'))
		.tweak(textLabel => textLabel.content.text.set(work.chapter_count_public.toLocaleString()))
		.appendTo(block.footer.left)

	if (work.word_count)
		TextLabel()
			.tweak(textLabel => textLabel.label.text.use('work/word-count/label'))
			.tweak(textLabel => textLabel.content.text.set(work.word_count.toLocaleString()))
			.appendTo(block.footer.left)

	if (work.visibility === 'Private')
		block.footer.right.append(Component().style('timestamp', 'work-timestamp').text.use('work/state/private'))
	else if (!work.chapter_count_public)
		block.footer.right.append(Component().style('timestamp', 'work-timestamp').text.use('work/state/private-no-chapters'))
	else if (work.time_last_update)
		block.footer.right.append(Timestamp(work.time_last_update).style('work-timestamp'))

	if (!component.is(Popover))
		block.setActionsMenu((popover, button) => {
			if (author && author.vanity === Session.Auth.author.value?.vanity) {
				Button()
					.type('flush')
					.setIcon('pencil')
					.text.use('work/action/label/edit')
					.event.subscribe('click', () => navigate.toURL(`/work/${author.vanity}/${work.vanity}/edit`))
					.appendTo(popover)

				Button()
					.type('flush')
					.setIcon('plus')
					.text.use('work/action/label/new-chapter')
					.event.subscribe('click', () => navigate.toURL(`/work/${author.vanity}/${work.vanity}/chapter/new`))
					.appendTo(popover)

				Button()
					.type('flush')
					.setIcon('trash')
					.text.use('work/action/label/delete')
					.event.subscribe('click', () => Works.delete(work, popover))
					.appendTo(popover)
			}
			else if (Session.Auth.loggedIn.value) {
				Button()
					.type('flush')
					.bindIcon(Follows.map(popover, () => Follows.followingWork(work)
						? 'circle-check'
						: 'circle'))
					.text.bind(Follows.map(popover, () => Follows.followingWork(work)
						? quilt['work/action/label/unfollow']()
						: quilt['work/action/label/follow']()
					))
					.event.subscribe('click', () => Follows.toggleFollowingWork(work))
					.appendTo(popover)

				Button()
					.type('flush')
					.bindIcon(Follows.map(popover, () => Follows.ignoringWork(work)
						? 'ban'
						: 'circle'))
					.text.bind(Follows.map(popover, () => Follows.ignoringWork(work)
						? quilt['work/action/label/unignore']()
						: quilt['work/action/label/ignore']()
					))
					.event.subscribe('click', () => Follows.toggleIgnoringWork(work))
					.appendTo(popover)
			}
		})

	return block.extend<WorkExtensions>(component => ({ work }))
})

export default Work
