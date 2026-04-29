# My Trips

A travel knowledge base + explorer site, populated by chatting with an
agent that has the [`travel-companion`](https://github.com/perseveringman/skills/tree/main/travel-companion)
skill loaded.

## How to use

1. `cd` into this repo from any agent session (codebuddy / claude code / etc.)
2. Just chat about a trip — the agent will:
   - extract entities into `trips/<slug>/wiki/`
   - geocode places, generate recommendations
   - rebuild `trips/<slug>/data/trip.json`
   - `git commit && git push`
3. Vercel watches this repo and redeploys within ~30 seconds.
4. Open your Vercel URL → see the live explorer.

## Layout

```
trips/<slug>/
  .trip/meta.json            metadata (title, slug, aliases, cover)
  .trip/session-log.jsonl    raw conversation log
  wiki/entities/*.md         the compiled knowledge base
  recommendations/{shots,food,itinerary,spots}/*.md
  data/trip.json             aggregated for the SPA

web/                         self-contained explorer SPA (Vite + React)
scripts/                     skill scripts (don't edit unless upgrading)
assets/                      SCHEMA.md + single-file template
references/                  extraction prompts (the agent reads these)
vercel.json                  build + cache config
```

## Upgrading the skill

When the upstream skill ships UI / script improvements:

```bash
bash <skill>/scripts/init_trips_repo.sh "$(pwd)" --upgrade
git add web/ scripts/ assets/ references/ vercel.json
git commit -m "upgrade skill"
git push
```

`--upgrade` re-copies `web/ scripts/ assets/ references/ vercel.json` but
never touches `trips/`, `.workbuddy/`, or `.git/`.

## Onboarding

See `ONBOARDING.md` for the full first-run guide.
