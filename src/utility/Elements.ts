import Define from 'utility/Define'

declare global {
	interface Element {
		asType<TAG_NAME extends keyof HTMLElementTagNameMap> (tagName: TAG_NAME): HTMLElementTagNameMap[TAG_NAME] | undefined
	}
}

namespace Elements {
	export function applyPrototypes () {
		Define.set(Element.prototype, 'asType', function (this: Element, tagName): any {
			return this.tagName.toLowerCase() === tagName ? this : undefined
		})
	}
}

export default Elements
