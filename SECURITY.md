# Security Policy

Desktop4Kids OS is designed to be **offline-first** and **kid-safe**. Security is a core goal of the project, especially around Electron hardening, IPC safety, and protecting local data.

## Supported Versions

Security fixes are provided for the most recent release.

| Version | Supported |
|--------:|:---------|
| v1.3.x  | ✅ Yes |
| < v1.3  | ❌ No |

## Reporting a Vulnerability

If you believe you’ve found a security issue, please report it responsibly.

### ✅ Preferred (Private) Reporting
- Open a GitHub Security Advisory:  
  **Repository → Security → Advisories → Report a vulnerability**

This is the best option because it allows private discussion and coordinated fixes.

### Alternative (If Advisories Aren’t Available)
- Open an Issue using the title: **[SECURITY] <short summary>**
- **Do not include exploit code** or sensitive details in the issue body.
- I will respond asking for details privately.

## What to Include in a Report

Please include:

- A clear description of the issue and potential impact
- Steps to reproduce (proof-of-concept is fine)
- Affected area (e.g., File Explorer, IPC bridge, Mentor AI runtime)
- OS + version info (Windows/Linux/macOS) and Desktop4Kids OS version
- Screenshots/logs if helpful (redact any personal info)

## Security Boundaries & Threat Model

Desktop4Kids OS runs locally and does not require internet access after setup. Primary security concerns include:

### Electron Security
- Minimizing the `preload.js` surface area
- Validating every IPC request and argument
- Preventing arbitrary file system access from the renderer
- Avoiding use of insecure patterns (e.g., enabling `remote`)

### Local Data Safety
- User data is stored under `/users/<username>/`
- Deleted items are recoverable via Trash (unless permanently deleted)
- The system is designed to prevent cross-user access when properly configured

### Mentor AI (Local Models)
- AI runs locally via a `.gguf` model placed in `/models/`
- Model execution is offline
- Prompts/responses are intended to be filtered for child-safe behavior (work in progress)
- Model choice can affect output quality and safety; use trusted sources

## Out of Scope

The following are generally out of scope unless they involve a clear vulnerability:

- Issues caused by modified forks or untrusted third-party models
- Social engineering, phishing, or user behavior outside the application
- Bugs that do not impact confidentiality, integrity, or availability
- Performance issues not tied to security

## Disclosure Process

When a valid vulnerability is confirmed:

1. I will acknowledge the report
2. I will investigate and reproduce the issue
3. A fix will be developed and tested
4. A release will be published with patch notes
5. Credit will be given if requested (or anonymized if preferred)

## Security Best Practices for Contributors

If you contribute code, please follow these rules:

- Keep `preload.js` minimal
- Never expose raw filesystem access to the renderer
- Validate inputs for all IPC calls (type checks + path checks)
- Avoid adding new IPC endpoints unless necessary
- Document security-sensitive changes clearly in PRs

Thank you for helping keep Desktop4Kids OS safe.
