import type { TagCreateGlobalBody } from 'api.fluff4.me'
import FormInputLengths from 'model/FormInputLengths'
import type { TagsManifest } from 'model/Tags'
import Component from 'ui/Component'
import { RadioDropdown } from 'ui/component/core/Dropdown'
import Form from 'ui/component/core/Form'
import LabelledTable from 'ui/component/core/LabelledTable'
import TextEditor from 'ui/component/core/TextEditor'
import TextInput from 'ui/component/core/TextInput'
import TagsEditor from 'ui/component/TagsEditor'
import { Quilt } from 'ui/utility/StringApplicator'

interface TagEditFormExtensions {
	readonly categoryDropdown: RadioDropdown<string>
	readonly nameInput: TextInput
	readonly descriptionEditor: TextEditor
	readonly aliasesEditor: TagsEditor
	readonly relationshipsToEditor: TagsEditor
	readonly relationshipsFromEditor: TagsEditor
	getFormData (): TagCreateGlobalBody | undefined
}

interface TagEditForm extends Form, TagEditFormExtensions { }

export default Component.Builder((component, manifest: TagsManifest): TagEditForm => {
	let categoryDropdown!: RadioDropdown<string>
	let nameInput!: TextInput
	let descriptionEditor!: TextEditor
	let aliasesEditor!: TagsEditor
	let relationshipsToEditor!: TagsEditor
	let relationshipsFromEditor!: TagsEditor

	const form = component.and(Form, null)

	form.content.and(LabelledTable)

		.label(label => label.text.use('view/manage-tags/global-tag-form/category/label'))
		.content((content, label) => content.append(categoryDropdown = RadioDropdown()
			.setLabel(label)
			.setRequired()
			.tweak(dropdown => {
				for (const category of Object.values(manifest.categories))
					dropdown.add(category.nameLowercase, {
						translation: Quilt.fake(category.name),
					})
			})
		))

		.label(label => label.text.use('view/manage-tags/global-tag-form/name/label'))
		.content((content, label) => content.append(nameInput = TextInput()
			.setLabel(label)
			.setRequired()
			.setMaxLength(FormInputLengths.map(content, lengths => lengths?.global_tag.name))
		))

		.label(label => label.text.use('view/manage-tags/global-tag-form/description/label'))
		.content((content, label) => content.append(descriptionEditor = TextEditor()
			.setLabel(label)
			.setRequired()
			.setMaxLength(FormInputLengths.map(content, lengths => lengths?.global_tag.description))
		))

		.label(label => label.text.use('view/manage-tags/global-tag-form/aliases/label'))
		.content((content, label) => content.append(aliasesEditor = TagsEditor()
			.setLabel(label)
			.setCustomTagsOnly()
		))

		.label(label => label.text.use('view/manage-tags/global-tag-form/relationships-to/label'))
		.content((content, label) => content.append(relationshipsToEditor = TagsEditor()
			.setLabel(label)
			.setGlobalTagsOnly()
		))

		.label(label => label.text.use('view/manage-tags/global-tag-form/relationships-from/label'))
		.content((content, label) => content.append(relationshipsFromEditor = TagsEditor()
			.setLabel(label)
			.setGlobalTagsOnly()
		))

	form.footer.style('tag-edit-form-footer')

	return form
		.extend<TagEditFormExtensions>(extensions => ({
			categoryDropdown,
			nameInput,
			descriptionEditor,
			aliasesEditor,
			relationshipsToEditor,
			relationshipsFromEditor,
			getFormData () {
				const category = categoryDropdown.selection.value
				if (!category)
					return undefined

				return {
					name: nameInput.state.value,
					description: descriptionEditor.useMarkdown(),
					category,
					aliases: aliasesEditor.state.value.custom_tags,
					relationships_to: relationshipsToEditor.state.value.global_tags,
					relationships_from: relationshipsFromEditor.state.value.global_tags,
				}
			},
		}))
})
