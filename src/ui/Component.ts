import type Label from "ui/component/core/Label"
import AnchorManipulator from "ui/utility/AnchorManipulator"
import AttributeManipulator from "ui/utility/AttributeManipulator"
import ClassManipulator from "ui/utility/ClassManipulator"
import type { NativeEvents } from "ui/utility/EventManipulator"
import EventManipulator from "ui/utility/EventManipulator"
import FocusListener from "ui/utility/FocusListener"
import StringApplicator from "ui/utility/StringApplicator"
import StyleManipulator from "ui/utility/StyleManipulator"
import TextManipulator from "ui/utility/TextManipulator"
import Viewport from "ui/utility/Viewport"
import Define from "utility/Define"
import Env from "utility/Env"
import Errors from "utility/Errors"
import type { UnsubscribeState } from "utility/State"
import State from "utility/State"
import Strings from "utility/string/Strings"
import type { AnyFunction, Mutable } from "utility/Type"

const SYMBOL_COMPONENT_BRAND = Symbol("COMPONENT_BRAND")
export interface ComponentBrand<TYPE extends string> {
	[SYMBOL_COMPONENT_BRAND]: TYPE
}

type AriaRole =
	| "button"
	| "checkbox"
	| "form"
	| "main"
	| "navigation"
	| "toolbar"
	| "textbox"
	| "group"
	| "radio"
	| "radiogroup"

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
	ancestorScroll (): any
	descendantInsert (): any
	ancestorRectDirty (): any
	root (): any
	unroot (): any
}

export interface ComponentExtensions<ELEMENT extends HTMLElement = HTMLElement> { }

interface BaseComponent<ELEMENT extends HTMLElement = HTMLElement> {
	readonly isComponent: true
	readonly supers: any[]

	readonly classes: ClassManipulator<this>
	readonly attributes: AttributeManipulator<this>
	readonly event: EventManipulator<this, ComponentEvents>
	readonly text: TextManipulator<this>
	readonly style: StyleManipulator<this>
	readonly anchor: AnchorManipulator<this>

	readonly hovered: State<boolean>
	readonly focused: State<boolean>
	readonly hasFocused: State<boolean>
	readonly hoveredOrFocused: State<boolean>
	readonly hoveredOrHasFocused: State<boolean>
	readonly active: State<boolean>
	readonly rooted: State<boolean>
	readonly removed: State<boolean>
	readonly id: State<string | undefined>
	readonly name: State<string | undefined>
	readonly rect: State.JIT<DOMRect>
	readonly tagName: Uppercase<keyof HTMLElementTagNameMap>

	readonly element: ELEMENT

	/** Causes this element to be removed when its owner is removed */
	setOwner (owner: Component): this

	setId (id?: string | State<string | undefined>): this
	setName (name?: string | State<string | undefined>): this

	is<COMPONENT extends Component> (builder: Component.Builder<any[], COMPONENT>): this is COMPONENT
	is<COMPONENT extends Component> (builder: Component.Extension<any[], COMPONENT>): this is COMPONENT
	as<COMPONENT extends Component> (builder: Component.Builder<any[], COMPONENT>): COMPONENT | undefined
	as<COMPONENT extends Component> (builder: Component.Extension<any[], COMPONENT>): COMPONENT | undefined
	cast<COMPONENT extends Component> (): this & Partial<COMPONENT>

	/**
	 * **Warning:** Replacing an element will leave any subscribed events on the original element, and not re-subscribe them on the new element.
	 */
	replaceElement (elementOrType: HTMLElement | keyof HTMLElementTagNameMap): this

