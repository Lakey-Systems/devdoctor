'use strict';

const { execSync } = require('child_process');

/**
 * Run a shell command synchronously and capture its output.
 * Never throws - returns a result object instead so callers
 * can handle failures gracefully (e.g. "not a git repo").
 *
 * @param {string} command - the command to run
 * @param {object} [options]
 * @param {string} [options.cwd] - working directory
 * @returns {{ ok: boolean, stdout: string, stderr: string, code: number }}
 */
function run(command, options = {}) {
	try {
		const stdout = execSync(command, {
			cwd: options.cwd || process.cwd(),
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe'],
			windowsHide: true,
		});
		return { ok: true, stdout: stdout.toString(), stderr: '', code: 0 };
	} catch (err) {
		return {
			ok: false,
			stdout: err.stdout ? err.stdout.toString() : '',
			stderr: err.stderr ? err.stderr.toString() : (err.message || ''),
			code: typeof err.status === 'number' ? err.status : 1,
		};
	}
}

module.exports = { run };
