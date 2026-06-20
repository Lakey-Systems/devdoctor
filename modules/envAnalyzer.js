'use strict';

const path = require('path');
const { readFileSafe, exists } = require('../utils/fs');

/**
 * Parse a .env-style file into a Map of key -> value.
 * Tolerant of comments, blank lines, quoted values, and
 * malformed lines (which are simply skipped, not thrown on).
 *
 * @param {string} content
 * @returns {{ keys: Map<string,string>, malformedLines: number }}
 */
function parseEnvContent(content) {
	const keys = new Map();
	let malformedLines = 0;

	if (!content) return { keys, malformedLines };

	const lines = content.split('\n');
	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (line.length === 0) continue;
		if (line.startsWith('#')) continue;

		const eqIndex = line.indexOf('=');
		if (eqIndex === -1) {
			malformedLines += 1;
			continue;
		}

		const key = line.slice(0, eqIndex).trim();
		let value = line.slice(eqIndex + 1).trim();

		if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
			malformedLines += 1;
			continue;
		}

		// Strip surrounding quotes if present.
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		keys.set(key, value);
	}

	return { keys, malformedLines };
}

/**
 * Analyze .env vs .env.example for the given directory.
 * Never throws. Handles missing files gracefully.
 *
 * @param {string} cwd
 * @returns {object}
 */
function analyzeEnv(cwd) {
	const result = {
		envExists: false,
		envExampleExists: false,
		missingKeys: [],      // in .env.example but not in .env
		extraKeys: [],         // in .env but not in .env.example
		emptyValueKeys: [],    // present in .env but value is empty
		malformedLines: 0,
		issues: [],
	};

	const envPath = path.join(cwd, '.env');
	const envExamplePath = path.join(cwd, '.env.example');

	result.envExists = exists(envPath);
	result.envExampleExists = exists(envExamplePath);

	if (!result.envExists && !result.envExampleExists) {
		result.issues.push('no .env or .env.example file found');
		return result;
	}

	const envContent = result.envExists ? readFileSafe(envPath) : null;
	const exampleContent = result.envExampleExists ? readFileSafe(envExamplePath) : null;

	const envParsed = parseEnvContent(envContent);
	const exampleParsed = parseEnvContent(exampleContent);

	result.malformedLines = envParsed.malformedLines + exampleParsed.malformedLines;

	if (result.envExampleExists && !result.envExists) {
		result.issues.push('.env.example exists but .env is missing');
	}

	if (result.envExists && !result.envExampleExists) {
		result.issues.push('.env exists but .env.example is missing (hard to onboard new devs)');
	}

	// Compare key sets only when both files exist.
	if (result.envExists && result.envExampleExists) {
		for (const key of exampleParsed.keys.keys()) {
			if (!envParsed.keys.has(key)) {
				result.missingKeys.push(key);
			}
		}
		for (const key of envParsed.keys.keys()) {
			if (!exampleParsed.keys.has(key)) {
				result.extraKeys.push(key);
			}
		}
	}

	// Empty values are worth flagging regardless of example file presence.
	if (result.envExists) {
		for (const [key, value] of envParsed.keys.entries()) {
			if (value.length === 0) {
				result.emptyValueKeys.push(key);
			}
		}
	}

	if (result.missingKeys.length > 0) {
		result.issues.push(`${result.missingKeys.length} key(s) missing from .env`);
	}
	if (result.emptyValueKeys.length > 0) {
		result.issues.push(`${result.emptyValueKeys.length} key(s) have empty values in .env`);
	}
	if (result.extraKeys.length > 0) {
		result.issues.push(`${result.extraKeys.length} key(s) in .env not documented in .env.example`);
	}
	if (result.malformedLines > 0) {
		result.issues.push(`${result.malformedLines} malformed line(s) in env file(s)`);
	}

	return result;
}

module.exports = { analyzeEnv, parseEnvContent };
