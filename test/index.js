var tape = require('tape');
var globalKeywords = require('css-global-keywords');
var systemFontKeywords = require('css-system-font-keywords');
var fontWeightKeywords = require('css-font-weight-keywords');
var fontStyleKeywords = require('css-font-style-keywords');
var fontStretchKeywords = require('css-font-stretch-keywords');

var parse = require('..');

tape('parse-css-font', function(t) {

	t.throws(
		function() {
			parse('');
		},
		/Cannot parse an empty string/,
		'throws when attempting to parse an empty string'
	);

	t.throws(
		function() {
			parse('foo');
		},
		/Missing required font-size/,
		'throws when the font-size is missing'
	);

	t.throws(
		function() {
			parse('1rem');
		},
		/Missing required font-family/,
		'throws when the font-family is missing'
	);

	systemFontKeywords.forEach(function(systemFont) {
		t.deepEqual(
			parse(systemFont),
			{ system: systemFont },
			'detects system font keyword: ' + systemFont
		);
	});

	compare(t,
		parse('1rem serif'),
		{
			size: '1rem',
			family: ['serif']
		},
		'detects size: 1rem and family: serif'
	);

	compare(t,
		parse('1rem/1.2 serif'),
		{
			lineHeight: 1.2
		},
		'detects line-height: 1.2'
	);

	compare(t,
		parse('1rem/1.2em serif'),
		{
			lineHeight: '1.2em'
		},
		'preserves line-height unit'
	);

	compare(t,
		parse('1rem/1.2em foo bar, "foo bar baz", \'foo\', bar, baz'),
		{
			family: ['foo bar', 'foo bar baz', 'foo', 'bar', 'baz']
		},
		'unquotes each font-family'
	);

	compare(t,
		parse('fn(a, b, c)/fn(x, y, z) serif'),
		{
			size: 'fn(a, b, c)',
			lineHeight: 'fn(x, y, z)'
		},
		'preserves functions with spaces and commas inside'
	);

	compare(t,
		parse('fn(a / b / c)/fn(x / y / z) serif'),
		{
			size: 'fn(a / b / c)',
			lineHeight: 'fn(x / y / z)'
		},
		'preserves functions with slashes inside'
	);

	fontWeightKeywords.forEach(function(weight) {
		compare(t,
			parse(weight + ' 1rem serif'),
			{ weight: weight },
			'detects weight: ' + weight
		);
	});

	fontStyleKeywords.forEach(function(style) {
		compare(t,
			parse(style + ' 1rem serif'),
			{ style: style },
			'detects style: ' + style
		);
	});

	fontStretchKeywords.forEach(function(stretch) {
		compare(t,
			parse(stretch + ' 1rem serif'),
			{ stretch: stretch },
			'detects stretch: ' + stretch
		);
	});

	compare(t,
		parse('foo 1rem serif'),
		{ variant: 'foo' },
		'parses an undetected property as variant'
	);

	t.throws(
		function() {
			parse('foo bar');
		},
		/Unknown or unsupported font token: foo/,
		'throws with two undetected properties: foo bar'
	);

	[
		'italic foo 500 condensed',
		'condensed 500 foo italic'
	].forEach(function(font) {
		t.deepEqual(
			parse(font + ' 1rem/1.2 serif'),
			{
				style: 'italic',
				variant: 'foo',
				weight: '500',
				stretch: 'condensed',
				size: '1rem',
				lineHeight: 1.2,
				family: ['serif']
			},
			'detects style, variant, weight, stretch, size, lineHeight and family'
		);
	});

	t.deepEqual(
		parse('normal italic foo 500 condensed 1rem/1.2 serif'),
		{
			style: 'normal',
			variant: 'normal',
			weight: 'normal',
			stretch: 'normal',
			size: '1rem',
			lineHeight: 1.2,
			family: ['serif']
		},
		'overrides all props before size with normal when one prop is normal'
	);

	globalKeywords.forEach(function(value) {
		t.deepEqual(
			parse('italic ' + value + ' 500 condensed 1rem/1.2 serif'),
			{
				style: value,
				variant: value,
				weight: value,
				stretch: value,
				size: '1rem',
				lineHeight: 1.2,
				family: ['serif']
			},
			'overrides all props before size with ' + value + ' when one prop is ' + value
		);
	});

	t.deepEqual(
		parse('1rem serif'),
		{
			size: '1rem',
			family: ['serif'],
			style: 'normal',
			variant: 'normal',
			weight: 'normal',
			stretch: 'normal',
			lineHeight: 'normal'
		},
		'returns defaults for style, variant, weight, stretch and lineHeight'
	);

	t.end();
});

function compare(t, o1, o2, message) {
	Object.keys(o2).forEach(function(key) {
		t.deepEqual(o1[key], o2[key], message);
	});
}
