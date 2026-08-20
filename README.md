# PaintPipeline AI — Slatts Pro Painters

An AI-powered lead generation and market-outreach demo for a residential and
commercial painting company operating across the five boroughs of New York City.

> **DEMO BUILD.** Every property, owner, business, contact detail and address in
> this application is **synthetic** and generated for demonstration purposes.
> Nothing is sent: no email, SMS, phone calls or physical mail. No website is
> scraped, no access restriction is bypassed, and no consumer data is purchased.
> Compliance rules shown are configurable safeguards, **not legal advice**.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build && npm start   # production build
```

## What it demonstrates

Two independent lead-generation engines feeding one CRM:

| Engine | Workflow |
|---|---|
| **Property leads** | Property → research → trigger detection → Painting Opportunity Score → recommended outreach → estimate → customer |
| **Partnership leads** | Organisation → portfolio sizing → Partnership Score → recommended pitch → recurring work |

Plus an **AI Manager** the owner talks to in plain English, which dispatches
simulated specialist workers (Property Research, Permit/Trigger Research,
Business Research, Realtor Research, Property Manager Research, Lead Scoring,
Compliance, Outreach, Follow-Up) and reports back a ranked, explained answer.
When the request exceeds current coverage the Manager runs a fresh research
sweep and adds what it discovers to the live pipeline.

### Pages

Dashboard · AI Manager · Property Leads · Partnership Leads · Pipeline · Map ·
Follow-Ups · Customers · Lead Sources · Settings

## Architecture

Layers are deliberately separated so demo pieces can be swapped for production
integrations without touching the interface.

```
src/
  lib/
    config.ts            demo flags, integration kill-switches
    types.ts             domain model
    geo/                 NYC boroughs, neighborhoods, map projection & outlines
    scoring/             pluggable scoring engines
      types.ts             ScoringEngine<T> interface
      property-scoring.ts  deterministic, fully explainable property scorer
      partnership-scoring.ts
      curve.ts             soft ceiling applied to raw totals
      index.ts             engine registry — swap in a model here
    compliance/          permission model + per-channel gating
    data/                synthetic dataset generators (the "database")
    manager/             intent parsing, worker registry, orchestration
    store/               client data-access layer + derived analytics
  components/
    layout/ ui/ charts/ leads/
  app/                   one directory per page
```

**Swapping the demo for production:**

- **Data** — replace `src/lib/data/index.ts` with a real data-access layer
  returning the same shapes. No component reads a generator directly.
- **Scoring** — register an engine implementing `ScoringEngine<T>` in
  `src/lib/scoring/index.ts`. The UI only depends on the `ScoreResult` shape,
  not on how the score was produced.
- **Manager** — `runManagerCommand` returns a `ManagerResponse`; the intent
  parser in `manager/intents.ts` is the natural place to call a language model
  that emits the same `ParsedIntent` structure.
- **Outreach** — every integration is hard-disabled in `config.ts`. The Outreach
  Agent only queues campaigns for human approval.

## Compliance model

Two principles are enforced structurally rather than by convention:

1. **Discovering a person's information is never treated as permission to
   contact them.** Discovery and consent are separate fields, and every channel
   carries an explicit allow / review / block decision with a stated reason.
2. **Consumer and B2B outreach are separate systems with separate default
   rules**, not one list with a filter.

These rules are configurable safeguards. They must be reviewed against
applicable federal, New York State and New York City requirements — and against
each channel's and data provider's own terms — before any real outreach.

## Data visualisation

Chart palettes were validated against this app's own light (`#ffffff`) and dark
(`#12151d`) chart surfaces: the two-slot categorical set passes lightness,
chroma, CVD-separation, normal-vision and contrast checks in both modes, and the
four-step ordinal ramp is monotone with visible step gaps and a light end that
clears the surface.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Recharts ·
lucide-react
