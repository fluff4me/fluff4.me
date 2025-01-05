import fs from 'fs-extra'
import type { IEnvironment } from '../src/utility/Env'
import Task from './utility/Task'

function env<KEY extends keyof IEnvironment> (key: KEY, orElse?: IEnvironment[KEY]) {
	const result = process.env[key] ?? orElse
	if (!result)
		throw new Error(`Missing environment variable ${key as string}`)

	return result as IEnvironment[KEY]
}

function optional<KEY extends keyof IEnvironment> (key: KEY) {
	return process.env[key] as IEnvironment[KEY]
}

let environment: IEnvironment | undefined
export default Task('env', _ => {
	environment ??= {
		API_ORIGIN: env('API_ORIGIN'),
		URL_ORIGIN: env('URL_ORIGIN'),
		ENVIRONMENT: env('ENVIRONMENT', 'prod'),
		BUILD_NUMBER: optional('BUILD_NUMBER'),
		BUILD_SHA: optional('BUILD_SHA'),
	}

	return fs.writeFile('docs/env.json', JSON.stringify(environment))
})
