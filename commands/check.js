'use strict';

const { analyzeGit } = require('../modules/gitAnalyzer');
const { analyzeEnv } = require('../modules/envAnalyzer');
const { analyzeProject } = require('../modules/projectAnalyzer');
const { analyzeDeps } = require('../modules/depsAnalyzer');
const { analyzeCode } = require('../modules/codeAnalyzer');
const { computeScore } = require('../modules/scorer');
const logger = require('../utils/logger');

/**
 * ---------------------------
 * CONTEXT-AWARE RULES
 * ---------------------------
 */
function isEnvActuallyRequired(project) {
	// only warn if signs of runtime config exist
	return (
		project.type === 'node' ||
		project.hasBackend ||
		project.usesEnvVars
	);
}

function isDepsActuallyRequired(project) {
	return project.type === 'node' && project.hasPackageJson;
}

/**
 * ---------------------------
 * EXPLANATION ENGINE
 * ---------------------------
 */
function explain(issue, context = {}) {
	const i = issue.toLowerCase();

	// Git
	if (i.includes('not a git repository')) {
		return {
			level: 'CRITICAL',
			why: 'This project is not version-controlled, meaning no history, rollback, or collaboration safety.',
			fix: 'Run: git init'
		};
	}

	if (i.includes('missing .gitignore')) {
		return {
			level: 'CRITICAL',
			why: 'Without a .gitignore, you risk committing node_modules, secrets, build artifacts, and noise.',
			fix: 'Add a Node.js .gitignore template'
		};
	}

	// ENV (context-aware)
	if (i.includes('.env')) {
		if (!isEnvActuallyRequired(context.project || {})) {
			return {
				level: 'INFO',
				why: 'No environment configuration detected. This may be a simple script or frontend-only project.',
				fix: 'No action required unless you later add secrets or backend config'
			};
		}

		return {
			level: 'WARN',
			why: 'This project likely uses environment variables, but no .env or .env.example exists.',
			fix: 'Add .env and .env.example to document required variables'
		};
	}

	// DEPS (context-aware)
	if (i.includes('dependencies')) {
		if (!isDepsActuallyRequired(context.project || {})) {
			return {
				level: 'INFO',
				why: 'This project does not appear to be a Node package, so dependencies may not apply.',
				fix: 'Ignore unless converting to npm project'
			};
		}

		return {
			level: 'WARN',
			why: 'Missing dependency declarations makes installs unreliable across machines/CI.',
			fix: 'Run npm init and define dependencies properly'
		};
	}

	// CODE
	if (i.includes('console.log')) {
		return {
			level: 'WARN',
			why: 'Debug logs can leak internal state and clutter production output.',
			fix: 'Replace with structured logger or remove'
		};
	}

	if (i.includes('debugger')) {
		return {
			level: 'CRITICAL',
			why: 'Debugger statements will halt execution if triggered in production.',
			fix: 'Remove all debugger statements'
		};
	}

	return {
		level: 'INFO',
		why: 'Requires manual review.',
		fix: 'Inspect manually'
	};
}

/**
 * ---------------------------
 * SECTION RENDERER
 * ---------------------------
 */
function printSection(title, icon) {
	logger.line('');
	logger.line(`${icon} ${logger.heading(title)}`);
	logger.line('');
}

function renderIssues(name, issues, context, actions) {
	printSection(name, '📦');

	if (!issues.length) {
		logger.line('✅ Clean');
		return;
	}

	for (const issue of issues) {
		const e = explain(issue, context);

		const icon =
			e.level === 'CRITICAL' ? '❌' :
				e.level === 'WARN' ? '⚠' : 'ℹ';

		logger.line(`${icon} ${issue}`);
		logger.line(`   Why: ${e.why}`);
		logger.line(`   Fix: ${e.fix}`);
		logger.line('');

		actions.push(e);
	}
}

/**
 * ---------------------------
 * SCORE HEADER
 * ---------------------------
 */
function printHeader(score) {
	logger.line('');
	logger.line(logger.heading('DevDoctor Report'));
	logger.line('--------------------');

	const status =
		score >= 80 ? 'Healthy' :
			score >= 60 ? 'Needs attention' :
				'Unhealthy';

	logger.line(`Score: ${score}/100 → ${status}`);
}

/**
 * ---------------------------
 * ACTION PLAN
 * ---------------------------
 */
function printPlan(actions) {
	printSection('Fix Plan', '🛠');

	const critical = actions.filter(a => a.level === 'CRITICAL');
	const warn = actions.filter(a => a.level === 'WARN');

	if (!critical.length && !warn.length) {
		logger.line('✅ No immediate fixes required');
		return;
	}

	let i = 1;

	for (const a of [...critical, ...warn].slice(0, 6)) {
		logger.line(`${i++}. ${a.fix}`);
	}
}

/**
 * ---------------------------
 * MAIN
 * ---------------------------
 */
function run(cwd) {
	const git = analyzeGit(cwd);
	const env = analyzeEnv(cwd);
	const project = analyzeProject(cwd);
	const deps = analyzeDeps(cwd);
	const code = analyzeCode(cwd);

	const { score } = computeScore({ git, env, project, deps, code });

	printHeader(score);

	const actions = [];

	renderIssues('Git', git.issues, { project }, actions);
	renderIssues('Env', env.issues, { project }, actions);
	renderIssues('Project', project.issues, { project }, actions);
	renderIssues('Deps', deps.issues, { project }, actions);
	renderIssues('Code', code.issues, { project }, actions);

	printPlan(actions);

	logger.line('');

	return { git, env, project, deps, code, score };
}

module.exports = { run };