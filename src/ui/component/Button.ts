import Component from "ui/Component"

interface ButtonExtensions {
	setDisabled (disabled: boolean, reason: string): this
}

interface Button extends Component, ButtonExtensions { }

const Button = Component.Builder((component = Component("button")): Button => component
	.style("button")
	.extend<ButtonExtensions>({
		setDisabled (disabled, reason) {
			return this
		},
	})
)

export default Button
