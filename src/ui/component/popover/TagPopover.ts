import Component from 'ui/Component'
import PopoverBlock from 'ui/component/popover/PopoverBlock'
import type { TagData } from 'ui/component/Tag'
import Tag from 'ui/component/Tag'
import TagBlock from 'ui/component/TagBlock'

const TagPopover = Component.Builder((component, tag: TagData) => component
	.and(PopoverBlock)
	.and(TagBlock, tag)
	// .tweak(tagPopover => tagPopover.visible.awaitManual(true, tagPopover.loadFull))
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
