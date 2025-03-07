import type style from 'style'
import Component from 'ui/Component'
import Breadcrumbs from 'ui/component/core/Breadcrumbs'

interface ViewExtensions {
	readonly viewId: ViewId
	params?: object
	readonly hash: string
	readonly breadcrumbs: Breadcrumbs
	readonly content: Component
}

interface View extends Component, ViewExtensions { }

export type ViewId = keyof { [KEY in keyof typeof style as KEY extends `view-type-${infer ID}` ? ID : never]: string[] }

const View = Component.Builder((_, id: ViewId): View => {
	const content = Component().style('view-content')
	return Component()
		.style('view', `view-type-${id}`)
		.attributes.set('data-view', id)
		.append(content)
		.extend<ViewExtensions>(view => ({
			viewId: id,
			hash: '',
			breadcrumbs: undefined!,
			content,
		}))
		.extendJIT('hash', view => `${view.viewId}${view.params ? `_${JSON.stringify(view.params)}` : ''}`
			.replaceAll(/\W+/g, '-'))
		.extendJIT('breadcrumbs', view => Breadcrumbs()
			.style('view-breadcrumbs')
			.tweak(breadcrumbs => {
				breadcrumbs.path.style('view-breadcrumbs-path')

				const originalAddBackButton = breadcrumbs.setBackButton
				breadcrumbs.backButton?.style('view-breadcrumbs-back-button')
				breadcrumbs.setBackButton = (...args) => {
					originalAddBackButton(...args)
					breadcrumbs.backButton?.style('view-breadcrumbs-back-button')
					return breadcrumbs
				}

				breadcrumbs.tweakJIT('meta', meta => meta.style('view-breadcrumbs-meta'))
				breadcrumbs.tweakJIT('info', info => info.style('view-breadcrumbs-info'))
				breadcrumbs.tweakJIT('title', title => title.style('view-breadcrumbs-title'))
				breadcrumbs.tweakJIT('description', description => description.style('view-breadcrumbs-description'))
			})
			.prependTo(view))
})

export default View
