import FormInputLengths from 'model/FormInputLengths'
import type { TagsManifest } from 'model/Tags'
import Component from 'ui/Component'
import { RadioDropdown } from 'ui/component/core/Dropdown'
import LabelledTable from 'ui/component/core/LabelledTable'
import TextEditor from 'ui/component/core/TextEditor'
import TextInput from 'ui/component/core/TextInput'
import { Quilt } from 'ui/utility/StringApplicator'

export default Component.Builder((component, manifest: TagsManifest) => {
	return component.and(LabelledTable)

		.label(label => label.text.use('view/manage-tags/global-tag-form/category/label'))
		.content(content => content.append(RadioDropdown()
			.tweak(dropdown => {
				for (const category of Object.values(manifest.categories))
					dropdown.add(category.nameLowercase, {
						translation: Quilt.fake(category.name),
					})
			})
		))

		.label(label => label.text.use('view/manage-tags/global-tag-form/name/label'))
		.content(content => content.append(TextInput()
			.setMaxLength(FormInputLengths.map(content, lengths => lengths?.global_tag.name))
		))

		.label(label => label.text.use('view/manage-tags/global-tag-form/description/label'))
		.content(content => content.append(TextEditor()
			.setMaxLength(FormInputLengths.map(content, lengths => lengths?.global_tag.description))
		))
})
