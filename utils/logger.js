'use strict';

/**
 * Minimal terminal logger. Keeps output deterministic and
 * dependency-free (no chalk) by using raw ANSI codes, with a
 * graceful no-color fallback when the terminal doesn't support it.
 */

const supportsColor = Boolean(process.stdout && process.stdout.isTTY) &&
	process.env.NO_COLOR === undefined;

const codes = {
	reset: '\x1b[0m',
	dim: '\x1b[2m',
	bold: '\x1b[1m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	red: '\x1b[31m',
	cyan: '\x1b[36m',
	gray: '\x1b[90m',
};

function color(text, code) {
	if (!supportsColor) return text;
	return `${code}${text}${codes.reset}`;
}

const ICONS = {
	ok: '\u2714',       // ✅
	warn: '\u26A0',     // ⚠️
	bad: '\u274C',      // ❌
};

function ok(text) {
	return color(`${ICONS.ok} ${text}`, codes.green);
}

function warn(text) {
	return color(`${ICONS.warn} ${text}`, codes.yellow);
}

function bad(text) {
	return color(`${ICONS.bad} ${text}`, codes.red);
}

function heading(text) {
	return color(text, codes.bold);
}

function dim(text) {
	return color(text, codes.gray);
}

function section(title) {
	console.log('');
	console.log(heading(`[${title}]`));
}

function line(text = '') {
	console.log(text);
}

function bullet(text) {
	console.log(`  - ${text}`);
}

module.exports = {
	ICONS,
	ok,
	warn,
	bad,
	heading,
	dim,
	section,
	line,
	bullet,
};