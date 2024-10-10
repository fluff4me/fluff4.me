import AttributeManipulator from "ui/utility/AttributeManipulator"
import ClassManipulator from "ui/utility/ClassManipulator"
import type { NativeEvents } from "ui/utility/EventManipulator"
import EventManipulator from "ui/utility/EventManipulator"
import StyleManipulator from "ui/utility/StyleManipulator"
import type { QuiltHandler, SimpleQuiltKey } from "ui/utility/TextManipulator"
import TextManipulator from "ui/utility/TextManipulator"
import Define from "utility/Define"
import Errors from "utility/Errors"
import State from "utility/State"
import type { AnyFunction, Mutable } from "utility/Type"

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

interface ComponentEvents extends NativeEvents {
	remove (): any
	insert (): any
	ancestorInsert (): any
	root (): any
	unroot (): any
}

interface Component {
	readonly isComponent: true

	readonly classes: ClassManipulator<this>
	readonly attributes: AttributeManipulator<this>
	readonly event: EventManipulator<this, ComponentEvents>
	readonly text: TextManipulator<this>
	readonly style: StyleManipulator<this>

	readonly hovered: State<boolean>
	readonly focused: State<boolean>
	readonly hoveredOrFocused: State<boolean>
	readonly active: State<boolean>
	readonly rooted: State<boolean>
	readonly removed: State<boolean>

	readonly element: HTMLElement

	/**
	 * **Warning:** Replacing an element will leave any subscribed events on the original element, and not re-subscribe them on the new element.
	 */
	replaceElement (elementOrType: HTMLElement | keyof HTMLElementTagNameMap): this

	and<PARAMS extends any[], COMPONENT extends Component> (builder: Component.Builder<PARAMS, COMPONENT>, ...params: PARAMS): this & COMPONENT
	extend<T> (extensionProvider: (component: this & T) => T): this & T
	extendMagic<K extends keyof this, O extends this = this> (property: K, magic: (component: this) => { get (): O[K], set?(value: O[K]): void }): this

	appendTo (destination: Component | Element): this
	prependTo (destination: Component | Element): this
	append (...contents: (Component | Node)[]): this
	prepend (...contents: (Component | Node)[]): this

	remove (): void

	receiveAncestorInsertEvents (): this

	ariaLabel (keyOrHandler: SimpleQuiltKey | QuiltHandler): this
}

export type EventsOf<COMPONENT extends Component> = COMPONENT["event"] extends EventManipulator<any, infer EVENTS> ? EVENTS : never

enum Classes {
	ReceiveAncestorInsertEvents = "_receieve-ancestor-insert-events"
}

function Component (type: keyof HTMLElementTagNameMap = "span"): Component {
	let component: Mutable<Component> = {
		isComponent: true,
		element: document.createElement(type),
		removed: State(false),
		rooted: State(false),
		replaceElement: (newElement) => {
			if (typeof newElement === "string")
				newElement = document.createElement(newElement)

			const oldElement = component.element

			if (component.element.parentNode)
				component.element.replaceWith(newElement)

			component.element = newElement
			type = component.element.tagName as keyof HTMLElementTagNameMap
			component.style.refresh()

			if (oldElement.classList.contains(Classes.ReceiveAncestorInsertEvents))
				newElement.classList.add(Classes.ReceiveAncestorInsertEvents)

			return component
		},
		and (builder, ...params) {
			component = builder.from(component, ...params)
			return component as any
		},
		extend: extension => Object.assign(component, extension(component as never)),
		extendMagic: (property, magic) => {
			Define.magic(component, property, magic(component))
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
		get active (): State<boolean> {
			return Define.set(component, "active", State(false))
		},

		remove (internal = false) {
			component.removed.value = true
			component.rooted.value = false

			interface HTMLElementRemovable extends HTMLElement {
				component?: Component & { remove (internal: boolean): void }
			}

			if (!internal)
				for (const descendant of component.element.querySelectorAll<HTMLElementRemovable>("*"))
					descendant.component?.remove(true)

			component.element.component = undefined
			component.element.remove()

			component.event.emit("unroot")
			component.event.emit("remove")
		},
		appendTo (destination) {
			Component.element(destination).append(component.element)
			updateRooted(component)
			emitInsert(component)
			return component
		},
		prependTo (destination) {
			Component.element(destination).prepend(component.element)
			updateRooted(component)
			emitInsert(component)
			return component
		},
		append (...contents) {
			const elements = contents.map(Component.element)
			component.element.append(...elements)

			for (const element of elements) {
				const component = (element as Element).component
				emitInsert(component)
				updateRooted(component)
			}

			return component
		},
		prepend (...contents) {
			const elements = contents.map(Component.element)
			component.element.prepend(...elements)

			for (const element of elements) {
				const component = (element as Element).component
				emitInsert(component)
				updateRooted(component)
			}

			return component
		},

		receiveAncestorInsertEvents: () => {
			component.element.classList.add(Classes.ReceiveAncestorInsertEvents)
			return component
		},

		ariaLabel: (keyOrHandler) => component.attributes.use("aria-label", keyOrHandler),
	}

	if (!Component.is(component))
		throw Errors.Impossible()

	component.element.component = component
	return component
}

function emitInsert (component: Component | undefined) {
	if (!component)
		return

	component.event.emit("insert")
	const descendantsListeningForEvent = component.element.getElementsByClassName(Classes.ReceiveAncestorInsertEvents)
	for (const descendant of descendantsListeningForEvent)
		descendant.component?.event.emit("ancestorInsert")
}

function updateRooted (component: Component | undefined) {
	if (component) {
		const rooted = document.documentElement.contains(component.element)
		if (component.rooted.value === rooted)
			return

		component.rooted.value = rooted
		component.event.emit(rooted ? "root" : "unroot")

		for (const descendant of component.element.querySelectorAll<Element>("*")) {
			const component = descendant.component
			if (component) {
				component.rooted.value = rooted
				component.event.emit(rooted ? "root" : "unroot")
			}
		}
	}
}

namespace Component {
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
		const realBuilder = (component = initialBuilder(type), ...params: any[]) => builder(component, ...params)
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const simpleBuilder = (...params: any[]) => realBuilder(undefined, ...params)

		return Object.assign(simpleBuilder, {
			from: realBuilder,
		})
	}

}

export default Component
