declare module 'https-localhost/certs' {
	import type { SecureContextOptions } from 'tls'

	export function getCerts (hostname: string): Promise<SecureContextOptions>
}
