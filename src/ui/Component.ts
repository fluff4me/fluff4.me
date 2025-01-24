import { WeavingArg, type WeavingRenderable } from 'lang/en-nz'
import type Label from 'ui/component/core/Label'
import AnchorManipulator from 'ui/utility/AnchorManipulator'
import AttributeManipulator from 'ui/utility/AttributeManipulator'
import ClassManipulator from 'ui/utility/ClassManipulator'
import type { NativeEvents } from 'ui/utility/EventManipulator'
import EventManipulator from 'ui/utility/EventManipulator'
import FocusListener from 'ui/utility/FocusListener'
import StringApplicator, { QuiltHelper } from 'ui/utility/StringApplicator'
import StyleManipulator from 'ui/utility/StyleManipulator'
import TextManipulator from 'ui/utility/TextManipulator'
import Viewport from 'ui/utility/Viewport'
import { Truthy } from 'utility/Arrays'
import Async from 'utility/Async'
import Define from 'utility/Define'
import Env from 'utility/Env'
import Errors from 'utility/Errors'
import type { UnsubscribeState } from 'utility/State'
import State from 'utility/State'
import Strings from 'utility/string/Strings'
import type { AnyFunction, Falsy, Mutable } from 'utility/Type'

const SYMBOL_COMPONENT_BRAND = Symbol('COMPONENT_BRAND')
export interface ComponentBrand<TYPE extends string> {
	[SYMBOL_COMPONENT_BRAND]: TYPE
}

type AriaRole =
	| 'button'
	| 'checkbox'
	| 'form'
	| 'main'
	| 'navigation'
	| 'toolbar'
	| 'textbox'
	| 'group'
	| 'radio'
	| 'radiogroup'

const ELEMENT_TO_COMPONENT_MAP = new WeakMap<Element, Component>()

declare global {
	interface Node {
		component?: Component
	}
}

Define.magic(Element.prototype, 'component', {
	get (): Component | undefined {
		return ELEMENT_TO_COMPONENT_MAP.get(this)
	},
	set (component): void {
		if (component) {
			ELEMENT_TO_COMPONENT_MAP.set(this, component)
		}
		else {
			ELEMENT_TO_COMPONENT_MAP.delete(this)
		}
	},
})

export interface ComponentInsertionDestination {
	readonly isInsertionDestination: true
	append (...contents: (Component | Node | Falsy)[]): this
	prepend (...contents: (Component | Node | Falsy)[]): this
	insert (direction: 'before' | 'after', sibling: Component | Element | undefined, ...contents: (Component | Node | Falsy)[]): this
}

export namespace ComponentInsertionDestination {
	export function is (value: unknown): value is ComponentInsertionDestination {
		return typeof value === 'object' && !!(value as ComponentInsertionDestination)?.isInsertionDestination
	}
}

export interface ComponentEvents extends NativeEvents {
	insert (): any
	ancestorInsert (): any
	ancestorScroll (): any
	descendantInsert (): any
	childrenInsert (nodes: Node[]): any
	ancestorRectDirty (): any
	root (): any
	unroot (): any
}

export interface ComponentExtensions<ELEMENT extends HTMLElement = HTMLElement> { }

interface BaseComponent<ELEMENT extends HTMLElement = HTMLElement> extends ComponentInsertionDestination {
	readonly isComponent: true
	readonly supers: State<any[]>

	readonly classes: ClassManipulator<this>
	readonly attributes: AttributeManipulator<this>
	readonly event: EventManipulator<this, ComponentEvents>
	readonly text: TextManipulator<this>
	readonly style: StyleManipulator<this>
	readonly anchor: AnchorManipulator<this>

	readonly hovered: State<boolean>
	readonly focused: State<boolean>
	readonly hasFocused: State<boolean>
	readonly hadFocusedLast: State<boolean>
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

