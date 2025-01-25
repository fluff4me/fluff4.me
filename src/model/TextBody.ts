import type { Author, TextBody as TextBodyRaw } from 'api.fluff4.me'

type TextBody = TextBodyRaw
namespace TextBody {
	export function resolve (body: TextBody, authors: Author[]): TextBody {
		return {
			body: body.body,
			mentions: [...body.mentions ?? [], ...authors].distinct(author => author.vanity),
		}
	}
}

export default TextBody
