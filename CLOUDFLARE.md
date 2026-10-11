# Cloudflare deployment

Public URL: https://atlas.fizyoatlas.workers.dev

The React/Three.js app and model files are deployed as Cloudflare Worker static assets. The API uses the `fizyo-atlas-study` D1 database. `wrangler.jsonc` is the external hosting configuration; the existing Sites build remains separate.

## Current source update

The V59 interface updates are included: separate muscle-card and model-tool panels on wide screens, a single panel with a return action on narrower screens, and a visible muscle-transparency control. This update also includes the integrated muscle card, guided comparisons, hand/finger motions, motion explanations, adjustable panel widths and persistent guest drafts from the latest Sites source.

The existing Cloudflare identity adapter, D1 binding and account-sign-in setup status are preserved. Model geometry and database migrations are unchanged by this source update.

## Build and deploy

```sh
npm ci
npm run check
node --import ./scripts/register-ui.mjs scripts/validate-cloudflare-auth.mjs
npm run build:cloudflare
npx wrangler deploy --config wrangler.jsonc
```

Authenticate Wrangler securely on your computer before deploying. Never commit API tokens or upload-session tokens. The first deployment was performed through the connected Cloudflare API; future GitHub pushes do not automatically deploy until a build integration is configured.

## Account sign-in: pending approval

The public atlas and existing guest study features work without sign-in. Favorites, quiz answers and guest case progress are saved in this browser. Account-only notebooks and cross-device records require the following setup, which has NOT been activated:

1. Create the `Fizyo Atlas` Cloudflare Access organization, suggested auth domain `fizyoatlas.cloudflareaccess.com`.
2. Add the One Time PIN identity provider.
3. Protect ONLY `atlas.fizyoatlas.workers.dev/auth/login` with a self-hosted Access application. Require verified email sign-in; do not protect the public atlas or bypass identity verification.
4. Add the resulting `ACCESS_TEAM_DOMAIN` (HTTPS origin) and `ACCESS_AUD` to Worker vars, then redeploy.
5. Verify real login, isolated account records and sign-out before marking migration complete.

`server/auth.ts` validates JWT signature, issuer, audience and expiry. External deployments ignore all `oai-authenticated-*` request headers. Until Access is configured, APIs return 401 and the login page explicitly explains the limitation, with a link to the previous site.

Existing Sites account data has NOT been migrated. It remains at the previous site. The imported GitHub project contains source code and assets, not private study records.

## Database

The six checked-in Drizzle SQL migrations were applied to the new empty D1 database during setup. Do not replay them blindly. For subsequent schema changes, apply only new migrations and keep a migration ledger.

## Verification

- TypeScript check and production build.
- Wrangler deployment dry run.
- Existing SQLite-backed learning API validation.
- Cloudflare auth signature/issuer/audience/expiry, spoofed-header and redirect checks.
- Live browser: atlas shell and study navigation load on the Cloudflare URL.
- The cloud test browser reports `GL_RENDERER = Disabled`; the actual 3D render could not be visually verified.

This deployment does not itself certify 3D motion accuracy or WebGL rendering on every browser.
