import Component from 'ui/Component'
import Checkbutton from 'ui/component/core/Checkbutton'

interface RadioButtonExtensions {

}

interface RadioButton extends Checkbutton, RadioButtonExtensions { }

const RadioButton = Component.Builder(() => {
	const radio = Checkbutton()
	radio.ariaRole('radio')
	radio.input.attributes.set('type', 'radio')
	return radio.extend<RadioButtonExtensions>(radio => ({}))
})

export default RadioButton
