import State from "utility/State"

namespace Viewport {

	export interface Size {
		w: number
		h: number
	}
	export const size = State.JIT<Size>(() => ({ w: window.innerWidth, h: window.innerHeight }))

	export function listen () {
		window.addEventListener("resize", size.markDirty)
	}
}

export default Viewport
