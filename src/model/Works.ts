import type { WorkMetadata, WorkReference, WorkStatus } from 'api.fluff4.me'
import EndpointWorks$authorVanity$workVanityDelete from 'endpoint/works/$author_vanity/$work_vanity/EndpointWorks$authorVanity$workVanityDelete'
import type { ButtonIcon } from 'ui/component/core/Button'
import ConfirmDialog from 'ui/component/core/ConfirmDialog'
import Enums from 'utility/Enums'
import type State from 'utility/State'

export const WORK_STATUSES = Enums.type<WorkStatus>().values('Complete', 'Ongoing', 'Hiatus', 'Cancelled')

export const WORK_STATUS_ICONS = {
	Cancelled: 'circle-xmark',
	Complete: 'circle-check',
	Ongoing: 'circle-play',
	Hiatus: 'circle-pause',
} satisfies Record<WorkMetadata['status'], ButtonIcon>

export interface NewWorkReference extends WorkReference {
	author_vanity: string
	work_vanity: string
}

namespace Works {
	export function resolve (reference: WorkReference | null | undefined, works: WorkMetadata[]): WorkMetadata | undefined {
		return !reference ? undefined : works.find(work => work.author === reference.author && work.vanity === reference.vanity)
	}

	export function equals (a?: WorkReference | null, b?: WorkReference | null) {
		return !!a && !!b && a.author === b.author && a.vanity === b.vanity
	}

	export function reference (work: WorkReference): NewWorkReference
	export function reference (work?: WorkReference | null): NewWorkReference | null
	export function reference (work?: WorkReference | null): NewWorkReference | null {
		return work ? { author_vanity: work.author ?? work.author_vanity!, work_vanity: work.vanity ?? work.work_vanity! } : null
	}
}

export default Object.assign(
	Works,
	{
		async delete (work?: WorkMetadata, owner?: State.Owner): Promise<boolean> {
			if (!work)
				return true

			const result = await ConfirmDialog.prompt(owner ?? null, {
				dangerToken: 'delete-work',
				bodyTranslation: quilt => quilt['work/action/delete/confirm'](work.name),
			})
			if (!result)
				return false

			const response = await EndpointWorks$authorVanity$workVanityDelete.query({ params: Works.reference(work) })
			if (toast.handleError(response))
				return false

			if (navigate.isURL(`/work/${work.author}/${work.vanity}/**`))
				void navigate.toURL(`/author/${work.author}`)

			return true
		},
	}
)
