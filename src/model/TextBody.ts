import type { Author, TextBody as TextBodyRaw } from 'api.fluff4.me'

type TextBody = TextBodyRaw
namespace TextBody {
	export function resolve (body: TextBody | string, authors?: Author[] | null): TextBody {
		return {
			body: typeof body === 'string' ? body : body.body,
			mentions: [
				...(typeof body === 'string' ? undefined : body.mentions) ?? [],
				...authors ?? [],
			].distinct(author => author.vanity),
		}
	}
}

export default TextBody
