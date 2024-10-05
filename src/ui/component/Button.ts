import Component from "ui/Component"

interface ButtonExtensions {
	setDisabled (disabled: boolean, reason: string): this
}

interface Button extends Component, ButtonExtensions { }

const Button = Component.Builder("button", (component): Button => {
	const disabledReasons = new Set<string>()

	return component
		.style("button")
		.extend<ButtonExtensions>(button => ({
			setDisabled (disabled, reason) {
				if (disabled)
					disabledReasons.add(reason)
				else
					disabledReasons.delete(reason)
				button.style.toggle(!!disabledReasons.size, "button--disabled")
				return button
			},
		}))
})

export default Button
