#!/usr/bin/env node

'use strict';

const path = require('path');
const logger = require('./utils/logger');

const COMMANDS = {
	check: require('./commands/check'),
	git: require('./commands/git'),
	env: require('./commands/env'),
	project: require('./commands/project'),
	deps: require('./commands/deps'),
	fix: require('./commands/fix'),
};

const HELP_TEXT = `
DevDoctor - local project health scanner

Usage:
  devdoctor <command>

Core commands:
  check     Full diagnostic (git, env, deps, project, code) + health score
  fix       Apply safe automated fixes (gitignore, env.example, formatting)

Inspect:
  git       Git state (branch, changes, weak commits)
  env       Environment config consistency (.env vs .env.example)
  deps      Dependency hygiene (missing deps, lockfile, risky versions)
  project   Project structure (README, gitignore, lockfile, root layout)

Other:
  help      Show this help

Examples:
  devdoctor check
  devdoctor git
  devdoctor fix
`;

function printHelp() {
	console.log(HELP_TEXT.trim());
	console.log('');
}

function main() {
	const args = process.argv.slice(2);
	const command = args[0];
	const cwd = process.cwd();

	if (!command || command === 'help' || command === '--help' || command === '-h') {
		printHelp();
		return;
	}

	if (command === '--version' || command === '-v') {
		const pkg = require('./package.json');
		console.log(pkg.version);
		return;
	}

	const handler = COMMANDS[command];

	if (!handler) {
		logger.line(logger.bad(`Unknown command: ${command}`));
		logger.line('');
		printHelp();
		process.exitCode = 1;
		return;
	}

	try {
		handler.run(cwd);
	} catch (err) {
		// Last-resort safety net - the analyzers/commands are written to
		// never throw, but if something unexpected happens we still want
		// a graceful, non-crashing exit rather than a raw stack trace.
		logger.line(logger.bad('DevDoctor encountered an unexpected error:'));
		logger.line(`  ${err && err.message ? err.message : String(err)}`);
		process.exitCode = 1;
	}
}

main();
