import type { Paths } from 'api.fluff4.me'
import Endpoint from 'endpoint/Endpoint'

type FollowType = Extract<keyof Paths, `/unignore/${string}/{vanity}`> extends `/unignore/${infer T}/{vanity}` ? Exclude<T, `${string}/${string}`> : never

export default {
	Author: Endpoint('/unignore/author/{vanity}', 'post'),
	Work: Endpoint('/unignore/work/{vanity}', 'post'),
	Tag: Endpoint('/unignore/tag/{vanity}', 'post'),
	Category: Endpoint('/unignore/category/{vanity}', 'post'),
} satisfies { [TYPE in FollowType as Capitalize<TYPE>]: Endpoint<`/unignore/${TYPE}/{vanity}`> }
