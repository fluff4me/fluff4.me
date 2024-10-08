import type App from "App"

type RouteHandler<PARAMS extends object> = (app: App, params: PARAMS) => any

interface RouteDefinition<PARAMS extends object> {
	handler: RouteHandler<PARAMS>
}

interface Route<PATH extends string, PARAMS extends object> extends RouteDefinition<PARAMS> {
	path: PATH
	match: (path: string) => PARAMS | undefined
}

export type ExtractData<PATH extends string[]> = PATH extends infer PATH2 ? { [INDEX in keyof PATH2 as PATH2[INDEX] extends `$$${infer VAR_NAME}` ? VAR_NAME : PATH2[INDEX] extends `$${infer VAR_NAME}` ? VAR_NAME : never]: string } : never
export type SplitPath<PATH extends string> = PATH extends `${infer X}/${infer Y}` ? [X, ...SplitPath<Y>] : [PATH]

type JoinPath<PATH extends string[]> = PATH extends [infer X extends string, ...infer Y extends string[]] ? Y["length"] extends 0 ? X : `${X}/${JoinPath<Y>}` : never

export type RoutePathInput<PATH extends string> = SplitPath<PATH> extends infer SPLIT ?

	{ [KEY in keyof SPLIT]: SPLIT[KEY] extends `$${string}` | `$$${string}` ? string : SPLIT[KEY] } extends infer SPLIT extends string[] ?

	JoinPath<SPLIT>

	: never
	: never

function Route<PATH extends `/${string}`, PARAMS extends ExtractData<SplitPath<PATH>>> (path: PATH, route: RouteHandler<PARAMS> | RouteDefinition<PARAMS>): Route<PATH, PARAMS> {
	const segments = (path.startsWith("/") ? path.slice(1) : path).split("/")
	const varGroups: string[] = []
	let regexString = "^"
	for (const segment of segments) {
		regexString += "/+"
		if (segment[0] !== "$") {
			regexString += segment
			continue
		}

		if (segment[1] === "$") {
			varGroups.push(segment.slice(2))
			regexString += "(.*)"
			continue
		}

		varGroups.push(segment.slice(1))
		regexString += "([^/]+)"
	}

	regexString += "$"

	const regex = new RegExp(regexString)
	const rawRoutePath = path

	return {
		path,
		...typeof route === "function" ? { handler: route } : route,
		match: path => {
			const match = path.match(regex)
			if (!match)
				return undefined

			const params: Record<string, string> = {}
			for (let i = 0; i < varGroups.length; i++) {
				const groupName = varGroups[i]
				const group = match[i + 1]
				if (group === undefined) {
					console.warn(`${rawRoutePath} matched, but $${groupName} was unset`)
					return undefined
				}

				params[groupName] = group
			}

			return params as PARAMS
		},
	}
}

export default Route
