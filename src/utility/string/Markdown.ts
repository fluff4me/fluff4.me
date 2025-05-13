import type { StateInline, Token } from 'markdown-it'
import MarkdownIt from 'markdown-it'
import MarkdownItHTML from 'utility/string/MarkdownItHTML'

export default function () {
	const Markdown = new MarkdownIt('commonmark', { html: true, breaks: true })

	MarkdownItHTML.use(Markdown, MarkdownItHTML.Options()
		.disallowTags('img', 'figure', 'figcaption', 'map', 'area'))
	Markdown.inline.ruler.enable('strikethrough')
	Markdown.inline.ruler2.enable('strikethrough')

	////////////////////////////////////
	//#region Underline Parse
	// Based on https://github.com/Markdown-it/Markdown-it/blob/0fe7ccb4b7f30236fb05f623be6924961d296d3d/lib/rules_inline/strikethrough.mjs

	Markdown.inline.ruler.before('emphasis', 'underline', function underline_tokenize (state, silent) {
		const start = state.pos
		const marker = state.src.charCodeAt(start)

		if (silent || marker !== 0x5F/* _ */)
			return false

		const scanned = state.scanDelims(state.pos, true)
		let len = scanned.length
		if (len < 2)
			return false

		const ch = String.fromCharCode(marker)

		let token: Token
		if (len % 2) {
			token = state.push('text', '', 0)
			token.content = ch
			len--
		}

		for (let i = 0; i < len; i += 2) {
			token = state.push('text', '', 0)
			token.content = ch + ch

			state.delimiters.push({
				marker,
				length: 0, // disable "rule of 3" length checks meant for emphasis
				token: state.tokens.length - 1,
				end: -1,
				open: scanned.can_open,
				close: scanned.can_close,
			})
		}

		state.pos += scanned.length
		return true
	})

	Markdown.inline.ruler2.before('emphasis', 'underline', function underline_postProcess (state) {
		const tokens_meta = state.tokens_meta
		const max = state.tokens_meta.length

		postProcess(state, state.delimiters)

		for (let curr = 0; curr < max; curr++) {
			const delimiters = tokens_meta[curr]?.delimiters
			if (delimiters)
				postProcess(state, delimiters)
		}

		for (const delim of state.delimiters)
			if (delim.marker === 0x5F) // prevent this being used for evil
				delim.marker = -999999

		return true

		function postProcess (state: StateInline, delimiters: StateInline.Delimiter[]) {
			let token: Token
			const loneMarkers: number[] = []
			const max = delimiters.length

			for (let i = 0; i < max; i++) {
				const startDelim = delimiters[i]

				if (startDelim.marker !== 0x5F/* _ */)
					continue

				if (startDelim.end === -1)
					continue

				const endDelim = delimiters[startDelim.end]

				token = state.tokens[startDelim.token]
				token.type = 'u_open'
				token.tag = 'u'
				token.nesting = 1
				token.markup = '__'
				token.content = ''

				token = state.tokens[endDelim.token]
				token.type = 'u_close'
				token.tag = 'u'
				token.nesting = -1
				token.markup = '__'
				token.content = ''

				if (state.tokens[endDelim.token - 1].type === 'text'
					&& state.tokens[endDelim.token - 1].content === '_') {
					loneMarkers.push(endDelim.token - 1)
				}
			}

			// If a marker sequence has an odd number of characters, it's splitted
			// like this: `_____` -> `_` + `__` + `__`, leaving one marker at the
			// start of the sequence.
			//
			// So, we have to move all those markers after subsequent u_close tags.
			//
			while (loneMarkers.length) {
				const i = loneMarkers.pop() ?? 0
				let j = i + 1

				while (j < state.tokens.length && state.tokens[j].type === 'u_close') {
					j++
				}

				j--

				if (i !== j) {
					token = state.tokens[j]
					state.tokens[j] = state.tokens[i]
					state.tokens[i] = token
				}
			}
		}
	})

	//#endregion
	////////////////////////////////////

	return Markdown
}
