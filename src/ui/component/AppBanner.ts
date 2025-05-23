import Component from 'ui/Component'
import Async from 'utility/Async'
import State from 'utility/State'

declare global {
	export const banner: AppBannerQueue
}

type AppBannerInitialiser = (banner: AppBanner) => unknown
interface AppBannerQueueExtensions {
	readonly state: State<boolean>
	queue (initialiser: AppBannerInitialiser): Promise<void>
}

interface AppBannerQueue extends Component, AppBannerQueueExtensions { }

export const AppBannerQueue = Component.Builder((component): AppBannerQueue => {
	Object.assign(window, { banner: component })

	const state = State(false)
	const queue: [AppBannerInitialiser, () => void][] = []

	return component.style('app-banner-container')
		.extend<AppBannerQueueExtensions>(banner => ({
			state,
			queue: initialiser => {
				let resolver!: () => void
				const promise = new Promise<void>(resolve => resolver = resolve)
				queue.push([initialiser, resolver])
				if (!state.value) next()
				return promise
			},
		}))

	function next () {
		const queuedBanner = queue.shift()
		if (!queuedBanner) {
			state.value = false
			return
		}

		const [initialiser, resolver] = queuedBanner
		state.value = true
		const banner = AppBanner().tweak(initialiser).appendTo(component)
		banner.dismissed.match(component, true, () => {
			resolver()
			next()
		})
	}
})

interface AppBannerExtensions {
	readonly dismissed: State<boolean>
	readonly body: Component
	dismiss (): void
}

interface AppBanner extends Component, AppBannerExtensions { }

const AppBanner = Component.Builder((component): AppBanner => {
	const dismissed = State(false)
	component.onRemoveManual(() => dismissed.value = true)

	const body = Component()
		.style('app-banner-body')

	return component.style('app-banner')
		.style.bind(dismissed, 'app-banner--dismissed')
		.append(body)
		.extend<AppBannerExtensions>(banner => ({
			dismissed,
			body,
			dismiss: () => {
				dismissed.value = true
				void Async.sleep(500).then(banner.remove)
			},
		}))
})

export default AppBanner
