import State from "utility/State"

namespace Viewport {

	export interface Size {
		w: number
		h: number
	}
	const jit = State.JIT<Size>(() => ({ w: window.innerWidth, h: window.innerHeight }))
	export const size: State<Size> = jit

	export function listen () {
		window.addEventListener("resize", jit.markDirty)
	}
}

export default Viewport
