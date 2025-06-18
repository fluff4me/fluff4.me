import Component from 'ui/Component'
import Heading from 'ui/component/core/Heading'
import TextLabel from 'ui/component/core/TextLabel'
import type { Quilt } from 'ui/utility/StringApplicator'

interface StatisticsSectionExtensions {
	stat (translation: Quilt.SimpleKey | Quilt.Handler, value?: number | Quilt.Handler): this
}

interface StatisticsSection extends Component, StatisticsSectionExtensions { }

const StatisticsSection = Component.Builder((component, title: Quilt.SimpleKey | Quilt.Handler): StatisticsSection => {
	return component.style('statistics-section')
		.append(Heading()
			.setAestheticStyle(false)
			.style('statistics-section-heading')
			.text.use(title)
		)
		.extend<StatisticsSectionExtensions>(section => ({
			stat (translation, value) {
				if (value !== undefined)
					TextLabel()
						.tweak(label => label.label.text.use(translation))
						.tweak(label => label.content.text.set(typeof value !== 'number' ? value
							: value.toLocaleString(navigator.language)
						))
						.appendTo(section)
				return this
			},
		}))
})

export { StatisticsSection }

interface StatisticsExtensions {
	section (translation: Quilt.SimpleKey | Quilt.Handler, initialiser: (section: StatisticsSection) => unknown): this
}

interface Statistics extends Component, StatisticsExtensions { }

const Statistics = Component.Builder((component): Statistics => {
	component.style('statistics')

	return component.extend<StatisticsExtensions>(statistics => ({
		section (translation, initialiser) {
			const section = StatisticsSection(translation)
			initialiser(section)
			return statistics.append(section)
		},
	}))
})

export default Statistics
