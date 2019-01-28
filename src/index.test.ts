const globalKeywords = require('css-global-keywords')
const systemFontKeywords = require('css-system-font-keywords')
const fontWeightKeywords = require('css-font-weight-keywords')
const fontStyleKeywords = require('css-font-style-keywords')
const fontStretchKeywords = require('css-font-stretch-keywords')

import parse from '.'

describe('parse-css-font', () => {
	it('throws when attempting to parse a number', () => {
		expect(() => {
			parse((42 as any) as string)
		}).toThrow(/Expected a string\.$/)
	})

	it('throws when attempting to parse an empty string', () => {
		expect(() => {
			parse('')
		}).toThrow(/Cannot parse an empty string\.$/)
	})

	it('throws when the font-size is missing', () => {
		expect(() => {
			parse('foo')
		}).toThrow(/Missing required font-size\.$/)
	})

	it('throws when the font-family is missing', () => {
		expect(() => {
			parse('1rem')
		}).toThrow(/Missing required font-family\.$/)
	})

	systemFontKeywords.forEach((systemFont: string) => {
		it('detects system font keyword: ' + systemFont, () => {
			expect(parse(systemFont)).toEqual({ system: systemFont })
		})
	})

	it('detects size: 1rem and family: serif', () => {
		expect(parse('1rem serif')).toEqual(
			expect.objectContaining({
				family: ['serif'],
				size: '1rem',
			}),
		)
	})

	it('detects line-height: 1.2', () => {
		expect(parse('1rem/1.2 serif')).toEqual(
			expect.objectContaining({
				lineHeight: 1.2,
			}),
		)
	})

	it('detects font-size and line-height when using spaces around "/" separator', () => {
		expect(parse('1rem / 1.2 serif')).toEqual(
			expect.objectContaining({
				lineHeight: 1.2,
				size: '1rem',
			}),
		)
	})

	it('preserves line-height unit', () => {
		expect(parse('1rem/1.2em serif')).toEqual(
			expect.objectContaining({
				lineHeight: '1.2em',
			}),
		)
	})

	it('unquotes each font-family', () => {
		expect(
			parse('1rem/1.2em foo bar, "foo bar baz", \'foo\', bar, baz'),
		).toEqual(
			expect.objectContaining({
				family: ['foo bar', 'foo bar baz', 'foo', 'bar', 'baz'],
			}),
		)
	})

	it('preserves functions with spaces and commas inside', () => {
		expect(parse('fn(a, b, c)/fn(x, y, z) serif')).toEqual(
			expect.objectContaining({
				lineHeight: 'fn(x, y, z)',
				size: 'fn(a, b, c)',
			}),
		)
	})

	it('preserves functions with slashes inside', () => {
		expect(parse('fn(a / b / c)/fn(x / y / z) serif')).toEqual(
			expect.objectContaining({
				lineHeight: 'fn(x / y / z)',
				size: 'fn(a / b / c)',
			}),
		)
	})

	fontWeightKeywords.forEach((weight: string) => {
		it('detects weight: ' + weight, () => {
			expect(parse(weight + ' 1rem serif')).toEqual(
				expect.objectContaining({ weight }),
			)
		})
	})

	fontStyleKeywords.forEach((style: string) => {
		it('detects style: ' + style, () => {
			expect(parse(style + ' 1rem serif')).toEqual(
				expect.objectContaining({ style }),
			)
		})
	})

	fontStretchKeywords.forEach((stretch: string) => {
		it('detects stretch: ' + stretch, () => {
			expect(parse(stretch + ' 1rem serif')).toEqual(
				expect.objectContaining({ stretch }),
			)
		})
	})

	it('parses an undetected property as variant', () => {
		expect(parse('foo 1rem serif')).toEqual(
			expect.objectContaining({ variant: 'foo' }),
		)
	})

	it('throws with two undetected properties: foo bar', () => {
		expect(() => {
			parse('foo bar')
		}).toThrow(/Unknown or unsupported font token: foo/)
	})

	it('detects style, variant, weight, stretch, size, lineHeight and family', () => {
		;['italic foo 500 condensed', 'condensed 500 foo italic'].forEach(
			(font: string) => {
				expect(parse(font + ' 1rem/1.2 serif')).toEqual({
					family: ['serif'],
					lineHeight: 1.2,
					size: '1rem',
					stretch: 'condensed',
					style: 'italic',
					variant: 'foo',
					weight: '500',
				})
			},
		)
	})

	it('overrides all props before size with normal when one prop is normal', () => {
		expect(parse('normal italic foo 500 condensed 1rem/1.2 serif')).toEqual({
			family: ['serif'],
			lineHeight: 1.2,
			size: '1rem',
			stretch: 'normal',
			style: 'normal',
			variant: 'normal',
			weight: 'normal',
		})
	})

	globalKeywords.forEach((value: string) => {
		it(
			'overrides all props before size with ' +
				value +
				' when one prop is ' +
				value,
			() => {
				expect(
					parse('italic ' + value + ' 500 condensed 1rem/1.2 serif'),
				).toEqual({
					family: ['serif'],
					lineHeight: 1.2,
					size: '1rem',
					stretch: value,
					style: value,
					variant: value,
					weight: value,
				})
			},
		)
	})

	it('returns defaults for style, variant, weight, stretch and lineHeight', () => {
		expect(parse('1rem serif')).toEqual({
			family: ['serif'],
			lineHeight: 'normal',
			size: '1rem',
			stretch: 'normal',
			style: 'normal',
			variant: 'normal',
			weight: 'normal',
		})
	})
})
