# SECURITY.md

## Supported Versions

DevDoctor follows a rolling release model.

Only the latest version is actively maintained. Older versions may receive security fixes on a best-effort basis.

---

## Security Model

DevDoctor is explicitly designed to be:

-   Fully offline
    
-   Deterministic
    
-   Non-telemetric
    
-   Local filesystem only
    

It does **not**:

-   Send any data over the network
    
-   Perform API calls
    
-   Execute remote code
    
-   Collect usage analytics
    

Any behavior that violates these constraints is considered a critical security issue.

---

## Reporting a Vulnerability

If you discover a vulnerability, report it responsibly.

Prefer private disclosure via GitHub Security Advisories.

Include:

-   Steps to reproduce
    
-   Affected version
    
-   Expected vs actual bbehavior
    
-   Minimal reproduction setup (if possible)
    

---

## In-Scope Security Areas

The following are considered security-relevant:

-   FFile systemaccess logic
    
-   `.env` and secret detection
    
-   `package.json` parsing and mutation
    
-   Git repository inspection
    
-   Automatic fixes (`fix` command)
    
-   Dependency analysis heuristics
    

---

## Out of Scope

-   User project code itself
    
-   External system vulnerabilities unrelated to DevDoctor
    
-   Node.js runtime vulnerabilities outside DevDoctor’s control
    

---

## Safety Guarantees

DevDoctor guarantees:

-   No file modifications unless explicitly triggered via `fix`
    
-   No hidden or background operations
    
-   No recursive or unsafe directory traversal outside project root
    
-   No execution of untrusted project code
    
-   No network access under any condition
    

---

## Known Limitations

-   Dependency risk detection is heuristic-based (no registry validation)
    
-   Git analysis depends on local Git installation
    
-   Code analysis is static only (no execution or sandboxing)
    

---

## Security Philosophy

DevDoctor prioritizes:

-   Predictability over completeness
    
-   Safety over automation
    
-   Transparency over convenience