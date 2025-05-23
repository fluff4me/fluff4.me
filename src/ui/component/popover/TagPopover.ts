import Component from 'ui/Component'
import Popover from 'ui/component/core/Popover'
import PopoverBlock from 'ui/component/popover/PopoverBlock'
import type { TagData } from 'ui/component/Tag'
import Tag from 'ui/component/Tag'
import TagBlock from 'ui/component/TagBlock'

const TagPopover = Component.Builder((component, tag: TagData) => component
	.and(Popover)
	.setDelay(500)
	.and(PopoverBlock)
	.tweak(popover => popover.visible.matchManual(true, () => {
		popover.and(TagBlock, tag)
	}))
)

export default Object.assign(
	TagPopover,
	{
		register () {
			Tag.extend(tag => {
				if (typeof tag.tag === 'object') {
					const tagData = tag.tag
					tag.clearPopover().setPopover('hover', popover => popover.and(TagPopover, tagData))
				}
				return {}
			})
		},
	}
)
