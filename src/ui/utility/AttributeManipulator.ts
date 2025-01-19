import quilt from 'lang/en-nz'
import type Component from 'ui/Component'
import type { Quilt } from 'ui/utility/StringApplicator'
import { QuiltHelper } from 'ui/utility/StringApplicator'
import type State from 'utility/State'
import type { UnsubscribeState } from 'utility/State'

interface AttributeManipulator<HOST> {
	has (attribute: string): boolean
	get (attribute: string): string | undefined
	/** Adds the given attributes with no values */
	append (...attributes: string[]): HOST
	/** 
	 * Adds the given attributes with no values.
	 * Note that prepending attributes requires removing all previous attributes, then re-appending them after.
	 */
	prepend (...attributes: string[]): HOST
	/**
	 * Inserts the given attributes before the reference attribute with no values.
	 * Note that inserting attributes requires removing all previous attributes, then re-appending them after.
	 */
	insertBefore (referenceAttribute: string, ...attributes: string[]): HOST
	/**
	 * Inserts the given attributes after the reference attribute with no values.
	 * Note that inserting attributes requires removing all previous attributes, then re-appending them after.
	 */
	insertAfter (referenceAttribute: string, ...attributes: string[]): HOST
	/** Sets the attribute to `value`, or removes the attribute if `value` is `undefined` */
	set (attribute: string, value?: string): HOST
	bind (state: State<boolean>, attribute: string, value?: string): HOST
	/**
	 * If the attribute is already set, does nothing. 
	 * Otherwise, calls the supplier, and sets the attribute to the result, or removes the attribute if it's `undefined` 
	 */
	compute (attribute: string, supplier: (host: HOST) => string | undefined): HOST
	use (attribute: string, keyOrHandler: Quilt.SimpleKey | Quilt.Handler): HOST
	getUsing (attribute: string): Quilt.SimpleKey | Quilt.Handler | undefined
	refresh (): void
	remove (...attributes: string[]): HOST
	toggle (present: boolean, attribute: string, value?: string): HOST
	copy (component: Component): HOST
	copy (element: HTMLElement): HOST
}

function AttributeManipulator (component: Component): AttributeManipulator<Component> {
	let translationHandlers: Record<string, Quilt.SimpleKey | Quilt.Handler> | undefined
	const unuseAttributeMap = new Map<string, UnsubscribeState>()
	const result: AttributeManipulator<Component> = {
		has (attribute) {
			return component.element.hasAttribute(attribute)
		},
		get (attribute) {
			return component.element.getAttribute(attribute) ?? undefined
		},
		append (...attributes) {
			for (const attribute of attributes) {
				delete translationHandlers?.[attribute]
				component.element.setAttribute(attribute, '')
			}
			return component
		},
		prepend (...attributes) {
			const oldAttributes: Record<string, string> = {}
			for (const attribute of [...component.element.attributes]) {
				oldAttributes[attribute.name] = attribute.value
				component.element.removeAttribute(attribute.name)
			}

			for (const attribute of attributes)
				component.element.setAttribute(attribute, oldAttributes[attribute] ?? '')

			for (const name of Object.keys(oldAttributes))
				component.element.setAttribute(name, oldAttributes[name])

			return component
		},
		insertBefore (referenceAttribute, ...attributes) {
			const oldAttributes: Record<string, string> = {}
			for (const attribute of [...component.element.attributes]) {
				oldAttributes[attribute.name] = attribute.value
				component.element.removeAttribute(attribute.name)
			}

			for (const attribute of Object.keys(oldAttributes)) {
				if (attribute === referenceAttribute)
					for (const attribute of attributes)
						component.element.setAttribute(attribute, oldAttributes[attribute] ?? '')

				component.element.setAttribute(attribute, oldAttributes[attribute])
			}

			return component
		},
		insertAfter (referenceAttribute, ...attributes) {
			const oldAttributes: Record<string, string> = {}
			for (const attribute of [...component.element.attributes]) {
				oldAttributes[attribute.name] = attribute.value
				component.element.removeAttribute(attribute.name)
			}

			if (!(referenceAttribute in oldAttributes))
				for (const attribute of attributes)
					component.element.setAttribute(attribute, oldAttributes[attribute] ?? '')

			for (const attribute of Object.keys(oldAttributes)) {
				component.element.setAttribute(attribute, oldAttributes[attribute])

				if (attribute === referenceAttribute)
					for (const attribute of attributes)
						component.element.setAttribute(attribute, oldAttributes[attribute] ?? '')
			}

			return component
		},
		set (attribute, value) {
			delete translationHandlers?.[attribute]
			if (value === undefined)
				component.element.removeAttribute(attribute)
			else
				component.element.setAttribute(attribute, value)
			return component
		},
		bind (state, attribute, value) {
			unuseAttributeMap.get(attribute)?.()
			unuseAttributeMap.set(attribute, state.use(component, active => {
				if (active)
					component.element.setAttribute(attribute, value ?? '')
				else
					component.element.removeAttribute(attribute)
			}))
			return component
		},
		compute (attribute, supplier) {
			if (component.element.hasAttribute(attribute))
				return component

			delete translationHandlers?.[attribute]
			const value = supplier(component)
			if (value === undefined)
				component.element.removeAttribute(attribute)
			else
				component.element.setAttribute(attribute, value)
			return component
		},
		getUsing (attribute) {
			return translationHandlers?.[attribute]
		},
		use (attribute, handler) {
			translationHandlers ??= {}
			translationHandlers[attribute] = handler
			result.refresh()
			return component
		},
		refresh () {
			if (!translationHandlers)
				return

			for (const attribute in translationHandlers) {
				const translationHandler = translationHandlers[attribute]
				const weave = typeof translationHandler === 'string' ? quilt[translationHandler]() : translationHandler(quilt, QuiltHelper)
				component.element.setAttribute(attribute, weave.toString())
			}
		},
		remove (...attributes) {
			for (const attribute of attributes) {
				delete translationHandlers?.[attribute]
				component.element.removeAttribute(attribute)
			}
			return component
		},
		toggle (present, attribute, value = '') {
			return this[present ? 'set' : 'remove'](attribute, value)
		},
		copy (element) {
			if ('element' in element)
				element = element.element

			for (const attribute of element.attributes)
				component.element.setAttribute(attribute.name, attribute.value)

			return component
		},
	}

	return result
}

export default AttributeManipulator
