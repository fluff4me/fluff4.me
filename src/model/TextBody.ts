import type { AuthorMetadata, TextBody as TextBodyRaw } from 'api.fluff4.me'

type TextBody = TextBodyRaw
namespace TextBody {
	export function resolve (body?: TextBody | string | null, authors?: AuthorMetadata[] | null): TextBody | undefined
	export function resolve (body: TextBody | string, authors?: AuthorMetadata[] | null): TextBody
	export function resolve (body?: TextBody | string | null, authors?: AuthorMetadata[] | null): TextBody | undefined {
		return body === null || body === undefined ? undefined : {
			body: typeof body === 'string' ? body : body.body,
			mentions: [
				...(typeof body === 'string' ? undefined : body.mentions) ?? [],
				...authors ?? [],
			].distinct(author => author.vanity),
		}
	}
}

export default TextBody
