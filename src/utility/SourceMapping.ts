import Import from 'utility/Import'
import State from 'utility/State'

namespace SourceMapping {
	const originalPrepareStackTrace = Error.prepareStackTrace
	let sourceMapPrepareStackTrace!: typeof originalPrepareStackTrace

	export function init () {
		interface BrowserSourceMapSupport {
			install (options: { environment: string }): void
		}

		Import.getModule<BrowserSourceMapSupport>('browser-source-map-support')?.install({
			environment: 'browser',
		})

		sourceMapPrepareStackTrace = Error.prepareStackTrace
	}

	export const Enabled = State<boolean>(true)
	Enabled.useManual(enabled => Error.prepareStackTrace = enabled ? sourceMapPrepareStackTrace : originalPrepareStackTrace)
}

export default SourceMapping
