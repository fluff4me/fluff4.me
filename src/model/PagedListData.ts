import type { PagedDataDefinition } from 'model/PagedData'
import PagedData from 'model/PagedData'
import State from 'utility/State'
import type { PartialMutable, PromiseOr } from 'utility/Type'

interface PagedListData<T> extends PagedData<T[]> {
	readonly pageSize: number
	resized (pageSize: number): PagedListData<T>
}

function PagedListData<T> (pageSize: number, definition: PagedDataDefinition<T[]>): PagedListData<T> {
	const list = PagedData<T[]>(definition)
	return Object.assign(
		list,
		{
			pageSize,
			resized (resizePageSize: number) {
				const newList = PagedListData(resizePageSize, {
					get: getPage,
				})

				list.rawPages.subscribeManual(() => {
					// go through current pages and update each from the source list
					const pages = newList.rawPages.value
					for (let i = 0; i < pages.length; i++) {
						const page = pages[i]
						if (State.is(page)) {
							const pageState = page
							const value = getPage(i)
							if (value instanceof Promise)
								void value.then(setPageValue)
							else
								setPageValue(value)

							function setPageValue (value: false | State<T[] | null>) {
								if (State.is(value))
									pageState.bindManual(value)
								else
									pageState.value = value

								newList.rawPages.emit()
							}

							continue
						}

						const value = getPage(i)
						if (value instanceof Promise)
							pages[i] = value.then(setPage)
						else
							pages[i] = setPage(value)
						newList.rawPages.emit()

						function setPage (value: false | State<T[] | null>) {
							const state = pages[i] = State<T[] | null | false>(null, false)// .setId('PagedListData subscribeManual setPage')
							if (State.is(value))
								state.bindManual(value)
							else
								state.value = value
							newList.rawPages.emit()
							return state
						}
					}
				})

				const mutableNewList = newList as PartialMutable<PagedListData<T>>
				delete mutableNewList.resized

				return newList

				type SourcePage = State.Mutable<false | T[] | null>
				type SourcePages = SourcePage[]

				function getPage (page: number): PromiseOr<State<T[] | null> | false> {
					const start = page * resizePageSize
					const end = (page + 1) * resizePageSize
					const startPageInSource = Math.floor(start / pageSize)
					const endPageInSource = Math.ceil(end / pageSize)
					const startIndexInFirstSourcePage = start % pageSize
					const endIndexInLastSourcePage = (end % pageSize) || pageSize

					const rawPages: PromiseOr<SourcePage | undefined>[] = list.rawPages.value.slice()
					for (let i = startPageInSource; i < endPageInSource; i++) {
						const rawPage = rawPages[i]
						if (i >= startPageInSource && i < endPageInSource && (!rawPage || (State.is(rawPage) && rawPage.value === false))) {
							rawPages[i] = list.get(i) as PromiseOr<State.Mutable<T[] | false | null>>
						}
					}

					const sourcePages = rawPages.slice(startPageInSource, endPageInSource)
					if (sourcePages.some(page => page instanceof Promise))
						return Promise.all(sourcePages).then(sourcePages => resolveData(sourcePages, startIndexInFirstSourcePage, endIndexInLastSourcePage))

					return resolveData(sourcePages as SourcePages, startIndexInFirstSourcePage, endIndexInLastSourcePage)
				}

				function resolveData (sourcePages: (SourcePage | undefined)[], startIndex: number, endIndex: number): State<T[] | null> | false {
					const data: T[] = []
					for (let i = 0; i < sourcePages.length; i++) {
						const sourcePage = sourcePages[i]
						if (sourcePage?.value === false)
							return false

						if (!sourcePage?.value)
							continue

						if (i === 0 && i === sourcePages.length - 1)
							data.push(...sourcePage.value.slice(startIndex, endIndex))
						else if (i === 0)
							data.push(...sourcePage.value.slice(startIndex))
						else if (i === sourcePages.length - 1)
							data.push(...sourcePage.value.slice(0, endIndex))
						else
							data.push(...sourcePage.value)
					}

					return State.Generator(() => data, false).observeManual(...sourcePages)// .setId('PagedListData resolveData')
				}
			},
		}
	)
}

export default PagedListData
