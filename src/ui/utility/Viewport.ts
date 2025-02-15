import State from 'utility/State'
import Style from 'utility/Style'

namespace Viewport {

	export interface Size {
		w: number
		h: number
	}

	export const size = State.JIT<Size>(() => ({ w: window.innerWidth, h: window.innerHeight }))
	export const mobile = State.JIT(owner => {
		const result = State.Use(owner, {
			contentWidth: Style.measure('--content-width'),
			viewport: size,
		}).map(owner, ({ contentWidth, viewport }) => viewport.w < contentWidth)
		result.subscribe(owner, mobile.markDirty)
		return result
	})
	export const tablet = State.JIT(owner => {
		const result = State.Use(owner, {
			tabletWidth: Style.measure('--tablet-width'),
			viewport: size,
		}).map(owner, ({ tabletWidth, viewport }) => viewport.w < tabletWidth)
		result.subscribe(owner, tablet.markDirty)
		return result
	})

	export function listen () {
		window.addEventListener('resize', size.markDirty)
	}
}

export default Viewport
