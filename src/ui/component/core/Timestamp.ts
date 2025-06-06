import type { Weave, WeavingArg } from 'lang/en-nz'
import Component from 'ui/Component'
import type { Quilt } from 'ui/utility/StringApplicator'
import State from 'utility/State'
import Time from 'utility/Time'

type TimestampTranslationHandler = (quilt: Quilt) => (arg: WeavingArg) => Weave
interface TimestampExtensions {
	readonly time: State<Date>
	setTranslation (translation?: TimestampTranslationHandler): this
	setSimple (simple?: boolean): this
}

interface Timestamp extends Component, TimestampExtensions { }

const Timestamp = Component.Builder((component, time?: number | string | Date): Timestamp => {
	let translation: TimestampTranslationHandler | undefined

	let simple = false

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
			setSimple (inSimple = true) {
				simple = inSimple
				return component
			},
		}))
		.onRooted(component => {
			update()
			const interval = setInterval(update, Time.seconds(1))
			component.removed.matchManual(true, () => clearInterval(interval))
		})

	function update () {
		const timeString = Time.relative(state.value.getTime(), { components: simple ? 1 : 2, secondsExclusive: true })
		component.text.set(!translation ? timeString : quilt => translation!(quilt)(timeString))
	}
})

export default Timestamp
