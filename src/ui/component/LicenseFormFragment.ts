import type { WorkLicense } from 'api.fluff4.me'
import FormInputLengths from 'model/FormInputLengths'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import { RadioDropdown } from 'ui/component/core/Dropdown'
import type LabelledTable from 'ui/component/core/LabelledTable'
import LabelledTextInputBlock from 'ui/component/core/LabelledTextInputBlock'
import type TextInput from 'ui/component/core/TextInput'
import type { License } from 'ui/utility/License'
import { LICENSES } from 'ui/utility/License'

interface LicenseFormFragment {
	readonly dropdown: RadioDropdown<License | 'inherit'>
	readonly customLinkInput: TextInput
	readonly customNameInput: TextInput
	getFormData (): WorkLicense | false
}

export default function (table: LabelledTable, inherits?: true): LicenseFormFragment {
	const dropdown = RadioDropdown<License | 'inherit'>()
		.tweak(dropdown => {
			if (inherits)
				dropdown.add('inherit', {
					translation: id => quilt => quilt['shared/form/license/inherit'](),
				})

			for (const license of LICENSES)
				dropdown.add(license, {
					translation: id => quilt => quilt[`license/${license}`](),
					tweakButton (button, id) {
						button.style('license-input-dropdown-option')
						if (id === 'all-rights-reserved' || id === 'custom')
							return

						button.style('license-input-dropdown-option--has-link').append(Component('a')
							.attributes.use('href', quilt => quilt[`license/${id}/link`]())
							.attributes.set('target', '_blank')
							.and(Button)
							.style('license-input-dropdown-option-link-button')
							.type('icon')
							.setIcon('circle-question')
							.ariaLabel.use('shared/form/license/link-view-text')
							.event.subscribe('click', event => {
								event.stopPropagation()
							})
						)
					},
				})

			dropdown.button
				.style('license-input-dropdown-button')
				.event.subscribe('click', event => {
					dropdown.button.element.scrollIntoView({ behavior: 'smooth' })
				})
		})

	table.label(label => label.text.use('shared/form/license/label'))
		.content((content, label) => content.append(dropdown.setLabel(label)))

	let customLinkInput!: TextInput
	let customNameInput!: TextInput
	LabelledTextInputBlock()
		.style('labelled-row--in-labelled-table')
		.ariaLabel.use('shared/form/license/aria-label')
		.label(label => label.text.use('shared/form/license/link'))
		.input(input => customLinkInput = input
			// .hint.use('view/account/external-link/hint')
			.setMaxLength(FormInputLengths.map(table, lengths => lengths?.license?.link)))
		.label(label => label.text.use('shared/form/license/name'))
		.input(input => customNameInput = input
			// .hint.use('view/work-edit/shared/form/license/name')
			.setMaxLength(FormInputLengths.map(table, lengths => lengths?.license?.name)))
		.appendToWhen(dropdown.selection.equals('custom'), table)

	return {
		dropdown,
		customLinkInput,
		customNameInput,
		getFormData () {
			if (!dropdown.selection.value || dropdown.selection.value === 'inherit')
				return false

			if (dropdown.selection.value === 'custom')
				return {
					name: customNameInput.value,
					link: customLinkInput.value,
				}

			return {
				name: dropdown.selection.value,
				link: '',
			}
		},
	}
}
