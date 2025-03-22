import Component from 'ui/Component'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import { mutable } from 'utility/Objects'
import State from 'utility/State'

interface TabExtensions {
	readonly content: Component
	readonly tabinator?: Tabinator<Tab>
	tweakContent<PARAMS extends any[]> (tweaker: (content: Component, tab: this, ...params: PARAMS) => unknown, ...params: PARAMS): this
	addTo (tabinator: Tabinator<Tab>): this
}

export interface Tab extends Component, TabExtensions {

}

export const Tab = Component.Builder((component): Tab => {
	const content = Component()
		.style('tabinator-panel')
		.ariaRole('tabpanel')
		.setRandomId()

	const tab: Tab = component.and(Button)
		.type('flush')
		.style('tabinator-tab')
		.ariaRole('tab')
		.setRandomId()
		.ariaControls(content)
		.extend<TabExtensions>(tab => ({
			content,
			tabinator: undefined,
			tweakContent (tweaker, ...params) {
				content.tweak(tweaker, tab, ...params)
				return tab
			},
			addTo (tabinator) {
				tabinator.addTab(tab)
				return tab
			},
		}))

	content
		.ariaLabelledBy(tab)
		.setOwner(tab)

	return tab
})
	.setName('Tab')

interface TabinatorExtensions<TAB extends Tab> {
	readonly tab: State<TAB | undefined>
	allowNoneVisible (): this
	showTab (tab: TAB): this
	addTab<NEW_TAB extends Tab> (tab: NEW_TAB): Tabinator<TAB | NEW_TAB>
	addTabWhen<NEW_TAB extends Tab> (state: State<boolean>, tab: NEW_TAB): Tabinator<TAB | NEW_TAB>
	removeTab (tab: Tab): this
}

interface Tabinator<TAB extends Tab> extends Block, TabinatorExtensions<TAB> { }

const Tabinator = Component.Builder((component): Tabinator<Tab> => {
	const activeTab = State<Tab | undefined>(undefined)

	let shouldForceSelect = true
	const tabs = State<Tab[]>([])

	const getFirstAvailableTab = () => tabs.value.find(tab => !tab.style.has('tabinator-tab--hidden'))

	const tabinator: Tabinator<Tab> = component
		.and(Block)
		.type('flush')
		.style('tabinator')
		.ariaRole('tablist')
		.extend<TabinatorExtensions<Tab>>(tabinator => ({
			tab: activeTab,
			allowNoneVisible () {
				shouldForceSelect = false
				return tabinator
			},
			showTab (newTab) {
				if (tabs.value.includes(newTab) && !newTab.style.has('tabinator-tab--hidden'))
					activeTab.value = newTab

				return tabinator
			},
			addTab (newTab) {
				if (tabs.value.includes(newTab))
					return tabinator

				const selected = activeTab.map(newTab, tab => tab === newTab)
				newTab
					.setOwner(tabinator)
					.attributes.bind(selected, 'aria-selected', 'true', 'false')
					.style.bind(selected, 'tabinator-tab--active')
					.event.subscribe('click', () => activeTab.value = newTab)
					.appendTo(tabinator.header)

				newTab.content
					.style('tabinator-panel--hidden')
					.appendTo(tabinator.content)

				mutable(newTab).tabinator = tabinator

				tabs.value.push(newTab)
				tabs.emit()
				if (tabinator.tab.value === undefined && shouldForceSelect)
					activeTab.value = newTab

				return tabinator
			},
			addTabWhen (state, tab) {
				tabinator.addTab(tab)
				tab.style.bind(state.falsy, 'tabinator-tab--hidden')
				state.falsy.subscribe(tab, hidden => {
					if (hidden && activeTab.value === tab)
						activeTab.value = shouldForceSelect ? getFirstAvailableTab() : undefined
				})
				return tabinator
			},
			removeTab (removeTab) {
				if (!tabs.value.includes(removeTab))
					return tabinator

				removeTab.setOwner(undefined)
				removeTab.remove()

				tabs.value.filterInPlace(tab => tab !== removeTab)
				tabs.emit()
				if (activeTab.value === removeTab)
					activeTab.value = shouldForceSelect ? getFirstAvailableTab() : undefined

				return tabinator
			},
		}))

	tabinator.header
		.style('tabinator-tab-list')
		.style.bind(activeTab.mapManual(tab => !tab), 'tabinator-tab-list--no-tab-shown')
	tabinator.content.style('tabinator-content')

	activeTab.useManual((tab, oldTab) => {
		const pageNumber = tabs.value.indexOf(tab!) + 1
		const previousPageNumber = (tabs.value.indexOf(oldTab!) + 1) || pageNumber
		const direction = Math.sign(pageNumber - previousPageNumber)

		oldTab?.content
			.style('tabinator-panel--hidden')
			.style.setVariable('page-direction', direction)

		tab?.content
			.style.remove('tabinator-panel--hidden')
			.style.setVariable('page-direction', direction)
	})

	return tabinator
})

export default Tabinator
