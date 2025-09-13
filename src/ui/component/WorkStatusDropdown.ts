import type { WorkStatus } from 'api.fluff4.me'
import { WORK_STATUS_ICONS, WORK_STATUSES } from 'model/Works'
import Component from 'ui/Component'
import { CheckDropdown, RadioDropdown } from 'ui/component/core/Dropdown'
import type { StateOr } from 'utility/State'
import State from 'utility/State'

namespace WorkStatusDropdown {
	export const Radio = Component.Builder((component, defaultStatus: StateOr<WorkStatus>): RadioDropdown<WorkStatus> => {
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

	export const Check = Component.Builder((component, defaultStatuses: StateOr<WorkStatus[]>): CheckDropdown<WorkStatus> => {
		defaultStatuses = State.get(defaultStatuses)
		const dropdown = component.and(CheckDropdown as Component.Builder<[], CheckDropdown<WorkStatus>>)
			.style('work-status-dropdown')

		dropdown.button.style('work-status-dropdown-button')

		for (const status of WORK_STATUSES) {
			const lowercaseStatus = status.toLowerCase() as Lowercase<WorkStatus>
			dropdown.add(status, {
				translation: id => quilt => quilt[`work/status/${lowercaseStatus}`](),
				tweakButton: (button, id) => (button
					.setIcon(WORK_STATUS_ICONS[status])
					.tweak(button => button.icon?.style('work-status-icon', 'work-status-dropdown-button-icon'))
					.tweak(button => button.textWrapper.style.bind(button.checked.falsy, 'work-status-dropdown-button-label--unchecked'))
					.style.bind(button.checked.falsy, 'work-status-dropdown-button--unchecked')
					.style('work-status-dropdown-option')
					.style(`work-status-dropdown-option--${lowercaseStatus}`)
				),
			})
		}

		dropdown.selection.value = defaultStatuses.value

		dropdown.selection.use(dropdown, statuses => {
			statuses ??= defaultStatuses.value
			dropdown.button
				.setIcon(statuses.length === 0 ? 'circle' : statuses.length > 1 ? 'circle-dot' : WORK_STATUS_ICONS[statuses[0]])
				.tweak(button => button.icon?.style('work-status-icon'))
				.style.remove(...WORK_STATUSES.flatMap(status1 => [
					`work-status-dropdown-button--${status1.toLowerCase()}`,
					...WORK_STATUSES.flatMap(status2 => [
						`work-status-dropdown-button--${status1.toLowerCase()}-${status2.toLowerCase()}`,
						...WORK_STATUSES.flatMap(status3 => [
							`work-status-dropdown-button--${status1.toLowerCase()}-${status2.toLowerCase()}-${status3.toLowerCase()}`,
							...WORK_STATUSES.map(status4 => `work-status-dropdown-button--${status1.toLowerCase()}-${status2.toLowerCase()}-${status3.toLowerCase()}-${status4.toLowerCase()}`),
						]),
					]),
				]) as never[])

			const statusLowercase = statuses.join('-').toLowerCase() as Lowercase<WorkStatus>
			dropdown.button.style(`work-status-dropdown-button--${statusLowercase}` as const)
		})

		return dropdown
	})
}

export default WorkStatusDropdown
