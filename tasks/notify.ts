import Env from './utility/Env'
import Task from './utility/Task'

export default Task('notify', async () => {
	if (Env.ENVIRONMENT === 'dev')
		return

	const commitURL = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/commit/${process.env.GITHUB_SHA}`
	const shortSHA = `\`${process.env.GITHUB_SHA?.slice(0, 7)}\``

	switch (process.env.NOTIFY_TYPE) {

		case 'success': {
			return notify({
				color: 0x00FF00,
				description: (''
					+ `Deployed [v${process.env.GITHUB_RUN_NUMBER} (${shortSHA})](${commitURL})`
					+ `\n-# ${process.env.GITHUB_HEAD_COMMIT_MESSAGE}`
				),
			})
		}

		case 'failure': {
			const runURL = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
			return notify({
				color: 0xFF0000,
				description: (''
					+ `[Build failed](${runURL}) for commit [${shortSHA}](${commitURL})`
					+ `\n-# ${process.env.GITHUB_HEAD_COMMIT_MESSAGE}`
				),
			})
		}

	}
})

interface Embed {
	description: string
	color: number
}

function notify (embed: Embed) {
	return fetch(process.env.BUILD_WEBHOOK!, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			embeds: [embed],
		}),
	})
}
