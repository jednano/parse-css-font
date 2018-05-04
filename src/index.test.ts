import test, { Context, TestContext } from 'ava';
import parse from '.';
const globalKeywords = require('css-global-keywords');
const systemFontKeywords = require('css-system-font-keywords');
const fontWeightKeywords = require('css-font-weight-keywords');
const fontStyleKeywords = require('css-font-style-keywords');
const fontStretchKeywords = require('css-font-stretch-keywords');

type T = TestContext & Context<any>;

test('throws when attempting to parse an empty string', (t) => {
	t.throws(
		() => {
			parse('');
		},
		/Cannot parse an empty string\.$/,
	);
});

test('throws when the font-size is missing', (t) => {
	t.throws(
		() => {
			parse('foo');
		},
		/Missing required font-size\.$/,
	);
});

test('throws when the font-family is missing', (t) => {
	t.throws(
		() => {
			parse('1rem');
		},
		/Missing required font-family\.$/,
	);
});

systemFontKeywords.forEach((systemFont: string) => {
	test('detects system font keyword: ' + systemFont, (t) => {
		t.deepEqual(
			parse(systemFont),
			{ system: systemFont },
		);
	});
});

test('detects size: 1rem and family: serif', (t) => {
	compare(t,
		parse('1rem serif'),
		{
			family: ['serif'],
			size: '1rem',
		},
	);
});

test('detects line-height: 1.2', (t) => {
	compare(t,
		parse('1rem/1.2 serif'),
		{
			lineHeight: 1.2,
		},
	);
});

test('preserves line-height unit', (t) => {
	compare(t,
		parse('1rem/1.2em serif'),
		{
			lineHeight: '1.2em',
		},
	);
});

test('unquotes each font-family', (t) => {
	compare(t,
		parse('1rem/1.2em foo bar, "foo bar baz", \'foo\', bar, baz'),
		{
			family: ['foo bar', 'foo bar baz', 'foo', 'bar', 'baz'],
		},
	);
});

test('preserves functions with spaces and commas inside', (t) => {
	compare(t,
		parse('fn(a, b, c)/fn(x, y, z) serif'),
		{
			lineHeight: 'fn(x, y, z)',
			size: 'fn(a, b, c)',
		},
	);
});

test('preserves functions with slashes inside', (t) => {
	compare(t,
		parse('fn(a / b / c)/fn(x / y / z) serif'),
		{
			lineHeight: 'fn(x / y / z)',
			size: 'fn(a / b / c)',
		},
	);
});

fontWeightKeywords.forEach((weight: string) => {
	test('detects weight: ' + weight, (t) => {
		compare(t,
			parse(weight + ' 1rem serif'),
			{ weight },
		);
	});
});

fontStyleKeywords.forEach((style: string) => {
	test('detects style: ' + style, (t) => {
		compare(t,
			parse(style + ' 1rem serif'),
			{ style },
		);
	});
});

fontStretchKeywords.forEach((stretch: string) => {
	test('detects stretch: ' + stretch, (t) => {
		compare(t,
			parse(stretch + ' 1rem serif'),
			{ stretch },
		);
	});
});

test('parses an undetected property as variant', (t) => {
	compare(t,
		parse('foo 1rem serif'),
		{ variant: 'foo' },
	);
});

test('throws with two undetected properties: foo bar', (t) => {
	t.throws(
		() => {
			parse('foo bar');
		},
		/Unknown or unsupported font token: foo/,
	);
});

test('detects style, variant, weight, stretch, size, lineHeight and family', (t) => {
	[
		'italic foo 500 condensed',
		'condensed 500 foo italic',
	].forEach((font: string) => {
		t.deepEqual(
			parse(font + ' 1rem/1.2 serif'),
			{
				family: ['serif'],
				lineHeight: 1.2,
				size: '1rem',
				stretch: 'condensed',
				style: 'italic',
				variant: 'foo',
				weight: '500',
			},
		);
	});
});

test('overrides all props before size with normal when one prop is normal', (t) => {
	t.deepEqual(
		parse('normal italic foo 500 condensed 1rem/1.2 serif'),
		{
			family: ['serif'],
			lineHeight: 1.2,
			size: '1rem',
			stretch: 'normal',
			style: 'normal',
			variant: 'normal',
			weight: 'normal',
		},
	);
});

globalKeywords.forEach((value: string) => {
	test('overrides all props before size with ' + value + ' when one prop is ' + value, (t) => {
		t.deepEqual(
			parse('italic ' + value + ' 500 condensed 1rem/1.2 serif'),
			{
				family: ['serif'],
				lineHeight: 1.2,
				size: '1rem',
				stretch: value,
				style: value,
				variant: value,
				weight: value,
			},
		);
	});
});

test('returns defaults for style, variant, weight, stretch and lineHeight', (t) => {
	t.deepEqual(
		parse('1rem serif'),
		{
			family: ['serif'],
			lineHeight: 'normal',
			size: '1rem',
			stretch: 'normal',
			style: 'normal',
			variant: 'normal',
			weight: 'normal',
		},
	);
});

function compare<U, V>(t: T, o1: U, o2: V) {
	Object.keys(o2).forEach((key: string) => {
		t.deepEqual(o1[key], o2[key]);
	});
}
