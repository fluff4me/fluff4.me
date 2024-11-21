namespace Errors {
	export const Impossible = () => new Error("Something impossible appears to have happened, what are you?")
	export const NotFound = () => Object.assign(new Error("Not found"), { code: 404 })
	export const BadData = (message?: string) => Object.assign(new Error("Bad data was sent by the server", { cause: message }), { code: 500 })
}

export default Errors
