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
	showTab (tab: TAB): this
	addTab<NEW_TAB extends Tab> (tab: NEW_TAB): Tabinator<TAB | NEW_TAB>
	removeTab (tab: Tab): this
}

interface Tabinator<TAB extends Tab> extends Block, TabinatorExtensions<TAB> { }

const Tabinator = Component.Builder((component): Tabinator<Tab> => {
	const activeTab = State<Tab | undefined>(undefined)

	const tabs = State<Tab[]>([])
	const tabinator: Tabinator<Tab> = component
		.and(Block)
		.type('flush')
		.style('tabinator')
		.ariaRole('tablist')
		.extend<TabinatorExtensions<Tab>>(tabinator => ({
			tab: activeTab,
			showTab (newTab) {
				if (tabs.value.includes(newTab))
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
				if (tabinator.tab.value === undefined)
					activeTab.value = newTab

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
					activeTab.value = undefined

				return tabinator
			},
		}))

	tabinator.header.style('tabinator-tab-list')
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
