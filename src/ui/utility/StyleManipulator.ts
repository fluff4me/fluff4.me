import style from "style"
import type Component from "ui/Component"
import type State from "utility/State"

type ComponentName = keyof typeof style

interface StyleManipulatorFunctions<HOST> {
	remove (...names: ComponentName[]): HOST
	toggle (enabled: boolean, ...names: ComponentName[]): HOST
	bind (state: State<boolean>, ...names: ComponentName[]): HOST
	refresh (): HOST

	setProperty (property: string, value: string | number): HOST
	setVariable (variable: string, value: string | number): HOST
	removeProperties (...properties: string[]): HOST
}

interface StyleManipulatorFunction<HOST> {
	(...names: ComponentName[]): HOST
}

interface StyleManipulator<HOST> extends StyleManipulatorFunction<HOST>, StyleManipulatorFunctions<HOST> {
}

function StyleManipulator (component: Component): StyleManipulator<Component> {
	const styles = new Set<ComponentName>()

	return Object.assign(
		((...names) => {
			for (const name of names)
				styles.add(name)
			updateClasses()
			return component
		}) as StyleManipulatorFunction<Component>,

		{
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
				state.subscribe(component, active => {
					if (active)
						for (const name of names)
							styles.add(name)
					else
						for (const name of names)
							styles.delete(name)

					updateClasses(!active ? names : undefined)
				})
				return component
			},
			refresh: () => updateClasses(),

			setProperty (property, value) {
				component.element.style.setProperty(property, `${value}`)
				return component
			},
			setVariable (variable, value) {
				component.element.style.setProperty(`--${variable}`, `${value}`)
				return component
			},
			removeProperties (...properties) {
				for (const property of properties)
					component.element.style.removeProperty(property)
				return component
			},
		} as StyleManipulatorFunctions<Component>,
	)

	function updateClasses (deletedStyles?: ComponentName[]) {
		const toAdd = [...styles].flatMap(component => style[component])
		const toRemove = deletedStyles?.flatMap(component => style[component]).filter(cls => !toAdd.includes(cls))

		if (toRemove)
			component.element.classList.remove(...toRemove)

		component.element.classList.add(...toAdd)
	}
}

export default StyleManipulator