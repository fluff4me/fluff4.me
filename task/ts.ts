import fs from 'fs/promises'
import { Task, TypeScript } from 'task'
import Env from './utility/Env'

const options = Env.ENVIRONMENT === 'dev'
	? ['--inlineSourceMap', '--inlineSources', '--incremental']
	: ['--pretty']

export default Task('ts', task => task.series(
	() => TypeScript.compile(task, 'src', '--pretty', ...options),
	() => fs.unlink('docs/index.tsbuildinfo')))

export const tsWatch = Task('ts (watch)', task =>
	TypeScript.compile(task, 'src', '--watch', '--preserveWatchOutput', '--pretty', ...options))
