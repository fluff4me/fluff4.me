import type { Paths } from 'api.fluff4.me'
import Endpoint from 'endpoint/Endpoint'

type FollowType = Extract<keyof Paths, `/follow/${string}/{vanity}`> extends `/follow/${infer T}/{vanity}` ? Exclude<T, `${string}/${string}`> : never

export default {
	Author: Endpoint('/follow/author/{vanity}', 'post'),
	Work: Endpoint('/follow/work/{vanity}', 'post'),
	Tag: Endpoint('/follow/tag/{vanity}', 'post'),
	Category: Endpoint('/follow/category/{vanity}', 'post'),
} satisfies { [TYPE in FollowType as Capitalize<TYPE>]: Endpoint<`/follow/${TYPE}/{vanity}`> }
