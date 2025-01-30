import type { Work, WorkReference } from 'api.fluff4.me'
import EndpointWorkDelete from 'endpoint/work/EndpointWorkDelete'
import type Component from 'ui/Component'
import ConfirmDialog from 'ui/component/core/ConfirmDialog'

namespace Works {
	export function resolve (reference: WorkReference | null | undefined, works: Work[]): Work | undefined {
		return !reference ? undefined : works.find(work => work.author === reference.author && work.vanity === reference.vanity)
	}

	export function equals (a?: WorkReference | null, b?: WorkReference | null) {
		return !!a && !!b && a.author === b.author && a.vanity === b.vanity
	}
}

export default Object.assign(
	Works,
	{
		async delete (work?: WorkReference, owner?: Component): Promise<boolean> {
			if (!work)
				return true

			const result = await ConfirmDialog.prompt(owner ?? null, { dangerToken: 'delete-work' })
			if (!result)
				return false

			const response = await EndpointWorkDelete.query({ params: work })
			if (toast.handleError(response))
				return false

			if (navigate.isURL('/work/**'))
				void navigate.toURL(`/author/${work.author}`)

			return true
		},
	}
)
