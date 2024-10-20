import type style from "style"
import Component from "ui/Component"

type ButtonType = keyof { [KEY in keyof typeof style as KEY extends `button-type-${infer TYPE}--${string}` ? TYPE
	: KEY extends `button-type-${infer TYPE}` ? TYPE
	: never]: string[] }

interface ButtonTypeManipulator<HOST> {
	(...buttonTypes: ButtonType[]): HOST
	remove (...buttonTypes: ButtonType[]): HOST
}

interface ButtonExtensions {
	readonly textWrapper: Component
	type: ButtonTypeManipulator<this>
	setDisabled (disabled: boolean, reason: string): this
}

interface Button extends Component, ButtonExtensions { }

const Button = Component.Builder("button", (button): Button => {
	const disabledReasons = new Set<string>()

	return button
		.attributes.set("type", "button")
		.style("button")
		.extend<ButtonExtensions>(button => ({
			textWrapper: undefined!,
			type: Object.assign(
				(...types: ButtonType[]) => {
					for (const type of types)
						button.style(`button-type-${type}`)
					return button
				},
				{
					remove (...types: ButtonType[]) {
						for (const type of types)
							button.style.remove(`button-type-${type}`)
						return button
					},
				},
			),
			setDisabled (disabled, reason) {
				if (disabled)
					disabledReasons.add(reason)
				else
					disabledReasons.delete(reason)
				button.style.toggle(!!disabledReasons.size, "button--disabled")
				return button
			},
		}))
		.extendJIT("textWrapper", button => Component()
			.style("button-text")
			.appendTo(button))
})

export default Button
