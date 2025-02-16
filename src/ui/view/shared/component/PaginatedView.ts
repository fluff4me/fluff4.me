import type { RoutePath } from 'navigation/RoutePath'
import Component from 'ui/Component'
import Paginator2 from 'ui/component/core/Paginator2'
import type { ViewId } from 'ui/view/shared/component/View'
import View from 'ui/view/shared/component/View'

interface PaginatedViewPaginatorExtensions {
	setURL (route: RoutePath): void
}

interface PaginatedViewPaginator extends Paginator2, PaginatedViewPaginatorExtensions { }

interface PaginatedViewExtensions {
	paginator (): PaginatedViewPaginator
	setURL (route: RoutePath): void
}

interface PaginatedView extends View, PaginatedViewExtensions { }

const PaginatedView = Component.Builder((_, id: ViewId): PaginatedView => {
	let paginator: PaginatedViewPaginator | undefined
	const urls: RoutePath[] = []
	return View(id)
		.extend<PaginatedViewExtensions>(view => ({
			setURL,
			paginator: () => {
				paginator ??= Paginator2().extend<PaginatedViewPaginatorExtensions>(paginator => ({ setURL }))
				paginator.page.subscribeManual(page => {
					const route = urls[page]
					if (route)
						navigate.setURL(route)
				})
				return paginator
			},
		}))

	function setURL (route: RoutePath) {
		navigate.setURL(route)
		const page = paginator?.page.value
		if (page !== undefined)
			urls[page] = route
	}
})

export default PaginatedView
