import type style from 'style'
import Component from 'ui/Component'
import Breadcrumbs from 'ui/component/core/Breadcrumbs'
import Heading from 'ui/component/core/Heading'
import ViewTitle from 'ui/view/shared/ext/ViewTitle'
import State from 'utility/State'

interface ViewExtensions {
	readonly viewId: ViewId
	params?: object
	readonly hash: string
	readonly breadcrumbs: Breadcrumbs
	readonly content: Component
	readonly titleComponent: State<Component | undefined>
	readonly sidebar: Component
}

interface View extends Component, ViewExtensions { }

export type ViewId = keyof { [KEY in keyof typeof style as KEY extends `view-type-${infer ID}` ? ID : never]: string[] }

const View = Component.Builder((component, id: ViewId): View => {
	const content = Component().style('view-content')
	return component
		.style('view', `view-type-${id}`)
		.attributes.set('data-view', id)
		.append(content)
		.extend<ViewExtensions>(view => ({
			viewId: id,
			hash: '',
			breadcrumbs: undefined!,
			content,
			titleComponent: undefined!,
			sidebar: undefined!,
		}))
		.extendJIT('hash', view => `${view.viewId}${view.params ? `_${JSON.stringify(view.params)}` : ''}`
			.replaceAll(/\W+/g, '-'))
		.extendJIT('breadcrumbs', view => Breadcrumbs()
			.style('view-breadcrumbs')
			.tweak(breadcrumbs => {
				breadcrumbs.path.style('view-breadcrumbs-path')

				const originalAddBackButton = breadcrumbs.setBackButton
				breadcrumbs.backButton.value?.style('view-breadcrumbs-back-button')
				breadcrumbs.setBackButton = (...args) => {
					originalAddBackButton(...args)
					breadcrumbs.backButton.value?.style('view-breadcrumbs-back-button')
					return breadcrumbs
				}

				breadcrumbs.tweakJIT('meta', meta => meta.style('view-breadcrumbs-meta'))
				breadcrumbs.tweakJIT('info', info => info.style('view-breadcrumbs-info'))
				breadcrumbs.tweakJIT('title', title => title.style('view-breadcrumbs-title'))
				breadcrumbs.tweakJIT('description', description => description.style('view-breadcrumbs-description'))
			})
			.prependTo(view))
		.extendJIT('titleComponent', view => {
			const state = State<Component | undefined>(undefined)

			updateTitleComponent()
			view.receiveDescendantInsertEvents()
			view.receiveDescendantRemoveEvents()
			view.event.subscribe(['descendantInsert', 'descendantRemove'], updateTitleComponent)

			return state

			function updateTitleComponent () {
				state.value = _
					?? view.breadcrumbs.getTitleIfExists()
					?? view.getFirstDescendant(ViewTitle)
					?? view.getFirstDescendant(Heading)
			}
		})
		.extendJIT('sidebar', view => Component('aside')
			.style('view-sidebar')
			.appendTo(view.style('view--has-sidebar'))
		)
})

export default View
