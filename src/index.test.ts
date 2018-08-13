import test, { Context, TestContext } from 'ava';
import parse from '.';
const globalKeywords = require('css-global-keywords');
const systemFontKeywords = require('css-system-font-keywords');
const fontWeightKeywords = require('css-font-weight-keywords');
const fontStyleKeywords = require('css-font-style-keywords');
const fontStretchKeywords = require('css-font-stretch-keywords');

const numberValues = [
	'1',
	'56',
	'22.876',
	'87',
	'99.999999999',
	'100.6',
	'123',
	'200.89',
	'23.300569',
	'321',
	'254',
	'328.907',
];

const fontWeightNumberValues = numberValues.concat([
	'999',
	'999.999999999',
]);

const invalidFontWeightNumberValues = [
	'0.1',
	'.34556',
	'1000.0000000000001',
	'23423456',
];

const fontStetchPercentValues = numberValues.concat([
	'.256',
	'0.75',
	'+.8',
	'+26.8',
]).map((val) => val + '%');

const invalidFontStetchPercentValues = numberValues.concat([
	'.234',
	'53',
]).map((val) => `-${val}%`);

const lineHeightNumberValues = numberValues.concat([
	'.256',
	'0.75',
	'+.8',
	'+26.8',
]);

const unitAndPercentNumberValues = numberValues.map((val) => val + '%')
		.concat(numberValues.map((val) => val + 'rem'))
		.concat(numberValues.map((val) => val + 'em'))
		.concat(numberValues.map((val) => val + 'px'));

test('throws when attempting to parse a number', (t) => {
	t.throws(
		() => {
			parse(42 as any as string);
		},
		/Expected a string\.$/,
	);
});

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

invalidFontWeightNumberValues.forEach((invalidWeight: string) => {
	test('throws when the font-weight is invalid number: ' + invalidWeight, (t) => {
		t.throws(
			() => {
				parse(invalidWeight + ' 1rem serif');
			},
			/Invalid font-weight value: must be between 1 and 1000 \(inclusive\)\.$/,
		);
	});
});

invalidFontStetchPercentValues.forEach((invalidStretch: string) => {
	test('throws when the font-stretch is negative percent: ' + invalidStretch, (t) => {
		t.throws(
			() => {
				parse(invalidStretch + ' 1rem serif');
			},
			/Invalid font-stretch value: must not be negative\.$/,
		);
	});
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

unitAndPercentNumberValues.forEach((fontSize: string) => {
	test('detects fontSize: ' + fontSize, (t) => {
		compare(t,
			parse(fontSize + ' serif'),
			{ size: fontSize },
		);
	});
});

lineHeightNumberValues.forEach((lineHeight: string) => {
	test('detects lineHeight: ' + lineHeight, (t) => {
		compare(t,
			parse('23.98%/' + lineHeight + ' 1rem serif'),
			{ lineHeight: parseFloat(lineHeight) },
		);
	});
});

unitAndPercentNumberValues.forEach((lineHeight: string) => {
	test('detects lineHeight units: ' + lineHeight, (t) => {
		compare(t,
			parse('2px/' + lineHeight + ' 1rem serif'),
			{ lineHeight },
		);
	});
});

test('detects line-height: 1.2', (t) => {
	compare(t,
		parse('1rem/1.2 serif'),
		{
			lineHeight: 1.2,
		},
	);
});

test('detects font-size and line-height when using spaces around "/" separator', (t) => {
	compare(t,
		parse('1rem / 1.2 serif'),
		{
			lineHeight: 1.2,
			size: '1rem',
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

fontWeightKeywords.concat(fontWeightNumberValues).forEach((weight: string) => {
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

fontStretchKeywords.concat(fontStetchPercentValues).forEach((stretch: string) => {
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

function compare<U, V>(t: TestContext & Context<any>, o1: U, o2: V) {
	Object.keys(o2).forEach((key: string) => {
		t.deepEqual(o1[key], o2[key]);
	});
}
