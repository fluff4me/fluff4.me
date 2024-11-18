namespace Errors {
	export const Impossible = () => new Error("Something impossible appears to have happened, what are you?")
	export const NotFound = () => Object.assign(new Error("Not found"), { code: 404 })
}

export default Errors
