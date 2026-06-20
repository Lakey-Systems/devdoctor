# TECH\_STACK.md

## Overview

## 

DevDoctor is a lightweight, dependency-minimal Node.js CLI tool designed for local project analysis.

It intentionally avoids frameworks, external services, and heavy runtime abstractions.

---

## Core Stack

### Runtime

## 

-   Node.js (>= 14.0.0)
    

### Language

## 

-   JavaScript (CommonJS)
    

TypeScript is not currently used.

---

## Architecture

## 

DevDoctor is structured into three main layers:

### 1\. CLI Layer (`commands/`)

## 

Responsible for orchestration and output only.

Commands include:

-   check
    
-   fix
    
-   git
    
-   deps
    
-   env
    
-   project
    

No analysis logic should live here.

---

### 2\. Analysis Layer (`modules/`)

## 

Pure functions that inspect the project and return structured results.

Modules include:

-   gitAnalyzer.js
    
-   envAnalyzer.js
    
-   depsAnalyzer.js
    
-   projectAnalyzer.js
    
-   codeAnalyzer.js
    

These modules must be:

-   deterministic
    
-   side-effect free
    
-   filesystem read-only
    

---

### 3\. Utilities (`utils/`)

## 

Shared helper functions:

-   File system wrappers (safe reads/writes)
    
-   Logger utilities
    
-   Scoring engine
    

These must remain generic and reusable.

---

## Fix System

## 

The `fix` command performs safe, deterministic modifications only.

Currently supported:

-   `.gitignore` generation
    
-   `.env.example` generation
    
-   `package.json` formatting
    

Rules:

-   No logic changes to user code
    
-   No destructive operations
    
-   No automatic deletion of user files
    

---

## Design Principles

## 

DevDoctor is built around strict constraints:

-   Offline by design
    
-   No telemetry
    
-   No network access
    
-   Deterministic output
    
-   Minimal dependencies
    
-   Fast execution
    

---

## Development Philosophy

## 

DevDoctor is not intended to be:

-   a linter
    
-   a formatter
    
-   an IDE replacement
    
-   an AI assistant
    
-   a build system
    

It is strictly a **project health inspector**.

---

## Future Improvements (Optional)

## 

-   Config file support (`devdoctor.config.js`)
    
-   Plugin system for custom analyzers
    
-   Improved terminal UI formatting
    
-   Optional TypeScript migration
    
-   Performance optimisations for large monorepos
    

---

## Running the Project

## 

```bash
node index.js check
```

```bash
node index.js fix
```

```bash
npm run start
```

---