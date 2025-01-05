import Component from 'ui/Component'

interface Paragraph extends Component {
}

const Paragraph = Component.Builder(component => component
	.style('paragraph')
)

export default Paragraph
