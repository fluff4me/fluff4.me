import Component from 'ui/Component'
import BlockDialog from 'ui/component/core/BlockDialog'
import Button from 'ui/component/core/Button'
import Checkbutton from 'ui/component/core/Checkbutton'
import Heading from 'ui/component/core/Heading'
import LabelledTable from 'ui/component/core/LabelledTable'
import Paragraph from 'ui/component/core/Paragraph'
import Placeholder from 'ui/component/core/Placeholder'
import RangeInput from 'ui/component/core/RangeInput'
import TextInput from 'ui/component/core/TextInput'
import Vector2 from 'utility/maths/Vector2'
import Settings from 'utility/Settings'

interface SettingsDialogExtensions {

}

interface SettingsDialog extends BlockDialog, SettingsDialogExtensions { }

const SettingsDialog = Component.Builder((component): SettingsDialog => {
	const dialog = component.and(BlockDialog)

	dialog.title.text.use('settings/title')
	dialog.description.text.use('settings/description')

	Paragraph().and(Placeholder)
		.style('settings-dialog-hint')
		.text.use('settings/hint/account')
		.appendTo(dialog.content)

	for (const group of Settings.get()) {
		const groupWrapper = Component()
			.style('settings-dialog-group')
			.appendTo(dialog.content)

		Heading()
			.style('settings-dialog-group-heading')
			.text.use(group.name)
			.appendTo(groupWrapper)

		const contentTable = LabelledTable()
			.style('settings-dialog-group-content')
			.appendTo(groupWrapper)

		for (const setting of group.settings) {
			function createSettingComponent () {
				switch (setting.type) {
					case 'boolean':
						return Checkbutton()
							.style('settings-dialog-setting-button')
							.setChecked(setting.state.value ?? setting.default)
							.text.use(setting.description)
							.event.subscribe('SetChecked', (checkbox, checked) => setting.state.value = checked)
							.tweak(checkbox => {
								setting.state.subscribe(checkbox, checked => checkbox.setChecked(checked ?? setting.default))
							})

					case 'number':
						if (setting.max)
							return RangeInput(setting.min ?? 0, setting.max, setting.step)
								.default.set(setting.default)
								.tweak(range => {
									range.state.value = setting.state.value ?? setting.default
									range.state.useManual(value => setting.state.value = value)
									setting.state.subscribe(range, value => range.state.value = value)
								})
						else
							return TextInput()
								.filter((...strings) => strings
									.map(string => string.replace(/[^0-9]/g, '')) as [string, string, string])

					case 'string':
						return TextInput()
				}
			}

			contentTable
				.label(label => label.text.use(setting.name))
				.content((content, label, row) => {
					row.style('settings-dialog-setting')
					content.style('settings-dialog-setting-content')
					createSettingComponent()
						.setLabel(label)
						.appendTo(content)

					Button()
						.setIcon('rotate-reverse')
						.event.subscribe('click', () => setting.state.value = undefined)
						.appendTo(content)
				})
		}
	}

	Button()
		.type('primary')
		.text.use('shared/action/done')
		.event.subscribe('click', () => dialog.close())
		.appendTo(dialog.footer.right)

	dialog.opened.useManual(opened => {
		if (opened)
			document.addEventListener('mousedown', onMouseDown)
		else
			document.removeEventListener('mousedown', onMouseDown)
	})

	return dialog.extend<SettingsDialogExtensions>(dialog => ({}))

	function onMouseDown (event: MouseEvent) {
		if (dialog.rect.value.intersects(Vector2.fromClient(event)))
			return

		dialog.close()
	}
})

export default SettingsDialog
