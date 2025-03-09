import Component from 'ui/Component'
import type Button from 'ui/component/core/Button'
import type { CheckbuttonExtensions } from 'ui/component/core/Checkbutton'
import Checkbutton from 'ui/component/core/Checkbutton'

const SYMBOL_RADIO_BUTTON_BRAND = Symbol('RadioButton')
interface RadioButtonExtensions {
	readonly [SYMBOL_RADIO_BUTTON_BRAND]: true
}

interface RadioButton extends Button, CheckbuttonExtensions, RadioButtonExtensions { }

const RadioButton = Component.Builder((): RadioButton => {
	const radio = Checkbutton()
	radio.ariaRole('radio')
	radio.input.attributes.set('type', 'radio')
	return radio.extend<RadioButtonExtensions>(radio => ({
		[SYMBOL_RADIO_BUTTON_BRAND]: true,
	}))
})

export default RadioButton
