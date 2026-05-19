# Releasing oth-tasks

Releases are tag-driven. CI publishes when you push a `v*` tag.

## One-time setup

1. Generate an npm token at https://www.npmjs.com/settings/damian-oth/tokens/new
   - **Type**: Granular Access Token (preferred) **or** Classic → Automation
   - For granular: tick **Bypass 2FA**, scope to "Packages and scopes → All packages" or just `oth-tasks`
   - Permissions: at least **Read and write** to `oth-tasks`
2. In GitHub: https://github.com/OverTimeHosting/oth-tasks/settings/secrets/actions
   - Click **New repository secret**
   - Name: `NPM_TOKEN`
   - Value: paste the token
3. Done. The secret is encrypted at rest and only readable by workflow runs from this repo.

## Cutting a release

```sh
# 1. Bump the version (use patch / minor / major as appropriate).
#    `npm version` updates package.json AND creates a commit + tag.
npm version patch       # 0.1.0 → 0.1.1
# or: npm version minor # 0.1.0 → 0.2.0
# or: npm version major # 0.1.0 → 1.0.0

# 2. Push the commit and the tag.
git push --follow-tags
```

The `Publish to npm` workflow picks up the new `v*` tag, verifies the tag matches `package.json`, builds, and publishes with provenance.

## Manual run

If you ever need to publish without a tag push, go to **Actions → Publish to npm → Run workflow**. CI uses whatever version is currently in `package.json` and `NPM_TOKEN`.

## Notes for public-repo safety

- The `NPM_TOKEN` secret is **never exposed to pull requests from forks** — only workflows triggered by repo collaborators can read it.
- The publish workflow only runs on `push: tags` and `workflow_dispatch` (both of which require write access to the repo). It never runs on `pull_request`.
- Token logs in CI are masked — even if a step accidentally prints the token, GitHub redacts it.
- Provenance attestation publishes a cryptographic record linking each released version back to the exact commit that produced it. Anyone can verify it at https://www.npmjs.com/package/oth-tasks.

## Revoking a token

If you suspect a token leak, revoke immediately at https://www.npmjs.com/settings/damian-oth/tokens and regenerate. Then update the GitHub secret with the new value.
