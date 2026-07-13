# CI/CD & Vercel Deployment Setup

This guide covers how to configure the GitHub Actions workflows for continuous integration and automatic deployment to Vercel.

---

## Overview

The project uses two GitHub Actions workflows:

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| CI | `.github/workflows/ci.yml` | Push & PR to `main` | Lint, type check, contract tests |
| Deploy | `.github/workflows/deploy.yml` | Push & PR to `main` | Deploy to Vercel (preview + production) |

---

## Prerequisites

- A [Vercel](https://vercel.com) account
- A [GitHub](https://github.com) repository for this project
- [Node.js](https://nodejs.org) v20+ installed locally
- [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`)

---

## Step 1: Create a Vercel Token

1. Go to https://vercel.com/account/tokens
2. Click **Create Token**
3. Give it a descriptive name (e.g., `ingat-github-actions`)
4. Set scope to your account or team
5. Copy the token — you won't see it again

---

## Step 2: Link the Project to Vercel

From the repo root, run:

```bash
npx vercel link
```

You will be prompted to:
- Log in to Vercel (if not already)
- Select your scope (personal account or team)
- Link to an existing project or create a new one

Once complete, a `.vercel/project.json` file is created:

```json
{
  "orgId": "team_xxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxx"
}
```

> **Note:** Add `.vercel` to your `.gitignore` — these values go into GitHub Secrets, not the repo.

---

## Step 3: Add GitHub Secrets

Go to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

Add the following three secrets:

| Secret Name | Value | Source |
|-------------|-------|--------|
| `VERCEL_TOKEN` | The token from Step 1 | Vercel account tokens page |
| `VERCEL_ORG_ID` | `orgId` from `.vercel/project.json` | Step 2 output |
| `VERCEL_PROJECT_ID` | `projectId` from `.vercel/project.json` | Step 2 output |

---

## Step 4: Configure Vercel Project Settings (Optional)

If your Vercel project was not auto-detected as a Next.js monorepo, configure these in the Vercel dashboard under **Project → Settings → General**:

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Root Directory | `apps/web` |
| Build Command | `npm run build` (or leave default) |
| Output Directory | `.next` (auto-detected) |

> The GitHub Actions workflow uses `vercel build` which pulls these settings automatically.

---

## How It Works

### On Pull Request → Preview Deployment

1. The `deploy-preview` job runs
2. Builds the project using Vercel CLI
3. Deploys to a unique preview URL
4. Comments the preview URL on the PR

### On Push to `main` → Production Deployment

1. The `deploy-production` job runs
2. Builds with production settings
3. Deploys to your production domain

### CI Checks (Both Push & PR)

- **Lint**: Runs ESLint via `npm run lint`
- **Type Check**: Runs `tsc --noEmit` on the frontend
- **Contract Tests**: Runs Rust/Soroban unit tests via `cargo test`
- **Contract Build**: Compiles the WASM binary to verify it builds

---

## Verifying the Setup

After adding the secrets, trigger the workflows by:

1. Pushing a commit to `main`, or
2. Opening a pull request targeting `main`

Check the **Actions** tab in your GitHub repo to see the workflow runs.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `VERCEL_TOKEN` error | Ensure the token hasn't expired and has the correct scope |
| Build fails with "project not found" | Verify `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` match `.vercel/project.json` |
| Contract tests fail | Ensure `Cargo.lock` is committed (it's used for CI caching) |
| Type check fails | Run `npx tsc --noEmit --project apps/web/tsconfig.json` locally to fix errors |
| Preview URL not commented | Check that the workflow has `write` permission for issues/PRs |

---

## Security Notes

- **Never commit** your `VERCEL_TOKEN` or `.vercel/project.json` to the repository
- GitHub Secrets are encrypted and only exposed to workflows at runtime
- The `VERCEL_TOKEN` should have minimal scope (only the project/team needed)
