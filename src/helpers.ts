const cssFontSizeKeywords = require('css-font-size-keywords');

export function isSize(value: string) {
	return /^[\d\.]/.test(value)
		|| value.indexOf('/') !== -1
		|| cssFontSizeKeywords.indexOf(value) !== -1
	;
}
