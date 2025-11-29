import Tabinator from 'ui/component/core/Tabinator'
import FollowingAuthorsTab from 'ui/view/following/FollowingAuthorsTab'
import FollowingTagsTab from 'ui/view/following/FollowingTagsTab'
import FollowingWorksTab from 'ui/view/following/FollowingWorksTab'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'

interface FollowingViewParams {
	tab?: string
}

export default ViewDefinition({
	create: ({ tab }: FollowingViewParams | undefined = {}) => {
		const view = View('following')

		view.breadcrumbs.title.text.use('view/following/main/title')
		view.breadcrumbs.description.text.use('view/following/main/description')

		Tabinator()
			.addTab(FollowingWorksTab('following'))
			.addTab(FollowingAuthorsTab('following'))
			.addTab(FollowingTagsTab('following'))
			.bindURL(tab, tab => `/following/${tab ?? 'works'}`)
			.appendTo(view.content)

		return view
	},
})
