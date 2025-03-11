import State from 'utility/State'
import Style from 'utility/Style'

namespace Viewport {

	export interface Size {
		w: number
		h: number
	}

	export const size = State.JIT<Size>(() => ({ w: window.innerWidth, h: window.innerHeight }))
	export const mobile = State.JIT(owner => {
		const contentWidth = Style.measure('--content-width')
		const result = size.value.w < contentWidth.value
		contentWidth.subscribe(owner, mobile.markDirty)
		size.subscribe(owner, mobile.markDirty)
		return result
	})
	export const tablet = State.JIT(owner => {
		const tabletWidth = Style.measure('--tablet-width')
		const result = size.value.w < tabletWidth.value
		tabletWidth.subscribe(owner, tablet.markDirty)
		size.subscribe(owner, tablet.markDirty)
		return result
	})

	export type State =
		| 'desktop'
		| 'tablet'
		| 'mobile'

	export const state = State.JIT(owner => {
		const result = mobile.value ? 'mobile' : tablet.value ? 'tablet' : 'desktop'
		mobile.subscribe(owner, state.markDirty)
		tablet.subscribe(owner, state.markDirty)
		return result
	})

	export function listen () {
		window.addEventListener('resize', size.markDirty)
	}
}

export default Viewport
