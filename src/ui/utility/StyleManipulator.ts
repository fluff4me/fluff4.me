import originalStyle from 'style'
import type Component from 'ui/Component'
import { NonNullish } from 'utility/Arrays'
import DevServer from 'utility/DevServer'
import Env from 'utility/Env'
import Script from 'utility/Script'
import type { StateOr, UnsubscribeState } from 'utility/State'
import State from 'utility/State'
import Style from 'utility/Style'
import type { PartialRecord } from 'utility/Type'

export const style = State(originalStyle)

DevServer.onMessage('updateStyle', async () => {
	Script.allowModuleRedefinition('style')
	void Style.reload(`${Env.URL_ORIGIN}style/index.css`)
	await Script.reload(`${Env.URL_ORIGIN}style/index.js`)
	style.value = await import('style').then(module => module.default)
	writeChiridata()
})

Env.onLoad('dev', () => {
	Object.assign(window, { writeChiridata })
	writeChiridata()
})

function writeChiridata () {
	for (const attribute of [...document.documentElement.attributes])
		if (attribute.name.startsWith('chiridata:'))
			document.documentElement.removeAttribute(attribute.name)

	for (const component in style.value) {
		const classes = style.value[component as keyof typeof style.value]
		if (classes.length)
			document.documentElement.setAttribute(`chiridata:${component}`, JSON.stringify(classes))
	}
}

export type ComponentName = keyof typeof style.value
export type ComponentNameType<PREFIX extends string> = keyof { [KEY in ComponentName as KEY extends `${PREFIX}-${infer TYPE}--${string}` ? TYPE
	: KEY extends `${PREFIX}-${infer TYPE}` ? TYPE
	: never]: string[] }

interface StyleManipulatorFunctions<HOST> {
	get (): ComponentName[]
	has (name: ComponentName): boolean
	remove (...names: ComponentName[]): HOST
	toggle (...names: ComponentName[]): HOST
	toggle (enabled: boolean, ...names: ComponentName[]): HOST
	bind (state: StateOr<boolean>, ...names: ComponentName[]): HOST
	bindFrom (state: State<ComponentName[] | ComponentName | undefined>): HOST
	unbind (state?: State<boolean> | State<ComponentName[] | ComponentName | undefined>): HOST
	refresh (): HOST

	hasProperty (property: string): boolean
	setProperty (property: string, value?: string | number | null): HOST
	setProperties (properties: PartialRecord<keyof CSSStyleDeclaration, string | number | null>): HOST
	toggleProperty (enabled: boolean | undefined, property: string, value?: string | number | null): HOST
	setVariable (variable: string, value?: string | number | null): HOST
	bindProperty (property: string, state: StateOr<string | number | undefined | null>): HOST
	bindVariable (variable: string, state: StateOr<string | number | undefined | null>): HOST
	removeProperties (...properties: string[]): HOST
	removeVariables (...variables: string[]): HOST
}

interface StyleManipulatorFunction<HOST> {
	(...names: ComponentName[]): HOST
}

interface StyleManipulator<HOST> extends StyleManipulatorFunction<HOST>, StyleManipulatorFunctions<HOST> {
}

