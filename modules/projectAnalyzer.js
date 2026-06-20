'use strict';

const path = require('path');
const { exists, isFile, listDirSafe } = require('../utils/fs');

const ROOT_FILE_WARNING_THRESHOLD = 10;

/**
 * Detect which project type(s) are present based on manifest files.
 *
 * @param {string} cwd
 * @returns {string[]}
 */
function detectProjectTypes(cwd) {
	const types = [];
	if (exists(path.join(cwd, 'package.json'))) types.push('Node');
	if (exists(path.join(cwd, 'requirements.txt'))) types.push('Python');
	if (exists(path.join(cwd, 'go.mod'))) types.push('Go');
	return types;
}

/**
 * Analyze general project structure/hygiene.
 * Never throws. Always returns a usable result even on an
 * empty or unusual directory.
 *
 * @param {string} cwd
 * @returns {object}
 */
function analyzeProject(cwd) {
	const result = {
		types: [],
		hasReadme: false,
		hasGitignore: false,
		hasLockfile: false,
		lockfileName: null,
		rootFileCount: 0,
		tooManyRootFiles: false,
		issues: [],
	};

	result.types = detectProjectTypes(cwd);

	// README check (case-insensitive, common extensions).
	const entries = listDirSafe(cwd);
	const entryNames = entries.map((e) => e.name);

	result.hasReadme = entryNames.some((name) => /^readme(\.md|\.txt|\.rst)?$/i.test(name));
	result.hasGitignore = exists(path.join(cwd, '.gitignore'));

	if (exists(path.join(cwd, 'package-lock.json'))) {
		result.hasLockfile = true;
		result.lockfileName = 'package-lock.json';
	} else if (exists(path.join(cwd, 'yarn.lock'))) {
		result.hasLockfile = true;
		result.lockfileName = 'yarn.lock';
	} else if (exists(path.join(cwd, 'pnpm-lock.yaml'))) {
		result.hasLockfile = true;
		result.lockfileName = 'pnpm-lock.yaml';
	}

	// Count root-level files (not directories) for "suspicious structure" check.
	result.rootFileCount = entries.filter((e) => isFile(path.join(cwd, e.name))).length;
	result.tooManyRootFiles = result.rootFileCount > ROOT_FILE_WARNING_THRESHOLD;

	if (!result.hasReadme) {
		result.issues.push('missing README.md');
	}
	if (!result.hasGitignore) {
		result.issues.push('missing .gitignore');
	}
	// Only flag a missing lockfile if this looks like a Node project,
	// since lockfiles are a Node/JS-specific convention here.
	if (result.types.includes('Node') && !result.hasLockfile) {
		result.issues.push('missing lockfile (package-lock.json or yarn.lock)');
	}
	if (result.tooManyRootFiles) {
		result.issues.push(`too many root files (${result.rootFileCount} > ${ROOT_FILE_WARNING_THRESHOLD})`);
	}

	return result;
}

module.exports = { analyzeProject, detectProjectTypes, ROOT_FILE_WARNING_THRESHOLD };