	and<PARAMS extends any[], COMPONENT extends Component> (builder: Component.BuilderAsync<PARAMS, COMPONENT>, ...params: NoInfer<PARAMS>): Promise<this & COMPONENT>
	and<PARAMS extends any[], COMPONENT extends Component> (builder: Component.ExtensionAsync<PARAMS, COMPONENT>, ...params: NoInfer<PARAMS>): Promise<this & COMPONENT>
	and<PARAMS extends any[], COMPONENT extends Component> (builder: Component.Builder<PARAMS, COMPONENT>, ...params: NoInfer<PARAMS>): this & COMPONENT
	and<PARAMS extends any[], COMPONENT extends Component> (builder: Component.Extension<PARAMS, COMPONENT>, ...params: NoInfer<PARAMS>): this & COMPONENT
	extend<T> (extensionProvider: (component: this & T) => Omit<T, typeof SYMBOL_COMPONENT_BRAND>): this & T
	extendMagic<K extends keyof this, O extends this = this> (property: K, magic: (component: this) => { get (): O[K], set?(value: O[K]): void }): this
	extendJIT<K extends keyof this, O extends this = this> (property: K, supplier: (component: this) => O[K]): this

	tweak<PARAMS extends any[]> (tweaker?: (component: this, ...params: PARAMS) => any, ...params: PARAMS): this

	appendTo (destination: Component | Element): this
	prependTo (destination: Component | Element): this
	insertTo (destination: Component | Element, direction: "before" | "after", sibling?: Component | Element): this
	append (...contents: (Component | Node)[]): this
	prepend (...contents: (Component | Node)[]): this
	insert (direction: "before" | "after", sibling: Component | Element | undefined, ...contents: (Component | Node)[]): this

	closest<BUILDER extends Component.Builder<any[], Component> | Component.Extension<any[], Component>> (builder: BUILDER): (BUILDER extends Component.Builder<any[], infer COMPONENT> ? COMPONENT : BUILDER extends Component.Extension<any[], infer COMPONENT> ? COMPONENT : never) | undefined
	closest<COMPONENT extends Component> (builder: Component.Builder<any[], COMPONENT>): COMPONENT | undefined
	closest<COMPONENT extends Component> (builder: Component.Extension<any[], COMPONENT>): COMPONENT | undefined

	get parent (): Component | undefined
	getAncestorComponents (): Generator<Component>
	get previousSibling (): Component | undefined
	get nextSibling (): Component | undefined

	remove (): void
	removeContents (): void

	receiveAncestorInsertEvents (): this
	receiveDescendantInsertEvents (): this
	receiveAncestorScrollEvents (): this
	emitInsert (): this
	monitorScrollEvents (): this

	onRooted (callback: (component: this) => any): this

	ariaRole (role?: AriaRole): this
	ariaLabel: StringApplicator.Optional<this>
	ariaLabelledBy (component?: Component): this
	ariaHidden (): this
	ariaChecked (state: State<boolean>): this
	ariaControls (component?: Component): this

	tabIndex (index?: "programmatic" | "auto" | number): this
	focus (): this
	blur (): this
}

interface Component<ELEMENT extends HTMLElement = HTMLElement> extends BaseComponent<ELEMENT>, ComponentExtensions<ELEMENT> { }

enum Classes {
	ReceiveAncestorInsertEvents = "_receieve-ancestor-insert-events",
	ReceiveDescendantInsertEvents = "_receieve-descendant-insert-events",
	ReceiveAncestorRectDirtyEvents = "_receieve-ancestor-rect-dirty-events",
	ReceiveScrollEvents = "_receieve-scroll-events",
}

const componentExtensionsRegistry: ((component: Mutable<Component>) => any)[] = []