	is<BUILDERS extends Component.BuilderLike[]> (builder: BUILDERS): this is { [INDEX in keyof BUILDERS]: BUILDERS[INDEX] extends infer BUILDER ? (BUILDER extends Component.BuilderLike<any[], infer COMPONENT> ? COMPONENT : never) | undefined : never }[number]
	is<COMPONENT extends Component> (builder: Component.BuilderLike<any[], COMPONENT>): this is COMPONENT
	is<COMPONENT extends Component> (builder?: Component.BuilderLike<any[], COMPONENT>): boolean
	as<COMPONENT extends Component> (builder: Component.BuilderLike<any[], COMPONENT>): COMPONENT | undefined
	as<COMPONENT extends Component> (builder?: Component.BuilderLike<any[], COMPONENT>): COMPONENT | this | undefined
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
	extendMagic<K extends Exclude<keyof this, symbol>, O extends this = this> (property: K, magic: (component: this) => { get (): O[K], set?(value: O[K]): void }): this
	extendJIT<K extends Exclude<keyof this, symbol>, O extends this = this> (property: K, supplier: (component: this) => O[K]): this

	tweak<PARAMS extends any[]> (tweaker?: (component: this, ...params: PARAMS) => unknown, ...params: PARAMS): this

	disableInsertion (): Omit<this, keyof ComponentInsertionDestination>

	appendTo (destination: ComponentInsertionDestination | Element): this
	prependTo (destination: ComponentInsertionDestination | Element): this
	insertTo (destination: ComponentInsertionDestination | Element, direction: 'before' | 'after', sibling?: Component | Element): this

	closest<BUILDERS extends Component.BuilderLike[]> (builder: BUILDERS): { [INDEX in keyof BUILDERS]: BUILDERS[INDEX] extends infer BUILDER ? (BUILDER extends Component.BuilderLike<any[], infer COMPONENT> ? COMPONENT : never) | undefined : never }[number]
	closest<BUILDER extends Component.BuilderLike> (builder: BUILDER): (BUILDER extends Component.BuilderLike<any[], infer COMPONENT> ? COMPONENT : never) | undefined
	closest<COMPONENT extends Component> (builder: Component.Builder<any[], COMPONENT>): COMPONENT | undefined
	closest<COMPONENT extends Component> (builder: Component.Extension<any[], COMPONENT>): COMPONENT | undefined

	get parent (): Component | undefined
	/** Gets all ancestors of this component that have an associated component */
	getAncestorComponents (): Generator<Component>
	/** Gets all ancestors of this component that have an associated component of the given type */
	getAncestorComponents<COMPONENT extends Component> (filterBuilder: Component.BuilderLike<any[], COMPONENT>): Generator<COMPONENT>
	get previousSibling (): Component | undefined
	/** Gets the previous sibling component of the given type */
	getPreviousSibling<COMPONENT extends Component> (filterBuilder: Component.BuilderLike<any[], COMPONENT>): COMPONENT | undefined
	get nextSibling (): Component | undefined
	/** Gets the next sibling component of the given type */
	getNextSibling<COMPONENT extends Component> (filterBuilder: Component.BuilderLike<any[], COMPONENT>): COMPONENT | undefined
	/** Iterates through all children that have an associated component */
	getChildren (): Generator<Component>
	/** Iterates through all children that have an associated component of the given type */
	getChildren<COMPONENT extends Component> (filterBuilder: Component.BuilderLike<any[], COMPONENT>): Generator<COMPONENT>
	/** Iterates through all siblings that have an associated component */
	getSiblings (): Generator<Component>
	/** Iterates through all children that have an associated component of the given type */
	getSiblings<COMPONENT extends Component> (filterBuilder: Component.BuilderLike<any[], COMPONENT>): Generator<COMPONENT>
	/** Iterates through all siblings before this component that have an associated component (in actual order) */
	getPreviousSiblings (): Generator<Component>
	/** Iterates through all children that have an associated component of the given type */
	getPreviousSiblings<COMPONENT extends Component> (filterBuilder: Component.BuilderLike<any[], COMPONENT>): Generator<COMPONENT>
	/** Iterates through all siblings after this component that have an associated component */
	getNextSiblings (): Generator<Component>
	/** Iterates through all children that have an associated component of the given type */
	getNextSiblings<COMPONENT extends Component> (filterBuilder: Component.BuilderLike<any[], COMPONENT>): Generator<COMPONENT>
	/** Iterates through all descendants that have an associated component */
	getDescendants (): Generator<Component>
	/** Iterates through all descendants that have an associated component of the given type */
	getDescendants<COMPONENT extends Component> (filterBuilder: Component.BuilderLike<any[], COMPONENT>): Generator<COMPONENT>
	/** Iterates through all descendants that have an associated component */
	getFirstDescendant (): Component | undefined
	/** Iterates through all descendants that have an associated component of the given type */
	getFirstDescendant<COMPONENT extends Component> (filterBuilder: Component.BuilderLike<any[], COMPONENT>): COMPONENT | undefined

