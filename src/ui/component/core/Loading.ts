import Component from 'ui/Component'
import Flag from 'ui/component/core/Flag'
import Placeholder from 'ui/component/core/Placeholder'
import type { UnsubscribeState } from 'utility/State'
import State from 'utility/State'

interface LoadingExtensions {
	readonly enabled: State.Mutable<boolean>
	readonly flag: Flag
	use (state: State.Async<any>): this
}

interface Loading extends Component, LoadingExtensions { }

const Loading = Component.Builder((component): Loading => {
	const enabled = State(true)
	const progress = State<State.AsyncProgress | undefined>(undefined)
	const flag = Flag()
		.style('loading-flag')
		.style.bind(enabled.falsy, 'loading-flag--hidden')
		.wave('loading', true)
	let unuseSettled: UnsubscribeState | undefined
	let unuseProgress: UnsubscribeState | undefined
	return component
		.style('loading')
		.append(flag)
		.appendWhen(progress.truthy, Component()
			.style('loading-progress')
			.append(
				Component()
					.style('loading-progress-bar')
					.tweak(bar => bar.style.bindVariable('progress', progress.map(bar, progress => progress?.progress ?? 0))),
				Placeholder()
					.style('loading-progress-message')
					.tweak(text => text.text.bind(progress.map(text, progress => progress?.message ?? ''))),
			)
		)
		.extend<LoadingExtensions>(loading => ({
			enabled,
			flag,
			use (state) {
				unuseSettled?.()
				unuseSettled = enabled.bind(loading, state.settled.falsy)
				unuseProgress?.()
				unuseProgress = progress.bind(loading, state.progress)
				return loading
			},
		}))
})

export default Loading
