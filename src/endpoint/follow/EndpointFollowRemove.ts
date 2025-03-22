import type { Paths } from 'api.fluff4.me'
import Endpoint from 'endpoint/Endpoint'

type FollowType = Extract<keyof Paths, `/unfollow/${string}/{id}`> extends `/unfollow/${infer T}/{id}` ? Exclude<T, `${string}/${string}`> : never

export default {
	Author: Endpoint('/unfollow/author/{id}', 'post'),
	Work: Endpoint('/unfollow/work/{id}', 'post'),
	Tag: Endpoint('/unfollow/tag/{id}', 'post'),
	Category: Endpoint('/unfollow/category/{id}', 'post'),
} satisfies { [TYPE in FollowType as Capitalize<TYPE>]: Endpoint<`/unfollow/${TYPE}/{id}`> }
