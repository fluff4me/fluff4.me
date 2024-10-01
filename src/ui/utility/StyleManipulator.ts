import style from "style"
import type Component from "ui/Component"

interface StyleManipulatorFunctions<HOST> {
	set (property: string, value: string | number): HOST
	var (variable: string, value: string | number): HOST
	remove (...properties: string[]): HOST
}

interface StyleManipulatorFunction<HOST> {
	(...names: (keyof typeof style)[]): HOST
}

interface StyleManipulator<HOST> extends StyleManipulatorFunction<HOST>, StyleManipulatorFunctions<HOST> {
}

function StyleManipulator (component: Component.SettingUp): StyleManipulator<Component> {
	const done = component as Component
	return Object.assign(
		((...names) => {
			for (const name of names)
				component.element.classList.add(...style[name])
			return done
		}) as StyleManipulatorFunction<Component>,

		{
			set (property, value) {
				component.element.style.setProperty(property, `${value}`)
				return done
			},
			var (variable, value) {
				component.element.style.setProperty(`--${variable}`, `${value}`)
				return done
			},
			remove (...properties) {
				for (const property of properties)
					component.element.style.removeProperty(property)
				return done
			},
		} as StyleManipulatorFunctions<Component>,
	)
}

export default StyleManipulator
