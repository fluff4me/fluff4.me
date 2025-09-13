import type { RoutePathWithSearch } from 'navigation/RoutePath'
import Component from 'ui/Component'
import Paginator from 'ui/component/core/Paginator'
import type { ViewId } from 'ui/view/shared/component/View'
import View from 'ui/view/shared/component/View'

interface PaginatedViewPaginatorExtensions {
	setURL (route?: RoutePathWithSearch): void
}

export interface PaginatedViewPaginator extends Paginator, PaginatedViewPaginatorExtensions { }

interface PaginatedViewExtensions {
	paginator (): PaginatedViewPaginator
	setURL (route?: RoutePathWithSearch): void
}

interface PaginatedView extends View, PaginatedViewExtensions { }

const PaginatedView = Component.Builder((_, id: ViewId): PaginatedView => {
	let paginator: PaginatedViewPaginator | undefined
	const urls: (RoutePathWithSearch | undefined)[] = []
	return View(id)
		.extend<PaginatedViewExtensions>(view => ({
			setURL,
			paginator: () => {
				paginator ??= Paginator().extend<PaginatedViewPaginatorExtensions>(paginator => ({ setURL }))
				paginator.onReset(null, () => {
					urls.length = 0
				})
				paginator.page.subscribeManual(page => {
					const route = urls[page]
					if (route)
						navigate.setURL(route)
				})
				return paginator
			},
		}))

	function setURL (route?: RoutePathWithSearch) {
		if (route !== undefined)
			navigate.setURL(route)

		const page = paginator?.page.value
		if (page === undefined)
			return

		urls[page] = route
	}
})

export default PaginatedView
