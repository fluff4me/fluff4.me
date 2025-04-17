import Component from 'ui/Component'

interface SmallExtensions {

}

interface Small extends Component, SmallExtensions { }

const Small = Component.Builder('small', (component): Small => {
	return component.style('small').extend<SmallExtensions>(placeholder => ({}))
})

export default Small