function StyleManipulator (component: Component): StyleManipulator<Component> {
	const styles = new Set<ComponentName>()
	const currentClasses: string[] = []
	const stateUnsubscribers = new WeakMap<State<boolean> | State<ComponentName[] | ComponentName | undefined>, [UnsubscribeState, ComponentName[]]>()
	const unbindPropertyState: Record<string, UnsubscribeState | undefined> = {}

	if (Env.isDev)
		style.subscribe(component, () => updateClasses())

	const result: StyleManipulator<Component> = Object.assign(
		((...names) => {
			for (const name of names)
				styles.add(name)
			updateClasses()
			return component
		}) as StyleManipulatorFunction<Component>,

		{
			get: () => [...styles].sort(),
			has (name) {
				return styles.has(name)
			},
			remove (...names) {
				for (const name of names)
					styles.delete(name)

				updateClasses()
				return component
			},
			toggle (enabled, ...names) {
				if (enabled)
					for (const name of names)
						styles.add(name)
				else
					for (const name of names)
						styles.delete(name)

				updateClasses()
				return component
			},
			bind (state, ...names) {
				if (!State.is(state))
					return result.toggle(state, ...names)

				result.unbind(state)

				const unsubscribe = state.use(component, active => {
					if (active)
						for (const name of names)
							styles.add(name)
					else
						for (const name of names)
							styles.delete(name)

					updateClasses()
				})

				stateUnsubscribers.set(state, [unsubscribe, names])
				return component
			},
			bindFrom (state) {
				result.unbind(state)

				const currentNames: ComponentName[] = []
				const unsubscribe = state.use(component, (names, oldNames) => {
					if (!Array.isArray(names))
						names = names ? [names] : []
					if (!Array.isArray(oldNames))
						oldNames = oldNames ? [oldNames] : []

					for (const oldName of oldNames ?? [])
						styles.delete(oldName)

					for (const name of names)
						styles.add(name)

					currentNames.splice(0, Infinity, ...names)

					updateClasses()
				})

				stateUnsubscribers.set(state, [unsubscribe, currentNames])
				return component
			},
			unbind (state) {
				const bound = state && stateUnsubscribers.get(state)
				if (!bound)
					return component

				const [unsubscribe, names] = bound
				unsubscribe?.()
				stateUnsubscribers.delete(state)
				result.remove(...names)
				return component
			},
			refresh: () => updateClasses(),

			hasProperty (property) {
				return component.element.style.getPropertyValue(property) !== ''
			},
			setProperty (property, value) {
				unbindPropertyState[property]?.()
				setProperty(property, value)
				return component
			},
			setProperties (properties) {
				for (let [property, value] of Object.entries(properties)) {
					unbindPropertyState[property]?.()
					property = property.replaceAll(/[a-z][A-Z]/g, match => `${match[0]}-${match[1].toLowerCase()}`).toLowerCase()
					setProperty(property, value)
				}
				return component
			},
			toggleProperty (enabled, property, value) {
				enabled ??= !result.hasProperty(property)
				if (enabled === true)
					return result.setProperty(property, enabled ? value : undefined)
				else
					return result.removeProperties(property)
			},
			setVariable (variable, value) {
				return result.setProperty(`--${variable}`, value)
			},
			bindProperty (property, state) {
				unbindPropertyState[property]?.()

				if (State.is(state))
					unbindPropertyState[property] = state.use(component, value => setProperty(property, value))
				else {
					setProperty(property, state)
					unbindPropertyState[property] = undefined
				}

				return component
			},
			bindVariable (variable, state) {
				return result.bindProperty(`--${variable}`, state)
			},
			removeProperties (...properties) {
				for (const property of properties)
					component.element.style.removeProperty(property)
				return component
			},
			removeVariables (...variables) {
				for (const variable of variables)
					component.element.style.removeProperty(`--${variable}`)
				return component
			},
		} satisfies StyleManipulatorFunctions<Component>,
	)

	return result

	function updateClasses () {
		const stylesArray = [...styles]

		if (!component.attributes.has('component'))
			component.attributes.insertBefore('class', 'component')

		component.attributes.set('component', stylesArray.join(' '))

		const toAdd = stylesArray.flatMap(component => style.value[component]).filter(NonNullish)
		const toRemove = currentClasses.filter(cls => !toAdd.includes(cls))

		if (toRemove)
			component.element.classList.remove(...toRemove)

		component.element.classList.add(...toAdd)
		currentClasses.push(...toAdd)
		return component
	}

	function setProperty (property: string, value?: string | number | null) {
		if (value === undefined || value === null)
			component.element.style.removeProperty(property)
		else
			component.element.style.setProperty(property, `${value}`)
	}
}

export default StyleManipulator
