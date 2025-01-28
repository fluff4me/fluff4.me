import type { Paths } from 'api.fluff4.me'
import Endpoint from 'endpoint/Endpoint'

type FollowType = Extract<keyof Paths, `/unfollow/${string}/{vanity}`> extends `/unfollow/${infer T}/{vanity}` ? Exclude<T, `${string}/${string}`> : never

export default {
	Author: Endpoint('/unfollow/author/{vanity}', 'post'),
	Work: Endpoint('/unfollow/work/{vanity}', 'post'),
	Tag: Endpoint('/unfollow/tag/{vanity}', 'post'),
	Category: Endpoint('/unfollow/category/{vanity}', 'post'),
} satisfies { [TYPE in FollowType as Capitalize<TYPE>]: Endpoint<`/unfollow/${TYPE}/{vanity}`> }
