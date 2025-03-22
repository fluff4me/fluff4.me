import type { Paths } from 'api.fluff4.me'
import Endpoint from 'endpoint/Endpoint'

type FollowType = Extract<keyof Paths, `/unignore/${string}/{id}`> extends `/unignore/${infer T}/{id}` ? Exclude<T, `${string}/${string}`> : never

export default {
	Author: Endpoint('/unignore/author/{id}', 'post'),
	Work: Endpoint('/unignore/work/{id}', 'post'),
	Tag: Endpoint('/unignore/tag/{id}', 'post'),
	Category: Endpoint('/unignore/category/{id}', 'post'),
} satisfies { [TYPE in FollowType as Capitalize<TYPE>]: Endpoint<`/unignore/${TYPE}/{id}`> }
