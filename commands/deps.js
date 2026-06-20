'use strict';

const path = require('path');
const fs = require('fs');
const { readJsonSafe } = require('../utils/fs');
const logger = require('../utils/logger');

function detectProjectContext(cwd) {
	const pkgPath = path.join(cwd, 'package.json');
	const existsPkg = fs.existsSync(pkgPath);

	if (!existsPkg) {
		return {
			hasPackageJson: false,
			pkg: null
		};
	}

	const raw = fs.readFileSync(pkgPath, 'utf8');

	let pkg;
	try {
		pkg = JSON.parse(raw);
	} catch (e) {
		return {
			hasPackageJson: true,
			pkg: null,
			parseError: true
		};
	}

	return {
		hasPackageJson: true,
		pkg
	};
}

function analyzeDependencyState(cwd, ctx) {
	if (!ctx.hasPackageJson || !ctx.pkg) {
		return {
			action: 'deps',
			status: 'skipped',
			reason: 'No package.json found',
			impact: 'Not a Node project',
			hasPackageJson: false
		};
	}

	const pkg = ctx.pkg;

	const deps = pkg.dependencies ? Object.keys(pkg.dependencies) : [];
	const devDeps = pkg.devDependencies ? Object.keys(pkg.devDependencies) : [];

	const hasLockfile =
		fs.existsSync(path.join(cwd, 'package-lock.json')) ||
		fs.existsSync(path.join(cwd, 'yarn.lock')) ||
		fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'));

	const issues = [];

	if (deps.length === 0 && devDeps.length === 0) {
		issues.push('no dependencies declared');
	}

	if (!hasLockfile && (deps.length > 0 || devDeps.length > 0)) {
		issues.push('missing lockfile');
	}

	const risky = [];

	for (const [name, version] of Object.entries(pkg.dependencies || {})) {
		if (typeof version === 'string' && (version.includes('^0.') || version.includes('<1'))) {
			risky.push({
				name,
				reason: `low version stability: ${version}`
			});
		}
	}

	return {
		action: 'deps',
		status: issues.length === 0 ? 'ok' : 'warn',
		reason: issues.length === 0 ? 'Healthy dependency setup' : `${issues.length} issue(s) detected`,
		impact:
			issues.length === 0
				? 'Dependencies are consistent'
				: 'Dependency hygiene needs attention',

		dependencyCount: deps.length,
		devDependencyCount: devDeps.length,
		hasLockfile,
		riskyVersions: risky,
		issues,
		hasPackageJson: true
	};
}

function printDepsDetails(deps) {
	logger.section('Deps');

	if (!deps.hasPackageJson) {
		logger.line(`  ${logger.dim('No package.json found → not a Node project')}`);
		return;
	}

	logger.bullet(`dependencies: ${deps.dependencyCount}`);
	logger.bullet(`devDependencies: ${deps.devDependencyCount}`);
	logger.bullet(`lockfile: ${deps.hasLockfile ? 'present' : 'missing'}`);

	if (deps.issues?.length > 0) {
		logger.line('');
		logger.line(logger.warn('Issues:'));
		for (const issue of deps.issues) {
			logger.line(`  - ${issue}`);
		}
	}

	if (deps.riskyVersions?.length > 0) {
		logger.line('');
		logger.line(logger.warn(`Risky dependencies (${deps.riskyVersions.length})`));

		for (const r of deps.riskyVersions.slice(0, 8)) {
			logger.line(`  - ${r.name}: ${r.reason}`);
		}

		if (deps.riskyVersions.length > 8) {
			logger.line(`  ${logger.dim(`... and ${deps.riskyVersions.length - 8} more`)}`);
		}
	}

	if (deps.issues.length === 0 && deps.riskyVersions.length === 0) {
		logger.bullet('no issues found');
	}
}

function run(cwd) {
	const ctx = detectProjectContext(cwd);
	const deps = analyzeDependencyState(cwd, ctx);

	logger.line('');
	logger.line(logger.heading('DevDoctor Deps'));
	logger.line('-------------------');

	printDepsDetails(deps);

	logger.line('');

	return deps;
}

module.exports = {
	run,
	printDepsDetails,
	analyzeDependencyState
};