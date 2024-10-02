import type style from "style"
import AttributeManipulator from "ui/utility/AttributeManipulator"
import ClassManipulator from "ui/utility/ClassManipulator"
import type { NativeEvents } from "ui/utility/EventManipulator"
import EventManipulator from "ui/utility/EventManipulator"
import StyleManipulator from "ui/utility/StyleManipulator"
import TextManipulator from "ui/utility/TextManipulator"
import Define from "utility/Define"
import Errors from "utility/Errors"
import type { AnyFunction } from "utility/Type"

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
	readonly style: StyleManipulator<this>
}

function Component (type: keyof HTMLElementTagNameMap = "span"): Component {
	const element = document.createElement(type)
	let component: Component.SettingUp & { -readonly [KEY in keyof Component as KEY extends keyof Component.SettingUp ? never : KEY]?: Component[KEY] } = {
		isComponent: true,
		element,
		removed: false,
		and (builder, ...params) {
			component = builder.from(component as Component, ...params)
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
		get style () {
			const style = StyleManipulator(component)
			Object.defineProperty(component, "style", { value: style })
			return style
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

		style (...names: (keyof typeof style)[]): this

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

	export interface Builder<PARAMS extends any[], BUILD_COMPONENT extends Component> {
		(...params: PARAMS): BUILD_COMPONENT
		from<COMPONENT extends Component> (component?: COMPONENT, ...params: PARAMS): COMPONENT & BUILD_COMPONENT
	}

	export interface BuilderAsync<PARAMS extends any[], BUILD_COMPONENT extends Component> {
		(...params: PARAMS): Promise<BUILD_COMPONENT>
		from<COMPONENT extends Component> (component?: COMPONENT, ...params: PARAMS): Promise<COMPONENT & BUILD_COMPONENT>
	}

	const defaultBuilder = (type?: keyof HTMLElementTagNameMap) => Component(type)
	export function Builder<PARAMS extends any[], COMPONENT extends Component> (builder: (component: Component, ...params: PARAMS) => COMPONENT): Builder<PARAMS, COMPONENT>
	export function Builder<PARAMS extends any[], COMPONENT extends Component> (builder: (component: Component, ...params: PARAMS) => Promise<COMPONENT>): BuilderAsync<PARAMS, COMPONENT>
	export function Builder<PARAMS extends any[], COMPONENT extends Component> (initial: keyof HTMLElementTagNameMap | (() => Component), builder: (component: Component, ...params: PARAMS) => COMPONENT): Builder<PARAMS, COMPONENT>
	export function Builder<PARAMS extends any[], COMPONENT extends Component> (initial: keyof HTMLElementTagNameMap | (() => Component), builder: (component: Component, ...params: PARAMS) => Promise<COMPONENT>): BuilderAsync<PARAMS, COMPONENT>
	export function Builder (initialOrBuilder: keyof HTMLElementTagNameMap | AnyFunction, builder?: (component: Component, ...params: any[]) => Component | Promise<Component>): (component?: Component, ...params: any[]) => Component | Promise<Component> {
		const type = typeof initialOrBuilder === "string" ? initialOrBuilder : undefined
		const initialBuilder: (type?: keyof HTMLElementTagNameMap) => Component = !builder || typeof initialOrBuilder === "string" ? defaultBuilder : initialOrBuilder
		builder ??= initialOrBuilder as AnyFunction

		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const realBuilder = (component = initialBuilder(type), ...params: any[]) => builder!(component, ...params)
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const simpleBuilder = (...params: any[]) => realBuilder(undefined, ...params)

		return Object.assign(simpleBuilder, {
			from: realBuilder,
		})
	}

}

export default Component
