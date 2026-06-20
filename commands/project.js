'use strict';

const { analyzeProject } = require('../modules/projectAnalyzer');
const logger = require('../utils/logger');

function printProjectDetails(project) {
	logger.section('Project');

	if (!project.types || project.types.length === 0) {
		logger.line(`  type: ${logger.dim('unknown')}`);
	} else {
		logger.line(`  type: ${project.types.join(', ')}`);
	}

	const items = [
		{
			label: 'README',
			value: project.hasReadme,
			ok: 'present',
			bad: 'missing',
			impact: 'Project documentation visibility'
		},
		{
			label: 'gitignore',
			value: project.hasGitignore,
			ok: 'present',
			bad: 'missing',
			impact: 'Risk of committing unwanted files (node_modules, logs, builds)'
		},
		{
			label: 'lockfile',
			value: project.hasLockfile,
			ok: project.lockfileName || 'present',
			bad: 'missing',
			impact: 'Dependency installs may not be reproducible'
		}
	];

	for (const item of items) {
		if (item.value) {
			logger.bullet(`${item.label}: ${item.ok}`);
		} else {
			logger.line(`  ${logger.warn(`${item.label}: ${item.bad}`)}`);
			logger.line(`    impact: ${item.impact}`);
		}
	}

	logger.line(`  root files: ${project.rootFileCount}${project.tooManyRootFiles ? logger.warn(' (high)') : ''}`);

	if (project.issues && project.issues.length > 0) {
		logger.line('');
		logger.line(logger.warn('Issues:'));
		for (const issue of project.issues.slice(0, 6)) {
			logger.line(`  - ${issue}`);
		}
		if (project.issues.length > 6) {
			logger.line(`  ${logger.dim(`... and ${project.issues.length - 6} more`)}`);
		}
	}

	if (!project.issues || project.issues.length === 0) {
		logger.bullet('no issues found');
	}
}

function run(cwd) {
	const project = analyzeProject(cwd);
	printProjectDetails(project);
	return project;
}

module.exports = { run, printProjectDetails };