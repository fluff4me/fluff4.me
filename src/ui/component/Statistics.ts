import Component from 'ui/Component'
import Heading from 'ui/component/core/Heading'
import TextLabel from 'ui/component/core/TextLabel'
import type { Quilt } from 'ui/utility/StringApplicator'

interface StatisticsSectionExtensions {
	stat (translation: Quilt.SimpleKey | Quilt.Handler, value?: number | bigint | Quilt.Handler, tweak?: (label: TextLabel, value?: number | bigint | Quilt.Handler) => unknown): this
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
			stat (translation, value, tweak) {
				if (value !== undefined)
					TextLabel()
						.style('statistics-stat')
						.tweak(label => label.label.style('statistics-stat-label').text.use(translation))
						.tweak(label => label.content.style('statistics-stat-value').append(Component()
							.text.set(typeof value !== 'number' && typeof value !== 'bigint' ? value : value.toLocaleString(navigator.language))
						))
						.tweak(tweak, value)
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
