'use strict';

const { analyzeGit } = require('../modules/gitAnalyzer');
const logger = require('../utils/logger');

function printList(label, items) {
	if (!items || items.length === 0) return;

	logger.line(
		`  ${logger.dim(label)} ${items.slice(0, 5).join(', ')}${
			items.length > 5 ? `, ... (+${items.length - 5} more)` : ''
		}`
	);
}

function printGitDetails(git) {
	logger.section('Git');

	if (!git.isRepo) {
		logger.line(`  ${logger.dim('not a git repository')}`);
		return git;
	}

	logger.line(`  branch: ${git.branch || logger.dim('(none)')}`);

	const empty = git.isEmptyRepo === true;

	if (empty) {
		logger.bullet('repository has no commits yet');
	}

	const untrackedCount = git.untrackedFiles?.length || 0;
	const modifiedCount = git.modifiedFiles?.length || 0;
	const weakCount = git.weakCommits?.length || 0;

	logger.bullet(`untracked files: ${untrackedCount}`);
	logger.bullet(`modified files: ${modifiedCount}`);

	if (weakCount > 0) {
		logger.bullet(
			`weak commits: ${weakCount} (${git.weakCommits
				.slice(0, 3)
				.map((c) => `"${c}"`)
				.join(', ')}${weakCount > 3 ? ', ...' : ''})`
		);
	}

	if (untrackedCount > 0) {
		printList('untracked:', git.untrackedFiles);
	}

	if (modifiedCount > 0) {
		printList('modified:', git.modifiedFiles);
	}

	if (weakCount === 0 && untrackedCount === 0 && modifiedCount === 0 && !empty) {
		logger.bullet('clean working tree');
	}

	return git;
}

function run(cwd) {
	const git = analyzeGit(cwd);
	return printGitDetails(git);
}

module.exports = { run, printGitDetails };