const unquote = require('unquote')
const systemFontKeywords = require('css-system-font-keywords')
const fontWeightKeywords = require('css-font-weight-keywords')
const fontStyleKeywords = require('css-font-style-keywords')
const fontStretchKeywords = require('css-font-stretch-keywords')
import * as cssListHelpers from 'css-list-helpers'
import * as helpers from './helpers'

export interface ISystemFont {
	system: string
}

export interface IFont {
	style?: string
	variant?: string
	weight?: string
	stretch?: string
	size?: string
	lineHeight?: string | number
	family?: string[]
}

const errorPrefix = '[parse-css-font]'

const firstDeclarations: ['style', 'weight', 'stretch', 'variant'] = [
	'style',
	'weight',
	'stretch',
	'variant',
]

export default function parseCSSFont(value: string) {
	if (typeof value !== 'string') {
		throw error('Expected a string.', TypeError)
	}

	if (value === '') {
		throw error('Cannot parse an empty string.')
	}

	if (systemFontKeywords.indexOf(value) !== -1) {
		return { system: value } as ISystemFont
	}

	const font: IFont = {
		lineHeight: 'normal',
		stretch: '',
		style: '',
		variant: '',
		weight: '',
	}

	const consumers = [style, weight, stretch, variant]
	const tokens = cssListHelpers.splitBySpaces(value)
	nextToken: for (
		let token = tokens.shift();
		!!token;
		token = tokens.shift()
	) {
		if (token === 'normal') {
			continue
		}

		for (const consume of consumers) {
			if (consume(token)) {
				continue nextToken
			}
		}

		const parts = cssListHelpers.split(token, ['/'])
		font.size = parts[0]
		if (!!parts[1]) {
			font.lineHeight = parseLineHeight(parts[1])
		} else if (tokens[0] === '/') {
			tokens.shift()
			font.lineHeight = parseLineHeight(tokens.shift() as string)
		}
		if (!tokens.length) {
			throw error('Missing required font-family.')
		}
		font.family = cssListHelpers.splitByCommas(tokens.join(' ')).map(unquote)

		for (const name of firstDeclarations) {
			font[name] = font[name] || 'normal'
		}

		return font
	}

	throw error('Missing required font-size.')

	function style(token: string) {
		if (fontStyleKeywords.indexOf(token) === -1) {
			return
		}
		if (font.style) {
			throw error('Font style already defined.')
		}
		return (font.style = token)
	}

	function weight(token: string) {
		if (fontWeightKeywords.indexOf(token) === -1) {
			return
		}
		if (font.weight) {
			throw error('Font weight already defined.')
		}
		return (font.weight = token)
	}

	function stretch(token: string) {
		if (fontStretchKeywords.indexOf(token) === -1) {
			return
		}
		if (font.stretch) {
			throw error('Font stretch already defined.')
		}
		return (font.stretch = token)
	}

	function variant(token: string) {
		return (
			!helpers.isSize(token) &&
			(font.variant = font.variant ? [font.variant, token].join(' ') : token)
		)
	}
}

function error(
	message: string,
	ErrorType: typeof Error | typeof TypeError = Error,
) {
	return new ErrorType(`${errorPrefix} ${message}`)
}

function parseLineHeight(value: string) {
	const parsed = parseFloat(value)
	if (parsed.toString() === value) {
		return parsed
	}
	return value
}

// @ts-ignore
module.exports = Object.assign(exports.default, exports)
