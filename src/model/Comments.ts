import type { CommentResolved } from 'api.fluff4.me'

namespace Comments {
	export function resolve (uuid: string | null | undefined, comments: CommentResolved[]): CommentResolved | undefined {
		return !uuid ? undefined : comments.find(comment => comment.comment_id === uuid)
	}
}

export default Comments
