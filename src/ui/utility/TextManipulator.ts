import type { Quilt as QuiltBase, Weave, WeavingArg, Weft } from "lang/en-nz"
import quilt from "lang/en-nz"
import type Component from "ui/Component"
import type { StateOr } from "utility/State"
import State from "utility/State"

export type Quilt = QuiltBase
export namespace Quilt {
	export type SimpleKey = QuiltBase.SimpleKey
	export type Handler = (quilt: Quilt, helper: typeof QuiltHelper) => Weave
}

export namespace QuiltHelper {
	export function renderWeave (weave: Weave): Node[] {
		return weave.content.map(renderWeft)
	}

	// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
	export function arg (arg: StateOr<WeavingArg | Quilt.SimpleKey | Quilt.Handler>) {
		if (typeof arg === "object" && arg && "map" in arg)
			arg = arg.value

		if (typeof arg === "function")
			arg = arg(quilt, QuiltHelper)

		if (typeof arg === "string" && arg in quilt)
			arg = quilt[arg as Quilt.SimpleKey]()

		return arg
	}

	function isPlaintextWeft (weft: Weft): weft is Weft & { content: string } {
		return true
			&& typeof weft.content === "string"
	}

	function renderWeft (weft: Weft): Node {
		if (isPlaintextWeft(weft))
			return document.createTextNode(weft.content)

		let element: HTMLElement | undefined
		const tag = weft.tag?.toLowerCase()
		if (tag) {
			if (tag.startsWith("link(")) {
				const link = element = document.createElement("a")
				const href = tag.slice(5, -1)
				link.href = href
				link.addEventListener("click", event => {
					event.preventDefault()
					navigate.toRawURL(href)
				})
			}
		}

		element ??= document.createElement("span")

		if (Array.isArray(weft.content))
			element.append(...weft.content.map(renderWeft))
		else if (typeof weft.content === "object" && weft.content)
			element.append(...renderWeave(weft.content))
		else
			element.textContent = `${weft.content ?? ""}`

		return element
	}
}

interface TextManipulator<HOST> {
	readonly state: State<string | Weave>
	set (text: string): HOST
	use (keyOrHandler: Quilt.SimpleKey | Quilt.Handler): HOST
	refresh (): void
}

function TextManipulator (component: Component): TextManipulator<Component> {
	let translationHandler: Quilt.SimpleKey | Quilt.Handler | undefined
	const result: TextManipulator<Component> = {
		state: State(""),
		set (text) {
			component.element.textContent = text
			result.state.value = text
			return component
		},
		use (handler) {
			translationHandler = handler
			result.refresh()
			return component
		},
		refresh () {
			if (!translationHandler)
				return

			const weave = typeof translationHandler === "string" ? quilt[translationHandler]() : translationHandler(quilt, QuiltHelper)
			component.element.replaceChildren(...QuiltHelper.renderWeave(weave))
			result.state.value = weave
		},
	}

	return result
}

export default TextManipulator
