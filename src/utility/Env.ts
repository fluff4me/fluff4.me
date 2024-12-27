export interface IEnvironment {
	ENVIRONMENT: "dev" | "beta" | "prod"
	API_ORIGIN: string
	URL_ORIGIN: string
	BUILD_NUMBER?: string
	BUILD_SHA?: string
}

interface Env extends Readonly<IEnvironment> { }
class Env {

	public get isDev () {
		return this.ENVIRONMENT === "dev"
	}

	public async load () {
		const origin = location.origin
		const root = location.pathname.startsWith("/beta/") ? "/beta/" : "/"
		Object.assign(this, await fetch(origin + root + "env.json").then(response => response.json()))
		document.documentElement.classList.add(`environment-${this.ENVIRONMENT}`)
	}
}

export default new Env
