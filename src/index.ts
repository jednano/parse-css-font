const unquote = require('unquote')
const globalKeywords = require('css-global-keywords')
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

const errorPrefix = '[parse-css-font] '

export default function parseCSSFont(value: string) {
	if (typeof value !== 'string') {
		throw new TypeError(errorPrefix + 'Expected a string.')
	}

	if (value === '') {
		throw error('Cannot parse an empty string.')
	}

	if (systemFontKeywords.indexOf(value) !== -1) {
		return { system: value } as ISystemFont
	}

	const font: IFont = {
		lineHeight: 'normal',
		stretch: 'normal',
		style: 'normal',
		variant: 'normal',
		weight: 'normal',
	}

	let isLocked = false
	const tokens = cssListHelpers.splitBySpaces(value)
	let token = tokens.shift()
	for (; !!token; token = tokens.shift()) {
		if (token === 'normal' || globalKeywords.indexOf(token) !== -1) {
			;(['style', 'variant', 'weight', 'stretch'] as [
				'style',
				'variant',
				'weight',
				'stretch'
			]).forEach(prop => {
				font[prop] = token
			})
			isLocked = true
			continue
		}

		if (fontWeightKeywords.indexOf(token) !== -1) {
			if (isLocked) {
				continue
			}
			font.weight = token
			continue
		}

		if (fontStyleKeywords.indexOf(token) !== -1) {
			if (isLocked) {
				continue
			}
			font.style = token
			continue
		}

		if (fontStretchKeywords.indexOf(token) !== -1) {
			if (isLocked) {
				continue
			}
			font.stretch = token
			continue
		}

		if (helpers.isSize(token)) {
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
			return font
		}

		if (font.variant !== 'normal') {
			throw error('Unknown or unsupported font token: ' + font.variant)
		}

		if (isLocked) {
			continue
		}
		font.variant = token
	}

	throw error('Missing required font-size.')
}

function error(message: string) {
	return new Error(errorPrefix + message)
}

function parseLineHeight(value: string) {
	const parsed = parseFloat(value)
	if (parsed.toString() === value) {
		return parsed
	}
	return value
}
