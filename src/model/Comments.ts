import type { Comment } from 'api.fluff4.me'

namespace Comments {
	export function resolve (uuid: string | null | undefined, comments: Comment[]): Comment | undefined {
		return !uuid ? undefined : comments.find(comment => comment.comment_id === uuid)
	}
}

export default Comments
