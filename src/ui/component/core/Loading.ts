import Component from 'ui/Component'
import Flag from 'ui/component/core/Flag'
import State from 'utility/State'

interface LoadingExtensions {
	readonly enabled: State.Mutable<boolean>
}

interface Loading extends Component, LoadingExtensions { }

const Loading = Component.Builder((component): Loading => {
	const enabled = State(true)
	return component.and(Flag)
		.style('loading-flag')
		.style.bind(enabled.falsy, 'loading-flag--hidden')
		.wave('loading', true)
		.extend<LoadingExtensions>(loading => ({
			enabled,
		}))
})

export default Loading
