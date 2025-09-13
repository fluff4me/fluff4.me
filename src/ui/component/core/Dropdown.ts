import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import Checkbutton from 'ui/component/core/Checkbutton'
import type { InputExtensions, InvalidMessageText } from 'ui/component/core/ext/Input'
import Input from 'ui/component/core/ext/Input'
import Form from 'ui/component/core/Form'
import type Popover from 'ui/component/core/Popover'
import RadioButton from 'ui/component/core/RadioButton'
import TextInput from 'ui/component/core/TextInput'
import Applicator from 'ui/utility/Applicator'
import { QuiltHelper, type Quilt } from 'ui/utility/StringApplicator'
import Arrays from 'utility/Arrays'
import Async from 'utility/Async'
import Functions from 'utility/Functions'
import type { UnsubscribeState } from 'utility/State'
import State from 'utility/State'

type DropdownButton = RadioButton | Checkbutton

interface DropdownOptionDefinition<ID extends string, BUTTON extends DropdownButton> {
	translation: string | ((id: ID) => string | Quilt.Handler)
	tweakButton?(button: BUTTON, id: ID): unknown
}

interface DropdownOption<ID extends string, BUTTON extends DropdownButton> extends DropdownOptionDefinition<ID, BUTTON> {
	index: number
}

interface DropdownExtensions<ID extends string, BUTTON extends DropdownButton> {
	readonly selection: State.Mutable<(BUTTON extends RadioButton ? ID : ID[]) | undefined>
	readonly touched: State<boolean>
	readonly default: Applicator.Optional<this, BUTTON extends RadioButton ? ID : ID[]>
	readonly options: Record<string, DropdownOption<ID, BUTTON>>
	readonly button: Button
	readonly popover: State<Popover | undefined>
	add<NEW_ID extends string> (id: NEW_ID, definition: DropdownOptionDefinition<NEW_ID, BUTTON>): Dropdown<ID | NEW_ID>
	clear (): Dropdown<never>
}

interface Dropdown<ID extends string = never, BUTTON extends DropdownButton = DropdownButton> extends Input, DropdownExtensions<ID, BUTTON> { }

interface DropdownDefinitionBase<BUTTON extends DropdownButton> {
	createButton (): BUTTON
	translateSelection?(dropdown: Dropdown<string, BUTTON>, selection: BUTTON extends RadioButton ? string : string[]): string | Quilt.Handler | undefined
}

