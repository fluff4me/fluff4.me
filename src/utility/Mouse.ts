namespace Mouse {

	type UnorderedArgs = [number, Event] | [Event, number]
	function extractArgs (args: UnorderedArgs): [Event, number] {
		if (typeof args[0] === "number")
			return args.reverse() as [Event, number]
		else
			return args as [Event, number]
	}

	export const asLeft = as.bind(null, 0)
	export const asMiddle = as.bind(null, 1)
	export const asRight = as.bind(null, 2)

	export function as (event: Event, button: number): MouseEvent | undefined
	export function as (button: number, event: Event): MouseEvent | undefined
	export function as (...args: [number, Event] | [Event, number]): MouseEvent | undefined {
		const [event, button] = extractArgs(args)
		if (event.type !== "click" && event.type !== "mousedown" && event.type !== "mouseup")
			return undefined

		const mouseEvent = event as MouseEvent
		return mouseEvent.button === button ? mouseEvent : undefined
	}

	export const isLeft = is.bind(null, 0)
	export const isMiddle = is.bind(null, 1)
	export const isRight = is.bind(null, 2)

	export function is (event: Event, button: number): event is MouseEvent
	export function is (button: number, event: Event): event is MouseEvent
	export function is (...args: [number, Event] | [Event, number]): boolean {
		const [event, button] = extractArgs(args)
		if (event.type !== "click" && event.type !== "mousedown" && event.type !== "mouseup")
			return false

		const mouseEvent = event as MouseEvent
		return mouseEvent.button === button
	}

	export const handleLeft = handle.bind(null, 0)
	export const handleMiddle = handle.bind(null, 1)
	export const handleRight = handle.bind(null, 2)

	export function handle (event: Event, button: number): event is MouseEvent
	export function handle (button: number, event: Event): event is MouseEvent
	export function handle (...args: [number, Event] | [Event, number]): boolean {
		const [event, button] = extractArgs(args)
		if (!is(event, button))
			return false

		event.preventDefault()
		return true
	}
}

export default Mouse
