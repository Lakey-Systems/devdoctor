'use strict';

const path = require('path');
const { readFileSafe, walkFiles } = require('../utils/fs');

const SCAN_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
const MAX_FILES_TO_SCAN = 2000;

const TODO_PATTERN = /\b(TODO|FIXME)\b/;
const CONSOLE_LOG_PATTERN = /console\.log\s*\(/;
const DEBUGGER_PATTERN = /\bdebugger\b/;

/**
 * Scan a single file's content for hygiene issues.
 * Simple line-based text scanning - no AST parsing.
 *
 * @param {string} content
 * @returns {{ consoleLogLines: number[], todoLines: number[], debuggerLines: number[] }}
 */
function scanContent(content) {
	const hits = { consoleLogLines: [], todoLines: [], debuggerLines: [] };
	if (!content) return hits;

	const lines = content.split('\n');
	for (let i = 0; i < lines.length; i += 1) {
		const lineText = lines[i];
		const lineNum = i + 1;

		if (CONSOLE_LOG_PATTERN.test(lineText)) {
			hits.consoleLogLines.push(lineNum);
		}
		if (TODO_PATTERN.test(lineText)) {
			hits.todoLines.push(lineNum);
		}
		if (DEBUGGER_PATTERN.test(lineText)) {
			hits.debuggerLines.push(lineNum);
		}
	}

	return hits;
}

/**
 * Walk the project and scan source files for basic code hygiene
 * issues: console.log usage, TODO/FIXME comments, debugger statements.
 *
 * @param {string} cwd
 * @returns {object}
 */
function analyzeCode(cwd) {
	const result = {
		filesScanned: 0,
		consoleLogCount: 0,
		todoCount: 0,
		debuggerCount: 0,
		filesWithIssues: [], // [{ file, consoleLogs, todos, debuggers }]
		truncated: false,
		issues: [],
	};

	const files = walkFiles(cwd, {
		extensions: SCAN_EXTENSIONS,
		maxFiles: MAX_FILES_TO_SCAN,
	});

	result.truncated = files.length >= MAX_FILES_TO_SCAN;
	result.filesScanned = files.length;

	for (const filePath of files) {
		const content = readFileSafe(filePath);
		if (content === null) continue;

		const hits = scanContent(content);
		const relPath = path.relative(cwd, filePath);

		if (hits.consoleLogLines.length || hits.todoLines.length || hits.debuggerLines.length) {
			result.filesWithIssues.push({
				file: relPath,
				consoleLogs: hits.consoleLogLines.length,
				todos: hits.todoLines.length,
				debuggers: hits.debuggerLines.length,
			});
		}

		result.consoleLogCount += hits.consoleLogLines.length;
		result.todoCount += hits.todoLines.length;
		result.debuggerCount += hits.debuggerLines.length;
	}

	if (result.consoleLogCount > 0) {
		result.issues.push(`${result.consoleLogCount} console.log usage(s)`);
	}
	if (result.debuggerCount > 0) {
		result.issues.push(`${result.debuggerCount} debugger statement(s)`);
	}
	if (result.todoCount > 0) {
		result.issues.push(`${result.todoCount} TODO/FIXME comment(s)`);
	}

	return result;
}

module.exports = { analyzeCode, scanContent, SCAN_EXTENSIONS };
