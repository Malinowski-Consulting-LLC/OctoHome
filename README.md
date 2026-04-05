# OctoHome

OctoHome turns GitHub into a household operating system. It uses GitHub sign-in, issues, labels, collaborators, Actions, and lightweight repo data to help a family manage chores, recurring routines, and day-to-day home operations.

## What OctoHome does

- guides a household through GitHub sign-in and onboarding
- provisions a household repo by forking `octohome/template` into `home-ops`
- initializes default labels such as **Groceries**, **Bills**, **Maintenance**, **School**, **Health**, and **Urgent**
- manages work through a dashboard, task list, kanban-style board, and family view
- tracks lightweight household stats in `stats.json`
- creates recurring routines by committing scheduled workflow files into `.github/workflows/`
- includes an AI copilot flow that turns natural-language requests into GitHub issues

## Feature snapshot

- **Dashboard** - a household pulse view with current focus, points, streaks, and quick navigation
- **Tasks** - create, view, and complete GitHub-backed household work
- **Family Board** - visualize household flow on a shared board
- **Family** - see members and leaderboard-style household activity
- **AI Copilot** - turn prompts into structured tasks
- **Routines / Templates** - generate recurring chores as scheduled GitHub Actions workflows
- **Settings** - inspect the connected repo, account, and household experience toggles

## Tech stack

- **Next.js 16** with the App Router
- **React 19** and **TypeScript**
- **NextAuth / Auth.js** with GitHub OAuth
- **Octokit** for repository, issue, collaborator, label, and file operations
- **Tailwind CSS 4**, **Radix UI**, and **Framer Motion**
- **Zustand** for client-side onboarding and app state
- **Tauri** desktop shell scaffolding under `src-tauri/`

## Getting started

### Prerequisites

- Node.js 20 or newer
- npm
- a GitHub account
- a GitHub OAuth app for local development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure GitHub auth

Create a `.env.local` file in the project root:

```bash
GITHUB_ID=your_github_oauth_app_client_id
GITHUB_SECRET=your_github_oauth_app_client_secret
```

For local development, configure your GitHub OAuth app with:

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

## How the GitHub-backed model works

1. Sign in with GitHub.
2. Choose whether the household should live under a personal account or organization-style setup.
3. OctoHome forks `octohome/template` into a `home-ops` repo, waits for it to become available, creates default labels, and invites household members.
4. Household tasks are stored as GitHub issues.
5. Recurring routines are created as workflow files in `.github/workflows/` and open issues on a schedule.
6. Family activity data is stored in `stats.json`.
7. The AI copilot route creates issues from natural-language prompts using a lightweight heuristic parser.

## Project structure

```text
app/           App Router pages and API routes, including auth and AI endpoints
components/    Dashboard, onboarding, navigation, and shared UI components
lib/github.ts  Octokit helpers for repos, issues, labels, collaborators, and file commits
store/         Zustand state for onboarding and local app flow
auth.ts        Auth.js GitHub provider configuration
src-tauri/     Desktop shell scaffold
```

## Current status and caveats

- The web app builds and lints cleanly.
- GitHub OAuth and GitHub repo permissions are core requirements; OctoHome is intentionally GitHub-backed.
- The onboarding flow depends on `octohome/template` being available as the seed repo.
- The AI copilot route currently uses simple heuristic parsing before creating issues. It is not connected to a real LLM yet.
- `src-tauri/tauri.conf.json` still assumes a static frontend export, while the current app uses server-side auth and API routes. The web app is the supported path today; Tauri packaging needs more architecture work.

## Contributing

If you extend OctoHome, keep the GitHub-backed workflow intact and run:

```bash
npm run lint
npm run build
```
