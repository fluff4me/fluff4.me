import Component from 'ui/Component'

interface PlaceholderExtensions {

}

interface Placeholder extends Component, PlaceholderExtensions { }

const Placeholder = Component.Builder((component): Placeholder => {
	return component.style('placeholder').extend<PlaceholderExtensions>(placeholder => ({}))
})

export default Placeholder
