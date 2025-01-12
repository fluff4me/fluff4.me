import type { Weave, WeavingArg } from 'lang/en-nz'
import Component from 'ui/Component'
import State from 'utility/State'
import Time from 'utility/Time'

interface TimestampExtensions {
	readonly time: State<Date>
	setTranslation (translation?: (arg: WeavingArg) => Weave): this
}

interface Timestamp extends Component, TimestampExtensions { }

const Timestamp = Component.Builder((component, time?: number | string | Date): Timestamp => {
	let translation: ((arg: WeavingArg) => Weave) | undefined

	const state = State(new Date(time ?? Date.now()))
	state.use(component, update)

	return component
		.style('timestamp')
		.extend<TimestampExtensions>(component => ({
			time: state,
			setTranslation (newTranslation) {
				translation = newTranslation
				return component
			},
		}))
		.onRooted(component => {
			update()
			const interval = setInterval(update, Time.seconds(1))
			component.removed.awaitManual(true, () => clearInterval(interval))
		})

	function update () {
		const timeString = Time.relative(state.value.getTime(), { components: 2, secondsExclusive: true })
		component.text.set(translation?.(timeString) ?? timeString)
	}
})

export default Timestamp
