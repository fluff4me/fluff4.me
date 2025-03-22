import type { TagCreateCategoryBody } from 'api.fluff4.me'
import FormInputLengths from 'model/FormInputLengths'
import type { TagsManifest } from 'model/Tags'
import Component from 'ui/Component'
import Form from 'ui/component/core/Form'
import LabelledTable from 'ui/component/core/LabelledTable'
import Textarea from 'ui/component/core/Textarea'
import TextInput from 'ui/component/core/TextInput'
import type State from 'utility/State'

interface CategoryEditFormExtensions {
	readonly nameInput: TextInput
	readonly descriptionEditor: Textarea
	getFormData (): TagCreateCategoryBody | undefined
}

interface CategoryEditForm extends Form, CategoryEditFormExtensions { }

export default Component.Builder((component, manifest: State<TagsManifest | undefined>, categoryName?: string): CategoryEditForm => {
	const category = manifest.map(component, manifest => manifest?.categories[categoryName!])

	let nameInput!: TextInput
	let descriptionEditor!: Textarea

	const form = component.and(Form, null)

	form.content.and(LabelledTable)

		.label(label => label.text.use('view/manage-tags/global-tag-form/name/label'))
		.content((content, label) => content.append(nameInput = TextInput()
			.setLabel(label)
			.setRequired()
			.setMaxLength(FormInputLengths.map(content, lengths => lengths?.global_tag.name))
			.default.bind(category.mapManual(tag => tag?.name))
		))

		.label(label => label.text.use('view/manage-tags/global-tag-form/description/label'))
		.content((content, label) => content.append(descriptionEditor = Textarea()
			.setLabel(label)
			.setRequired()
			.setMaxLength(FormInputLengths.map(content, lengths => lengths?.global_tag.description))
			.default.bind(category.mapManual(tag => tag?.description))
		))

	form.footer.style('tag-edit-form-footer')

	return form
		.extend<CategoryEditFormExtensions>(extensions => ({
			nameInput,
			descriptionEditor,
			getFormData () {
				return {
					name: nameInput.state.value,
					description: descriptionEditor.state.value,
				}
			},
		}))
})
