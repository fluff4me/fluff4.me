import type { RoutePath } from 'navigation/RoutePath'
import Component from 'ui/Component'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import type { ComponentName, ComponentNameType } from 'ui/utility/StyleManipulator'
import TypeManipulator from 'ui/utility/TypeManipulator'
import ViewTitle from 'ui/view/shared/ext/ViewTitle'
import { mutable } from 'utility/Objects'
import State from 'utility/State'

interface TabExtensions {
	readonly content: Component
	readonly tabinator?: Tabinator<Tab>
	readonly tabId?: string
	tweakContent<PARAMS extends any[]> (tweaker: (content: Component, tab: this, ...params: PARAMS) => unknown, ...params: PARAMS): this
	addTo (tabinator: Tabinator<Tab>): this
	addToWhen (state: State<boolean>, tabinator: Tabinator<Tab>): this
	createNextButton (): Button | undefined
	showNextTab (): void
}

export interface Tab extends Button, TabExtensions { }

export const Tab = Component.Builder((component, tabId?: string): Tab => {
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
			tabId,
			tweakContent (tweaker, ...params) {
				content.tweak(tweaker, tab, ...params)
				return tab
			},
			addTo (tabinator) {
				tabinator.addTab(tab)
				return tab
			},
			addToWhen (state, tabinator) {
				tabinator.addTabWhen(state, tab)
				return tab
			},
			createNextButton () {
				return Button()
					.text.use('shared/action/next')
					.event.subscribe('click', showNextTab)
			},
			showNextTab,
		}))

	content
		.ariaLabelledBy(tab)
		.setOwner(tab)

	return tab

	function showNextTab () {
		const index = tab.tabinator?.tabs.value.indexOf(tab) ?? -1
		if (index === -1)
			return

		const nextTab = tab.tabinator!.tabs.value[index + 1]
		if (!nextTab)
			return

		tab.tabinator!.showTab(nextTab)
	}
})
	.setName('Tab')

export type TabinatorType = ComponentNameType<'tabinator--type'>

interface TabinatorExtensions<TAB extends Tab> {
	readonly tab: State<TAB | undefined>
	readonly tabType: TypeManipulator<this, TabinatorType>
	readonly tabs: State<readonly TAB[]>
	allowNoneVisible (): this
	showTab (tab: TAB | string): this
	showNone (): this
	addTab<NEW_TAB extends Tab> (tab: NEW_TAB): Tabinator<TAB | NEW_TAB>
	addTabWhen<NEW_TAB extends Tab> (state: State<boolean>, tab: NEW_TAB): Tabinator<TAB | NEW_TAB>
	removeTab (tab: Tab): this
	bindURL (tabId: string | undefined, tabHandler: (tabId: string | undefined, tab: TAB | undefined) => RoutePath): this
	bindViewTitle (): this
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
			tabType: TypeManipulator.Style(tabinator, [
				[tabinator, type => `tabinator--type-${type}`],
				[tabinator.header, type => `tabinator--type-${type}-tab-list` as ComponentName],
				[tabs, type => `tabinator--type-${type}-tab` as ComponentName],
			]),
			tab: activeTab,
			tabs,
			allowNoneVisible () {
				shouldForceSelect = false
				return tabinator
			},
			showTab (newTab) {
				if (typeof newTab === 'string') {
					const tab = tabs.value.find(tab => tab.tabId === newTab)
					if (!tab)
						return tabinator

					newTab = tab
				}

				if (tabs.value.includes(newTab) && !newTab.style.has('tabinator-tab--hidden'))
					activeTab.value = newTab

				return tabinator
			},
			showNone () {
				if (shouldForceSelect)
					throw new Error('Cannot show none when `allowNoneVisible` is not set')

				activeTab.value = undefined
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

				mutable(removeTab).tabinator = undefined
				removeTab.setOwner(undefined)
				removeTab.remove()

				tabs.value.filterInPlace(tab => tab !== removeTab)
				tabs.emit()
				if (activeTab.value === removeTab)
					activeTab.value = shouldForceSelect ? getFirstAvailableTab() : undefined

				return tabinator
			},
			bindURL (tabId, tabHandler) {
				if (tabId) tabinator.showTab(tabId)
				tabinator.tab.useManual(tab => navigate.setURL(tabHandler(tab?.tabId, tab)))
				return tabinator
			},
			bindViewTitle () {
				Component().and(ViewTitle)
					.style('tabinator-view-title')
					.tweak(title => this.tab.use(title, tab => title.text.bind(tab?.text.state)))
					.appendTo(tabinator.header)
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
