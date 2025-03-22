import type { Paths } from 'api.fluff4.me'
import Endpoint from 'endpoint/Endpoint'

type FollowType = Extract<keyof Paths, `/follows/${string}/{id}`> extends `/follows/${infer T}/{id}` ? Exclude<T, `${string}/${string}`> : never

export default {
	Author: Endpoint('/follows/author/{id}', 'get'),
	Work: Endpoint('/follows/work/{id}', 'get'),
	Tag: Endpoint('/follows/tag/{id}', 'get'),
	Category: Endpoint('/follows/category/{id}', 'get'),
} satisfies { [TYPE in FollowType as Capitalize<TYPE>]: Endpoint<`/follows/${TYPE}/{id}`> }
