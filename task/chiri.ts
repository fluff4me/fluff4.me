import { Task } from 'task'
import Env from './utility/Env'

export default Task('chiri', task =>
	task.exec(Env.ENVIRONMENT === 'dev' ? { env: {} } : {}, 'NPM:chiri', 'style/index.chiri', '--out', 'docs', '--out-dts', 'src'))

export const chiriwatch = Task('chiriwatch', task =>
	task.exec(
		{
			env: {
				CHIRI_ENV: Env.CHIRI_ENV,
				CHIRI_STACK_LENGTH: Env.CHIRI_STACK_LENGTH,
				CHIRI_AST: Env.CHIRI_AST,
				CHIRI_INSPECT: Env.CHIRI_INSPECT,
				CHIRI_INSPECT_PORT: Env.CHIRI_INSPECT_PORT,
			},
		},
		'NPM:chiri', 'style/index.chiri', '--out', 'docs', '--out-dts', 'src', '-w'))
