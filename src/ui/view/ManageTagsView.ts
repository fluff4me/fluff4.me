import EndpointTagCustomGetAll from 'endpoint/tag/EndpointTagCustomGetAll'
import Session from 'model/Session'
import Tags from 'model/Tags'
import Tabinator, { Tab } from 'ui/component/core/Tabinator'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import ManageCustomTags from 'ui/view/tags/ManageCustomTags'
import ManageGlobalTags from 'ui/view/tags/ManageGlobalTags'
import ManageTagCategories from 'ui/view/tags/ManageTagCategories'
import Errors from 'utility/Errors'
import State from 'utility/State'

export default ViewDefinition({
	async load (params) {
		if (!Session.Auth.hasPrivilege('TagGlobalCreate'))
			throw Errors.Forbidden()

		const customTags = await EndpointTagCustomGetAll.query()
		if (toast.handleError(customTags))
			throw Errors.NotFound()

		void Tags.getManifest()

		return {
			customTags: customTags.data,
			manifest: Tags,
		}
	},
	create: (params, { customTags: customTagsIn, manifest }) => {
		const view = View('manage-tags')

		view.breadcrumbs.title.text.use('view/manage-tags/title')
		view.breadcrumbs.description.text.use('view/manage-tags/description')

		const customTags = State(customTagsIn)

		Tabinator()
			.addTab(Tab()
				.text.use('view/manage-tags/custom-tags/title')
				.tweak(tab => ManageCustomTags(manifest, customTags)
					.appendTo(tab.content)))
			.addTab(Tab()
				.text.use('view/manage-tags/categories/title')
				.tweak(tab => ManageTagCategories(manifest)
					.appendTo(tab.content)))
			.addTab(Tab()
				.text.use('view/manage-tags/global-tags/title')
				.tweak(tab => ManageGlobalTags(manifest)
					.appendTo(tab.content)))
			.appendTo(view.content)

		return view
	},
})