const Dropdown = Component.Builder((component, definition: DropdownDefinitionBase<DropdownButton>): Dropdown => {
	const dropdown = component.and(Input)
		.style('dropdown')

	interface InternalDropdownOption extends DropdownOption<string, DropdownButton> {
		button: RadioButton
	}

	const selection = State<string | string[] | undefined>(undefined)
	const touched = State(false)
	const options: Record<string, InternalDropdownOption> = {}
	let optionIndex = 0

	const input = TextInput()
		.placeholder.use('shared/form/dropdown/filter/placeholder')
		.style('dropdown-popover-input')

	const content = Component()
		.style('dropdown-popover-content')

	const popover = State<Popover | undefined>(undefined)
	const button = Button()
		.style('dropdown-button')
		.text.bind(selection.mapManual(state => state === undefined || (Array.isArray(state) && state.length === 0)
			? quilt => quilt['shared/form/dropdown/selection/none']()
			: (_
				?? definition.translateSelection?.(dropdown as Dropdown<string>, state)
				?? (quilt => quilt['shared/form/dropdown/selection/join'](...Arrays.resolve(state)
					.map(id => Functions.resolve(options[id]?.translation, id))
					.map(translation => typeof translation === 'string' ? translation : Functions.resolve(translation, quilt, QuiltHelper))
				))
			)
		))
		.setPopover('click', p => {
			const oldPopover = popover.value

			popover.value = p
				.style('dropdown-popover')
				.anchor.add('aligned left', 'aligned top')
				.anchor.add('aligned left', 'aligned bottom')
				.anchor.add('aligned left', 'sticky centre')
				.anchor.orElseHide()

			popover.value.appendTo(dropdown)
			popover.value.visible.subscribeManual(async visible => {
				await Async.sleep(20)
				if (visible) input.focus()
			})

			content.appendTo(popover.value)

			popover.value.anchor.state.useManual(location => {
				if (!popover.value)
					return

				const isBottom = location?.preference?.yAnchor.side === 'bottom'
				popover.value.style.toggle(isBottom, 'dropdown-popover--is-bottom')
				if (isBottom)
					input.appendTo(popover.value)
				else
					input.prependTo(popover.value)
			})

			oldPopover?.remove()
		})
		.appendTo(dropdown)

	const hiddenInput = Component('input')
		.style('dropdown-validity-pipe-input')
		.tabIndex('programmatic')
		.attributes.set('type', 'text')
		.setName(`dropdown-validity-pipe-input-${Math.random().toString(36).slice(2)}`)
		.appendTo(dropdown)

	let labelFor: State<string | undefined> | undefined
	let unusePopoverForInput: UnsubscribeState | undefined
	dropdown
		.pipeValidity(hiddenInput)
		.ariaRole('group')
		.extend<DropdownExtensions<string, DropdownButton> & Partial<InputExtensions>>(dropdown => ({
			options,
			selection: selection as never,
			touched,
			default: Applicator(dropdown, (id?: string) => selection.value = id),
			button,
			popover,
			add (id, optionDefinition: DropdownOptionDefinition<string, DropdownButton>) {
				const button = definition.createButton()
					.style('dropdown-option')
					.tweak(button => button.is(RadioButton) && button.setIcon(undefined))
					.type('flush')
					.setId(id)
					.setName(labelFor)
					.text.bind(Functions.resolve(optionDefinition.translation, id))
					.use(selection.mapManual(selected => Arrays.resolve(selected).includes(id)))
					.receiveFocusedClickEvents()
					.tweak(button => button.as(Checkbutton)?.event.subscribe('click', event => {
						input.focus()
						event.preventDefault()
						event.stopImmediatePropagation()

						const isRadio = button.is(RadioButton)
						if (isRadio)
							popover.value?.hide()

						if (!selection.value)
							selection.value = isRadio ? id : [id]
						else {
							const current = Arrays.resolve(selection.value)
							if (current.includes(id))
								selection.value = current.filter(value => value !== id)
							else if (isRadio)
								selection.value = id
							else
								selection.value = [...current, id].sort((a, b) => options[a].index - options[b].index)
						}

						touched.value = true
						updateValidity()
					}))
					.tweak(optionDefinition.tweakButton, id)
					.appendTo(content)

				options[id] = Object.assign(optionDefinition, {
					button,
					index: optionIndex++,
				}) as InternalDropdownOption

				button.style.bind(button.checked, 'dropdown-option--selected')
				const filteredOut = State.Map(button, [input.state, button.checked], (filter, selected) =>
					!selected && !!filter && !button.element.textContent?.toLowerCase()?.includes(filter.toLowerCase()))
				button.style.bind(filteredOut, 'dropdown-option--filtered-out')

				if (button.is(RadioButton))
					button.bindDisabled(button.checked, 'selection')

				return dropdown
			},
			clear () {
				for (const option of Object.values(options))
					option.button.remove()

				for (const key of Object.keys(options))
					delete options[key]

				return dropdown as never
			},
		}))
		.extend<Partial<InputExtensions>>(dropdown => ({
			setLabel (label) {
				unusePopoverForInput?.()
				unusePopoverForInput = popover.useManual(popover => popover?.ariaLabel.bind(label?.text.state))

				labelFor = label?.for
				for (const option of Object.values(options))
					option.button.setName(labelFor)

				label?.setInput(dropdown)
				return dropdown
			},
		}))

	dropdown.onRooted(updateValidity)
	dropdown.required.useManual(updateValidity)
	return dropdown as Dropdown

	function updateValidity () {
		let invalid: InvalidMessageText
		if (!selection.value && dropdown.required.value)
			invalid = quilt => quilt['shared/form/invalid/required']()

		dropdown.setCustomInvalidMessage(invalid)
		dropdown.closest(Form)?.refreshValidity()
	}
})

interface DropdownDefinition<BUTTON extends DropdownButton> extends Omit<DropdownDefinitionBase<BUTTON>, 'createButton'> { }

export interface RadioDropdown<ID extends string = never> extends Dropdown<ID, RadioButton> { }

export const RadioDropdown = (
	Component.Builder((component, definition?: DropdownDefinition<RadioButton>): RadioDropdown => {
		return component.and(Dropdown, { createButton: RadioButton, ...definition }) as RadioDropdown
	}).setName('RadioDropdown')
) as never as (<ID extends string> (definition?: DropdownDefinition<RadioButton>) => RadioDropdown<ID>)

export interface CheckDropdown<ID extends string = never> extends Dropdown<ID, Checkbutton> { }

export const CheckDropdown = (
	Component.Builder((component, definition?: DropdownDefinition<Checkbutton>): CheckDropdown => {
		return component.and(Dropdown, { createButton: Checkbutton, ...definition }) as CheckDropdown
	}).setName('CheckDropdown')
) as never as (<ID extends string> (definition?: DropdownDefinition<Checkbutton>) => CheckDropdown<ID>)
