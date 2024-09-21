import AttributeManipulator from "ui/utility/AttributeManipulator"
import ClassManipulator from "ui/utility/ClassManipulator"
import type { NativeEvents } from "ui/utility/EventManipulator"
import EventManipulator from "ui/utility/EventManipulator"
import TextManipulator from "ui/utility/TextManipulator"
import Define from "utility/Define"
import Errors from "utility/Errors"

const ELEMENT_TO_COMPONENT_MAP = new WeakMap<HTMLElement, Component>()

declare global {
	interface HTMLElement {
		component?: Component
	}
}

Define.magic(HTMLElement.prototype, "component", {
	get (): Component | undefined {
		return ELEMENT_TO_COMPONENT_MAP.get(this)
	},
	set (component): void {
		if (component) {
			ELEMENT_TO_COMPONENT_MAP.set(this, component)
		} else {
			ELEMENT_TO_COMPONENT_MAP.delete(this)
		}
	},
})

interface Component extends Component.SettingUp {
	readonly removed: boolean
	readonly classes: ClassManipulator<this>
	readonly attributes: AttributeManipulator<this>
	readonly event: EventManipulator<this, NativeEvents>
	readonly text: TextManipulator<this>
}

function Component (type: keyof HTMLElementTagNameMap = "span"): Component {
	const element = document.createElement(type)
	let component: Component.SettingUp & { -readonly [KEY in keyof Component as KEY extends keyof Component.SettingUp ? never : KEY]?: Component[KEY] } = {
		isComponent: true,
		element,
		removed: false,
		and (builder, ...params) {
			component = builder(...params, component as Component)
			return component as any
		},
		extend: extension => Object.assign(component, extension) as Component & typeof extension,
		remove (internal = false) {
			component.removed = true

			interface HTMLElementRemovable extends HTMLElement {
				component?: Component & { remove (internal: boolean): void }
			}

			if (!internal)
				for (const descendant of element.querySelectorAll<HTMLElementRemovable>("*"))
					descendant.component?.remove(true)

			element.component = undefined
			element.remove()
		},
		appendTo (destination) {
			Component.element(destination).append(element)
			return component
		},
		prependTo (destination) {
			Component.element(destination).prepend(element)
			return component
		},
		append (...contents) {
			component.element.append(...contents.map(Component.element))
			return component
		},
		prepend (...contents) {
			component.element.prepend(...contents.map(Component.element))
			return component
		},
		get classes () {
			const classes = ClassManipulator(component)
			Object.defineProperty(component, "classes", { value: classes })
			return classes
		},
		get attributes () {
			const attributes = AttributeManipulator(component)
			Object.defineProperty(component, "attributes", { value: attributes })
			return attributes
		},
		get event () {
			const event = EventManipulator(component)
			Object.defineProperty(component, "event", { value: event })
			return event
		},
		get text () {
			const text = TextManipulator(component)
			Object.defineProperty(component, "text", { value: text })
			return text
		},
	}

	if (!Component.is(component))
		throw Errors.Impossible()

	element.component = component
	return component
}

namespace Component {
	export interface SettingUp {
		readonly isComponent: true
		readonly element: HTMLElement

		and<PARAMS extends any[], COMPONENT extends Component> (builder: Component.Builder<PARAMS, COMPONENT>, ...params: PARAMS): this & COMPONENT
		extend<T> (extension: T): this & T

		appendTo (destination: Component | Element): this
		prependTo (destination: Component | Element): this
		append (...contents: (Component | Node)[]): this
		prepend (...contents: (Component | Node)[]): this

		removed: boolean
		remove (): void
	}

	export function is (value: unknown): value is Component {
		return typeof value === "object" && !!(value as Component)?.isComponent
	}

	export function element<NODE extends Node> (from: Component | NODE): NODE {
		return is(from) ? from.element as Node as NODE : from
	}

	export interface BuilderParams<PARAMS extends any[], COMPONENT extends Component> {
		<COMPONENT2 extends Component> (...params: [...PARAMS, component?: COMPONENT2]): COMPONENT & Partial<COMPONENT2>
		<COMPONENT2 extends Component> (...params: [...PARAMS, component: COMPONENT2]): COMPONENT & COMPONENT2
	}

	export interface BuilderParamsAsync<PARAMS extends any[], COMPONENT extends Component> {
		<COMPONENT2 extends Component> (...params: [...PARAMS, component?: COMPONENT2]): Promise<COMPONENT & Partial<COMPONENT2>>
		<COMPONENT2 extends Component> (...params: [...PARAMS, component: COMPONENT2]): Promise<COMPONENT & COMPONENT2>
	}

	export interface Builder<PARAMS extends any[], COMPONENT extends Component> {
		(): COMPONENT
		<COMPONENT2 extends Component> (...params: [...PARAMS, component?: COMPONENT2]): COMPONENT & Partial<COMPONENT2>
		<COMPONENT2 extends Component> (...params: [...PARAMS, component: COMPONENT2]): COMPONENT & COMPONENT2
	}

	export interface BuilderAsync<PARAMS extends any[], COMPONENT extends Component> {
		(): Promise<COMPONENT>
		<COMPONENT2 extends Component> (...params: [...PARAMS, component?: COMPONENT2]): Promise<COMPONENT & Partial<COMPONENT2>>
		<COMPONENT2 extends Component> (...params: [...PARAMS, component: COMPONENT2]): Promise<COMPONENT & COMPONENT2>
	}

	export function Builder<COMPONENT extends Component> (builder: (component?: Component) => COMPONENT): Builder<[], COMPONENT>
	export function Builder<COMPONENT extends Component> (builder: (component?: Component) => Promise<COMPONENT>): BuilderAsync<[], COMPONENT>
	/** **Note:** When providing parameters, the component parameter must be typed as `: Component` */
	export function Builder<PARAMS extends any[], COMPONENT extends Component> (builder: (...params: [...PARAMS, Component?]) => COMPONENT): undefined extends PARAMS[0] ? Builder<PARAMS, COMPONENT> : BuilderParams<PARAMS, COMPONENT>
	/** **Note:** When providing parameters, the component parameter must be typed as `: Component` */
	export function Builder<PARAMS extends any[], COMPONENT extends Component> (builder: (...params: [...PARAMS, Component?]) => Promise<COMPONENT>): undefined extends PARAMS[0] ? BuilderAsync<PARAMS, COMPONENT> : BuilderParamsAsync<PARAMS, COMPONENT>
	export function Builder<PARAMS extends any[], COMPONENT extends Component> (builder: (...params: [...PARAMS, Component?]) => COMPONENT | Promise<COMPONENT>) {
		return builder
	}

}

export default Component
