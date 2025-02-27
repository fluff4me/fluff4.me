import quilt, { Weave } from "lang/en-nz"
import Component from "ui/Component"
import Button from "ui/component/core/Button"
import Input, { InputExtensions } from "ui/component/core/ext/Input"
import Popover from "ui/component/core/Popover"
import RadioButton from "ui/component/core/RadioButton"
import TextInput from "ui/component/core/TextInput"
import Applicator from "ui/utility/Applicator"
import { Quilt } from "ui/utility/StringApplicator"
import Async from "utility/Async"
import Functions from "utility/Functions"
import State from "utility/State"
import { SupplierOr } from "utility/Type"

interface DropdownOptionDefinition<ID extends string> {
	translation: SupplierOr<string | Weave | Quilt.Handler, [ID]>
	tweakButton?(button: RadioButton, id: ID): unknown
}

interface DropdownExtensions<ID extends string> {
	readonly selection: State<ID | undefined>
	readonly default: Applicator.Optional<this, ID>
	add<NEW_ID extends string> (id: NEW_ID, definition: DropdownOptionDefinition<NEW_ID>): Dropdown<ID | NEW_ID>
	clear (): Dropdown<never>
}

interface Dropdown<ID extends string = never> extends Input, DropdownExtensions<ID> { }

const Dropdown = Component.Builder((component): Dropdown => {
	const dropdown = component.and(Input)
		.style('dropdown')

	interface DropdownOption extends DropdownOptionDefinition<string> {
		button: RadioButton
	}

	const selection = State<string | undefined>(undefined)
	let options: Record<string, DropdownOption> = {}

	let popover!: Popover
	Button()
		.style('dropdown-button')
		.text.bind(selection.mapManual(state => _
			?? Functions.resolve(options[state!]?.translation, state!)
			?? quilt['shared/form/dropdown/no-selection']()
		))
		.setPopover('click', p => popover = p
			.style('dropdown-popover')
			.anchor.add('aligned left', 'aligned top')
			.anchor.add('aligned left', 'aligned bottom')
		)
		.appendTo(dropdown)

	popover.appendTo(dropdown)
	popover.visible.subscribeManual(async visible => {
		await Async.sleep(20)
		if (visible) input.focus()
	})

	const input = TextInput()
		.placeholder.use('shared/form/dropdown/filter/placeholder')
		.style('dropdown-popover-input')

	const content = Component()
		.style('dropdown-popover-content')
		.appendTo(popover)

	popover.anchor.state.useManual(location => {
		const isBottom = location?.preference?.yAnchor.side === 'bottom'
		popover.style.toggle(isBottom, 'dropdown-popover--is-bottom')
		if (isBottom)
			input.appendTo(popover)
		else
			input.prependTo(popover)
	})

	let labelFor: State<string | undefined> | undefined
	dropdown
		.ariaRole('group')
		.extend<DropdownExtensions<string> & Partial<InputExtensions>>(dropdown => ({
			selection,
			default: Applicator(dropdown, (id?: string) => selection.value = id),
			add (id, definition: DropdownOptionDefinition<string>) {
				const button = RadioButton()
					.style('dropdown-option')
					.type('flush')
					.tweak(definition.tweakButton, id)
					.setId(id)
					.setName(labelFor)
					.text.bind(Functions.resolve(definition.translation, id))
					.use(selection.mapManual(selected => selected === id))
					.receiveFocusedClickEvents()
					.event.subscribe('click', event => {
						input.focus()
						selection.value = id
						event.preventDefault()
						event.stopImmediatePropagation()
						popover.hide()
					})
					.appendTo(content)

				options[id] = Object.assign(definition, { button })

				button.style.bind(button.checked, 'dropdown-option--selected')
				const filteredOut = State.Map(button, [input.state, button.checked], (filter, selected) =>
					!selected && !!filter && !button.element.textContent?.includes(filter))
				button.style.bind(filteredOut, 'dropdown-option--filtered-out')
				button.bindDisabled(button.checked, 'selection')

				return dropdown
			},
			clear () {
				for (const option of Object.values(options))
					option.button.remove()

				options = {}
				return dropdown as Dropdown<never>
			},
		}))
		.extend<Partial<InputExtensions>>(dropdown => ({
			setLabel (label) {
				labelFor = label?.for
				popover.ariaLabel.bind(label?.text.state)
				for (const option of Object.values(options))
					option.button.setName(labelFor)

				label?.setInput(dropdown)
				return dropdown
			},
		}))

	return dropdown as Dropdown
})

export default Dropdown
