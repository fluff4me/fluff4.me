import AttributeManipulator from "ui/utility/AttributeManipulator"
import ClassManipulator from "ui/utility/ClassManipulator"
import type { NativeEvents } from "ui/utility/EventManipulator"
import EventManipulator from "ui/utility/EventManipulator"
import StyleManipulator from "ui/utility/StyleManipulator"
import TextManipulator from "ui/utility/TextManipulator"
import Define from "utility/Define"
import Errors from "utility/Errors"
import State from "utility/State"
import type { AnyFunction } from "utility/Type"

const ELEMENT_TO_COMPONENT_MAP = new WeakMap<Element, Component>()

declare global {
	interface Element {
		component?: Component
	}
}

Define.magic(Element.prototype, "component", {
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

interface Component {
	readonly isComponent: true

	readonly classes: ClassManipulator<this>
	readonly attributes: AttributeManipulator<this>
	readonly event: EventManipulator<this, NativeEvents>
	readonly text: TextManipulator<this>
	readonly style: StyleManipulator<this>

	readonly hovered: State<boolean>
	readonly focused: State<boolean>
	readonly hoveredOrFocused: State<boolean>
	readonly removed: State<boolean>

	readonly element: HTMLElement

	and<PARAMS extends any[], COMPONENT extends Component> (builder: Component.Builder<PARAMS, COMPONENT>, ...params: PARAMS): this & COMPONENT
	extend<T> (extension: T): this & T

	appendTo (destination: Component | Element): this
	prependTo (destination: Component | Element): this
	append (...contents: (Component | Node)[]): this
	prepend (...contents: (Component | Node)[]): this

	remove (): void
}

export type EventsOf<COMPONENT extends Component> = COMPONENT["event"] extends EventManipulator<any, infer EVENTS> ? EVENTS : never

function Component (type: keyof HTMLElementTagNameMap = "span"): Component {
	const element = document.createElement(type)

	let component: Component = {
		isComponent: true,
		element,
		removed: State(false),
		and (builder, ...params) {
			component = builder.from(component, ...params)
			return component as any
		},
		extend: extension => Object.assign(component, extension),
		remove (internal = false) {
			component.removed.value = true

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
			return Define.set(component, "style", StyleManipulator(component))
		},
		get classes () {
			return Define.set(component, "classes", ClassManipulator(component))
		},
		get attributes () {
			return Define.set(component, "attributes", AttributeManipulator(component))
		},
		get event () {
			return Define.set(component, "event", EventManipulator(component))
		},
		get text () {
			return Define.set(component, "text", TextManipulator(component))
		},
		get hovered (): State<boolean> {
			return Define.set(component, "hovered", State(false))
		},
		get focused (): State<boolean> {
			return Define.set(component, "focused", State(false))
		},
		get hoveredOrFocused (): State<boolean> {
			return Define.set(component, "hoveredOrFocused",
				State.Generator(() => component.hovered.value || component.focused.value)
					.observe(component.hovered, component.focused))
		},
	}

	if (!Component.is(component))
		throw Errors.Impossible()

	element.component = component
	return component
}

namespace Component {
	export interface SettingUp {
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
