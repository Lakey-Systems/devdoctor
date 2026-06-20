# [AGENTS.md](http://AGENTS.md)

This document provides guidance for AI coding assistants (ChatGPT, Claude, Gemini, Copilot, Cursor, Windsurf, etc.) contributing to the DevDoctor codebase.

## Project Overview

DevDoctor is a deterministic, offline-first project health scanner for developers.

The project analyses local repositories and reports actionable issues without making network requests, collecting telemetry, or relying on AI.

## Core Principles

Every change should follow these principles:

-   Keep the project dependency-free where possible.
-   Never introduce telemetry or analytics.
-   Never require internet access for functionality.
-   Keep execution deterministic.
-   Prioritize speed.
-   Prefer readability to cleverness.
-   Avoid unnecessary abstraction.

If a feature cannot be implemented predictably, it probably should not be implemented.

## Architecture

The project is split into a few simple layers.

```
index.js
│
├── commands/
│   ├── check.js
│   ├── git.js
│   ├── deps.js
│   ├── env.js
│   ├── project.js
│   └── fix.js
│
├── modules/
│   ├── gitAnalyzer.js
│   ├── dependencyAnalyzer.js
│   ├── envAnalyzer.js
│   ├── projectAnalyzer.js
│   └── codeAnalyzer.js
│
└── utils/
    ├── logger.js
    ├── scoring.js
    └── helpers.js
```

> This table may not be up-to-date (at some points, may be completely wrong), please read the section of the codebase that involves changes before editing.

Commands should only display output.

Analyzers should perform all inspection logic and return structured data.

Utilities should remain generic and reusable.

## Coding Standards

-   Use CommonJS (`require` / `module.exports`).
-   Prefer synchronous file-system operations.
-   Keep functions small and focused.
-   Avoid side effects.
-   Avoid global state.
-   Do not add unnecessary classes.
-   Do not over-engineer solutions.

## Output

CLI output should be:

-   Consistent
-   Easy to scan
-   Actionable
-   Concise

Every reported issue should explain:

-   What was found.
-   Why it matters.
-   How to fix it (where practical).

Avoid vague warnings.

## Adding New Checks

When adding a check:

-   Return structured data.
-   Include a severity where appropriate.
-   Ensure false positives are minimized.
-   Do not print directly from the analyzer.
-   Integrate with the scoring system if necessary.

If a safe automatic fix exists, implement it within the `fix` command.

## Dependencies

Before introducing a dependency, ask:

-   Can Node.js already do this?
-   Can this be implemented in fewer than ~50 lines?
-   Does the dependency justify its maintenance cost?
-   Will the dependency result in unnecessary overhead?

If the answer is no, do not add the dependency.

## AI Expectations

AI-generated code is acceptable only if it has been reviewed.

Do not:

-   Invent APIs.
-   Guess file system layouts.
-   Add speculative features.
-   Change behavior unrelated to the task.
-   Rewrite large sections without justification.

Prefer minimal, targeted changes.

## Pull Requests

Changes should:

-   Solve one problem.
-   Keep commits focused.
-   Preserve backwards compatibility where practical.
-   Update documentation if behavior changes.

## Non-Goals

DevDoctor is **not** intended to become:

-   A linter
-   A formatter
-   An IDE
-   An AI assistant
-   A cloud service
-   A code generator

Its purpose is to inspect projects and provide useful diagnostics.

## Golden Rule

When making changes, ask:

> Does this make DevDoctor simpler, faster, clearer, or more useful?

If not, reconsider the implementation.