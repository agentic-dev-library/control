# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |
| < latest| :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report security vulnerabilities by emailing the maintainers directly.

When reporting a vulnerability, please include:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** of the vulnerability
4. **Suggested fix** (if any)

We will acknowledge receipt within 48 hours and provide a detailed response within 7 days indicating:

- Our assessment of the report
- Expected timeline for a fix
- Any mitigations available

## Security Best Practices

### For Contributors

- Never commit secrets, API keys, or credentials
- Use environment variables for sensitive configuration
- Review dependencies for known vulnerabilities
- Follow secure coding guidelines

### Automated Security

This repository uses:

- **Dependabot** for dependency updates
- **Secret scanning** to detect leaked credentials
- **Push protection** to prevent secret commits
- **CodeQL** for static analysis (where applicable)

## Acknowledgments

We appreciate responsible disclosure of security issues.
