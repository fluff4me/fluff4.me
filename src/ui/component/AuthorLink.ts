import type { AuthorMetadata } from 'api.fluff4.me'
import Component from 'ui/Component'
import GradientText from 'ui/component/core/ext/GradientText'
import Link from 'ui/component/core/Link'
import AuthorPopover from 'ui/component/popover/AuthorPopover'

export default Component.Builder('a', (component, author: AuthorMetadata): Link => {
	return component.and(Link, `/author/${author.vanity}`)
		.text.set(author.name)
		.setPopover('hover/longpress', popover => popover.and(AuthorPopover, author))
		.and(GradientText)
		.useGradient(author.supporter?.username_colours)
})
