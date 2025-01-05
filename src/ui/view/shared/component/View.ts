import type style from 'style'
import Component from 'ui/Component'

interface ViewExtensions {
	viewId: ViewId
	params?: object
	readonly hash: string
}

interface View extends Component, ViewExtensions { }

export type ViewId = keyof { [KEY in keyof typeof style as KEY extends `view-type-${infer ID}` ? ID : never]: string[] }

const View = Component.Builder((_, id: ViewId): View => Component()
	.style('view', `view-type-${id}`)
	.attributes.set('data-view', id)
	.extend<ViewExtensions>(view => ({
		viewId: id,
		hash: '',
	}))
	.extendJIT('hash', view => `${view.viewId}${view.params ? `_${JSON.stringify(view.params)}` : ''}`
		.replaceAll(/\W+/g, '-')))

export default View
