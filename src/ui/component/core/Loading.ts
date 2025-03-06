import Component from 'ui/Component'
import Flag from 'ui/component/core/Flag'

interface LoadingExtensions {

}

interface Loading extends Component, LoadingExtensions { }

const Loading = Component.Builder((component): Loading => {
	return component.and(Flag)
		.style('loading-flag')
		.wave('loading', true)
})

export default Loading
