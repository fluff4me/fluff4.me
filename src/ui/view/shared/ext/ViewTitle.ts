import Component from 'ui/Component'
import type { Quilt } from 'ui/utility/StringApplicator'

export default Component.Extension((component, title?: Quilt.SimpleKey | Quilt.Handler) => {
	if (title)
		component.attributes.use('data-view-title', title)
	return component
})
