'use strict';

const path = require('path');
const { readJsonSafe, exists } = require('../utils/fs');

function classifyVersionRisk(name, versionRange) {
	const reasons = [];
	if (typeof versionRange !== 'string') return reasons;

	const cleaned = versionRange.trim();

	if (cleaned === '*' || cleaned === 'latest') {
		reasons.push(`${name}@${cleaned} is unpinned ("${cleaned}") which can break builds unexpectedly`);
		return reasons;
	}

	const match = cleaned.match(/(\d+)\.(\d+)\.(\d+)/);
	if (!match) return reasons;

	const major = parseInt(match[1], 10);

	if (cleaned.startsWith('^0.') || cleaned.startsWith('0.')) {
		reasons.push(`${name}@${cleaned} is a pre-1.0 release (^0.x) - API may be unstable`);
	}

	if (/^git(\+|@)?/.test(cleaned)) {
		reasons.push(`${name}@${cleaned} uses a git-based dependency (non-reproducible builds)`);
	}

	if (/^(file:|\.\/|\.\.\/)/.test(cleaned)) {
		reasons.push(`${name}@${cleaned} uses a local file dependency (fragile in CI environments)`);
	}

	if (/^\^?\d+\.\d+$/.test(cleaned)) {
		reasons.push(`${name}@${cleaned} is missing patch version specificity`);
	}

	return reasons;
}

function analyzeDeps(cwd) {
	const result = {
		hasPackageJson: false,
		hasDependencies: false,
		hasLockfile: false,
		dependencyCount: 0,
		devDependencyCount: 0,
		riskyVersions: [],
		issues: [],
		state: 'unknown'
	};

	const pkgPath = path.join(cwd, 'package.json');
	result.hasPackageJson = exists(pkgPath);

	if (!result.hasPackageJson) {
		result.state = 'missing';
		result.issues.push('no package.json found');
		return result;
	}

	const pkg = readJsonSafe(pkgPath);
	if (!pkg) {
		result.state = 'invalid';
		result.issues.push('package.json could not be parsed (invalid JSON)');
		return result;
	}

	const deps = pkg.dependencies && typeof pkg.dependencies === 'object' ? pkg.dependencies : null;
	const devDeps = pkg.devDependencies && typeof pkg.devDependencies === 'object' ? pkg.devDependencies : null;

	result.dependencyCount = deps ? Object.keys(deps).length : 0;
	result.devDependencyCount = devDeps ? Object.keys(devDeps).length : 0;
	result.hasDependencies = result.dependencyCount > 0 || result.devDependencyCount > 0;

	result.hasLockfile =
		exists(path.join(cwd, 'package-lock.json')) ||
		exists(path.join(cwd, 'yarn.lock')) ||
		exists(path.join(cwd, 'pnpm-lock.yaml'));

	if (!result.hasDependencies) {
		result.state = 'empty';
	} else {
		result.state = 'valid';
	}

	const hasAnyDeps = result.hasDependencies;

	if (hasAnyDeps && !result.hasLockfile) {
		result.issues.push('missing lockfile - dependency versions are not reproducible');
	}

	const allDeps = Object.assign({}, deps || {}, devDeps || {});

	for (const [name, versionRange] of Object.entries(allDeps)) {
		const reasons = classifyVersionRisk(name, versionRange);
		for (const reason of reasons) {
			result.riskyVersions.push({ name, version: versionRange, reason });
		}
	}

	if (result.riskyVersions.length > 0) {
		result.issues.push(`${result.riskyVersions.length} package(s) with risky version ranges`);
	}

	return result;
}

module.exports = { analyzeDeps, classifyVersionRisk };