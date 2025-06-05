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

		if (!Element.prototype.computedStyleMap) { 
			Define.set(Element.prototype, 'computedStyleMap', function (this: Element) {
				const css = getComputedStyle(this)
				return {
					get (p: string) {
						const v = css.getPropertyValue(p)
						return v ? { toString: () => v } : undefined
					},
					// PUT OTHER METHODS DOWN HERE, only get() done for now because I can't find any uses of the other ones in the code
				} as unknown as StylePropertyMapReadOnly
			})
		}
	}
}

export default Elements
