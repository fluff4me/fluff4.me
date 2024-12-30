import style from "style"
import type Component from "ui/Component"
import type State from "utility/State"
import type { UnsubscribeState } from "utility/State"

export type ComponentName = keyof typeof style
export type ComponentNameType<PREFIX extends string> = keyof { [KEY in ComponentName as KEY extends `${PREFIX}-${infer TYPE}--${string}` ? TYPE
	: KEY extends `${PREFIX}-${infer TYPE}` ? TYPE
	: never]: string[] }

interface StyleManipulatorFunctions<HOST> {
	get (): ComponentName[]
	remove (...names: ComponentName[]): HOST
	toggle (...names: ComponentName[]): HOST
	toggle (enabled: boolean, ...names: ComponentName[]): HOST
	bind (state: State<boolean>, ...names: ComponentName[]): HOST
	unbind (state?: State<boolean>): HOST
	refresh (): HOST

	hasProperty (property: string): boolean
	setProperty (property: string, value?: string | number | null): HOST
	toggleProperty (enabled: boolean | undefined, property: string, value?: string | number | null): HOST
	setVariable (variable: string, value?: string | number | null): HOST
	bindProperty (property: string, state: State<string | number | undefined | null>): HOST
	bindVariable (variable: string, state: State<string | number | undefined | null>): HOST
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
	const stateUnsubscribers = new WeakMap<State<boolean>, [UnsubscribeState, ComponentName[]]>()
	const unbindPropertyState: Record<string, UnsubscribeState | undefined> = {}

	const result: StyleManipulator<Component> = Object.assign(
		((...names) => {
			for (const name of names)
				styles.add(name)
			updateClasses()
			return component
		}) as StyleManipulatorFunction<Component>,

		{
			get: () => [...styles].sort(),
			remove (...names) {
				for (const name of names)
					styles.delete(name)

				updateClasses(names)
				return component
			},
			toggle (enabled, ...names) {
				if (enabled)
					for (const name of names)
						styles.add(name)
				else
					for (const name of names)
						styles.delete(name)

				updateClasses(!enabled ? names : undefined)
				return component
			},
			bind (state, ...names) {
				result.unbind(state)

				const unsubscribe = state.use(component, active => {
					if (active)
						for (const name of names)
							styles.add(name)
					else
						for (const name of names)
							styles.delete(name)

					updateClasses(!active ? names : undefined)
				})
				stateUnsubscribers.set(state, [unsubscribe, names])
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
				return component.element.style.getPropertyValue(property) !== ""
			},
			setProperty (property, value) {
				unbindPropertyState[property]?.()
				setProperty(property, value)
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
				unbindPropertyState[property] = state.use(component, value => setProperty(property, value))
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
		} as StyleManipulatorFunctions<Component>,
	)

	return result

	function updateClasses (deletedStyles?: ComponentName[]) {
		const toAdd = [...styles].flatMap(component => style[component])
		const toRemove = deletedStyles?.flatMap(component => style[component]).filter(cls => !toAdd.includes(cls))

		if (toRemove)
			component.element.classList.remove(...toRemove)

		component.element.classList.add(...toAdd)
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
