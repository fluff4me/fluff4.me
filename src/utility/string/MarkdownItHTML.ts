import entities from 'entities'
import type MarkdownIt from 'markdown-it'
import type { PluginWithOptions, StateBlock, StateInline, Token as TokenBase } from 'markdown-it'

interface MarkdownItHTMLState {
	block: StateBlock | undefined
	inline: StateInline | undefined
	i: number
	l: number
	e: number
	src: string
	silent: boolean
	options: MarkdownItHTML.Options
}

const html = Object.assign(
	((md, options) => {
		const state: MarkdownItHTMLState = {
			block: undefined as StateBlock | undefined,
			inline: undefined as StateInline | undefined,
			i: 0,
			l: 0,
			e: 0,
			src: '',
			silent: false,
			options: {
				...html.defaultOptions,
				...options,
			},
		}

		md.block.ruler.at('html_block', (block, startLine, endLine, silent) => {
			state.block = block
			state.src = state.block.src
			state.l = startLine
			state.i = state.block.bMarks[state.l] + state.block.tShift[state.l]
			state.e = state.src.length
			state.silent = silent
			const result = html.consumeBlock(state)
			state.block = undefined
			return result
		}, { alt: ['paragraph'] })

		md.inline.ruler.at('html_inline', (inline, silent) => {
			state.inline = inline
			state.e = inline.posMax
			state.i = inline.pos
			state.src = inline.src
			state.silent = silent
			const result = html.consumeInline(state)
			state.inline = undefined
			return result
		})

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
		md.renderer.rules.html_inline = (tokens, idx) => tokens[idx].content || (tokens[idx] as any).raw
	}) as PluginWithOptions<MarkdownItHTML.Options.Factory>,
	{

		regexCSSProperty: /^[-a-zA-Z_][a-zA-Z0-9_-]*$/,

		defaultOptions: {
			voidElements: [
				// default
				'area',
				'base',
				'br',
				'col',
				'embed',
				'hr',
				'img',
				'input',
				'link',
				'meta',
				'source',
				'track',
				'wbr',
			],
			allowedTags: [
				// headings
				'hgroup',
				'h1',
				'h2',
				'h3',
				'h4',
				'h5',
				'h6',
				// layout
				'div',
				'p',
				'br',
				'wbr',
				'hr',
				'details',
				'summary',
				'label',
				// lists
				'ol',
				'ul',
				'li',
				// tables
				'table',
				'tr',
				'th',
				'td',
				'caption',
				'thead',
				'tbody',
				'tfoot',
				// text
				'span',
				// text style
				'i',
				'b',
				'u',
				's',
				'strike',
				'sup',
				'sub',
				'em',
				'mark',
				'small',
				'strong',
				// quoting/referencing
				'q',
				'cite',
				'blockquote',
				// links
				'a',
				// definitions
				'abbr',
				'dfn',
				'dd',
				'dt',
				'dl',
				// code
				'code',
				'samp',
				'kbd',
				// images
				'img',
				'figure',
				'figcaption',
				'area',
				'map',
			],
			allTagsAllowedAttributes: [
				'title',
				'name',
				'style',
				'aria-label',
				'aria-labelledby',
				'aria-describedby',
				'aria-hidden',
			],
			allTagsAllowedAttributeValues: {},
			perTagAllowedAttributes: {
				// default
				a: ['href'],
				img: ['src', 'alt', 'usemap', 'width', 'height'],
				area: ['shape', 'coords'],
				details: ['open'],
				ol: ['type', 'start', 'reversed'],
				li: ['value'],
				th: ['colspan', 'rowspan', 'headers', 'scope', 'abbr'],
				td: ['colspan', 'rowspan', 'headers'],
				q: ['cite'],
			},
			perTagAllowedAttributeValues: {
				a: { href: /^https?:/ },
				img: { src: /^https?:/ },
				area: { href: /^https?:/ },
				q: { cite: /^https?:/ },
				blockquote: { cite: /^https?:/ },
			},
			allTagsAllowedStyleProperties: [
				'color',
				'text-align',
				'font-family',
				'font-style',
				'font-weight',
				'text-decoration',
				'text-transform',
				'line-height',
				'letter-spacing',
				'word-spacing',
				'vertical-align',
				'background-color',
				'opacity',
				'margin',
				'padding',
				'width',
				'height',
				'vertical-align',
				'box-shadow',
				'border-width',
				'border-style',
				'border-color',
				'border-radius',
				'text-indent',
				'display',
				'position',
			],
			allTagsAllowedStylePropertyValues: {
				position: ['relative', 'absolute', 'sticky'],
			},
			perTagAllowedStyleProperties: {},
			perTagAllowedStylePropertyValues: {},
		} satisfies MarkdownItHTML.Options as MarkdownItHTML.Options,

		Options (options?: MarkdownItHTML.Options): MarkdownItHTML.Options.Factory {
			const factory: MarkdownItHTML.Options.Factory = Object.assign({ ...structuredClone(html.defaultOptions), ...options }, {
				disallowTags (...tags) {
					const disallowed = tags.map(tag => tag.toLowerCase())
					factory.allowedTags = factory.allowedTags.filter(tag => !disallowed.includes(tag))
					return factory
				},
				allowTags (...tags) {
					factory.allowedTags = [...new Set([...factory.allowedTags, ...tags.map(tag => tag.toLowerCase())])]
					return factory
				},
				disallowAttributes (...attributes) {
					const disallowed = attributes.map(attr => attr.toLowerCase())
					factory.allTagsAllowedAttributes = factory.allTagsAllowedAttributes.filter(attr => !disallowed.includes(attr))
					for (const [tag, allowedAttributes] of Object.entries(factory.perTagAllowedAttributes))
						factory.perTagAllowedAttributes[tag] = allowedAttributes.filter(attr => !disallowed.includes(attr))
					return factory
				},
				allowAttributes (...attributes) {
					factory.allTagsAllowedAttributes = [...new Set([...factory.allTagsAllowedAttributes, ...attributes.map(attr => attr.toLowerCase())])]
					return factory
				},
			} satisfies Omit<MarkdownItHTML.Options.Factory, keyof MarkdownItHTML.Options>)
			return factory
		},

		use (md: MarkdownIt, options?: MarkdownItHTML.Options.Factory) {
			return md.use(html, options)
		},

		consumeBlock (state: MarkdownItHTMLState) {
			if (!state.block)
				return false

			html.consumeInlineWhitespace(state)

			if (state.silent)
				return html.consumeTerminator(state)

			const result = html.consumeTagsLine(state)
			if (!result)
				return false

			state.l++
			state.block.line = state.l

			const indent = html.consumeInlineWhitespace(state) || 0
			if (indent >= state.block.blkIndent + 4)
				state.block.blkIndent = indent - 4 // allow for indented code blocks within html block
			else
				state.block.blkIndent = indent

			return true
		},

		consumeInline (state: MarkdownItHTMLState) {
			if (!state.inline || state.src[state.i] !== '<')
				return false

			const tag = html.consumeTag(state)
			if (!tag)
				return false

			state.inline.pos = state.i
			return true
		},

		consumeTerminator (state: MarkdownItHTMLState) {
			const noSetBlockIndent = new Error().stack?.split('\n')?.at(4)?.includes('Array.lheading')

			const indent = html.consumeInlineWhitespace(state) || 0
			if (!html.consumeTagsLine(state))
				return false

			if (!noSetBlockIndent && state.block)
				state.block.blkIndent = indent

			return true
		},

		consumeTagsLine (state: MarkdownItHTMLState): MarkdownItHTML.ConsumeResult | undefined {
			let consumed = false
			const tokens: TokenBase[] = []
			let token: TokenBase | true | undefined
			while ((token = html.consumeTag(state))) {
				if (typeof token === 'object')
					tokens.push(token)

				consumed = true
				html.consumeInlineWhitespace(state)
			}

			if (!consumed)
				return undefined

			if (state.i < state.src.length && !html.consumeNewline(state)) {
				// a line of tags MUST end in a newline — if this doesn't, remove all the tokens we added and don't match
				if (tokens.length)
					state.block?.tokens.splice(0, Infinity, ...state.block.tokens
						.filter(token => !tokens.includes(token)))

				return undefined
			}

			return {
				tokens,
			}
		},

		consumeNewline (state: MarkdownItHTMLState) {
			if (state.inline)
				return false

			if (state.src[state.i] === '\n') {
				state.i++
				return true
			}

			if (state.src[state.i] !== '\r')
				return false

			state.i++
			if (state.src[state.i] === '\n')
				state.i++

			return true
		},

		consumeWhitespace (state: MarkdownItHTMLState) {
			if (state.inline)
				return !!html.consumeInlineWhitespace(state)

			const start = state.i
			if (state.i >= state.e)
				return false

			for (state.i; state.i < state.e; state.i++) {
				if (!html.isWhitespace(state))
					break

				if (html.consumeNewline(state)) {
					state.l++
					state.i--
				}
			}

			return state.i > start
		},

		consumeInlineWhitespace (state: MarkdownItHTMLState) {
			if (state.i >= state.e)
				return undefined

			let indent = 0
			for (state.i; state.i < state.e; state.i++) {
				if (state.src[state.i] === ' ')
					indent++
				else if (state.src[state.i] === '\t')
					indent += 4
				else
					break
			}

			return indent || undefined
		},

		consumeTag (state: MarkdownItHTMLState): TokenBase | true | undefined {
			if (state.src[state.i] !== '<')
				return undefined

			state.i++
			return html.consumeOpenTag(state) ?? html.consumeCloseTag(state)
		},

		consumeOpenTag (state: MarkdownItHTMLState): MarkdownItHTML.Token | true | undefined {
			const start = state.i

			const tagNameRaw = html.consumeTagName(state)
			if (!tagNameRaw)
				return undefined

			const tagName = tagNameRaw.toLowerCase()
			const o = state.options
			if (!o.allowedTags.includes(tagName)) {
				state.i = start
				return undefined
			}

			const attributes: MarkdownItHTML.AttributeTuple[] = []
			let style: Map<string, string> | undefined
			while (html.consumeWhitespace(state)) {
				const attribute = html.consumeAttribute(state)
				if (!attribute)
					break

				let [name, value] = attribute
				name = name.toLowerCase()
				if (!o.allTagsAllowedAttributes.includes(name) && !o.perTagAllowedAttributes[tagName]?.includes(name))
					continue

				value = entities.decodeHTML5Strict(value)
				if (name !== 'style') {
					const allowedValues = o.perTagAllowedAttributeValues[tagName]?.[name] ?? o.allTagsAllowedAttributeValues[name]
					if (allowedValues !== undefined && !html.matchesAllowedValues(value, allowedValues))
						continue

					attributes.push(attribute)
					continue
				}

				style = html.parseStyleAttributeValue(value)
				let styleValue = ''
				for (let [property, value] of style) {
					property = property.toLowerCase()
					if (!o.allTagsAllowedStyleProperties.includes(property) && !o.perTagAllowedStyleProperties[tagName]?.includes(property))
						continue

					const importantToken = '!important'
					const important = value.slice(-importantToken.length).toLowerCase() === importantToken
					if (important)
						value = value.slice(0, -importantToken.length).trim()

					const allowedValues = o.perTagAllowedStylePropertyValues[tagName]?.[property] ?? o.allTagsAllowedStylePropertyValues[property]
					if (allowedValues !== undefined && !html.matchesAllowedValues(value, allowedValues))
						continue

					styleValue += `${property}:${value}${important ? importantToken : ''};`
				}

				if (styleValue.length)
					attributes.push(['style', styleValue.slice(0, -1)])
			}

			if (state.src[state.i] === '/')
				state.i++

			if (state.src[state.i] !== '>') {
				state.i = start
				return undefined
			}

			state.i++
			const nesting = state.options.voidElements.includes(tagName) ? 0 : 1
			if (state.silent)
				return true

			let type = `html_${state.block ? 'block' : 'inline'}${nesting ? '_open' : ''}`
			if (tagName === 'br')
				type = 'softbreak'

			const mdState = state.block ?? state.inline!
			const token = mdState.push(type, tagName, nesting)
			Object.assign(token, {
				style,
				raw: state.src.slice(start - 1, state.i),
			})

			for (const attribute of attributes)
				token.attrPush(attribute)

			return token
		},

		consumeCloseTag (state: MarkdownItHTMLState): TokenBase | true | undefined {
			const start = state.i
			if (state.src[state.i] !== '/')
				return undefined

			state.i++
			const tagNameRaw = html.consumeTagName(state)
			if (!tagNameRaw)
				return undefined

			if (state.src[state.i] !== '>') {
				state.i = start
				return undefined
			}

			state.i++
			const tagName = tagNameRaw.toLowerCase()
			if (!state.options.allowedTags.includes(tagName)) {
				state.i = start
				return undefined
			}

			if (state.silent || state.options.voidElements.includes(tagName))
				return true

			const type = `html_${state.block ? 'block' : 'inline'}_close`
			const mdState = state.block ?? state.inline!

			const token = mdState.push(type, tagName, -1)
			Object.assign(token, { raw: state.src.slice(start - 1, state.i) })

			if (state.inline && !state.inline.delimiters)
				state.inline.delimiters = []

			return token
		},

		consumeTagName (state: MarkdownItHTMLState) {
			const start = state.i
			if (state.i >= state.e)
				return undefined

			if (!html.isAlpha(state))
				return undefined

			for (state.i++; state.i < state.e; state.i++)
				if (!html.isAlphaNumeric(state))
					break

			return state.src.slice(start, state.i)
		},

		consumeAttribute (state: MarkdownItHTMLState): MarkdownItHTML.AttributeTuple | undefined {
			const start = state.i
			const name = html.consumeAttributeName(state)
			if (!name)
				return undefined

			const valueStart = state.i
			html.consumeWhitespace(state)
			if (state.src[state.i] !== '=') {
				state.i = valueStart
				return [name, '']
			}

			state.i++
			html.consumeWhitespace(state)
			const value = html.consumeAttributeValue(state)
			if (!value) {
				state.i = start
				return undefined
			}

			return [name, value]
		},

		consumeAttributeName (state: MarkdownItHTMLState) {
			const start = state.i
			if (state.i >= state.e)
				return undefined

			for (state.i; state.i < state.e; state.i++) {
				const charCode = state.src.charCodeAt(state.i)

				const isInvalidChar = false
					|| charCode === 0x0020 // SPACE
					|| charCode === 0x0022 // "
					|| charCode === 0x0027 // '
					|| charCode === 0x003E // >
					|| charCode === 0x002F // /
					|| charCode === 0x003D // =
					|| html.isNonCharacter(state, charCode)
					|| html.isControl(state, charCode)
				if (isInvalidChar)
					break
			}

			return state.i > start ? state.src.slice(start, state.i) : undefined
		},

		consumeAttributeValue (state: MarkdownItHTMLState) {
			return false
				|| html.consumeUnquotedAttributeValue(state)
				|| html.consumeQuotedAttributeValue(state)
				|| undefined
		},

		consumeUnquotedAttributeValue (state: MarkdownItHTMLState) {
			let result = ''

			while (state.i < state.e) {
				const charCode = state.src.charCodeAt(state.i)

				// Check for invalid characters in unquoted attribute values
				const isInvalidChar = false
					|| charCode === 0x0022 // "
					|| charCode === 0x0027 // '
					|| charCode === 0x003D // =
					|| charCode === 0x003C // <
					|| charCode === 0x003E // >
					|| charCode === 0x0060 // `
					|| html.isWhitespace(state, charCode) // ASCII whitespace
				if (isInvalidChar)
					break

				if (charCode !== 0x0026) { // not &
					result += state.src[state.i]
					state.i++
					continue
				}

				const charRef = html.consumeCharacterReference(state)
				if (!charRef) {
					result += '&amp;'
					state.i++
					continue
				}

				result += charRef
				// `i` is already at the next pos
			}

			return result || undefined
		},

		consumeQuotedAttributeValue (state: MarkdownItHTMLState) {
			const start = state.i

			const quoteChar = state.src[state.i]
			if (quoteChar !== '\'' && quoteChar !== '"')
				return undefined

			state.i++
			let result = ''

			while (state.i < state.e) {
				const charCode = state.src.charCodeAt(state.i)

				if (state.src[state.i] === quoteChar) {
					state.i++
					return result
				}

				if (charCode !== 0x0026) { // not &
					const charStart = state.i
					if (html.consumeNewline(state)) {
						state.l++
						result += state.src.slice(charStart, state.i)
						continue
					}

					const isNewlineInInlineMode = state.inline && html.isWhitespace(state) && state.src[state.i] !== ' ' && state.src[state.i] !== '\t'
					if (isNewlineInInlineMode) {
						state.i = start
						return undefined
					}

					result += state.src[state.i]
					state.i++
					continue
				}

				const charRef = html.consumeCharacterReference(state)
				if (!charRef) {
					result += '&amp;'
					state.i++
					continue
				}

				result += charRef
				// `i` is already at the next pos
			}

			// no closing quote before the end of `src`
			state.i = start
			return undefined
		},

		consumeCharacterReference (state: MarkdownItHTMLState) {
			const start = state.i
			if (state.src[state.i] !== '&')
				return undefined

			state.i++

			const isValid = html.consumeNumericCharacterReference(state) || html.consumeNamedCharacterReference(state)
			if (!isValid) {
				state.i = start
				return undefined
			}

			return state.src.slice(start, state.i)
		},

		consumeNamedCharacterReference (state: MarkdownItHTMLState) {
			const nameStart = state.i
			for (state.i; state.i < state.e; state.i++)
				if (!html.isAlpha(state))
					break

			if (state.i === nameStart || state.src[state.i] !== ';')
				return false

			state.i++
			return true
		},

		consumeNumericCharacterReference (state: MarkdownItHTMLState) {
			if (state.src[state.i] !== '#')
				return false

			state.i++

			const isHex = state.src[state.i] === 'x' || state.src[state.i] === 'X'
			if (isHex)
				state.i++

			const digitsStart = state.i
			for (state.i; state.i < state.e; state.i++)
				if (isHex ? !html.isHexadecimal(state) : !html.isNumeric(state))
					break

			if (state.i === digitsStart || state.src[state.i] !== ';')
				return false

			const codePoint = parseInt(state.src.slice(digitsStart, state.i), isHex ? 16 : 10)
			if (codePoint === 0x000D || html.isNonCharacter(state, codePoint) || (html.isControl(state, codePoint) && !html.isWhitespace(state, codePoint)))
				return false

			state.i++
			return true
		},

		parseStyleAttributeValue: ((style?: string | null) => {
			if (style === undefined || style === null)
				return undefined

			const styles = new Map<string, string>()
			let key = ''
			let value = ''
			let inValue = false
			let isEscaped = false
			let isQuoted = false
			let isComment = false
			let quoteChar = ''
			let parenCount = 0

			for (let i = 0; i < style.length; i++) {
				const char = style[i]
				if (isComment) {
					if (char !== '*' && style[i + 1] !== '/')
						continue

					isComment = false
					i++
					continue
				}

				if (char === '\\') {
					isEscaped = true
					continue
				}

				if (isEscaped) {
					value += char
					isEscaped = false
					continue
				}

				if (!isComment && char === '/' && style[i + 1] === '*') {
					isComment = true
					i++
					continue
				}

				if (isQuoted) {
					if (char === quoteChar) {
						isQuoted = false
						value += char
						continue
					}
				}
				else {
					if (char === '"' || char === '\'') {
						isQuoted = true
						quoteChar = char
						value += char
						continue
					}
				}

				if (char === '(' && !isQuoted) {
					parenCount++
					value += char
					continue
				}

				if (char === ')' && !isQuoted) {
					parenCount--
					value += char
					continue
				}

				if (char === ':' && !isQuoted && parenCount === 0) {
					inValue = true
					continue
				}

				if (char === ';' && !isQuoted && parenCount === 0) {
					if (key && value) {
						key = key.trim()
						if (!html.regexCSSProperty.test(key))
							console.warn(`Invalid CSS property "${key}"`)
						else
							styles.set(key, value.trim())
						key = ''
						value = ''
					}
					inValue = false
					continue
				}

				if (inValue) {
					value += char
				}
				else {
					key += char
				}
			}

			if (key && value) {
				key = key.trim()
				if (!html.regexCSSProperty.test(key))
					console.warn(`Invalid CSS property "${key}"`)
				else
					styles.set(key, value.trim())
			}

			return styles
		}) as {
			(style: string): Map<string, string>
			(style?: string | null): Map<string, string> | undefined
		},

		isAlpha (state: MarkdownItHTMLState, charCode = state.src.charCodeAt(state.i)) {
			return (charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122) // A-Z, a-z
		},

		isNumeric (state: MarkdownItHTMLState, charCode = state.src.charCodeAt(state.i)) {
			return charCode >= 48 && charCode <= 57
		},

		isHexadecimal (state: MarkdownItHTMLState, charCode = state.src.charCodeAt(state.i)) {
			return (charCode >= 65 && charCode <= 70) || (charCode >= 97 && charCode <= 102) || html.isNumeric(state, charCode)
		},

		isAlphaNumeric (state: MarkdownItHTMLState, charCode = state.src.charCodeAt(state.i)) {
			return html.isAlpha(state, charCode) || html.isNumeric(state, charCode)
		},

		isNonCharacter (state: MarkdownItHTMLState, charCode = state.src.charCodeAt(state.i)) {
			return false
				|| (charCode >= 0xFDD0 && charCode <= 0xFDEF)
				|| charCode === 0xFFFE || charCode === 0xFFFF
				|| charCode === 0x1FFFE || charCode === 0x1FFFF
				|| charCode === 0x2FFFE || charCode === 0x2FFFF
				|| charCode === 0x3FFFE || charCode === 0x3FFFF
				|| charCode === 0x4FFFE || charCode === 0x4FFFF
				|| charCode === 0x5FFFE || charCode === 0x5FFFF
				|| charCode === 0x6FFFE || charCode === 0x6FFFF
				|| charCode === 0x7FFFE || charCode === 0x7FFFF
				|| charCode === 0x8FFFE || charCode === 0x8FFFF
				|| charCode === 0x9FFFE || charCode === 0x9FFFF
				|| charCode === 0xAFFFE || charCode === 0xAFFFF
				|| charCode === 0xBFFFE || charCode === 0xBFFFF
				|| charCode === 0xCFFFE || charCode === 0xCFFFF
				|| charCode === 0xDFFFE || charCode === 0xDFFFF
				|| charCode === 0xEFFFE || charCode === 0xEFFFF
				|| charCode === 0xFFFFE || charCode === 0xFFFFF
				|| charCode === 0x10FFFE || charCode === 0x10FFFF
		},

		isControl (state: MarkdownItHTMLState, charCode = state.src.charCodeAt(state.i)) {
			return false
				|| (charCode >= 0x0000 && charCode <= 0x001F)
				|| (charCode >= 0x007F && charCode <= 0x009F)
		},

		isWhitespace (state: MarkdownItHTMLState, charCode = state.src.charCodeAt(state.i)) {
			return false
				|| charCode === 0x0009 // TAB
				|| charCode === 0x000A // LF
				|| charCode === 0x000C // FF
				|| charCode === 0x000D // CR
				|| charCode === 0x0020 // SPACE
		},

		matchesAllowedValues (value: string, allowed: MarkdownItHTML.AllowedValues): boolean {
			if (Array.isArray(allowed))
				return allowed.some(allowed => html.matchesAllowedValues(value, allowed))

			if (typeof allowed === 'string')
				return value === allowed

			if (typeof allowed === 'function')
				return allowed(value)

			return allowed.test(value)
		},
	},
)

