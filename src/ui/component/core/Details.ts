import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import State from 'utility/State'

interface DetailsExtensions {
	readonly state: State.Mutable<boolean>
	readonly summary: Button
}

interface Details extends Component<HTMLDetailsElement>, DetailsExtensions { }

const Details = Component.Builder('details', (component): Details => {
	const state = State(false)
	const summary = Component('summary').and(Button).appendTo(component)
	const details = (component as Component<HTMLDetailsElement>).style('details')
		.extend<DetailsExtensions>(details => ({
			state,
			summary,
		}))

	state.use(details, open => details.element.open = open)
	return details
		.event.subscribe('toggle', event => {
			state.value = event.host.element.open
		})
})

export default Details
