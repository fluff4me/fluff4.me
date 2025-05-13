import type { RoutePath } from 'navigation/RoutePath'
import Component from 'ui/Component'
import BaseExternalLink from 'ui/component/core/ExternalLink'
import BaseHeading from 'ui/component/core/Heading'
import BaseLink from 'ui/component/core/Link'
import Paragraph from 'ui/component/core/Paragraph'
import Placeholder from 'ui/component/core/Placeholder'
import Small from 'ui/component/core/Small'
import { HomeLink } from 'ui/component/Masthead'
import Env from 'utility/Env'

export default Component.Builder(footer => {
	const Column = () => Component()
		.style('app-footer-column')

	const Section = () => Component()
		.style('app-footer-column-section')

	const Heading = () => BaseHeading()
		.setAestheticStyle(false)
		.style('app-footer-column-heading')

	const Link = (route: RoutePath) => BaseLink(route)
		.style('app-footer-column-link')

	const ExternalLink = (route: string) => BaseExternalLink(route)
		.style('app-footer-column-link')

	Column()
		.style('app-footer-column-site')
		.append(Section()
			.append(HomeLink()
				.style('app-footer-wordmark')
				.tweak(link => link.button.style('app-footer-wordmark-button'))
			)
			.append(Paragraph().and(Placeholder)
				.text.use('fluff4me/tagline')
			)
		)
		.append(Section()
			.append(Placeholder().and(Small)
				.text.use(quilt => quilt['footer/other/copyright']({ YEAR: new Date().getFullYear() }))
			)
		)
		.append(BaseExternalLink(undefined)
			.style('app-version')
			.attributes.bind('href', Env.state.mapManual(env => !env?.BUILD_SHA ? undefined : `https://github.com/fluff4me/fluff4.me/commit/${env.BUILD_SHA}`))
			.text.bind(Env.state.mapManual(env => !env ? ''
				: !env.BUILD_SHA
					? 'dev'
					: `v${env.BUILD_NUMBER} (${env.BUILD_SHA?.slice(0, 7)})`
			)))
		.appendTo(footer)

	Column()
		.append(Heading().text.use('footer/heading/site'))
		.append(Section()
			.append(Link('/about').text.use('footer/link/about'))
			.append(Link('/about/roadmap').text.use('footer/link/roadmap'))
			.append(Link('/about/supporters').text.use('footer/link/supporters'))
		)
		.appendTo(footer)

	Column()
		.append(Heading().text.use('footer/heading/support'))
		.append(Section()
			.append(Link('/contact').text.use('footer/link/contact'))
			.append(ExternalLink('https://discord.gg/KrXfDtn').text.use('footer/link/bug-reports'))
			.append(ExternalLink('https://discord.gg/KrXfDtn').text.use('footer/link/feature-requests'))
			.append(Link('/contact').text.use('footer/link/responsible-disclosure'))
		)
		.appendTo(footer)

	Column()
		.append(Heading().text.use('footer/heading/legal'))
		.append(Section()
			.append(Link('/legal/terms').text.use('footer/link/terms-of-service'))
			.append(Link('/legal/privacy').text.use('footer/link/privacy-policy'))
		)
		.appendTo(footer)

	return footer.style('app-footer')
})
