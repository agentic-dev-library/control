# Semantic Release Configuration

This repository uses [semantic-release](https://github.com/semantic-release/semantic-release) for automated versioning and package publishing.

## How It Works

1. **Commit Messages**: Follow [Conventional Commits](https://www.conventionalcommits.org/) format
2. **Automatic Versioning**: semantic-release analyzes commits and determines the next version
3. **Changelog Generation**: Automatically generates CHANGELOG.md from commits
4. **NPM Publishing**: Publishes to npm with the new version
5. **GitHub Release**: Creates a GitHub release with release notes

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat:` → New feature (MINOR version bump, e.g., 1.0.0 → 1.1.0)
- `fix:` → Bug fix (PATCH version bump, e.g., 1.0.0 → 1.0.1)
- `docs:` → Documentation only changes (no version bump)
- `style:` → Code style changes (no version bump)
- `refactor:` → Code refactoring (no version bump)
- `perf:` → Performance improvements (PATCH)
- `test:` → Adding tests (no version bump)
- `chore:` → Maintenance tasks (no version bump)
- `ci:` → CI/CD changes (no version bump)

### Breaking Changes

For MAJOR version bump (e.g., 1.0.0 → 2.0.0), use either:

**Option 1: Exclamation mark**
```
feat!: drop support for Node 18

This removes Node 18 support completely.
```

**Option 2: BREAKING CHANGE footer**
```
feat: migrate to TypeDoc

BREAKING CHANGE: Documentation is now generated with TypeDoc instead of Sphinx.
Old documentation URLs will no longer work.
```

## Examples

### Minor Release (New Feature)
```bash
git commit -m "feat(triage): add issue priority scoring"
# Results in: 1.0.0 → 1.1.0
```

### Patch Release (Bug Fix)
```bash
git commit -m "fix(github): correct API rate limiting"
# Results in: 1.0.0 → 1.0.1
```

### Major Release (Breaking Change)
```bash
git commit -m "feat!: migrate to new API format

BREAKING CHANGE: All API endpoints now require authentication.
Old unauthenticated endpoints are removed."
# Results in: 1.0.0 → 2.0.0
```

### No Release
```bash
git commit -m "docs: update README with examples"
# No version bump, no release
```

## Configuration

The semantic-release configuration is in `.releaserc.json`:

- **Branches**: Releases only from `main` branch
- **Plugins**:
  - `commit-analyzer`: Determines version bump from commits
  - `release-notes-generator`: Generates release notes
  - `changelog`: Updates CHANGELOG.md
  - `npm`: Publishes to npm registry
  - `github`: Creates GitHub releases
  - `git`: Commits version changes back to repo

## CI/CD Integration

The release process runs automatically on every push to `main`:

1. Tests pass
2. Build succeeds
3. semantic-release analyzes commits
4. If release needed:
   - Version bumped in package.json
   - CHANGELOG.md updated
   - Git tag created
   - NPM package published
   - GitHub release created
   - Changes committed with `[skip ci]`

## Required Secrets

- `GITHUB_TOKEN` - Provided automatically by GitHub Actions
- `NPM_TOKEN` - Must be configured in repository secrets

## Testing Locally

```bash
# Dry run (no actual release)
npx semantic-release --dry-run --no-ci

# See what would happen
npx semantic-release --dry-run
```

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [semantic-release Documentation](https://semantic-release.gitbook.io/semantic-release/)
- [Commit Message Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
