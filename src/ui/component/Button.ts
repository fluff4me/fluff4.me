import Component from "ui/Component"

interface ButtonExtensions {
	setDisabled (disabled: boolean, reason: string): this
}

interface Button extends Component, ButtonExtensions { }

const Button = Component.Builder("button", (component): Button => {
	const disabledReasons = new Set<string>()

	return component
		.style("button")
		.extend<ButtonExtensions>({
			setDisabled (this: Button, disabled, reason) {
				if (disabled)
					disabledReasons.add(reason)
				else
					disabledReasons.delete(reason)
				this.style.toggle(!!disabledReasons.size, "button--disabled")
				return this
			},
		})
})

export default Button
