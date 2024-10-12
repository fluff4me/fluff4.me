import Component from "ui/Component"

interface ButtonExtensions {
	readonly textWrapper: Component
	setDisabled (disabled: boolean, reason: string): this
}

interface Button extends Component, ButtonExtensions { }

const Button = Component.Builder("button", (button): Button => {
	const disabledReasons = new Set<string>()

	return button
		.style("button")
		.extend<ButtonExtensions>(button => ({
			textWrapper: undefined!,
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
