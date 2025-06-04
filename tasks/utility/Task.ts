import { spawn } from 'child_process'
import path from 'path'
import type { ITaskApi } from './TaskRunner'

const SYMBOL_IS_TASK_FUNCTION = Symbol('IS_TASK_FUNCTION')

export type TaskFunctionDef<T, ARGS extends any[] = []> = (api: ITaskApi, ...args: ARGS) => T
export interface TaskFunction<T, ARGS extends any[] = []> extends TaskFunctionDef<T, ARGS> {
	[SYMBOL_IS_TASK_FUNCTION]: true
}

function Task<T, ARGS extends any[] = []> (name: string | null, task: TaskFunctionDef<T, ARGS>) {
	Object.defineProperty(task, 'name', { value: name })
	Object.defineProperty(task, SYMBOL_IS_TASK_FUNCTION, { value: true })
	return task as TaskFunction<T, ARGS>
}

namespace Task {

	export function is (value: unknown): value is TaskFunction<unknown> {
		return typeof value === 'function' && (value as TaskFunction<unknown>)[SYMBOL_IS_TASK_FUNCTION]
	}

	export interface ITaskCLIOptions {
		cwd?: string
		env?: NodeJS.ProcessEnv
		stdout?(data: string): any
		stderr?(data: string): any
	}

	export function cli (command: string, ...args: string[]): Promise<void>
	export function cli (options: ITaskCLIOptions, command: string, ...args: string[]): Promise<void>
	export function cli (options: ITaskCLIOptions | string, command?: string, ...args: string[]) {
		return new Promise<void>((resolve, reject) => {
			if (typeof options === 'string') {
				args.unshift(command!)
				command = options
				options = {}
			}

			command = command!

			if (command.startsWith('NPM:'))
				command = `${command.slice(4)}${process.platform === 'win32' ? '.cmd' : ''}`

			command = command.startsWith('PATH:')
				? command.slice(5)
				: path.resolve(`node_modules/.bin/${command}`)

			const childProcess = spawn(wrapQuotes(command), args.map(wrapQuotes),
				{ shell: true, stdio: [process.stdin, options.stdout ? 'pipe' : process.stdout, options.stderr ? 'pipe' : process.stderr], cwd: options.cwd, env: options.env })

			if (options.stdout)
				childProcess.stdout?.on('data', options.stdout)

			if (options.stderr)
				childProcess.stderr?.on('data', options.stderr)

			childProcess.on('error', reject)
			childProcess.on('exit', code => {
				if (code) reject(new Error(`Error code ${code}`))
				else resolve()
			})
		})
	}
}

export default Task

function wrapQuotes (value: string): string {
	if (!value.includes(' '))
		return value

	if (!value.startsWith('"'))
		value = `"${value}`
	if (!value.endsWith('"'))
		value = `${value}"`

	return value
}
