import type { WorkStatus } from 'api.fluff4.me'
import { WORK_STATUS_ICONS, WORK_STATUSES } from 'model/Works'
import Component from 'ui/Component'
import { RadioDropdown } from 'ui/component/core/Dropdown'
import type { StateOr } from 'utility/State'
import State from 'utility/State'

export default Component.Builder((component, defaultStatus: StateOr<WorkStatus>): RadioDropdown<WorkStatus> => {
	defaultStatus = State.get(defaultStatus)
	const dropdown = component.and(RadioDropdown as Component.Builder<[], RadioDropdown<WorkStatus>>)
		.style('work-status-dropdown')

	dropdown.button.style('work-status-dropdown-button')

	for (const status of WORK_STATUSES) {
		const lowercaseStatus = status.toLowerCase() as Lowercase<WorkStatus>
		dropdown.add(status, {
			translation: id => quilt => quilt[`work/status/${lowercaseStatus}`](),
			tweakButton: (button, id) => (button
				.setIcon(WORK_STATUS_ICONS[status])
				.tweak(button => button.icon?.style('work-status-icon'))
				.style('work-status-dropdown-option')
				.style(`work-status-dropdown-option--${lowercaseStatus}`)
			),
		})
	}

	dropdown.selection.value = defaultStatus.value

	dropdown.selection.use(dropdown, status => {
		status ??= defaultStatus.value
		const statusLowercase = status.toLowerCase() as Lowercase<WorkStatus>
		dropdown.button
			.setIcon(WORK_STATUS_ICONS[status])
			.tweak(button => button.icon?.style('work-status-icon'))
			.style.remove(...WORK_STATUSES.map(status => `work-status-dropdown-button--${status.toLowerCase() as Lowercase<WorkStatus>}` as const))
			.style(`work-status-dropdown-button--${statusLowercase}` as const)
	})

	return dropdown
})
