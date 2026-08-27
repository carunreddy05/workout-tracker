# Workout Tracker — Project Guidelines

React web app (`src/`) + Expo/React Native mobile app (`mobile/`, sibling folder, not an npm workspace) sharing pure domain logic (`src/utils/week.ts`, `exerciseMeasurement.ts`, `plan.ts`, `streak.ts`, `firestore.ts`, `src/types/WorkoutEntry.ts`) via relative imports. Both target the same Firebase project (`gymentrytracker`).

## Security — read before committing, pushing, or opening a PR

### What's safe to hardcode

**Firebase client config** (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) is not a secret. This is Firebase's own documented model: a client API key identifies the project, it does not grant access — access control is enforced entirely by **Firestore Security Rules** (and App Check, if enabled), not by keeping the key private. It's fine for this to live directly in `src/firebase.ts` / `mobile/lib/firebase.ts`.

Do not "fix" this by moving it to an env file or trying to hide it — that doesn't add real security and just adds friction. The real security control is the Firestore rules below.

### What must NEVER be committed

- Any Anthropic/Claude API key, OpenAI key, or other third-party API secret key. Unlike Firebase's client config, these ARE real secrets (they grant API usage billed to an account). If a feature ever needs one, it must be called from a backend/Cloud Function, never embedded in web or mobile client code.
- Firebase **service account** JSON (Admin SDK credentials) — different from the client config above; this grants full backend access and must never leave a server/CI environment.
- Apple signing material: `.p8`, `.p12`, `.mobileprovision`, `.pem` files, or App Store Connect API keys. EAS manages these remotely — don't pull them into the repo.
- `.env` / `.env.local` files containing real values, GitHub personal access tokens, Expo access tokens (`EXPO_TOKEN`), or any password/credential string.
- Anything matching common secret shapes: `AKIA...` (AWS), `sk_live_`/`pk_live_` (Stripe), `ghp_`/`gho_`/`github_pat_` (GitHub), `xox[baprs]-` (Slack), `-----BEGIN ... PRIVATE KEY-----`.

### Firestore Security Rules

This is the actual access-control boundary for the app — treat it as more important than any client-side secret. Before real users rely on this app (TestFlight or later):

- Review the current rules in the Firebase Console (Firestore → Rules) — confirm they are not left in permissive "test mode" (`allow read, write: if true;`).
- Rules should scope every read/write on `gymEntries` to `request.auth.uid == resource.data.userId` (or the equivalent for new-document creates), so one user's anonymous session can never read or write another's data.
- If you change the data model (new collections, new fields queried on), update the rules to match — a rule that's merely absent defaults to **deny**, not allow, so the failure mode is usually "app breaks," not "data leaks" — but verify this rather than assuming it.

### Automated enforcement

`.claude/settings.local.json` has a `PreToolUse` hook on `git commit` that scans `git diff --cached` (excluding `src/firebase.ts` and `mobile/lib/firebase.ts`, the known-safe Firebase config) for the patterns below and blocks the commit if one matches. This is local-only (`settings.local.json` is gitignored) — it doesn't protect a teammate's machine or CI, only this one. Verified live: it blocked a real `git commit` with a fake AWS key staged, and allowed the same commit once the key was removed.

Don't rely on it as the only check, especially for anything the pattern list doesn't cover — the manual scan below is still worth running when adding a new integration:

```bash
git diff --cached | grep -inE "AIza[0-9A-Za-z_-]{10,}|sk-[A-Za-z0-9]{20,}|sk_live_|pk_live_|ghp_[A-Za-z0-9]{30,}|gho_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{12,}|xox[baprs]-|-----BEGIN|api[_-]?key\s*[:=]\s*['\"][A-Za-z0-9_-]{16,}|secret|password\s*[:=]"
```

A hit doesn't automatically mean stop — the Firebase `apiKey` block will match the `api[_-]?key` pattern and is expected/fine per above. Anything else should be looked at before it goes in, not after.

## Repo layout notes

- `mobile/` is a sibling of `src/`, deliberately not an npm workspace — see `mobile/metro.config.js`'s top comment for why, and don't add `resolver.nodeModulesPaths` overrides or `disableHierarchicalLookup` there without re-reading that comment; a previous attempt broke nested dependency resolution project-wide.
- Shared logic in `src/utils/` must use relative imports, not the `@/*` alias — that alias resolves differently under the web app's and mobile's own tsconfigs, and importing via `@/` there was already a resolution bug (fixed in the commit that added `mobile/`).
- Mobile stores weight in **lb** (converted once from the shared kg-denominated exercise library defaults, in `mobile/lib/units.ts`); the web app stores and displays **kg**. This is intentional per user decision, not a bug — see that file's top comment before changing either.
