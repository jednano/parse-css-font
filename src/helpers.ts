const fontWeightKeywords = require('css-font-weight-keywords');
const cssFontSizeKeywords = require('css-font-size-keywords');
const fontStretchKeywords = require('css-font-stretch-keywords');

const sizePattern = /^\+?[\d\.]/;
const numberPrefixPattern = /^(\+|-)?(\d|\.)/;
const percentPattern = /%$/;

export function isSize(value: string) {
	return sizePattern.test(value)
		|| value.indexOf('/') !== -1
		|| cssFontSizeKeywords.indexOf(value) !== -1
	;
}

export function isWeight(value: string) {
	return fontWeightKeywords.indexOf(value) !== -1
		|| isOnlyNumber(value);
}

export function isStretch(value: string) {
	return fontStretchKeywords.indexOf(value) !== -1
		|| isOnlyPercentNumber(value);
}

function isOnlyPercentNumber(value: string): boolean {
	if (percentPattern.test(value)) {
		return isOnlyNumber(value.substring(0, value.length - 1));
	}
	return false;
}

function isOnlyNumber(value: string): boolean {
	const match = numberPrefixPattern.exec(value);
	if (!match) {
		return false;
	}
	const [, sign, dot] = match;
	if (sign === '+') {
		value = value.substring(1);
	}
	if (dot === '.') {
		if (sign === '-') {
			value = '-0' + value.substring(1);
		} else {
			value = '0' + value;
		}
	}
	return parseFloat(value).toString() === value;
}
