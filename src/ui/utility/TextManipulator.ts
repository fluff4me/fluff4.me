import type { Quilt, Weave, Weft } from "lang/en-nz"
import quilt from "lang/en-nz"
import type Component from "ui/Component"

export type SimpleQuiltKey = keyof { [KEY in keyof Quilt as Parameters<Quilt[KEY]>["length"] extends 0 ? KEY : never]: true }
export type QuiltHandler = (quilt: Quilt) => Weave

export namespace QuiltHelper {
	export function renderWeave (weave: Weave): Node[] {
		return weave.content.map(renderWeft)
	}

	function isPlaintextWeft (weft: Weft): weft is Weft & { content: string } {
		return true
			&& typeof weft.content === "string"
	}

	function renderWeft (weft: Weft): Node {
		if (isPlaintextWeft(weft))
			return document.createTextNode(weft.content)

		const component = document.createElement("span")

		if (Array.isArray(weft.content))
			component.append(...weft.content.map(renderWeft))
		else
			component.textContent = `${weft.content}`

		return component
	}
}

interface TextManipulator<HOST> {
	set (text: string): HOST
	use (keyOrHandler: SimpleQuiltKey | QuiltHandler): HOST
	refresh (): void
}

function TextManipulator (component: Component): TextManipulator<Component> {
	let translationHandler: SimpleQuiltKey | QuiltHandler | undefined
	const result: TextManipulator<Component> = {
		set (text) {
			component.element.textContent = text
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

			const weave = typeof translationHandler === "string" ? quilt[translationHandler]() : translationHandler(quilt)
			component.element.replaceChildren(...QuiltHelper.renderWeave(weave))
		},
	}

	return result
}

export default TextManipulator