function Component<TYPE extends keyof HTMLElementTagNameMap> (type: TYPE): Component<HTMLElementTagNameMap[TYPE]>
function Component (): Component<HTMLSpanElement>
function Component (type?: keyof HTMLElementTagNameMap): Component
function Component (type: keyof HTMLElementTagNameMap = "span"): Component {

	let unuseIdState: UnsubscribeState | undefined
	let unuseNameState: UnsubscribeState | undefined
	let unuseAriaLabelledByIdState: UnsubscribeState | undefined
	let unuseAriaControlsIdState: UnsubscribeState | undefined

	let descendantsListeningForScroll: HTMLCollection | undefined

	let owner: Component | undefined
	let component = ({
		supers: [],
		isComponent: true,
		element: document.createElement(type),
		removed: State(false),
		rooted: State(false),

		get tagName () {
			return component.element.tagName as Uppercase<keyof HTMLElementTagNameMap>
		},

		setOwner: newOwner => {
			owner?.event.unsubscribe("remove", component.remove)
			owner = newOwner
			owner.event.subscribe("remove", component.remove)
			return component
		},

		replaceElement: newElement => {
			if (typeof newElement === "string")
				newElement = document.createElement(newElement)

			const oldElement = component.element

			newElement.replaceChildren(...component.element.childNodes)
			if (component.element.parentNode)
				component.element.replaceWith(newElement)

			component.element = newElement
			type = component.element.tagName as keyof HTMLElementTagNameMap

			ELEMENT_TO_COMPONENT_MAP.delete(oldElement)
			ELEMENT_TO_COMPONENT_MAP.set(newElement, component)

			component.attributes.copy(oldElement)
			component.style.refresh()

			return component
		},
		is: (builder): this is any => component.supers.includes(builder),
		as: (builder): any => component.supers.includes(builder) ? component : undefined,
		cast: (): any => component,
		and<PARAMS extends any[], COMPONENT extends Component> (builder: Component.Extension<PARAMS, COMPONENT> | Component.ExtensionAsync<PARAMS, COMPONENT>, ...params: PARAMS) {
			const result = builder.from(component, ...params)
			if (result instanceof Promise)
				return result.then(result => {
					component = result
					component.supers.push(builder)
					if (builder.name)
						component.attributes.prepend(`:${builder.name.kebabcase}`)
					return component
				})

			component = result
			component.supers.push(builder)
			if (builder.name)
				component.attributes.prepend(`:${builder.name.kebabcase}`)
			return component as any
		},
		extend: extension => Object.assign(component, extension(component as never)) as never,
		extendMagic: (property, magic) => {
			Define.magic(component, property, magic(component))
			return component
		},
		extendJIT: (property, supplier) => {
			Define.magic(component, property, {
				get: () => {
					const value = supplier(component)
					Define.set(component, property, value)
					return value
				},
				set: value => {
					Define.set(component, property, value)
				},
			})
			return component
		},

		tweak: (tweaker, ...params) => {
			tweaker?.(component, ...params)
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
		get anchor () {
			return Define.set(component, "anchor", AnchorManipulator(component))
		},

		get hovered (): State<boolean> {
			return Define.set(component, "hovered", State(false))
		},
		get focused (): State<boolean> {
			return Define.set(component, "focused", State(false))
		},
		get hasFocused (): State<boolean> {
			return Define.set(component, "hasFocused", State(false))
		},
		get hoveredOrFocused (): State<boolean> {
			return Define.set(component, "hoveredOrFocused",
				State.Generator(() => component.hovered.value || component.focused.value)
					.observe(component, component.hovered, component.focused))
		},
		get hoveredOrHasFocused (): State<boolean> {
			return Define.set(component, "hoveredOrHasFocused",
				State.Generator(() => component.hovered.value || component.hasFocused.value)
					.observe(component, component.hovered, component.hasFocused))
		},
		get active (): State<boolean> {
			return Define.set(component, "active", State(false))
		},
		get id (): State<string | undefined> {
			return Define.set(component, "id", State(undefined))
		},
		get name (): State<string | undefined> {
			return Define.set(component, "name", State(undefined))
		},
		get rect (): State.JIT<DOMRect> {
			const rectState = State.JIT(() => component.element.getBoundingClientRect())
			const oldMarkDirty = rectState.markDirty
			rectState.markDirty = () => {
				oldMarkDirty()
				for (const descendant of this.element.getElementsByClassName(Classes.ReceiveAncestorRectDirtyEvents))
					descendant.component?.event.emit("ancestorRectDirty")
				return rectState
			}
			this.receiveAncestorInsertEvents()
			this.receiveAncestorScrollEvents()
			this.classes.add(Classes.ReceiveAncestorRectDirtyEvents)
			this.event.subscribe(["insert", "ancestorInsert", "ancestorScroll", "ancestorRectDirty"], rectState.markDirty)
			Viewport.size.subscribe(component, rectState.markDirty)
			return Define.set(component, "rect", rectState)
		},

		setId: id => {
			unuseIdState?.()
			unuseIdState = undefined

			if (id && typeof id !== "string")
				unuseIdState = id.use(component, setId)
			else
				setId(id)

			return component

			function setId (id?: string) {
				if (id) {
					component.element.setAttribute("id", id)
					component.id.value = id
				} else {
					component.element.removeAttribute("id")
					component.id.value = undefined
				}
			}
		},
		setName: name => {
			unuseNameState?.()
			unuseNameState = undefined

			if (name && typeof name !== "string")
				unuseNameState = name.use(component, setName)
			else
				setName(name)

			return component

			function setName (name?: string) {
				if (name) {
					name = name.replace(/[^\w-]+/g, "-").toLowerCase()
					component.element.setAttribute("name", name)
					component.name.value = name
				} else {
					component.element.removeAttribute("name")
					component.name.value = undefined
				}
			}
		},

		remove (internal = false) {
			component.removed.value = true
			component.rooted.value = false

			interface HTMLElementRemovable extends HTMLElement {
				component?: Component & { remove (internal: boolean): void }
			}

			if (internal !== true)
				for (const descendant of component.element.querySelectorAll<HTMLElementRemovable>("*"))
					descendant.component?.remove(true)

			component.element.component = undefined
			component.element.remove()

			component.event.emit("unroot")
			component.event.emit("remove")
			owner?.event.unsubscribe("remove", component.remove)
		},
		appendTo (destination) {
			Component.element(destination).append(component.element)
			component.emitInsert()
			return component
		},
		prependTo (destination) {
			Component.element(destination).prepend(component.element)
			component.emitInsert()
			return component
		},
		insertTo (destination, direction, sibling) {
			const element = Component.element(destination)
			const siblingElement = sibling ? Component.element(sibling) : null
			if (direction === "before")
				element.insertBefore(component.element, siblingElement)
			else
				element.insertBefore(component.element, siblingElement?.nextSibling ?? null)

			component.emitInsert()
			return component
		},
		append (...contents) {
			const elements = contents.map(Component.element)
			component.element.append(...elements)

			for (const element of elements)
				(element as Element).component?.emitInsert()

			return component
		},
		prepend (...contents) {
			const elements = contents.map(Component.element)
			component.element.prepend(...elements)

			for (const element of elements)
				(element as Element).component?.emitInsert()

			return component
		},
		insert (direction, sibling, ...contents) {
			const siblingElement = sibling ? Component.element(sibling) : null
			const elements = contents.map(Component.element)

			if (direction === "before")
				for (let i = elements.length - 1; i >= 0; i--)
					component.element.insertBefore(elements[i], siblingElement)
			else
				for (const element of elements)
					component.element.insertBefore(element, siblingElement?.nextSibling ?? null)

			for (const element of elements)
				(element as Element).component?.emitInsert()

			return component
		},
		removeContents () {
			component.element.replaceChildren()
			return component
		},

		closest (builder: any) {
			let cursor: HTMLElement | null = component.element
			while (cursor) {
				cursor = cursor.parentElement
				const component = cursor?.component
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				if (component?.is(builder))
					return component
			}
		},

		get parent () {
			return component.element.parentElement?.component
		},
		get previousSibling () {
			return component.element.previousElementSibling?.component
		},
		get nextSibling () {
			return component.element.nextElementSibling?.component
		},
		*getAncestorComponents () {
			let cursor: HTMLElement | null = component.element
			while (cursor) {
				cursor = cursor.parentElement
				const component = cursor?.component
				if (component)
					yield component
			}
		},

		receiveAncestorInsertEvents: () => {
			component.element.classList.add(Classes.ReceiveAncestorInsertEvents)
			return component
		},
		receiveDescendantInsertEvents: () => {
			component.element.classList.add(Classes.ReceiveAncestorInsertEvents)
			return component
		},
		receiveAncestorScrollEvents () {
			component.element.classList.add(Classes.ReceiveScrollEvents)
			return component
		},
		emitInsert: () => {
			updateRooted(component)
			emitInsert(component)
			return component
		},
		monitorScrollEvents () {
			descendantsListeningForScroll ??= component.element.getElementsByClassName(Classes.ReceiveScrollEvents)
			component.event.subscribe("scroll", () => {
				for (const descendant of [...descendantsListeningForScroll!])
					descendant.component?.event.emit("ancestorScroll")
			})
			return component
		},
		onRooted (callback) {
			component.rooted.awaitManual(true, () => callback(component))
			return component
		},

		ariaRole: (role?: string) => {
			if (!role)
				return component.attributes.remove("role")

			return component.attributes.set("role", role)
		},
		get ariaLabel () {
			return Define.set(component, "ariaLabel", StringApplicator(component as Component, value => component.attributes.set("aria-label", value)))
		},
		ariaLabelledBy: labelledBy => {
			unuseAriaLabelledByIdState?.()
			if (labelledBy) {
				const state = State.Generator(() => labelledBy.id.value ?? labelledBy.attributes.get("for"))
					.observe(component, labelledBy.id, labelledBy.cast<Label>()?.for)
				unuseAriaLabelledByIdState = state.use(component, id =>
					component.attributes.set("aria-labelledby", id))
			}
			return component
		},
		ariaHidden: () => component.attributes.set("aria-hidden", "true"),
		ariaChecked: state => {
			state.use(component, state =>
				component.attributes.set("aria-checked", `${state}`))
			return component
		},
		ariaControls: target => {
			unuseAriaControlsIdState?.()
			unuseAriaControlsIdState = target?.id.use(component, id =>
				component.attributes.set("aria-controls", id))
			return component
		},

		tabIndex: index => {
			if (index === undefined)
				component.element.removeAttribute("tabindex")
			else if (index === "programmatic")
				component.element.setAttribute("tabindex", "-1")
			else if (index === "auto")
				component.element.setAttribute("tabindex", "0")
			else
				component.element.setAttribute("tabindex", `${index}`)

			return component
		},
		focus: () => {
			FocusListener.focus(component.element)
			return component
		},
		blur: () => {
			FocusListener.blur(component.element)
			return component
		},
	} satisfies Pick<Component, keyof BaseComponent>) as any as Mutable<Component>

	for (const extension of componentExtensionsRegistry)
		extension(component)

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

	let cursor = component.element.parentElement
	while (cursor) {
		cursor.component?.event.emit("descendantInsert")
		cursor = cursor.parentElement
	}
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

	export interface Builder<PARAMS extends any[], BUILD_COMPONENT extends Component> extends Extension<PARAMS, BUILD_COMPONENT> {
		(...params: PARAMS): BUILD_COMPONENT
		setName (name: string): this
	}

	export interface BuilderAsync<PARAMS extends any[], BUILD_COMPONENT extends Component> extends ExtensionAsync<PARAMS, BUILD_COMPONENT> {
		(...params: PARAMS): Promise<BUILD_COMPONENT>
		setName (name: string): this
	}

	const defaultBuilder = (type?: keyof HTMLElementTagNameMap) => Component(type)
	export function Builder<PARAMS extends any[], COMPONENT extends Component> (builder: (component: Component, ...params: PARAMS) => COMPONENT): Builder<PARAMS, COMPONENT>
	export function Builder<PARAMS extends any[], COMPONENT extends Component> (builder: (component: Component, ...params: PARAMS) => Promise<COMPONENT>): BuilderAsync<PARAMS, COMPONENT>
	export function Builder<PARAMS extends any[], COMPONENT extends Component> (initial: keyof HTMLElementTagNameMap | (() => Component), builder: (component: Component, ...params: PARAMS) => COMPONENT): Builder<PARAMS, COMPONENT>
	export function Builder<PARAMS extends any[], COMPONENT extends Component> (initial: keyof HTMLElementTagNameMap | (() => Component), builder: (component: Component, ...params: PARAMS) => Promise<COMPONENT>): BuilderAsync<PARAMS, COMPONENT>
	export function Builder (initialOrBuilder: keyof HTMLElementTagNameMap | AnyFunction, builder?: (component: Component, ...params: any[]) => Component | Promise<Component>): (component?: Component, ...params: any[]) => Component | Promise<Component> {
		let name = getBuilderName()

		const type = typeof initialOrBuilder === "string" ? initialOrBuilder : undefined
		const initialBuilder: (type?: keyof HTMLElementTagNameMap) => Component = !builder || typeof initialOrBuilder === "string" ? defaultBuilder : initialOrBuilder
		builder ??= initialOrBuilder as AnyFunction

		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const realBuilder = (component = initialBuilder(type), ...params: any[]) => builder(component, ...params)
		const simpleBuilder = (...params: any[]) => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			const component = realBuilder(undefined, ...params)
			if (component instanceof Promise)
				return component.then(completeComponent)

			return completeComponent(component)
		}

		Object.defineProperty(simpleBuilder, "name", { value: name, configurable: true })

		const resultBuilder = Object.assign(simpleBuilder, {
			from: realBuilder,
			setName (newName: string) {
				name = addKebabCase(newName)
				Object.defineProperty(simpleBuilder, "name", { value: name })
				return resultBuilder
			},
		})
		return resultBuilder

		function completeComponent (component: Component) {
			if (name && Env.isDev) {
				(component as Component & { [Symbol.toStringTag]?: string })[Symbol.toStringTag] ??= name.toString()
				const tagName = `:${name.kebabcase}`
				if (component.element.tagName === "SPAN") {
					component.replaceElement(tagName as keyof HTMLElementTagNameMap)
				} else {
					component.attributes.prepend(tagName)
				}
			}

			component.supers.push(simpleBuilder)
			return component
		}
	}

	export interface Extension<PARAMS extends any[], EXT_COMPONENT extends Component> {
		name: BuilderName
		from<COMPONENT extends Component> (component?: COMPONENT, ...params: PARAMS): COMPONENT & EXT_COMPONENT
	}

	export interface ExtensionAsync<PARAMS extends any[], EXT_COMPONENT extends Component> {
		name: BuilderName
		from<COMPONENT extends Component> (component?: COMPONENT, ...params: PARAMS): Promise<COMPONENT & EXT_COMPONENT>
	}

	export function Extension<PARAMS extends any[], COMPONENT extends Component> (builder: (component: Component, ...params: PARAMS) => COMPONENT): Extension<PARAMS, COMPONENT>
	export function Extension<PARAMS extends any[], COMPONENT extends Component> (builder: (component: Component, ...params: PARAMS) => Promise<COMPONENT>): ExtensionAsync<PARAMS, COMPONENT>
	export function Extension (builder: (component: Component, ...params: any[]) => Component | Promise<Component>) {
		return {
			name: getBuilderName(),
			from: builder,
		} as Extension<any[], Component> | ExtensionAsync<any[], Component>
	}

	export function extend (extension: (component: Mutable<Component>) => any) {
		componentExtensionsRegistry.push(extension as (component: Mutable<Component>) => any)
	}

	/**
	 * Returns the component for the given element, if it exists
	 */
	export function get (element?: unknown): Component | undefined {
		if (!element || (typeof element !== "object" && typeof element !== "function"))
			return undefined

		return ELEMENT_TO_COMPONENT_MAP.get(element as Element)
	}

	const STACK_FILE_NAME_REGEX = /\(http.*?(\w+)\.ts:\d+:\d+\)/
	const PASCAL_CASE_WORD_START = /(?<=[a-z0-9_-])(?=[A-Z])/g

	interface BuilderName extends String {
		kebabcase: string
	}

	function addKebabCase (name: string): BuilderName {
		return Object.assign(String(name), {
			kebabcase: name.replaceAll(PASCAL_CASE_WORD_START, "-").toLowerCase(),
		})
	}

	function getBuilderName (): BuilderName | undefined {
		const stack = Strings.shiftLine((new Error().stack ?? ""), 3)
		const name = stack.match(STACK_FILE_NAME_REGEX)?.[1]
		if (!name)
			return undefined

		return addKebabCase(name)
	}

}

TextManipulator.setComponent(Component)

export default Component
