import Component from "ui/Component"
import { BlockClasses } from "ui/component/core/Block"
import type Label from "ui/component/core/Label"
import type { PopoverInitialiser } from "ui/component/core/Popover"
import Popover from "ui/component/core/Popover"
import Slot from "ui/component/core/Slot"
import StringApplicator from "ui/utility/StringApplicator"
import State from "utility/State"

export interface InputExtensions {
	readonly required: State<boolean>
	readonly hint: StringApplicator.Optional<this>
	readonly maxLength: State<number | undefined>
	readonly length: State<number | undefined>
	setMaxLength (maxLength?: number): this
	setRequired (required?: boolean): this
	/**
	 * - Sets the `[name]` of this component to `label.for`
	 * - Allows the label to use this component for information like whether it's required, etc
	 */
	setLabel (label?: Label): this
	tweakPopover (initialiser: PopoverInitialiser<this>): this
}

interface Input extends Component, InputExtensions { }

const Input = Component.Extension((component): Input => {
	const hintText = State<string | undefined>(undefined)
	const maxLength = State<number | undefined>(undefined)
	const length = State<number | undefined>(undefined)
	const unusedPercent = State.MapManual([length, maxLength], (length, maxLength) => length === undefined || !maxLength ? undefined : 1 - length / maxLength)
	const unusedChars = State.MapManual([length, maxLength], (length, maxLength) => length === undefined || !maxLength ? undefined : maxLength - length)
	const hasPopover = State.MapManual([hintText, maxLength], (hintText, maxLength) => !!hintText || !!maxLength)
	let popover: Popover | undefined
	hasPopover.subscribeManual(hasPopover => {
		if (!hasPopover) {
			popover?.remove()
			popover = undefined
			return
		}

		popover = Popover()
			.anchor.from(component)
			.anchor.add("off right", `.\\${BlockClasses.Main}`, "aligned top")
			.setCloseOnInput(false)
			.style("input-popover")
			.setOwner(component)
			.tweak(popover => {
				Slot.using(hintText, (slot, hintText) => !hintText ? undefined
					: Component()
						.style("input-popover-hint-text")
						.text.set(hintText))
					.appendTo(popover)

				Slot.using(maxLength, (slot, maxLength) => !maxLength ? undefined
					: Component()
						.style("input-popover-max-length")
						.append(Component()
							.style("input-popover-max-length-icon")
							.style.bind(unusedPercent.mapManual(p => (p ?? 0) < 0), "input-popover-max-length-icon--overflowing"))
						.append(Component()
							.style("input-popover-max-length-text")
							.text.bind(unusedChars.mapManual(chars => chars === undefined ? "" : `${chars}`)))
						.style.bindVariable("progress", unusedPercent))
					.appendTo(popover)
			})
			.tweak(popoverInitialiser, component)
			.appendTo(document.body)
	})

	component.hasFocused.subscribeManual(hasFocused => popover?.toggle(hasFocused).anchor.apply())

	let popoverInitialiser: PopoverInitialiser<Component> | undefined
	return component.extend<InputExtensions>(component => ({
		required: State(false),
		hint: StringApplicator(component, value => hintText.value = value),
		maxLength,
		length,
		setMaxLength (newLength) {
			maxLength.value = newLength
			return component
		},
		setRequired: (required = true) => {
			component.attributes.toggle(required, "required")
			component.required.value = required
			return component
		},
		setLabel: label => {
			component.setName(label?.for)
			component.setId(label?.for)
			label?.setInput(component)
			return component
		},
		tweakPopover (initialiser) {
			popoverInitialiser = initialiser as never
			return component
		},
	}))
})

export default Input
