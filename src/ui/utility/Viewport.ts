import State from 'utility/State'
import Style from 'utility/Style'

namespace Viewport {

	export interface Size {
		w: number
		h: number
	}

	export const size = State.JIT<Size>(() => ({ w: window.innerWidth, h: window.innerHeight }))
	export const mobile = State.JIT(() => {
		const result = State.UseManual({
			contentWidth: Style.measure('--content-width'),
			viewport: size,
		}).mapManual(({ contentWidth, viewport }) => viewport.w < contentWidth)
		result.subscribeManual(mobile.markDirty)
		return result
	})
	export const tablet = State.JIT(() => {
		const result = State.UseManual({
			tabletWidth: Style.measure('--tablet-width'),
			viewport: size,
		}).mapManual(({ tabletWidth, viewport }) => viewport.w < tabletWidth)
		result.subscribeManual(tablet.markDirty)
		return result
	})

	export function listen () {
		window.addEventListener('resize', size.markDirty)
	}
}

export default Viewport
