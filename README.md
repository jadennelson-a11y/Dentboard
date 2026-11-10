# DentBoard: deploy guide

This folder is the complete website. It has the app (`index.html`), a small server function that keeps your AI key private (`api/ai.js`), installable-app files (manifest, service worker, icons), and privacy and terms pages.

## What you need
1. **An Anthropic API key**: create one at console.anthropic.com and set a monthly spending limit there. AI use is billed to this key.
2. **A Vercel account** (free tier works): vercel.com.
3. Optional: a domain name.

## Deploy (about 10 minutes)
In a terminal, inside this folder:

```
npm i -g vercel          # once
vercel                   # first deploy; accept the defaults
vercel env add ANTHROPIC_API_KEY      # paste your key (choose Production)
vercel env add ACCESS_CODE            # optional: invite-only beta code
vercel --prod            # publish
```
Or push this folder to GitHub and import the repo in the Vercel dashboard, then add the environment variables under Settings, Environment Variables. See `.env.example` for every option.

## Before you open it to the public
- Replace the `[bracketed]` placeholders in `privacy.html` and `terms.html` and have a lawyer review them.
- Remove `ACCESS_CODE` when you are ready for anyone to use it (or keep it for an invite-only beta).
- Keep a spending limit on your Anthropic account. `RATE_LIMIT_PER_HOUR` caps each person; the limit is best-effort because serverless instances don't share memory.
- Set `ALLOWED_ORIGINS` to your real address once you have a domain.

## How it works
- Decks, notes and progress live in each student's browser (localStorage and IndexedDB). Nothing about students is stored on your server.
- Question generation and feedback use the fast model (`MODEL_FAST`). Ask uses the stronger model (`MODEL_SMART`) with live web search.
- "Latest research" calls PubMed directly from the browser.
- Students can install the site as an app: iPhone and iPad (Safari, Share, Add to Home Screen), Mac (Safari, File, Add to Dock), Android (Chrome, Install app).

## Not included yet
Student accounts and sync across devices, instructor dashboards, a shared feedback inbox, Google Drive and OneDrive import, and App Store or Google Play listings (those need a native wrapper and developer accounts).
