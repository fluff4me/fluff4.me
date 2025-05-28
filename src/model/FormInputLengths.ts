import type { ManifestFormInputLengths } from 'api.fluff4.me'
import EndpointFormInputLengths from 'endpoint/manifest/EndpointFormInputLengths'
import Manifest from 'model/Manifest'
import Time from 'utility/Time'

type PartialFormInputLengths = { [KEY in keyof ManifestFormInputLengths]?: { [KEY2 in keyof ManifestFormInputLengths[KEY]]?: ManifestFormInputLengths[KEY][KEY2] } }

export default Manifest<PartialFormInputLengths>({
	cacheId: 'form-input-lengths',
	valid: Time.minutes(5),
	get () {
		return EndpointFormInputLengths.query()
	},
	orElse () {
		const empy = {}
		return new Proxy({} as ManifestFormInputLengths, {
			get (target, p, receiver) {
				return empy
			},
		})
	},
})
