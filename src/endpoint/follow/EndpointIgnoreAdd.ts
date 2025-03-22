import type { Paths } from 'api.fluff4.me'
import Endpoint from 'endpoint/Endpoint'

type FollowType = Extract<keyof Paths, `/ignore/${string}/{id}`> extends `/ignore/${infer T}/{id}` ? Exclude<T, `${string}/${string}`> : never

export default {
	Author: Endpoint('/ignore/author/{id}', 'post'),
	Work: Endpoint('/ignore/work/{id}', 'post'),
	Tag: Endpoint('/ignore/tag/{id}', 'post'),
	Category: Endpoint('/ignore/category/{id}', 'post'),
} satisfies { [TYPE in FollowType as Capitalize<TYPE>]: Endpoint<`/ignore/${TYPE}/{id}`> }
