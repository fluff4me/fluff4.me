import Component from 'ui/Component'
import State from 'utility/State'
import Time from 'utility/Time'

interface TimestampExtensions {
	time: State<Date>
}

interface Timestamp extends Component, TimestampExtensions { }

const Timestamp = Component.Builder((component, time?: number | string | Date) => {
	const state = State(new Date(time ?? Date.now()))
	state.use(component, update)

	return component
		.style('timestamp')
		.extend(component => ({ time: state }))
		.onRooted(component => {
			update()
			const interval = setInterval(update, Time.seconds(1))
			component.event.subscribe('remove', () => clearInterval(interval))
		})

	function update () {
		component.text.set(Time.relative(state.value.getTime(), { components: 2, secondsExclusive: true }))
	}
})

export default Timestamp
