import Component from "ui/Component"
import EventManipulator, { Events } from "ui/utility/EventManipulator"
import State from "utility/State"

interface CodeInputExtensions {
	readonly state: State.JIT<string>
	readonly valid: State<boolean>
	clear (): void
}

interface CodeInputEvents {
	Enter (): void
}

interface CodeInput extends Component, CodeInputExtensions {
	readonly event: EventManipulator<this, Events<Component, CodeInputEvents>>
}

const CodeInput = Component.Builder((component, length = 6): CodeInput => {
	component.style('code-input')

	const inputs: Component<HTMLInputElement>[] = []
	const state = State.JIT(() => inputs.map(input => input.element.value.trim()).join(''))

	for (let i = 0; i < length; i++) {
		const input = Component('input')
			.style('code-input-input', 'text-input')
			.attributes.set('type', 'text')
			.attributes.set('inputmode', 'numeric')
			.attributes.set('maxlength', '1')
			.attributes.set('autocomplete', 'one-time-code')
			.attributes.set('size', '1')
			.event.subscribe('focus', event => event.host.element.select())
			.event.subscribe('paste', event => {
				event.preventDefault()
				const digits = event.clipboardData?.getData('text')
				if (!digits)
					return

				if (!(new RegExp(`^\\d{${length}}`).test(digits)))
					return

				for (let i = 0; i < length; i++)
					inputs[i].element.value = digits[i]

				state.markDirty()
			})
			.event.subscribe('input', event => {
				const input = event.host.element
				if (input.value.length && !input.value.match(/^\d$/)) {
					input.value = ''
					return
				}

				if (input.value.length)
					inputs[i + 1]?.focus()

				state.markDirty()
			})
			.event.subscribe('keydown', event => {
				if (event.key === 'ArrowLeft') {
					event.preventDefault()
					const prev = inputs[i - 1]
					prev?.focus()
					prev?.element.select()
					return
				}

				if (event.key === 'ArrowRight') {
					event.preventDefault()
					const next = inputs[i + 1]
					next?.focus()
					next?.element.select()
					return
				}

				const input = event.host.element
				if (event.key === 'Backspace') {
					if (input.value.trim()) {
						input.value = ''
						state.markDirty()
						return
					}

					const prev = inputs[i - 1]
					if (!prev)
						return

					prev.focus()
					prev.element.select()
					prev.element.value = ''
					state.markDirty()
					return
				}

				if (event.key === 'Delete') {
					if (input.value.trim()) {
						input.value = ''
						state.markDirty()
						return
					}
					const next = inputs[i + 1]
					if (!next)
						return

					next.focus()
					next.element.select()
					next.element.value = ''
					state.markDirty()
					return
				}

				if (event.key === 'Enter') {
					event.preventDefault()
					component.cast<CodeInput>().event.emit('Enter')
					return
				}
			})
			.appendTo(component)

		inputs.push(input)
	}

	return component.extend<CodeInputExtensions>(component => ({
		state,
		valid: state.mapManual(value => value.length === length),
		clear () {
			for (const input of inputs)
				input.element.value = ''
			state.markDirty()
		}
	}))
})

export default CodeInput