	remove (): void
	removeContents (): this

	receiveAncestorInsertEvents (): this
	receiveDescendantInsertEvents (): this
	receiveAncestorScrollEvents (): this
	emitInsert (): this
	monitorScrollEvents (): this

	onRooted (callback: (component: this) => unknown): this
	onRemove (owner: Component, callback: (component: this) => unknown): this
	onRemoveManual (callback: (component: this) => unknown): this

	ariaRole (role?: AriaRole): this
	ariaLabel: StringApplicator.Optional<this>
	ariaLabelledBy (component?: Component): this
	ariaHidden (): this
	ariaChecked (state: State<boolean>): this
	ariaControls (component?: Component): this

	tabIndex (index?: 'programmatic' | 'auto' | number): this
	focus (): this
	blur (): this
}

interface Component<ELEMENT extends HTMLElement = HTMLElement> extends BaseComponent<ELEMENT>, ComponentExtensions<ELEMENT>, WeavingRenderable { }

enum Classes {
	ReceiveAncestorInsertEvents = '_receieve-ancestor-insert-events',
	ReceiveDescendantInsertEvents = '_receieve-descendant-insert-events',
	ReceiveAncestorRectDirtyEvents = '_receieve-ancestor-rect-dirty-events',
	ReceiveScrollEvents = '_receieve-scroll-events',
}

const componentExtensionsRegistry: ((component: Mutable<Component>) => unknown)[] = []

