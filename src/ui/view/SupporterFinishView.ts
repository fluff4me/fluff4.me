import EndpointSupporterPollTransaction from 'endpoint/supporter/EndpointSupporterPollTransaction'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import Async from 'utility/Async'
import Store from 'utility/Store'
import Time from 'utility/Time'

declare module 'utility/Store' {
	interface ILocalStorage {
		supporterTransactionId?: string
	}
}

export default ViewDefinition({
	wrapper: false,
	async load (_, signal, setProgress): Promise<undefined> {
		const transaction_id = Store.items.supporterTransactionId
		if (!transaction_id)
			return undefined

		setProgress(0, quilt => quilt['shared/popup/supporter/finishing']())

		const startedWaitingForTransactionAt = Date.now()
		while (!signal.aborted) {
			await Async.sleep(5000, signal)
			if (signal.aborted)
				break

			const waited = Date.now() - startedWaitingForTransactionAt
			const maxWait = Time.minutes(2)
			if (waited > maxWait)
				break // give up

			setProgress(waited / maxWait, quilt => quilt['shared/popup/supporter/finishing']())

			const response = await EndpointSupporterPollTransaction.query(undefined, { transaction_id }, signal)
			if (response instanceof Error)
				continue

			if (!response.data.completed)
				continue // not completed yet

			return
		}
	},
	create () {
		delete Store.items.supporterTransactionId
		window.close()
		throw new Error('Closing window')
	},
})
