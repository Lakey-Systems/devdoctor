'use strict';

const MAX_DEDUCTIONS = {
	git: 10,
	env: 25,
	project: 20,
	deps: 20,
	code: 15,
};

/**
 * Deduct points proportionally to issue count, capped at a max
 * deduction per category. This keeps any single category from
 * tanking the whole score while still being sensitive to severity.
 *
 * @param {number} issueCount
 * @param {number} maxDeduction
 * @param {number} perIssuePenalty
 */
function deductionFor(issueCount, maxDeduction, perIssuePenalty) {
	if (issueCount <= 0) return 0;
	return Math.min(maxDeduction, issueCount * perIssuePenalty);
}

/**
 * Compute an overall 0-100 health score from the four analyzer
 * results. Pure function - same inputs always produce the same
 * score (deterministic, no randomness).
 *
 * @param {object} results
 * @param {object} results.git - output of analyzeGit
 * @param {object} results.env - output of analyzeEnv
 * @param {object} results.project - output of analyzeProject
 * @param {object} results.deps - output of analyzeDeps
 * @param {object} results.code - output of analyzeCode
 * @returns {{ score: number, breakdown: object }}
 */
function computeScore(results) {
	const { git, env, project, deps, code } = results;

	const breakdown = {
		git: deductionFor(git.issues.length, MAX_DEDUCTIONS.git, 5),
		env: deductionFor(env.issues.length, MAX_DEDUCTIONS.env, 8),
		project: deductionFor(project.issues.length, MAX_DEDUCTIONS.project, 5),
		deps: deductionFor(deps.issues.length, MAX_DEDUCTIONS.deps, 5),
		code: deductionFor(code.issues.length, MAX_DEDUCTIONS.code, 5),
	};

	const totalDeduction = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
	const rawScore = 100 - totalDeduction;
	const score = Math.max(0, Math.min(100, Math.round(rawScore)));

	return { score, breakdown, maxDeductions: MAX_DEDUCTIONS };
}

module.exports = { computeScore, MAX_DEDUCTIONS };
