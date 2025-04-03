import type { Author as AuthorData, AuthorFull } from 'api.fluff4.me'
import Component from 'ui/Component'
import Author from 'ui/component/Author'
import PopoverBlock from 'ui/component/popover/PopoverBlock'

export default Component.Builder((component, author: AuthorData & Partial<AuthorFull>) => component
	.and(PopoverBlock)
	.and(Author, author)
	.tweak(author => author.bio.style('author-description--in-popover'))
	.tweak(authorPopover => authorPopover.visible.awaitManual(true, authorPopover.loadFull))
)
