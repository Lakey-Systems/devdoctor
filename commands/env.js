'use strict';

const { analyzeEnv } = require('../modules/envAnalyzer');
const logger = require('../utils/logger');

/**
 * Print the detailed [Env] section given an analyzeEnv() result.
 * Exported so commands/check.js can reuse the exact same output.
 */
function printEnvDetails(env) {
	logger.section('Env');

	if (!env.envExists && !env.envExampleExists) {
		logger.line(`  ${logger.dim('no .env or .env.example file found')}`);
		return;
	}

	logger.line(`  .env: ${env.envExists ? 'found' : logger.dim('missing')}`);
	logger.line(`  .env.example: ${env.envExampleExists ? 'found' : logger.dim('missing')}`);

	if (env.missingKeys.length > 0) {
		logger.bullet(`missing: ${env.missingKeys.join(', ')}`);
	}
	if (env.emptyValueKeys.length > 0) {
		logger.bullet(`empty: ${env.emptyValueKeys.join(', ')}`);
	}
	if (env.extraKeys.length > 0) {
		logger.bullet(`undocumented in .env.example: ${env.extraKeys.join(', ')}`);
	}
	if (env.malformedLines > 0) {
		logger.bullet(`malformed lines: ${env.malformedLines}`);
	}

	if (
		env.missingKeys.length === 0 &&
		env.emptyValueKeys.length === 0 &&
		env.extraKeys.length === 0 &&
		env.malformedLines === 0
	) {
		logger.bullet('no issues found');
	}
}

function run(cwd) {
	const env = analyzeEnv(cwd);
	printEnvDetails(env);
	return env;
}

module.exports = { run, printEnvDetails };
