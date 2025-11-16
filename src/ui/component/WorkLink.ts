import type { AuthorMetadata, WorkMetadata } from 'api.fluff4.me'
import Component from 'ui/Component'
import GradientText from 'ui/component/core/ext/GradientText'
import Link from 'ui/component/core/Link'
import WorkPopover from 'ui/component/popover/WorkPopover'

export default Component.Builder('a', (component, work: WorkMetadata, author?: AuthorMetadata): Link => {
	return component.and(Link, `/work/${work.author}/${work.vanity}`)
		.style('author-link')
		.text.set(work.name)
		.setPopover('hover/longpress', popover => popover.and(WorkPopover, work, author))
		.and(GradientText)
		.useGradient(work.card_colours)
})
