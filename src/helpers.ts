const fontWeightKeywords = require('css-font-weight-keywords');
const cssFontSizeKeywords = require('css-font-size-keywords');
const fontStretchKeywords = require('css-font-stretch-keywords');

export function isSize(value: string) {
	return /^\+?[\d\.]/.test(value)
		|| value.indexOf('/') !== -1
		|| cssFontSizeKeywords.indexOf(value) !== -1
	;
}

export function isWeight(value: string) {
	return fontWeightKeywords.indexOf(value) !== -1
		|| isOnlyNumber(value, false);
}

export function isStretch(value: string) {
	return fontStretchKeywords.indexOf(value) !== -1
		|| isOnlyNumber(value, true);
}

function isOnlyNumber(value: string, isPercent: boolean): boolean {
	const match = /^(\+|-)?(\d|\.)/.exec(value);
	if (match && (!isPercent || /%$/.test(value))) {
		let val = isPercent ? value.substring(0, value.length - 1) : value;
		if (match[1] === '+') {
			val = val.substring(1);
		}
		if (match[2] === '.') {
			if (match[1] === '-') {
				val = '-0' + val.substring(1);
			} else {
				val = '0' + val;
			}
		}
		return parseFloat(val).toString() === val;
	}
	return false;
}
