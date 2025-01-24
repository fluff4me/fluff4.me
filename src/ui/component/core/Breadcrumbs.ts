import type { RoutePath } from 'navigation/Routes'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import Link from 'ui/component/core/Link'
import type { Quilt } from 'ui/utility/StringApplicator'

interface BreadcrumbsExtensions {
	readonly path: Component
	backButton?: Link & Button
	setPath (...path: [route: RoutePath, translation: Quilt.SimpleKey | Quilt.Handler][]): this
	setBackButton (route?: RoutePath, initialiser?: (button: Link & Button) => unknown): this
}

interface Breadcrumbs extends Component, BreadcrumbsExtensions { }

const Breadcrumbs = Component.Builder((component): Breadcrumbs => {
	const pathComponent = Component()
		.style('breadcrumbs-path', 'breadcrumbs-path--hidden')
		.viewTransition('breadcrumbs-path')

	const breadcrumbs = component.style('breadcrumbs')
		.append(pathComponent)
		.extend<BreadcrumbsExtensions>(breadcrumbs => ({
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
					.viewTransition('breadcrumbs-back-button')
					.text.use('shared/action/return')
					.tweak(initialiser)
					.prependTo(breadcrumbs)

				return breadcrumbs
			},
		}))

	return breadcrumbs
})

export default Breadcrumbs
