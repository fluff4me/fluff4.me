import type Component from 'ui/Component'
import { Quilt, QuiltHelper } from 'ui/utility/StringApplicator'
import type { UnsubscribeState } from 'utility/State'
import State from 'utility/State'

interface AttributeManipulator<HOST> {
	has (attribute: string): boolean
	get (attribute: string): State<string | undefined>
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
	bind (state: State<boolean>, attribute: string, value?: string, orElse?: string): HOST
	bind (attribute: string, state: State<string | undefined>): HOST
	/**
	 * If the attribute is already set, does nothing. 
	 * Otherwise, calls the supplier, and sets the attribute to the result, or removes the attribute if it's `undefined` 
	 */
	compute (attribute: string, supplier: (host: HOST) => string | undefined): HOST
	use (attribute: string, keyOrHandler: Quilt.SimpleKey | Quilt.Handler): HOST
	getUsing (attribute: string): Quilt.SimpleKey | Quilt.Handler | undefined
	remove (...attributes: string[]): HOST
	toggle (present: boolean, attribute: string, value?: string): HOST
	copy (component: Component): HOST
	copy (element: HTMLElement): HOST
}

interface TranslationHandlerRegistration {
	handler: Quilt.SimpleKey | Quilt.Handler
	unuse: UnsubscribeState
}

function AttributeManipulator (component: Component): AttributeManipulator<Component> {
	let removed = false
	let translationHandlers: Record<string, TranslationHandlerRegistration> | undefined
	const unuseAttributeMap = new Map<string, UnsubscribeState>()
	const attributeStates = new Map<string, State<string | undefined>>()

	State.Owner.getOwnershipState(component)?.awaitManual(true, () => {
		removed = true

		for (const registration of Object.values(translationHandlers ?? {}))
			registration.unuse()

		translationHandlers = undefined
	})

	const result: AttributeManipulator<Component> = {
		has (attribute) {
			return component.element.hasAttribute(attribute)
		},
		get (attribute) {
			return attributeStates.compute(attribute, () =>
				State(component.element.getAttribute(attribute) ?? undefined))
		},
		append (...attributes) {
			for (const attribute of attributes) {
				translationHandlers?.[attribute]?.unuse()
				delete translationHandlers?.[attribute]
				component.element.setAttribute(attribute, '')
				attributeStates.get(attribute)?.asMutable?.setValue('')
			}
			return component
		},
		prepend (...attributes) {
			const oldAttributes: Record<string, string> = {}
			for (const attribute of [...component.element.attributes]) {
				oldAttributes[attribute.name] = attribute.value
				component.element.removeAttribute(attribute.name)
			}

			for (const attribute of attributes) {
				const value = oldAttributes[attribute] ?? ''
				component.element.setAttribute(attribute, value)
				attributeStates.get(attribute)?.asMutable?.setValue(value)
			}

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
					for (const attribute of attributes) {
						const value = oldAttributes[attribute] ?? ''
						component.element.setAttribute(attribute, value)
						attributeStates.get(attribute)?.asMutable?.setValue(value)
					}

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
				for (const attribute of attributes) {
					const value = oldAttributes[attribute] ?? ''
					component.element.setAttribute(attribute, value)
					attributeStates.get(attribute)?.asMutable?.setValue(value)
				}

			for (const attribute of Object.keys(oldAttributes)) {
				component.element.setAttribute(attribute, oldAttributes[attribute])

				if (attribute === referenceAttribute)
					for (const attribute of attributes) {
						const value = oldAttributes[attribute] ?? ''
						component.element.setAttribute(attribute, value)
						attributeStates.get(attribute)?.asMutable?.setValue(value)
					}
			}

			return component
		},
		set (attribute, value) {
			translationHandlers?.[attribute]?.unuse()
			delete translationHandlers?.[attribute]
			if (value === undefined) {
				component.element.removeAttribute(attribute)
				attributeStates.get(attribute)?.asMutable?.setValue(undefined)
			}
			else {
				component.element.setAttribute(attribute, value)
				attributeStates.get(attribute)?.asMutable?.setValue(value)
			}
			return component
		},
		bind (...args) {
			if (typeof args[0] === 'string') {
				const [attribute, state] = args as [string, State<string | undefined>]
				unuseAttributeMap.get(attribute)?.()
				unuseAttributeMap.set(attribute, state.use(component, value => {
					if (value === undefined) {
						component.element.removeAttribute(attribute)
						attributeStates.get(attribute)?.asMutable?.setValue(undefined)
					}
					else {
						component.element.setAttribute(attribute, value)
						attributeStates.get(attribute)?.asMutable?.setValue(value)
					}
				}))
			}
			else {
				let [state, attribute, value, orElse] = args as [State<boolean>, string, string?, string?]
				unuseAttributeMap.get(attribute)?.()
				unuseAttributeMap.set(attribute, state.use(component, active => {
					if (active) {
						value ??= ''
						component.element.setAttribute(attribute, value)
						attributeStates.get(attribute)?.asMutable?.setValue(value)
					}
					else if (orElse !== undefined) {
						component.element.setAttribute(attribute, orElse)
						attributeStates.get(attribute)?.asMutable?.setValue(orElse)
					}
					else {
						component.element.removeAttribute(attribute)
						attributeStates.get(attribute)?.asMutable?.setValue(undefined)
					}
				}))
			}
			return component
		},
		compute (attribute, supplier) {
			if (component.element.hasAttribute(attribute))
				return component

			translationHandlers?.[attribute]?.unuse()
			delete translationHandlers?.[attribute]
			const value = supplier(component)
			if (value === undefined) {
				component.element.removeAttribute(attribute)
				attributeStates.get(attribute)?.asMutable?.setValue(undefined)
			}
			else {
				component.element.setAttribute(attribute, value)
				attributeStates.get(attribute)?.asMutable?.setValue(value)
			}
			return component
		},
		getUsing (attribute) {
			return translationHandlers?.[attribute]?.handler
		},
		use (attribute, handler) {
			if (removed)
				return component

			const unuse = Quilt.State.useManual(quilt => {
				const registration = translationHandlers?.[attribute]
				if (!registration)
					return

				const translationHandler = registration.handler
				const weave = typeof translationHandler === 'string' ? quilt[translationHandler]() : translationHandler(quilt, QuiltHelper)
				const value = weave?.toString() ?? ''
				component.element.setAttribute(attribute, value)
				attributeStates.get(attribute)?.asMutable?.setValue(value)
			})

			translationHandlers ??= {}
			translationHandlers[attribute] = { handler, unuse }

			return component
		},
		remove (...attributes) {
			for (const attribute of attributes) {
				translationHandlers?.[attribute]?.unuse()
				delete translationHandlers?.[attribute]
				component.element.removeAttribute(attribute)
				attributeStates.get(attribute)?.asMutable?.setValue(undefined)
			}
			return component
		},
		toggle (present, attribute, value = '') {
			return this[present ? 'set' : 'remove'](attribute, value)
		},
		copy (element) {
			if ('element' in element)
				element = element.element

			for (const attribute of element.attributes) {
				component.element.setAttribute(attribute.name, attribute.value)
				attributeStates.get(attribute.name)?.asMutable?.setValue(attribute.value)
			}
			return component
		},
	}

	return result
}

export default AttributeManipulator
