# Spendsheet — Project Context

## What this is

A free, public-facing web app. Users drop in their credit card CSVs and get an instant categorized spending report (pivot table + AI-generated insights + PDF export). No login, no backend database, no bank connection. Privacy-first positioning.

## Tech stack

- Next.js 16 (App Router) + TypeScript
- Tailwind v4 + shadcn/ui (already set up by v0)
- @anthropic-ai/sdk for categorization + insights
- Recharts for bar chart
- @react-pdf/renderer for PDF export
- localStorage only — no database, no auth
- Deployed to Vercel

## Key constraints

- Dark mode only
- Primary accent: `#7FD858` (green), hover `#6FCF4D`
- One month of data at a time — warn and require selection if CSVs span multiple months
- Fully auto-categorize with LLM; only prompt user for "Uncategorized" merchants
- Every category cell in the final report is click-to-edit with instant pivot/insights refresh
- Plausible analytics only — no Google Analytics, no cookie banners

## How to work with me

- I'm non-technical. Explain what you're doing and why before/after major changes.
- Work phase by phase per docs/spec.md. Stop after each phase so I can test.
- Commit to git after every phase with a clear message.
- If something breaks, don't pile code on top — suggest rolling back.
- When you need me to make a decision, ask one clear question instead of guessing.

## Files in docs/

- `spec.md` — full 10-phase build spec
- `report-reference.png` — visual target for the report view (TODO: Austin to add)
- `sample-*.csv` — real transaction samples for testing parsers (TODO: Austin to add)