const MarkdownItHTML = html
type MarkdownItHTML = typeof MarkdownItHTML

namespace MarkdownItHTML {

	type AllowedValue = string | RegExp | ((value: string) => boolean)
	export type AllowedValues = AllowedValue | AllowedValue[]

	export interface Options {
		/** The tagnames that will be parsed as HTML */
		allowedTags: string[]
		/** Attributes that are allowed in all tags */
		allTagsAllowedAttributes: string[]
		/** Allowed attribute values for all tags */
		allTagsAllowedAttributeValues: Record<string, AllowedValues>
		/** Additional attributes allowed in specific tags */
		perTagAllowedAttributes: Record<string, string[]>
		/** Override allowed attribute values for specific tags */
		perTagAllowedAttributeValues: Record<string, Record<string, AllowedValues>>
		/** Allowed style properties on all tags */
		allTagsAllowedStyleProperties: string[]
		/** Allowed values for style properties on all tags */
		allTagsAllowedStylePropertyValues: Record<string, AllowedValues>
		/** Additional allowed style properties for specific tags */
		perTagAllowedStyleProperties: Record<string, string[]>
		/** Override allowed style property values for specific tags */
		perTagAllowedStylePropertyValues: Record<string, Record<string, AllowedValues>>
		/** The current list of void elements in the HTML standard, or extras if you're doing something custom */
		voidElements: string[]
	}

	export namespace Options {
		export interface Factory extends Options {
			allowTags (...tags: string[]): this
			disallowTags (...tags: string[]): this
			allowAttributes (...tags: string[]): this
			disallowAttributes (...tags: string[]): this
		}
	}

	export type AttributeTuple = [name: string, value: string]

	export interface Token extends TokenBase {
		readonly raw?: string
		readonly style?: ReadonlyMap<string, string>
	}

	export interface ConsumeResult {
		tokens: Token[]
	}
}

export default MarkdownItHTML
