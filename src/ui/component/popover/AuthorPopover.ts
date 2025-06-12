import type { Author as AuthorData, AuthorMetadata } from 'api.fluff4.me'
import Component from 'ui/Component'
import Author from 'ui/component/Author'
import Popover from 'ui/component/core/Popover'
import PopoverBlock from 'ui/component/popover/PopoverBlock'

export default Component.Builder((component, author: AuthorMetadata & Partial<AuthorData>) => component
	.and(Popover)
	.setDelay(500)
	.and(PopoverBlock)
	.and(Author, author)
	.tweak(author => author.bio.style('author-description--in-popover'))
	.tweak(authorPopover => authorPopover.visible.matchManual(true, authorPopover.loadFull))
)
