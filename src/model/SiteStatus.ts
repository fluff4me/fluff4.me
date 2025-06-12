import type { SiteStatus } from 'api.fluff4.me'
import EndpointSiteStatus from 'endpoint/site/EndpointSiteStatus'
import Manifest from 'model/Manifest'
import Time from 'utility/Time'

export default Manifest<SiteStatus>({
	valid: Time.minutes(30),
	refresh: true,
	cacheId: 'status',
	get () {
		return EndpointSiteStatus.query()
	},
	orElse () {
		return {
			fundraisers: [],
		}
	},
})
