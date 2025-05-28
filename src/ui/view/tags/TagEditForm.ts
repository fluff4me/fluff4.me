import type { TagCreateGlobalBody } from 'api.fluff4.me'
import FormInputLengths from 'model/FormInputLengths'
import type { TagId, TagsManifest } from 'model/Tags'
import Component from 'ui/Component'
import Checkbutton from 'ui/component/core/Checkbutton'
import { RadioDropdown } from 'ui/component/core/Dropdown'
import Form from 'ui/component/core/Form'
import LabelledTable from 'ui/component/core/LabelledTable'
import TextEditor from 'ui/component/core/TextEditor'
import TextInput from 'ui/component/core/TextInput'
import TagsEditor from 'ui/component/TagsEditor'
import { Quilt } from 'ui/utility/StringApplicator'
import State from 'utility/State'

interface TagEditFormExtensions {
	readonly categoryDropdown: RadioDropdown<string>
	readonly nameInput: TextInput
	readonly descriptionEditor: TextEditor
	readonly aliasesEditor: TagsEditor
	readonly relationshipsToEditor: TagsEditor
	readonly relationshipsFromEditor: TagsEditor
	readonly isMature: Checkbutton
	getFormData (): TagCreateGlobalBody | undefined
}

interface TagEditForm extends Form, TagEditFormExtensions { }

export default Component.Builder((component, manifest: State<TagsManifest | undefined>, tagId?: TagId): TagEditForm => {
	const tag = manifest.map(component, manifest => manifest?.tags[tagId!])

	let categoryDropdown!: RadioDropdown<string>
	let nameInput!: TextInput
	let descriptionEditor!: TextEditor
	let aliasesEditor!: TagsEditor
	let relationshipsToEditor!: TagsEditor
	let relationshipsFromEditor!: TagsEditor
	let isMature!: Checkbutton

	const form = component.and(Form, null)

	form.content.and(LabelledTable)

		.label(label => label.text.use('view/manage-tags/global-tag-form/category/label'))
		.content((content, label) => content.append(categoryDropdown = RadioDropdown()
			.setLabel(label)
			.setRequired()
			.tweak(dropdown => {
				manifest.use(dropdown, manifest => {
					const selectionValue = dropdown.selection.value

					dropdown.clear()
					if (!manifest)
						return

					for (const category of Object.values(manifest.categories))
						dropdown.add(category.nameLowercase, {
							translation: id => Quilt.fake(category.name),
						})

					if (selectionValue && selectionValue in dropdown.options)
						dropdown.selection.value = selectionValue
					else
						dropdown.selection.value = tag.value?.categoryLowercase
				})
			})
		))

		.label(label => label.text.use('view/manage-tags/global-tag-form/name/label'))
		.content((content, label) => content.append(nameInput = TextInput()
			.setLabel(label)
			.setRequired()
			.setMaxLength(FormInputLengths.map(content, lengths => lengths?.global_tag?.name))
			.default.bind(tag.mapManual(tag => tag?.name))
		))

		.label(label => label.text.use('view/manage-tags/global-tag-form/description/label'))
		.content((content, label) => content.append(descriptionEditor = TextEditor()
			.setLabel(label)
			.setRequired()
			.disablePersistence()
			.setMaxLength(FormInputLengths.map(content, lengths => lengths?.global_tag?.description))
			.default.bind(tag.mapManual(tag => tag?.description.body))
		))

		.label(label => label.text.use('view/manage-tags/global-tag-form/aliases/label'))
		.content((content, label) => content.append(aliasesEditor = TagsEditor()
			.setLabel(label)
			.setCustomTagsOnly()
			.default.bind(tag.mapManual(tag => ({ custom_tags: tag?.aliases || [] })))
		))

		.label(label => label.text.use('view/manage-tags/global-tag-form/relationships-to/label'))
		.content((content, label) => content.append(relationshipsToEditor = TagsEditor()
			.setLabel(label)
			.setGlobalTagsOnly()
			.default.bind(State.Use(label, { tag, manifest }).map(label, ({ tag, manifest }) => {
				if (!tag || !manifest)
					return undefined

				const tagId = `${tag.category}: ${tag.name}`
				return {
					global_tags: manifest.relationships[tagId] as TagId[] || [],
				}
			}))
		))

		.label(label => label.text.use('view/manage-tags/global-tag-form/relationships-from/label'))
		.content((content, label) => content.append(relationshipsFromEditor = TagsEditor()
			.setLabel(label)
			.setGlobalTagsOnly()
			.default.bind(State.Use(label, { tag, manifest }).map(label, ({ tag, manifest }) => {
				if (!tag || !manifest)
					return undefined

				const tagId = `${tag.category}: ${tag.name}`
				return {
					global_tags: Object.entries(manifest.relationships)
						.filter(([fromId, toIds]) => toIds.includes(tagId))
						.map(([fromId]) => fromId as TagId),
				}
			}))
		))

		.label(label => label.text.use('view/manage-tags/global-tag-form/mature/label'))
		.content((content, label) => content.append(isMature = Checkbutton()
			.setLabel(label)
			.setChecked(tag.value?.is_mature ?? false)
			.text.use('view/manage-tags/global-tag-form/mature/hint')
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
			isMature,
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
					is_mature: isMature.checked.value,
				}
			},
		}))
})
