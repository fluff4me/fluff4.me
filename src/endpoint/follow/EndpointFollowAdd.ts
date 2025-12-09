import type { Paths } from 'api.fluff4.me'
import Endpoint from 'endpoint/Endpoint'

type FollowType = Extract<keyof Paths, `/follow/${string}/{id}`> extends `/follow/${infer T}/{id}` ? Exclude<T, `${string}/${string}`> : never

export default {
	Author: Endpoint('/follow/author/{id}', 'post'),
	// Work: Endpoint('/follow/work/{id}', 'post'),
	Tag: Endpoint('/follow/tag/{id}', 'post'),
	Category: Endpoint('/follow/category/{id}', 'post'),
} satisfies { [TYPE in FollowType as Capitalize<TYPE>]: Endpoint<`/follow/${TYPE}/{id}`> }
