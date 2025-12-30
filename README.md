# Org-Specific Overrides

Place files here to override enterprise defaults from jbcom/control-center.

## Directory Structure

```
repository-files/
├── always-sync/          # From enterprise (don't edit)
├── initial-only/         # From enterprise (don't edit)  
├── python/               # From enterprise (don't edit)
├── nodejs/               # From enterprise (don't edit)
├── go/                   # From enterprise (don't edit)
├── rust/                 # From enterprise (don't edit)
├── terraform/            # From enterprise (don't edit)
└── org-overrides/        # YOUR ORG CUSTOMIZATIONS HERE
    ├── .github/
    │   └── workflows/    # Org-specific workflows
    ├── .cursor/
    │   └── rules/        # Org-specific Cursor rules
    ├── CLAUDE.md         # Org-specific Claude instructions
    └── AGENTS.md         # Org-specific agent instructions
```

## Merge Order

When syncing to repos, files are applied in this order:
1. Enterprise `always-sync/` (base)
2. Language-specific rules (python/, nodejs/, etc.)
3. **Org overrides** (this directory - wins on conflicts)
4. `initial-only/` (only if file doesn't exist)

## Examples

### Override CI workflow for your org
```bash
cp repository-files/always-sync/.github/workflows/ci.yml \
   repository-files/org-overrides/.github/workflows/ci.yml
# Then edit ci.yml with org-specific changes
```

### Add org-specific Cursor rule
```bash
echo "# My Org Rule" > repository-files/org-overrides/.cursor/rules/my-org.mdc
```
