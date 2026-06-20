# Contributing to DevDoctor

**First, thank you for contributing to DevDoctor.** This project was created to help both new and experienced developers quickly assess the health of their projects by automating common checks and highlighting potential issues before they become problems.

Whether you're fixing a bug, improving documentation, adding a new project check, or suggesting an idea, your contribution is appreciated.

## Getting Started

Clone the repository:

```bash
git clone https://github.com/<your-username>/devdoctor.git
cd devdoctor
```

Install dependencies:

```bash
npm install
```

Run the CLI locally:

```bash
node index.js check
```

Or, if you've linked it globally:

```bash
npm link
devdoctor check
```

---

## Development Guidelines

Please follow these principles when contributing:

* Keep the project dependency-free unless absolutely necessary.
* Prioritise deterministic behaviour. DevDoctor should never rely on external services or AI.
* Keep changes focused. Avoid unrelated refactors in the same pull request.
* Maintain the existing coding style.
* Ensure new features work across supported platforms.

---

## Adding New Checks

New checks should:

* Be deterministic.
* Produce actionable output.
* Avoid false positives where possible.
* Return structured data rather than printing directly.
* Include enough information for users to understand the issue.

If a check can be fixed automatically, implement the corresponding fix in the `fix` command.

---

## Pull Requests

Before opening a pull request:

* Ensure the project runs correctly.
* Keep commits descriptive.
* Update documentation if behaviour changes.
* Verify that existing functionality still works.

Good commit messages include:

```
Add detection for duplicate dependencies

Improve .env comparison output

Fix package.json formatting
```

Avoid commit messages like:

```
fix

update

stuff
```

---

## Reporting Bugs

When reporting a bug, include:

* Operating system
* Node.js version
* DevDoctor version
* Command executed
* Complete output
* Steps to reproduce the issue

If possible, include a minimal project that reproduces the problem.

---

## Feature Requests

Feature requests are welcome.

Please explain:

* The problem you're trying to solve.
* Why the feature would be useful.
* Any potential edge cases.

---

## Code Style

* Use CommonJS (`require`).
* Prefer small, focused functions.
* Use descriptive variable and function names.
* Avoid unnecessary abstractions.
* Keep output consistent across commands.

---

## Philosophy

DevDoctor is intended to be:

* Fast
* Deterministic
* Offline-first
* Easy to understand
* Safe by default

Automatic fixes should never modify user code unless the change is clearly safe and predictable.

---

## Artificial Intelligence (AI) Usage

AI-assisted contributions are welcome, but contributors are expected to understand and verify any code they submit.

Before opening a pull request, ensure that:

* The code has been reviewed and tested.
* You understand how it works.
* It follows the project's coding style and design principles.
* It does not introduce unnecessary dependencies or complexity.

Submissions that appear to be entirely AI-generated without review, or that include incorrect, bloated, or low-quality code, may be declined.

---

## Code of Conduct

Please be respectful and constructive when participating in discussions and code reviews.

Harassment, abuse, discrimination, or disruptive behavior will not be tolerated.

---

Thank you for helping improve DevDoctor.