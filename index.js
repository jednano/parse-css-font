'use strict'

var unquote = require('unquote');
var globalKeywords = require('css-global-keywords');
var systemFontKeywords = require('css-system-font-keywords');
var fontWeightKeywords = require('css-font-weight-keywords');
var fontStyleKeywords = require('css-font-style-keywords');
var fontStretchKeywords = require('css-font-stretch-keywords');
var cssListHelpers = require('css-list-helpers');
var cssFontSizeKeywords = require('css-font-size-keywords');


module.exports = function parseFont (value) {
	if (typeof value !== 'string') throw error('Font argument must be a string.')

	if (value === '') {
		throw error('Cannot parse an empty string.');
	}

	if (systemFontKeywords.indexOf(value) !== -1) {
		return { system: value };
	}

	var font = {
		style: 'normal',
		variant: 'normal',
		weight: 'normal',
		stretch: 'normal',
		size: undefined,
		lineHeight: 'normal',
		family: []
	};

	var isLocked = false;
	var tokens = cssListHelpers.splitBySpaces(value);
	var token = tokens.shift();
	for (; token != null; token = tokens.shift()) {

		if (token === 'normal' || globalKeywords.indexOf(token) !== -1) {
			['style', 'variant', 'weight', 'stretch'].forEach(function(prop) {
				font[prop] = token;
			});
			isLocked = true;
			continue;
		}

		if (fontWeightKeywords.indexOf(token) !== -1) {
			if (isLocked) {
				continue;
			}
			font.weight = token;
			continue;
		}

		if (fontStyleKeywords.indexOf(token) !== -1) {
			if (isLocked) {
				continue;
			}
			font.style = token;
			continue;
		}

		if (fontStretchKeywords.indexOf(token) !== -1) {
			if (isLocked) {
				continue;
			}
			font.stretch = token;
			continue;
		}

		if (isSize(token)) {
			var parts = cssListHelpers.split(token, ['/']);
			font.size = parts[0];
			if (parts[1] != null) {
				font.lineHeight = parseLineHeight(parts[1]);
			}
			if (!tokens.length) {
				throw error('Missing required font-family.');
			}
			font.family = cssListHelpers.splitByCommas(tokens.join(' ')).map(unquote);

			return font;
		}

		if (font.variant !== 'normal') {
			throw error('Unknown or unsupported font token: ' + font.variant);
		}

		if (isLocked) {
			continue;
		}
		font.variant = token;
	}

	throw error('Missing required font-size.');
}

function error(message) {
	return new Error('[parse-css-font] ' + message);
}

function parseLineHeight(value) {
	var parsed = parseFloat(value);
	if (parsed.toString() === value) {
		return parsed;
	}
	return value;
}


function isSize(value) {
	return /^[\d\.]/.test(value)
		|| value.indexOf('/') !== -1
		|| cssFontSizeKeywords.indexOf(value) !== -1
	;
}