function Component<TYPE extends keyof HTMLElementTagNameMap> (type: TYPE): Component<HTMLElementTagNameMap[TYPE]>
function Component (): Component<HTMLSpanElement>
function Component (type?: keyof HTMLElementTagNameMap): Component
function Component (type: keyof HTMLElementTagNameMap = 'span'): Component {
	let unuseIdState: UnsubscribeState | undefined
	let unuseNameState: UnsubscribeState | undefined
	let unuseAriaLabelledByIdState: UnsubscribeState | undefined
	let unuseAriaControlsIdState: UnsubscribeState | undefined
	let unuseOwnerRemove: UnsubscribeState | undefined

	let descendantsListeningForScroll: HTMLCollection | undefined

	let component = ({
		supers: State([]),
		isComponent: true,
		isInsertionDestination: true,
		element: document.createElement(type),
		removed: State(false),
		rooted: State(false),

		get tagName () {
			return component.element.tagName as Uppercase<keyof HTMLElementTagNameMap>
		},

		setOwner: newOwner => {
			unuseOwnerRemove?.()
			unuseOwnerRemove = newOwner.removed.use(component, removed => removed && component.remove())
			return component
		},

		replaceElement: newElement => {
			if (typeof newElement === 'string')
				newElement = document.createElement(newElement)

			const oldElement = component.element

			Component.removeContents(newElement)
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
		is: (builder?: Component.BuilderLike | Component.BuilderLike[]): this is any => !builder || (Array.isArray(builder) ? builder : [builder]).some(builder => component.supers.value.includes(builder)),
		as: (builder): any => !builder || component.supers.value.includes(builder) ? component : undefined,
		cast: (): any => component,
		and<PARAMS extends any[], COMPONENT extends Component> (builder: Component.Builder<PARAMS, COMPONENT> | Component.BuilderAsync<PARAMS, COMPONENT> | Component.Extension<PARAMS, COMPONENT> | Component.ExtensionAsync<PARAMS, COMPONENT>, ...params: PARAMS) {
			if (component.is(builder as never))
				return component

			const result = builder.from(component, ...params)
			if (result instanceof Promise)
				return result.then(result => {
					component = result
					component.supers.value.push(builder)
					component.supers.emit()
					if (builder.name)
						component.attributes.prepend(`:${builder.name.kebabcase}`)
					return component
				})

			component = result
			component.supers.value.push(builder)
			component.supers.emit()
			if (builder.name)
				component.attributes.prepend(`:${builder.name.kebabcase}`)
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
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

		tweak: (tweaker: (component: Component, ...params: any[]) => unknown, ...params: any[]) => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			tweaker?.(component, ...params)
			return component
		},

		get style () {
			return Define.set(component, 'style', StyleManipulator(component))
		},
		get classes () {
			return Define.set(component, 'classes', ClassManipulator(component))
		},
		get attributes () {
			return Define.set(component, 'attributes', AttributeManipulator(component))
		},
		get event () {
			return Define.set(component, 'event', EventManipulator(component))
		},
		get text () {
			return Define.set(component, 'text', TextManipulator(component))
		},
		get anchor () {
			return Define.set(component, 'anchor', AnchorManipulator(component))
		},

		get hovered (): State<boolean> {
			return Define.set(component, 'hovered', State(false))
		},
		get focused (): State<boolean> {
			return Define.set(component, 'focused', State(false))
		},
		get hasFocused (): State<boolean> {
			return Define.set(component, 'hasFocused', State(false))
		},
		get hadFocusedLast (): State<boolean> {
			return Define.set(component, 'hadFocusedLast', State(false))
		},
		get hoveredOrFocused (): State<boolean> {
			return Define.set(component, 'hoveredOrFocused',
				State.Generator(() => component.hovered.value || component.focused.value)
					.observe(component, component.hovered, component.focused))
		},
		get hoveredOrHasFocused (): State<boolean> {
			return Define.set(component, 'hoveredOrHasFocused',
				State.Generator(() => component.hovered.value || component.hasFocused.value)
					.observe(component, component.hovered, component.hasFocused))
		},
		get active (): State<boolean> {
			return Define.set(component, 'active', State(false))
		},
		get id (): State<string | undefined> {
			return Define.set(component, 'id', State(undefined))
		},
		get name (): State<string | undefined> {
			return Define.set(component, 'name', State(undefined))
		},
		get rect (): State.JIT<DOMRect> {
			const rectState = State.JIT(() => component.element.getBoundingClientRect())
			const oldMarkDirty = rectState.markDirty
			rectState.markDirty = () => {
				oldMarkDirty()
				for (const descendant of this.element.getElementsByClassName(Classes.ReceiveAncestorRectDirtyEvents))
					descendant.component?.event.emit('ancestorRectDirty')
				return rectState
			}
			this.receiveAncestorInsertEvents()
			this.receiveAncestorScrollEvents()
			this.classes.add(Classes.ReceiveAncestorRectDirtyEvents)
			this.event.subscribe(['insert', 'ancestorInsert', 'ancestorScroll', 'ancestorRectDirty'], rectState.markDirty)
			Viewport.size.subscribe(component, rectState.markDirty)
			return Define.set(component, 'rect', rectState)
		},

		setId: id => {
			unuseIdState?.()
			unuseIdState = undefined

			if (id && typeof id !== 'string')
				unuseIdState = id.use(component, setId)
			else
				setId(id)

			return component

			function setId (id?: string) {
				if (id) {
					component.element.setAttribute('id', id)
					component.id.asMutable?.setValue(id)
				}
				else {
					component.element.removeAttribute('id')
					component.id.asMutable?.setValue(undefined)
				}
			}
		},
		setName: name => {
			unuseNameState?.()
			unuseNameState = undefined

			if (name && typeof name !== 'string')
				unuseNameState = name.use(component, setName)
			else
				setName(name)

			return component

			function setName (name?: string) {
				if (name) {
					name = name.replace(/[^\w-]+/g, '-').toLowerCase()
					component.element.setAttribute('name', name)
					component.name.asMutable?.setValue(name)
				}
				else {
					component.element.removeAttribute('name')
					component.name.asMutable?.setValue(undefined)
				}
			}
		},

		disableInsertion () {
			return component
		},

		remove () {
			component.removeContents()

			component.removed.asMutable?.setValue(true)
			component.rooted.asMutable?.setValue(false)

			component.element.component = undefined
			component.element.remove()

			component.event.emit('unroot')
			unuseOwnerRemove?.()
		},
		appendTo (destination) {
			destination.append(component.element)
			component.emitInsert()
			return component
		},
		prependTo (destination) {
			destination.prepend(component.element)
			component.emitInsert()
			return component
		},
		insertTo (destination, direction, sibling) {
			if (ComponentInsertionDestination.is(destination)) {
				destination.insert(direction, sibling, component)
				component.emitInsert()
				return component
			}

			const siblingElement = sibling ? Component.element(sibling) : null
			if (direction === 'before')
				destination.insertBefore(component.element, siblingElement)
			else
				destination.insertBefore(component.element, siblingElement?.nextSibling ?? null)

			component.emitInsert()
			return component
		},
		append (...contents) {
			const elements = contents.filter(Truthy).map(Component.element)
			component.element.append(...elements)

			for (const element of elements)
				(element as Element).component?.emitInsert()

			component.event.emit('childrenInsert', elements)
			return component
		},
		prepend (...contents) {
			const elements = contents.filter(Truthy).map(Component.element)
			component.element.prepend(...elements)

			for (const element of elements)
				(element as Element).component?.emitInsert()

			component.event.emit('childrenInsert', elements)
			return component
		},
		insert (direction, sibling, ...contents) {
			const siblingElement = sibling ? Component.element(sibling) : null
			const elements = contents.filter(Truthy).map(Component.element)

			if (direction === 'before')
				for (let i = elements.length - 1; i >= 0; i--)
					component.element.insertBefore(elements[i], siblingElement)
			else
				for (const element of elements)
					component.element.insertBefore(element, siblingElement?.nextSibling ?? null)

			for (const element of elements)
				(element as Element).component?.emitInsert()

			component.event.emit('childrenInsert', elements)
			return component
		},
		removeContents () {
			Component.removeContents(component.element)
			return component
		},

		closest (builder: any) {
			let cursor: HTMLElement | null = component.element
			while (cursor) {
				cursor = cursor.parentElement
				const component = cursor?.component

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
		getPreviousSibling (builder) {
			const [sibling] = component.getPreviousSiblings(builder)
			return sibling
		},
		get nextSibling () {
			return component.element.nextElementSibling?.component
		},
		getNextSibling (builder) {
			const [sibling] = component.getNextSiblings(builder)
			return sibling
		},
		*getAncestorComponents (builder?: Component.BuilderLike) {
			let cursor: HTMLElement | null = component.element
			while (cursor) {
				cursor = cursor.parentElement
				const component = cursor?.component
				if (component?.is(builder))
					yield component
			}
		},
		*getChildren (builder?: Component.BuilderLike) {
			for (const child of component.element.children) {
				const component = child.component
				if (component?.is(builder))
					yield component
			}
		},
		*getSiblings (builder?: Component.BuilderLike) {
			const parent = component.element.parentElement
			for (const child of parent?.children ?? [])
				if (child !== component.element) {
					const component = child.component
					if (component?.is(builder))
						yield component
				}
		},
		*getPreviousSiblings (builder?: Component.BuilderLike) {
			const parent = component.element.parentElement
			for (const child of parent?.children ?? []) {
				if (child === component.element)
					break

				const childComponent = child.component
				if (childComponent?.is(builder))
					yield childComponent
			}
		},
		*getNextSiblings (builder?: Component.BuilderLike) {
			let cursor: Element | null = component.element
			while ((cursor = cursor.nextElementSibling)) {
				const component = cursor.component
				if (component?.is(builder))
					yield component
			}
		},
		*getDescendants (builder?: Component.BuilderLike) {
			const walker = document.createTreeWalker(component.element, NodeFilter.SHOW_ELEMENT)
			let node: Node | null
			while ((node = walker.nextNode())) {
				const component = node.component
				if (component?.is(builder))
					yield component
			}
		},
		getFirstDescendant (builder?: Component.BuilderLike) {
			const [first] = component.getDescendants(builder!)
			return first
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
			component.event.subscribe('scroll', () => {
				for (const descendant of [...descendantsListeningForScroll!])
					descendant.component?.event.emit('ancestorScroll')
			})
			return component
		},
		onRooted (callback) {
			component.rooted.awaitManual(true, () => callback(component))
			return component
		},
		onRemove (owner, callback) {
			component.removed.await(owner, true, () => callback(component))
			return component
		},
		onRemoveManual (callback) {
			component.removed.awaitManual(true, () => callback(component))
			return component
		},

		ariaRole: (role?: string) => {
			if (!role)
				return component.attributes.remove('role')

			return component.attributes.set('role', role)
		},
		get ariaLabel () {
			return Define.set(component, 'ariaLabel', StringApplicator(component as Component, value => component.attributes.set('aria-label', value)))
		},
		ariaLabelledBy: labelledBy => {
			unuseAriaLabelledByIdState?.()
			if (labelledBy) {
				const state = State.Generator(() => labelledBy.id.value ?? labelledBy.attributes.get('for'))
					.observe(component, labelledBy.id, labelledBy.cast<Label>()?.for)
				unuseAriaLabelledByIdState = state.use(component, id =>
					component.attributes.set('aria-labelledby', id))
			}
			return component
		},
		ariaHidden: () => component.attributes.set('aria-hidden', 'true'),
		ariaChecked: state => {
			state.use(component, state =>
				component.attributes.set('aria-checked', `${state}`))
			return component
		},
		ariaControls: target => {
			unuseAriaControlsIdState?.()
			unuseAriaControlsIdState = target?.id.use(component, id =>
				component.attributes.set('aria-controls', id))
			return component
		},

		tabIndex: index => {
			if (index === undefined)
				component.element.removeAttribute('tabindex')
			else if (index === 'programmatic')
				component.element.setAttribute('tabindex', '-1')
			else if (index === 'auto')
				component.element.setAttribute('tabindex', '0')
			else
				component.element.setAttribute('tabindex', `${index}`)

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

	WeavingArg.setRenderable(component)

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

	component.event.emit('insert')
	const descendantsListeningForEvent = component.element.getElementsByClassName(Classes.ReceiveAncestorInsertEvents)
	for (const descendant of descendantsListeningForEvent)
		descendant.component?.event.emit('ancestorInsert')

	let cursor = component.element.parentElement
	while (cursor) {
		cursor.component?.event.emit('descendantInsert')
		cursor = cursor.parentElement
	}
}

function updateRooted (component: Component | undefined) {
	if (component) {
		const rooted = document.documentElement.contains(component.element)
		if (component.rooted.value === rooted)
			return

		component.rooted.asMutable?.setValue(rooted)
		component.event.emit(rooted ? 'root' : 'unroot')

		for (const descendant of component.element.querySelectorAll<Element>('*')) {
			const component = descendant.component
			if (component) {
				component.rooted.asMutable?.setValue(rooted)
				component.event.emit(rooted ? 'root' : 'unroot')
			}
		}
	}
}

namespace Component {
	export function is (value: unknown): value is Component {
		return typeof value === 'object' && !!(value as Component)?.isComponent
	}

	export function element<NODE extends Node> (from: Component | NODE): NODE {
		return is(from) ? from.element as Node as NODE : from
	}

	const SYMBOL_COMPONENT_TYPE_BRAND = Symbol('COMPONENT_TYPE_BRAND')

	export type BuilderLike<PARAMS extends any[] = any[], COMPONENT extends Component = Component> = Builder<PARAMS, COMPONENT> | Extension<PARAMS, COMPONENT>

	export interface Builder<PARAMS extends any[], BUILD_COMPONENT extends Component | undefined> extends Omit<Extension<PARAMS, Exclude<BUILD_COMPONENT, undefined>>, 'builderType' | typeof SYMBOL_COMPONENT_TYPE_BRAND> {
		builderType: 'builder'
		[SYMBOL_COMPONENT_TYPE_BRAND]: BUILD_COMPONENT
		(...params: PARAMS): BUILD_COMPONENT
		setName (name: string): this
	}

	export interface BuilderAsync<PARAMS extends any[], BUILD_COMPONENT extends Component | undefined> extends Omit<ExtensionAsync<PARAMS, Exclude<BUILD_COMPONENT, undefined>>, 'builderType' | typeof SYMBOL_COMPONENT_TYPE_BRAND> {
		builderType: 'builder'
		[SYMBOL_COMPONENT_TYPE_BRAND]: BUILD_COMPONENT
		(...params: PARAMS): Promise<BUILD_COMPONENT>
		setName (name: string): this
	}

	const defaultBuilder = (type?: keyof HTMLElementTagNameMap) => Component(type)
	export function Builder<PARAMS extends any[], COMPONENT extends Component> (builder: (component: Component, ...params: PARAMS) => COMPONENT): Builder<PARAMS, COMPONENT>
	export function Builder<PARAMS extends any[], COMPONENT extends Component> (builder: (component: Component, ...params: PARAMS) => Promise<COMPONENT>): BuilderAsync<PARAMS, COMPONENT>
	export function Builder<PARAMS extends any[], COMPONENT extends Component> (initial: keyof HTMLElementTagNameMap | (() => Component), builder: (component: Component, ...params: PARAMS) => COMPONENT): Builder<PARAMS, COMPONENT>
	export function Builder<PARAMS extends any[], COMPONENT extends Component> (initial: keyof HTMLElementTagNameMap | (() => Component), builder: (component: Component, ...params: PARAMS) => Promise<COMPONENT>): BuilderAsync<PARAMS, COMPONENT>
	export function Builder<PARAMS extends any[], COMPONENT extends Component | undefined> (builder: (component: Component, ...params: PARAMS) => COMPONENT): Builder<PARAMS, COMPONENT>
	export function Builder<PARAMS extends any[], COMPONENT extends Component | undefined> (builder: (component: Component, ...params: PARAMS) => Promise<COMPONENT>): BuilderAsync<PARAMS, COMPONENT>
	export function Builder<PARAMS extends any[], COMPONENT extends Component | undefined> (initial: keyof HTMLElementTagNameMap | (() => Component), builder: (component: Component, ...params: PARAMS) => COMPONENT): Builder<PARAMS, COMPONENT>
	export function Builder<PARAMS extends any[], COMPONENT extends Component | undefined> (initial: keyof HTMLElementTagNameMap | (() => Component), builder: (component: Component, ...params: PARAMS) => Promise<COMPONENT>): BuilderAsync<PARAMS, COMPONENT>
	export function Builder (initialOrBuilder: keyof HTMLElementTagNameMap | AnyFunction, builder?: (component: Component, ...params: any[]) => Component | Promise<Component>): (component?: Component, ...params: any[]) => Component | Promise<Component> {
		let name = getBuilderName()

		const type = typeof initialOrBuilder === 'string' ? initialOrBuilder : undefined
		const initialBuilder: (type?: keyof HTMLElementTagNameMap) => Component = !builder || typeof initialOrBuilder === 'string' ? defaultBuilder : initialOrBuilder
		builder ??= initialOrBuilder as AnyFunction

		const realBuilder = (component = initialBuilder(type), ...params: any[]) => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			const result = builder(component, ...params)
			if (result instanceof Promise)
				return result.then(result => {
					if (result !== component)
						void ensureOriginalComponentNotSubscriptionOwner(component)
					return result
				})

			if (result !== component)
				void ensureOriginalComponentNotSubscriptionOwner(component)
			return result
		}
		const simpleBuilder = (...params: any[]) => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			const component = realBuilder(undefined, ...params)
			if (component instanceof Promise)
				return component.then(completeComponent)

			return completeComponent(component)
		}

		Object.defineProperty(simpleBuilder, 'name', { value: name, configurable: true })

		const resultBuilder = Object.assign(simpleBuilder, {
			from: realBuilder,
			setName (newName: string) {
				name = addKebabCase(newName)
				Object.defineProperty(simpleBuilder, 'name', { value: name })
				return resultBuilder
			},
		})
		return resultBuilder

		function completeComponent (component: Component) {
			if (!component)
				return component

			if (name && Env.isDev) {
				(component as Component & { [Symbol.toStringTag]?: string })[Symbol.toStringTag] ??= name.toString()
				const tagName = `:${name.kebabcase}`
				if (component.element.tagName === 'SPAN') {
					component.replaceElement(tagName as keyof HTMLElementTagNameMap)
				}
				else {
					component.attributes.prepend(tagName)
				}
			}

			component.supers.value.push(simpleBuilder)
			component.supers.emit()
			return component
		}

		async function ensureOriginalComponentNotSubscriptionOwner (original?: Component) {
			if (!original || !State.OwnerMetadata.hasSubscriptions(original))
				return

			const originalRef = new WeakRef(original)
			original = undefined
			await Async.sleep(1000)

			original = originalRef.deref()
			if (!original || original.rooted.value || original.removed.value)
				return

			console.error(`${String(name ?? 'Component')} builder returned a replacement component, but the original component was used as a subscription owner and is not in the tree!`)
		}
	}

	export interface Extension<PARAMS extends any[], EXT_COMPONENT extends Component> {
		builderType: 'extension'
		[SYMBOL_COMPONENT_TYPE_BRAND]: EXT_COMPONENT
		name: BuilderName
		from<COMPONENT extends Component> (component?: COMPONENT, ...params: PARAMS): COMPONENT & EXT_COMPONENT
	}

	export interface ExtensionAsync<PARAMS extends any[], EXT_COMPONENT extends Component> {
		builderType: 'extension'
		[SYMBOL_COMPONENT_TYPE_BRAND]: EXT_COMPONENT
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

	export function extend (extension: (component: Mutable<Component>) => unknown) {
		componentExtensionsRegistry.push(extension as (component: Mutable<Component>) => unknown)
	}

	/**
	 * Returns the component for the given element, if it exists
	 */
	export function get (element?: unknown): Component | undefined {
		if (!element || (typeof element !== 'object' && typeof element !== 'function'))
			return undefined

		return ELEMENT_TO_COMPONENT_MAP.get(element as Element)
	}

	const STACK_FILE_NAME_REGEX = /\(http.*?(\w+)\.ts:\d+:\d+\)/
	const PASCAL_CASE_WORD_START = /(?<=[a-z0-9_-])(?=[A-Z])/g

	// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
	interface BuilderName extends String {
		kebabcase: string
	}

	function addKebabCase (name: string): BuilderName {
		return Object.assign(String(name), {
			kebabcase: name.replaceAll(PASCAL_CASE_WORD_START, '-').toLowerCase(),
		})
	}

	function getBuilderName (): BuilderName | undefined {
		const stack = Strings.shiftLine((new Error().stack ?? ''), 3)
		const name = stack.match(STACK_FILE_NAME_REGEX)?.[1]
		if (!name || name === 'Component')
			return undefined

		return addKebabCase(name)
	}

	export function removeContents (element: Node) {
		for (const child of [...element.childNodes]) {
			if (child.component)
				child.component.remove()
			else {
				removeContents(child)
				child.remove()
			}
		}
	}

}

QuiltHelper.setComponent(Component)

export default Component
