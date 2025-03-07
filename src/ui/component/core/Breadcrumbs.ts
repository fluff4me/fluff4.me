import type { RoutePath } from 'navigation/RoutePath'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import Heading from 'ui/component/core/Heading'
import Link from 'ui/component/core/Link'
import type { Quilt } from 'ui/utility/StringApplicator'

interface BreadcrumbsExtensions {
	readonly path: Component
	readonly meta: Component
	readonly info: Component
	readonly title: Heading
	readonly description: Component
	readonly actions: Component
	backButton?: Link & Button
	setPath (...path: [route: RoutePath, translation: Quilt.SimpleKey | Quilt.Handler][]): this
	setBackButton (route?: RoutePath, initialiser?: (button: Link & Button) => unknown): this
	getTitleIfExists (): Heading | undefined
}

interface Breadcrumbs extends Component, BreadcrumbsExtensions { }

const Breadcrumbs = Component.Builder((component): Breadcrumbs => {
	const pathComponent = Component()
		.style('breadcrumbs-path', 'breadcrumbs-path--hidden')
		.viewTransition('breadcrumbs-path')

	let title: Heading | undefined

	const breadcrumbs = component.style('breadcrumbs')
		.append(pathComponent)
		.extend<BreadcrumbsExtensions>(breadcrumbs => ({
			meta: undefined!,
			info: undefined!,
			title: undefined!,
			description: undefined!,
			actions: undefined!,
			path: pathComponent,
			setPath (...path) {
				pathComponent.removeContents()
					.style.toggle(!path.length, 'breadcrumbs-path--hidden')
					.append(...path.flatMap(([route, translation], i) => [
						i && Component()
							.style('breadcrumbs-path-separator'),
						Link(route)
							.and(Button)
							.type('flush')
							.text.use(translation),
					]))
				return breadcrumbs
			},
			setBackButton (route, initialiser) {
				breadcrumbs.backButton?.remove()
				if (!route)
					return breadcrumbs

				breadcrumbs.backButton = Link(route)
					.and(Button)
					.type('flush')
					.style('breadcrumbs-back-button')
					.setIcon('arrow-left')
					.text.use('shared/action/return')
					.tweak(initialiser)
					.appendTo(breadcrumbs.meta)

				return breadcrumbs
			},
			getTitleIfExists () {
				return title
			},
		}))
		.extendJIT('meta', breadcrumbs => Component()
			.viewTransition('breadcrumbs-meta')
			.prependTo(breadcrumbs))
		.extendJIT('info', breadcrumbs => Component()
			.prependTo(breadcrumbs.meta))
		.extendJIT('title', breadcrumbs => title = Heading()
			.style('breadcrumbs-title')
			.setAestheticStyle(false)
			.prependTo(breadcrumbs.info))
		.extendJIT('description', breadcrumbs => Component()
			.style('breadcrumbs-description')
			.appendTo(breadcrumbs.info))
		.extendJIT('actions', breadcrumbs => Component()
			.style('breadcrumbs-actions')
			.appendTo(breadcrumbs.meta))

	return breadcrumbs
})

export default Breadcrumbs
