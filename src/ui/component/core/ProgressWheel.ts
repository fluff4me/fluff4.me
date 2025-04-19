import Component from 'ui/Component'
import Slot from 'ui/component/core/Slot'
import type { Quilt } from 'ui/utility/StringApplicator'
import type { StateOr } from 'utility/State'
import State from 'utility/State'

interface ProgressWheelExtensions {
	set (definition: ProgressWheelDefinition): this
}

interface ProgressWheel extends Component, ProgressWheelExtensions { }

export interface ProgressWheelDefinition {
	readonly progress: StateOr<number | undefined>
	readonly label: StateOr<string | Quilt.Handler | undefined>
	initialiseIcon?(icon: Component): any
	initialiseLabel?(label: Component): any
}

const ProgressWheelBuilder = Component.Builder((component): ProgressWheel => {
	return component
		.style('progress-wheel')
		.extend<ProgressWheelExtensions>(wheel => ({
			set (definition) {
				wheel.removeContents()

				Component()
					.style('progress-wheel-icon')
					.tweak(definition.initialiseIcon)
					.appendTo(wheel)

				const label = Component()
					.style('progress-wheel-label')
					.tweak(definition.initialiseLabel)
					.appendTo(wheel)

				label.text.bind(definition.label)
				wheel.style.bindVariable('progress', definition.progress)

				return wheel
			},
		}))
})

const ProgressWheel = Object.assign(
	ProgressWheelBuilder,
	{
		Length (length: State<number | undefined>, maxLength: State<number | undefined>) {
			const unusedPercent = State.MapManual([length, maxLength], (length, maxLength) => length === undefined || !maxLength ? undefined : 1 - length / maxLength)
			const unusedChars = State.MapManual([length, maxLength], (length, maxLength) => length === undefined || !maxLength ? undefined : maxLength - length)
			return Slot.using(State.UseManual({ unusedPercent, unusedChars }), (slot, { unusedPercent, unusedChars }) => unusedPercent === undefined || unusedChars === undefined ? undefined
				: ProgressWheelBuilder()
					.set({
						progress: unusedPercent,
						label: quilt => quilt['shared/form/progress-wheel/remaining/label'](unusedChars),
						initialiseIcon: icon => icon
							.style.bind(unusedPercent < 0, 'progress-wheel-icon--overflowing'),
					}))
		},
		Progress (progress: State<number | undefined>) {
			return ProgressWheelBuilder()
				.set({
					progress,
					label: progress.mapManual(p => quilt => quilt['shared/form/progress-wheel/progress/label']((p ?? 0) * 100)),
				})
		},
	}
)

export default ProgressWheel
