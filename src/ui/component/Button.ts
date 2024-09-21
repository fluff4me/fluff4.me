import Component from "ui/Component"

export enum ButtonClasses {
	Main = "button",
}

interface ButtonExtensions {
	setDisabled (disabled: boolean, reason: string): this
}

interface Button extends Component, ButtonExtensions { }

const Button = Component.Builder((component = Component()): Button => component
	.classes.add(ButtonClasses.Main)
	.extend<ButtonExtensions>({
		setDisabled (disabled, reason) {
			return this
		},
	})
)

export default Button
