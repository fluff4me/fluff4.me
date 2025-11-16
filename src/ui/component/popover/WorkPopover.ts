import type { AuthorMetadata, WorkMetadata } from 'api.fluff4.me'
import Component from 'ui/Component'
import Popover from 'ui/component/core/Popover'
import PopoverBlock from 'ui/component/popover/PopoverBlock'
import Work from 'ui/component/Work'

export default Component.Builder((component, work: WorkMetadata, author?: AuthorMetadata) => component
	.and(Popover)
	.setDelay(500)
	.and(PopoverBlock)
	.and(Work, work, author)
)
