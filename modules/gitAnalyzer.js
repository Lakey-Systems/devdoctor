'use strict';

const { run } = require('../utils/exec');

const WEAK_COMMIT_PATTERNS = [
	/^update$/i,
	/^updates$/i,
	/^update stuff$/i,
	/^fix$/i,
	/^fixes$/i,
	/^fix stuff$/i,
	/^stuff$/i,
	/^wip$/i,
	/^misc$/i,
	/^changes$/i,
	/^minor changes$/i,
	/^\.$/,
];

function isWeakCommit(message) {
	const trimmed = (message || '').trim();
	if (trimmed.length === 0) return false;
	return WEAK_COMMIT_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Analyze git state for the given directory.
 * Always returns a structured, deterministic result object.
 * Never throws - if not a git repo, isRepo is false and the
 * rest of the fields are sensible empty defaults.
 *
 * @param {string} cwd
 * @returns {object}
 */
function analyzeGit(cwd) {
	const result = {
		isRepo: false,
		branch: null,
		isEmptyRepo: false,
		untrackedFiles: [],
		modifiedFiles: [],
		stagedFiles: [],
		deletedFiles: [],
		recentCommits: [],
		weakCommits: [],
		issues: [],
		error: null,
	};

	// Confirm this is a git repo at all.
	const repoCheck = run('git rev-parse --is-inside-work-tree', { cwd });
	if (!repoCheck.ok || repoCheck.stdout.trim() !== 'true') {
		result.error = 'Not a git repository';
		result.issues.push('not a git repository');
		return result;
	}

	result.isRepo = true;

	// Current branch (may be empty on a fresh repo with no commits).
	const branchResult = run('git branch --show-current', { cwd });
	result.branch = branchResult.ok ? branchResult.stdout.trim() || null : null;

	// Porcelain status for untracked / modified / staged / deleted files.
	const statusResult = run('git status --porcelain', { cwd });
	if (statusResult.ok) {
		const lines = statusResult.stdout.split('\n').filter((l) => l.trim().length > 0);
		for (const rawLine of lines) {
			const statusCode = rawLine.slice(0, 2);
			const filePath = rawLine.slice(3).trim();

			if (statusCode === '??') {
				result.untrackedFiles.push(filePath);
				continue;
			}
			if (statusCode.includes('D')) {
				result.deletedFiles.push(filePath);
			}
			if (statusCode.includes('M')) {
				result.modifiedFiles.push(filePath);
			}
			// Staged: first column is not space and not '?'
			if (statusCode[0] !== ' ' && statusCode[0] !== '?') {
				result.stagedFiles.push(filePath);
			}
		}
	}

	// Recent commit log - handle empty repo (no commits yet) gracefully.
	const logResult = run('git log -n 5 --pretty=format:%s', { cwd });
	if (logResult.ok && logResult.stdout.trim().length > 0) {
		result.recentCommits = logResult.stdout.split('\n').filter(Boolean);
	} else {
		// Either an empty repo or some other benign log failure.
		result.isEmptyRepo = true;
	}

	// Detect weak commit messages among recent commits.
	result.weakCommits = result.recentCommits.filter(isWeakCommit);

	// Build a flat list of human-readable issues.
	if (result.isEmptyRepo) {
		result.issues.push('repository has no commits yet');
	}
	if (result.untrackedFiles.length > 0) {
		result.issues.push(`${result.untrackedFiles.length} untracked file(s)`);
	}
	if (result.modifiedFiles.length > 0) {
		result.issues.push(`${result.modifiedFiles.length} modified file(s)`);
	}
	if (result.weakCommits.length > 0) {
		result.issues.push(`${result.weakCommits.length} weak commit message(s)`);
	}

	return result;
}

module.exports = { analyzeGit, isWeakCommit, WEAK_COMMIT_PATTERNS };
