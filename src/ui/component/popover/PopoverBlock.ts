import Component from 'ui/Component'
import Block from 'ui/component/core/Block'
import Popover from 'ui/component/core/Popover'

export default Component.Builder((component): Popover => {
	const popover = component
		.and(Popover).and(Block)
		.style('popover-block')
		.anchor.add('aligned left', 'off bottom')
		.anchor.add('aligned left', 'off top')
		.anchor.add('aligned right', 'off bottom')
		.anchor.add('aligned right', 'off top')
		.anchor.orElseHide()
		.viewTransition(false)

	popover.header.style('popover-block-header')
	popover.content.style('popover-block-content')
	popover.tweakJIT('title', title => title
		.setAestheticLevel(3)
		.style('popover-block-title')
	)

	return popover
})
