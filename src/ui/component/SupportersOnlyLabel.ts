import Component from 'ui/Component'
import Label from 'ui/component/core/Label'

export default Component.Builder('label', (label): Label => {
	return label.and(Label)
		.style('label--supporter')
		.prepend(Component()
			.style('label-supporter', 'label-supporter--in-label')
			.text.use('shared/term/supporters')
		)
})
