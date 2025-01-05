export default process.env as {
	ENVIRONMENT?: 'dev' | 'beta' | 'prod'
	URL_ORIGIN?: string
	URL_REWRITE?: string
	PORT?: `${bigint}`
	HOSTNAME?: string
	NO_COLOURIZE_ERRORS?: string
	NO_LOG_TSC_DURATION?: string
	NPM_LINK?: string
	CHIRI_ENV?: string
	CHIRI_STACK_LENGTH?: `${bigint}`
	CHIRI_AST?: 'true'
	CHIRI_INSPECT?: 'true'
	CHIRI_INSPECT_PORT?: `${bigint}`
}
