'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Safe filesystem helpers. All functions swallow errors and
 * return sensible defaults instead of throwing, so the CLI
 * never crashes on a missing file or permission issue.
 */
function exists(targetPath) {
	try {
		return fs.existsSync(targetPath);
	} catch {
		return false;
	}
}

function isFile(targetPath) {
	try {
		return fs.statSync(targetPath).isFile();
	} catch {
		return false;
	}
}

function isDirectory(targetPath) {
	try {
		return fs.statSync(targetPath).isDirectory();
	} catch {
		return false;
	}
}

function readFileSafe(targetPath) {
	try {
		return fs.readFileSync(targetPath, 'utf8');
	} catch {
		return null;
	}
}

function writeFileSafe(targetPath, content) {
	try {
		fs.writeFileSync(targetPath, content, 'utf8');
		return true;
	} catch {
		return false;
	}
}

function readJsonSafe(targetPath) {
	const raw = readFileSafe(targetPath);
	if (raw === null) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

/**
 * List entries directly inside a directory (non-recursive),
 * excluding common noise directories. Returns [] on failure.
 */
function listDirSafe(dirPath, { excludeDirs = ['.git', 'node_modules'] } = {}) {
	try {
		const entries = fs.readdirSync(dirPath, { withFileTypes: true });
		return entries.filter((entry) => {
			if (entry.isDirectory() && excludeDirs.includes(entry.name)) return false;
			return true;
		});
	} catch {
		return [];
	}
}

/**
 * Recursively walk a directory collecting file paths, skipping
 * noisy directories (node_modules, .git, etc). Has a max file
 * cap to avoid runaway scans on huge repos.
 *
 * @returns {string[]} absolute file paths
 */
function walkFiles(rootDir, {
	excludeDirs = ['.git', 'node_modules', 'dist', 'build', '.next', 'coverage', 'vendor'],
	extensions = null, // e.g. ['.js', '.ts'] - null means all files
	maxFiles = 5000,
} = {}) {
	const results = [];

	function walk(dir) {
		if (results.length >= maxFiles) return;
		const entries = listDirSafe(dir, { excludeDirs });
		for (const entry of entries) {
			if (results.length >= maxFiles) return;
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				if (excludeDirs.includes(entry.name)) continue;
				walk(fullPath);
			} else if (entry.isFile()) {
				if (extensions) {
					const ext = path.extname(entry.name);
					if (!extensions.includes(ext)) continue;
				}
				results.push(fullPath);
			}
		}
	}

	try {
		walk(rootDir);
	} catch { }

	return results;
}

module.exports = {
	exists,
	isFile,
	isDirectory,
	readFileSafe,
	writeFileSafe,
	readJsonSafe,
	listDirSafe,
	walkFiles,
};