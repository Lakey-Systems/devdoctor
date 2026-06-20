'use strict';

const path = require('path');
const {
	exists,
	readFileSafe,
	writeFileSafe,
	readJsonSafe
} = require('../utils/fs');

const { parseEnvContent } = require('../modules/envAnalyzer');
const logger = require('../utils/logger');

/**
 * ---------------------------
 * CONTEXT DETECTION
 * ---------------------------
 */
function detectProjectContext(cwd) {
	const pkg = readJsonSafe(path.join(cwd, 'package.json'));

	return {
		isNode: !!pkg,
		hasScripts: pkg?.scripts && Object.keys(pkg.scripts).length > 0,
		isLibrary: pkg?.main || pkg?.exports,
		hasEnvUsage: false,
	};
}

/**
 * ---------------------------
 * GITIGNORE
 * ---------------------------
 */
function fixGitignore(cwd, ctx) {
	const gitignorePath = path.join(cwd, '.gitignore');

	if (exists(gitignorePath)) {
		return {
			action: 'gitignore',
			status: 'skipped',
			reason: 'Already exists',
			impact: 'No change needed'
		};
	}

	// only create if meaningful project exists
	if (!ctx.isNode && !ctx.hasScripts) {
		return {
			action: 'gitignore',
			status: 'skipped',
			reason: 'Project too minimal to require gitignore',
			impact: 'Avoided unnecessary file creation'
		};
	}

	const template = `# dependencies
node_modules/

# env
.env
.env.local

# logs
*.log

# OS
.DS_Store
Thumbs.db

# build
dist/
build/
coverage/
`;

	const ok = writeFileSafe(gitignorePath, template);

	if (!ok) {
		return {
			action: 'gitignore',
			status: 'failed',
			reason: 'Write permission or filesystem error',
			impact: 'No file created'
		};
	}

	return {
		action: 'gitignore',
		status: 'fixed',
		reason: 'Missing ignore rules for common Node/JS artifacts',
		impact: 'Prevents accidental commits of node_modules, logs, builds'
	};
}

/**
 * ---------------------------
 * ENV EXAMPLE
 * ---------------------------
 */
function fixEnvExample(cwd, ctx) {
	const envPath = path.join(cwd, '.env');
	const envExamplePath = path.join(cwd, '.env.example');

	if (!exists(envPath)) {
		return {
			action: 'env.example',
			status: 'skipped',
			reason: 'No .env file found',
			impact: 'No environment schema inferred'
		};
	}

	if (exists(envExamplePath)) {
		return {
			action: 'env.example',
			status: 'skipped',
			reason: '.env.example already exists',
			impact: 'No duplication needed'
		};
	}

	const content = readFileSafe(envPath);
	const { keys } = parseEnvContent(content);

	if (!keys || keys.size === 0) {
		return {
			action: 'env.example',
			status: 'skipped',
			reason: 'No valid environment keys detected',
			impact: 'Could not generate schema safely'
		};
	}

	const lines = Array.from(keys.keys()).map(k => `${k}=`);
	const ok = writeFileSafe(envExamplePath, lines.join('\n') + '\n');

	if (!ok) {
		return {
			action: 'env.example',
			status: 'failed',
			reason: 'File write error',
			impact: 'No .env.example created'
		};
	}

	return {
		action: 'env.example',
		status: 'fixed',
		reason: 'Derived environment schema from existing .env',
		impact: `Documented ${keys.size} environment variables safely`
	};
}

/**
 * ---------------------------
 * PACKAGE JSON FORMAT
 * ---------------------------
 */
function fixPackageJsonFormatting(cwd) {
	const pkgPath = path.join(cwd, 'package.json');

	if (!exists(pkgPath)) {
		return {
			action: 'package.json',
			status: 'skipped',
			reason: 'No package.json present',
			impact: 'Not a Node project'
		};
	}

	const raw = readFileSafe(pkgPath);
	const parsed = readJsonSafe(pkgPath);

	if (!parsed) {
		return {
			action: 'package.json',
			status: 'skipped',
			reason: 'Invalid JSON',
			impact: 'Manual fix required'
		};
	}

	const formatted = JSON.stringify(parsed, null, 2) + '\n';

	if (raw === formatted) {
		return {
			action: 'package.json',
			status: 'skipped',
			reason: 'Already formatted',
			impact: 'No change needed'
		};
	}

	const ok = writeFileSafe(pkgPath, formatted);

	if (!ok) {
		return {
			action: 'package.json',
			status: 'failed',
			reason: 'Write failure',
			impact: 'Could not format file'
		};
	}

	return {
		action: 'package.json',
		status: 'fixed',
		reason: 'Standardized JSON formatting',
		impact: 'Improves readability and reduces diff noise'
	};
}

/**
 * ---------------------------
 * OUTPUT HELPERS
 * ---------------------------
 */
function print(result) {
	const icon =
		result.status === 'fixed' ? '✅' :
			result.status === 'failed' ? '❌' : '🟠';

	logger.line(` ${icon} ${result.action}`);
	logger.line(`   reason: ${result.reason}`);
	logger.line(`   impact: ${result.impact}`);
	logger.line('');
}

function printSection(title) {
	logger.line('');
	logger.line(logger.heading(title));
	logger.line('');
}

/**
 * ---------------------------
 * MAIN RUN
 * ---------------------------
 */
function run(cwd) {
	const ctx = detectProjectContext(cwd);

	const results = [
		fixGitignore(cwd, ctx),
		fixEnvExample(cwd, ctx),
		fixPackageJsonFormatting(cwd)
	];

	logger.line('');
	logger.line(logger.heading('DevDoctor Fix'));
	logger.line('-------------------');

	printSection('Applied Changes');

	const fixed = results.filter(r => r.status === 'fixed');
	const skipped = results.filter(r => r.status === 'skipped');
	const failed = results.filter(r => r.status === 'failed');

	const allSkipped = skipped.length === results.length;
	if (allSkipped) {
		logger.line(logger.bullet('No changes were made.'));
		logger.line(logger.dim('All checks passed or were not applicable.'));
		logger.line('');
		return results;
	}

	if (!results.length) {
		logger.line('Nothing executed');
		return results;
	}

	for (const r of results) print(r);

	printSection('Summary');

	logger.line(`✅ fixed: ${fixed.length}`);
	logger.line(`🟠 skipped: ${skipped.length}`);
	logger.line(`❌ failed: ${failed.length}`);

	printSection('Impact');

	if (!fixed.length) {
		logger.line('No changes were needed for this project state.');
	} else {
		for (const f of fixed) {
			logger.bullet(f.impact);
		}
	}

	logger.line('');

	return results;
}

module.exports = {
	run,
	fixGitignore,
	fixEnvExample,
	fixPackageJsonFormatting
};