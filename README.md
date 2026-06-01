# SnapIt SiteScope

SnapIt SiteScope — website quality inspection without a traditional backend. The UI is a static Next.js export on GitHub Pages; background analysis runs in GitHub Actions with Playwright, Lighthouse, and axe-core.

**Live site:** https://meowdule.github.io/scopurl/  
**Repository:** https://github.com/meowdule/scopurl

## How it works

1. User enters a URL and clicks **Analyze** (instant DNS/URL checks run in the browser).
2. The app triggers a **repository_dispatch** event (production) or opens a prefilled GitHub issue (fallback).
3. **`queue-request.yml`** creates `requests/{id}.json` and `public/reports/{id}/status.json`, then pushes.
4. **`analyze-and-publish.yml`** runs on `requests/**` push: crawls the site, generates the report, commits artifacts, rebuilds, and deploys Pages.
5. The UI polls `reports/{id}/status.json` and shows the report on the same page when complete.

## GitHub secrets (required for one-click Analyze)

In **Settings → Secrets and variables → Actions → Secrets**:

| Secret | Purpose |
|--------|---------|
| `QUEUE_DISPATCH_TOKEN` | Classic PAT with `repo` scope — `repository_dispatch` from the static app |
| `GH_PAT` (recommended) | PAT with `contents: write` — workflows commit `requests/` and `public/reports/` |

Optional **Variables** (usually not needed if the repo is named `scopurl`):

| Variable | Default in CI |
|----------|----------------|
| `NEXT_PUBLIC_GITHUB_REPO` | `github.repository` → `meowdule/scopurl` |
| `NEXT_PUBLIC_BASE_PATH` | `/scopurl` |

Enable **GitHub Pages** with source **GitHub Actions**. Enable **Issues** for the fallback queue flow.

## Workflows

| Workflow | Trigger | Role |
|----------|---------|------|
| `pages.yml` | Push to `main` (except `requests/**`) | Deploy static app |
| `queue-request.yml` | `repository_dispatch` | Queue analysis |
| `analyze-and-publish.yml` | Push to `requests/**` | Crawl + report + deploy |
| `qa.yml` | Push / PR | Lint, smoke, E2E |
| `cleanup-reports.yml` | Daily cron | 30-day retention |

## Local development

```bash
npm install
npx playwright install chromium
npm run dev
```

```bash
npm run analyze:local -- --report-id=test-1 --target-url=https://example.com
npm run build
```

See [docs/DEPLOY.md](docs/DEPLOY.md) for GitHub Pages setup details.
