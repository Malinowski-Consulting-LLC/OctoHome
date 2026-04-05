# OctoHome
Provided by [Malinowski Consulting, LLC](https://malinowski.consulting).


Proof of concept for a GitHub-backed home management system.

Based on the idea that GitHub's features can be repurposed for home management, and that families might enjoy a bit of octocat magic in their daily routines. [Read more](https://github.com/social-impact/insights/perspectives/03-17-2026-github-for-everyone)

Create your home-ops repo and get started today! 

[![Launch App](https://img.shields.io/badge/Launch-OctoHome-blue?style=for-the-badge&logo=github)](https://octo-home.vercel.app/)

Powered by GitHub, designed for households.

## What OctoHome does

- guides a household through GitHub sign-in and onboarding
- creates or reuses a `home-ops` repo directly under the signed-in account (personal or org)
- initializes default labels such as **Groceries**, **Bills**, **Maintenance**, **School**, **Health**, and **Urgent**
- manages work through a dashboard, task list, kanban-style board, and family view
- tracks lightweight household stats in `stats.json`
- creates recurring routines by committing scheduled workflow files into `.github/workflows/`
- includes an AI copilot flow that turns natural-language requests into GitHub issues using a heuristic parser

## Feature snapshot

- **Dashboard** — a household pulse view with current focus, points, streaks, and quick navigation
- **Tasks** — create, view, and complete GitHub-backed household work
- **Family Board** — visualize household flow on a shared board
- **Family** — see members and leaderboard-style household activity
- **AI Copilot** — turn prompts into structured tasks (heuristic-based, not connected to an LLM)
- **Routines / Templates** — generate recurring chores as scheduled GitHub Actions workflows
- **Settings** — inspect the connected repo, account, and household experience toggles

## Tech stack

- **Next.js 16** with the App Router
- **React 19** and **TypeScript**
- **Auth.js (NextAuth v5)** with GitHub OAuth
- **Octokit** for repository, issue, collaborator, label, and file operations
- **Tailwind CSS 4**, **Radix UI**, and **Framer Motion**
- **Zustand** for client-side onboarding and app state
- **Tauri** desktop wrapper under `src-tauri/` that loads the hosted OctoHome web app in production

## Deploying to production (Vercel), if you want to self-host

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FMalinowski-Consulting-LLC%2FOctoHome)

Clicking the button opens the Vercel project wizard for this repository. Complete the steps below before the first deployment succeeds.

### Step 1 — Create a GitHub OAuth App for production

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Fill in the fields:
   - **Application name:** OctoHome (or any name you prefer)
   - **Homepage URL:** `https://your-project.vercel.app`
   - **Authorization callback URL:** `https://your-project.vercel.app/api/auth/callback/github`
3. Click **Register application**, then copy the **Client ID** and generate a **Client Secret**.

> **Org mode:** if you want the household repo to live under a GitHub organization, the account that signs in must be an owner or have sufficient permissions in that org. During onboarding, OctoHome will ask for the GitHub organization login to use for `home-ops`.

### Step 2 — Set environment variables in Vercel

In your Vercel project go to **Settings → Environment Variables** and add:

| Variable | Description |
| --- | --- |
| `AUTH_SECRET` | Random string used to sign session cookies. Generate with `openssl rand -base64 32`. |
| `GITHUB_ID` | Client ID from your GitHub OAuth App. |
| `GITHUB_SECRET` | Client Secret from your GitHub OAuth App. |
| `APP_URL` | Canonical URL of your deployment, e.g. `https://your-project.vercel.app`. Optional for the web app itself, but required for desktop release builds because the Tauri wrapper embeds it at compile time. |

### Step 3 — Deploy

Trigger a deployment from the Vercel dashboard or push to the branch you connected. Vercel runs `npm run build` automatically.

---

## Local development

### Prerequisites

- Node.js 20 or newer
- npm
- a GitHub account
- a GitHub OAuth app configured for `http://localhost:3000`

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
# macOS / Linux
cp .env.example .env.local

# Windows
copy .env.example .env.local
```

Edit `.env.local`:

```bash
AUTH_SECRET=<generate with: openssl rand -base64 32>
GITHUB_ID=your_github_oauth_app_client_id
GITHUB_SECRET=your_github_oauth_app_client_secret
APP_URL=http://localhost:3000
```

Create a GitHub OAuth App for local development with:

- **Homepage URL:** `http://localhost:3000`
- **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`

During sign-in, OctoHome requests the following GitHub scopes:

- `repo`
- `read:user`
- `user:email`
- `workflow`

### 3. Start the app

```bash
npm run dev
```

Then open `http://localhost:3000` and sign in with GitHub.

## Useful scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run lint` | Run ESLint across the repo |
| `npm run build` | Build the production Next.js app |
| `npm run start` | Start the production server after build |
| `npm run tauri:dev` | Run the desktop wrapper against `http://localhost:3000` |
| `npm run tauri:build` | Build the desktop wrapper |

## How the GitHub-backed model works

1. Sign in with GitHub.
2. Choose whether the household should live under a personal account or an organization.
3. OctoHome creates or reuses a `home-ops` repo under the signed-in account, initializes default labels, and invites household members.
4. Household tasks are stored as GitHub issues.
5. Recurring routines are created as workflow files in `.github/workflows/` and open issues on a schedule.
6. Family activity data is stored in `stats.json`.
7. The AI copilot route creates issues from natural-language prompts using a lightweight heuristic parser — it is not connected to an LLM.

## Project structure

```text
app/           App Router pages and API routes, including auth and AI endpoints
components/    Dashboard, onboarding, navigation, and shared UI components
lib/github.ts  Octokit helpers for repos, issues, labels, collaborators, and file commits
lib/env.ts     Validated server-side environment variable access
store/         Zustand state for onboarding and local app flow
auth.ts        Auth.js GitHub provider configuration
src-tauri/     Desktop wrapper that targets the hosted OctoHome web app in production
```

## Release process (high level)

Deploy the web app to Vercel, then cut desktop releases from GitHub Actions. Semver tag pushes publish the release workflow, which builds unsigned Tauri desktop artifacts around the hosted app URL configured in the `APP_URL` Actions variable. `workflow_dispatch` is still available for on-demand CI validation without publishing a release, and the release tag must exactly match the shared app version.

## Current status and caveats

- The web app builds and lints cleanly.
- GitHub OAuth and GitHub repo permissions are core requirements; OctoHome is intentionally GitHub-backed.
- Org mode requires the signed-in user to be an org owner or have sufficient permissions, and onboarding asks for the target GitHub organization login.
- The AI copilot route uses simple heuristic parsing and is not connected to an LLM.
- The desktop wrapper and GitHub release workflow are implemented, but the binaries are currently unsigned and not notarized.

## Contributing

If you extend OctoHome, keep the GitHub-backed workflow intact and run:

```bash
npm run lint
npm run build
```
