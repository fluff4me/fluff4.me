import State from 'utility/State'
import Strings from 'utility/string/Strings'

export interface IEnvironment {
	ENVIRONMENT: 'dev' | 'beta' | 'prod'
	API_ORIGIN: string
	URL_ORIGIN: string
	BUILD_NUMBER?: string
	BUILD_SHA?: string
	DEBUG_ENABLE_SUPPORTER_SYSTEM?: 'true'
}

interface Env extends Readonly<IEnvironment> { }
class Env {

	#loaded = false
	#onLoad: (() => void)[] = []

	public readonly state = State<this | undefined>(undefined)

	public get isDev () {
		return this.ENVIRONMENT === 'dev'
	}

	public get isNgrok () {
		return this.URL_ORIGIN.includes('ngrok')
	}

	public async load () {
		const origin = location.origin
		const root = location.pathname.startsWith('/beta/') ? '/beta/' : '/'
		Object.assign(this, _
			?? Strings.optionalParseJSON(document.getElementById('env-json')?.textContent)
			?? await fetch(origin + root + 'env.json').then(response => response.json())
		)
		document.documentElement.classList.add(`environment-${this.ENVIRONMENT}`)

		this.state.value = this
		this.#loaded = true
		for (const handler of this.#onLoad)
			handler()
		this.#onLoad.length = 0
	}

	public onLoad (handler: () => void): void
	public onLoad (environment: IEnvironment['ENVIRONMENT'], handler: () => void): void
	public onLoad (environment?: IEnvironment['ENVIRONMENT'] | (() => void), handler?: () => void): void {
		if (typeof environment === 'function') {
			handler = environment
			environment = undefined
		}
		else if (environment) {
			const originalHandler = handler
			handler = () => this.ENVIRONMENT === environment && originalHandler?.()
		}

		if (this.#loaded)
			handler?.()
		else if (handler)
			this.#onLoad.push(handler)
	}

}

export default new Env()
