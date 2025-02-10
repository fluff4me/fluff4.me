import type { Weave } from 'lang/en-nz'
import Component from 'ui/Component'
import { BlockClasses } from 'ui/component/core/Block'
import type Label from 'ui/component/core/Label'
import type { PopoverInitialiser } from 'ui/component/core/Popover'
import Popover from 'ui/component/core/Popover'
import ProgressWheel from 'ui/component/core/ProgressWheel'
import Slot from 'ui/component/core/Slot'
import { AllowYOffscreen } from 'ui/utility/AnchorManipulator'
import StringApplicator from 'ui/utility/StringApplicator'
import Viewport from 'ui/utility/Viewport'
import type { StateOr } from 'utility/State'
import State from 'utility/State'

export type InvalidMessageText = string | Weave | undefined

export interface InputExtensions {
	readonly required: State<boolean>
	readonly hint: StringApplicator.Optional<this>
	readonly maxLength: State<number | undefined>
	readonly length: State<number | undefined>
	readonly invalid: State<string>
	readonly hasPopover: State<boolean>
	getPopover (): Popover | undefined
	/** 
	 * By default the hint popover is visible on input focus. This allows disabling that in favour of custom handling. 
	 *
	 * ### Default handling: 
	 * ```ts
	 * input.hasFocused.subscribe(owner, focus => input.getPopover()?.toggle(focus).anchor.apply())
	 * ```
	 */
	disableDefaultHintPopoverVisibilityHandling (): this
	setMaxLength (maxLength?: number): this
	setRequired (required?: boolean): this
	/**
	 * - Sets the `[name]` of this component to `label.for`
	 * - Allows the label to use this component for information like whether it's required, etc
	 */
	setLabel (label?: Label): this
	/**
	 * Allows tweaking the hint popover for this input.
	 * 
	 * Controls the same initialiser as `setCustomHintPopover`, if that's also used.
	 */
	tweakPopover (initialiser: PopoverInitialiser<this>): this
	/**
	 * Permanently replace the default hint popover handling for this input with custom handling.
	 * 
	 * Controls the same initialiser as `tweakPopover`.
	 */
	setCustomHintPopover (initialiser: PopoverInitialiser<this>): this
	/** Pipes the validity of this input to a component wrapping an `HTMLInputElement` */
	pipeValidity (component: Component<HTMLInputElement>): this
	/** Sets or clears the custom invalid message for this component. This will be shown over whatever the native invalid message would be */
	setCustomInvalidMessage (message: InvalidMessageText): this
	/** Refreshes the validity message for this input */
	refreshValidity (): this
}

interface Input extends Component, InputExtensions { }

function createHintText (hint: StateOr<string | Weave>) {
	return Component()
		.style('input-popover-hint-text')
		.text.bind(hint)
}

const Input = Object.assign(
	Component.Extension((component): Input => {
		const hintText = State<string | undefined>(undefined)
		const maxLength = State<number | undefined>(undefined)
		const length = State<number | undefined>(undefined)
		const invalid = State<string>('')
		const popoverOverride = State(false)
		const hasPopover = State.MapManual([hintText, maxLength, popoverOverride], (hintText, maxLength, override) => override || !!hintText || !!maxLength)
		let popover: Popover | undefined
		hasPopover.subscribeManual(hasPopover => {
			if (!hasPopover) {
				popover?.remove()
				popover = undefined
				return
			}

			if (component.removed.value)
				return

			popover = Popover()
				.setNormalStacking()
				.style('input-popover')
				.setOwner(component)
				.tweak(popover => {
					if (popoverOverride.value)
						return

					Slot.using(hintText, (slot, hintText) => !hintText ? undefined : createHintText(hintText))
						.appendTo(popover)

					ProgressWheel.Length(length, maxLength)
						.appendTo(popover)
				})
				.tweak(popoverInitialiser, component)
				.appendTo(document.body)

			Viewport.tablet.use(popover, isTablet => {
				const tablet = isTablet()
				popover?.type.toggle(!tablet, 'flush')

				if (tablet) {
					popover?.anchor.reset()
						.anchor.from(component)
						.anchor.add('aligned left', 'aligned top')
						.anchor.add('aligned left', 'aligned bottom')
						.setCloseOnInput(true)
				}
				else {
					popover?.anchor.reset()
						.anchor.from(component)
						.anchor.add('off right', `.${BlockClasses.Main}`, 'aligned top', {
							...AllowYOffscreen,
							yValid (y, hostBox, popoverBox) {
								// only align top if the popover box is taller than the host box
								return popoverBox.height > (hostBox?.height ?? 0)
							},
						})
						.anchor.add('off right', `.${BlockClasses.Main}`, 'centre', AllowYOffscreen)
						.setCloseOnInput(false)
				}
			})
		})

		let customPopoverVisibilityHandling = false
		component.hasFocused.subscribeManual(hasFocused => {
			if (customPopoverVisibilityHandling)
				return

			if (Viewport.tablet.value)
				return

			popover?.toggle(hasFocused).anchor.apply()
		})

		const customInvalidMessage = State<InvalidMessageText>(undefined)
		let validityPipeComponent: Component<HTMLInputElement> | undefined
		customInvalidMessage.subscribe(component, invalidMessage => {
			const validity = typeof invalidMessage === 'object' ? invalidMessage.toString() : invalidMessage
			const input = validityPipeComponent?.element ?? component.element as HTMLInputElement
			input.setCustomValidity?.(validity ?? '')
		})

		component.event.subscribe(['input', 'change'], refreshValidity)

		let popoverInitialiser: PopoverInitialiser<Component> | undefined
		const input = component.extend<InputExtensions>(component => ({
			required: State(false),
			hint: StringApplicator(component, value => hintText.value = value),
			maxLength,
			length,
			invalid,
			hasPopover,
			disableDefaultHintPopoverVisibilityHandling () {
				customPopoverVisibilityHandling = true
				return component
			},
			getPopover: () => popover,
			setMaxLength (newLength) {
				maxLength.value = newLength
				return component
			},
			setRequired: (required = true) => {
				component.attributes.toggle(required, 'required')
				component.required.asMutable?.setValue(required)
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
			setCustomHintPopover (initialiser) {
				popoverInitialiser = initialiser as never
				popoverOverride.value = true
				return component
			},
			pipeValidity (to) {
				validityPipeComponent = to
				return component
			},
			setCustomInvalidMessage (message) {
				customInvalidMessage.value = message
				refreshValidity()
				return component
			},
			refreshValidity,
		}))

		return input

		function refreshValidity () {
			invalid.value = _
				?? customInvalidMessage.value?.toString()
				?? (component.element as HTMLInputElement).validationMessage
				?? ''
			return input
		}
	}),
	{
		createHintText,
	}
)

export default Input
