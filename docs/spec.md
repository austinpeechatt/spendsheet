# Spendsheet — 10-Phase Build Spec

## Project overview

Spendsheet is a free, no-login web app where users upload credit card CSV files and get an instant categorized monthly spending report. The report includes a pivot table, AI-generated insights, a bar chart, and a downloadable PDF. Privacy-first: no database, no bank connection, no accounts. Everything runs client-side except one LLM call for categorization and one for insights.

Tech stack: Next.js 14+ (App Router), TypeScript, Tailwind, shadcn/ui, Anthropic SDK, PapaParse, @react-pdf/renderer, Recharts. Deploys to Vercel.

Working principle: Do each phase, stop, let me test and commit to git, then move to the next phase. Do not build multiple phases at once.

## Phase 1 — Rebrand and polish (quick wins)

- Rename "Credi" to "Spendsheet" everywhere it appears (logo text, page title, metadata, component names, any copy)
- Update the accent color to #7FD858 with hover state #6FCF4D. Apply to: logo icon, "Generate Report" button background (with dark #0A0A0A text for contrast), "+ Add custom" button, links, focus rings, active/selected states
- Replace the hero headline with: "Your transactions, sorted. Your spending, explained."
- Replace the hero subhead with: "No account required. Drop your CSVs and get a clean monthly breakdown in seconds."
- Fix any awkward text wrapping in the hero at common breakpoints
- Keep the dark background and white/light gray text as-is

## Phase 2 — CSV parsing

Build per-issuer CSV parsers for Amex, Chase (and Chase Freedom/Sapphire variants), Discover, and Capital One. Each bank exports with different column layouts, date formats, and amount sign conventions.

- Auto-detect the issuer from the CSV headers using a detection function
- For unknown formats, fall back to sending the first few rows to the Anthropic API with a prompt asking the model to extract transactions into the standard schema
- Output a normalized JSON structure: { date: string (ISO), description: string, amount: number, payment_method: string }[]
- Preserve negative amounts (refunds, payments) — do not apply Math.abs()
- Test against the sample CSVs in docs/ — actually run them through and show me parsed output
- If the v0-generated parser already exists and handles most of this, port it into /lib/parsers/ as clean TypeScript modules and verify it works against real files

## Phase 3 — LLM integration (split architecture)

Set up a Next.js API route at /api/analyze that takes parsed transactions + the user's selected categories + the optional "anything we should know" notes. Inside that route, make two separate Anthropic API calls (this is deliberate — do not combine them):

### Call 1: Categorization

- Batch transactions into groups of ~50
- Run batches in parallel using Promise.all
- Each batch gets the list of categories + the user's notes + the batch of transactions
- Claude returns structured JSON with each transaction's assigned category
- Transactions the model is unsure about should be labeled "Uncategorized" (do not force a guess)
- Use Claude Sonnet (latest)

### Call 2: Insights

- After categorization completes, aggregate the data into pivot format on the server (category × payment method totals)
- Send only the aggregated summary (not raw transactions) to Claude Sonnet
- Ask for 4-5 insight bullets about the month's spending, in the style of the reference image at docs/report-reference.png
- Return structured JSON

API key lives in .env.local as ANTHROPIC_API_KEY. Use the @anthropic-ai/sdk package. Never expose the key to the client.

## Phase 4 — Uncategorized review modal

After categorization, if any transactions came back as "Uncategorized", show a centered modal card with a subtle jiggle animation on appear. The modal walks the user through each uncategorized transaction one at a time.

Each card shows:

- Date
- Merchant description
- Amount
- Dropdown of the user's selected categories

Controls:

- "Skip all as Misc" secondary button (bulk-assigns remaining to Misc)
- "Next" primary button (advances to next uncategorized)
- Progress indicator ("2 of 3")

Only after all uncategorized transactions are resolved does the report render. If there are zero uncategorized, skip this modal entirely.

## Phase 5 — Report view

Match the aesthetic of docs/report-reference.png — a dark-mode Notion-style spending summary. Build:

### Header
"[Month Year] — Spending Summary"

### Insights block

- 4-5 bullet points, each prefixed with a small #7FD858 dot
- Top-right corner: ghost button labeled 📋 Copy
- Clicking Copy copies all insight bullets as formatted plain text (with the month header) to the clipboard for pasting into Twitter/iMessage

### Pivot table

- Rows = categories, columns = payment methods, cells = SUM(amount)
- Grand total row (bold) and grand total column (bold)
- Clean table styling, subtle hover states on rows
- Every category cell is click-to-edit — clicking opens an inline dropdown to reassign that transaction's category. On change, instantly update pivot totals AND re-run the insights API call to regenerate the bullets.

### Bar chart

- Horizontal bars (Recharts)
- Categories sorted by spend descending
- Minimal axis labels, matches dark theme

### Transaction table (below pivot)

- Columns: Date, Description, Amount, Category, Payment Method
- Category column is an editable dropdown — click to change, instant pivot + insights refresh
- Sortable columns (click header to sort)
- Sticky header on scroll

### Sticky top-right action buttons

- "Download PDF" (primary green)
- "Save to browser" (secondary)
- "Start over" (ghost, clears state and returns to upload screen)

### Footer
"Generated [timestamp]" in muted text

## Phase 6 — PDF export

Use @react-pdf/renderer.

Two-page PDF:

- Page 1: Full transaction table (Date, Description, Amount, Category, Payment Method)
- Page 2: Insights bullets + pivot table + bar chart (render chart as SVG or static image for PDF)

Match the dark-mode aesthetic. Trigger download on "Download PDF" click. Filename: spendsheet-[month]-[year].pdf.

## Phase 7 — Save to browser (localStorage)

When user clicks "Save to browser":

- Serialize the entire report (transactions, categorized data, pivot, insights, month, timestamp) as JSON
- Save to localStorage under the key spendsheet_reports as an array (append new reports, don't overwrite)
- Show a small confirmation toast: "Saved"

On the landing page:

- If any saved reports exist in localStorage, show a "Your saved reports" section above the upload zone
- Display each saved report as a card: month, total spend, date saved
- Click a card to reopen that report in the report view (skip upload + categorization)
- Include a small × on each card to delete individual saved reports

## Phase 8 — Error handling

Handle these cases gracefully with friendly, non-technical messages. Never show a stack trace to the user.

- Non-CSV file uploaded: "That doesn't look like a CSV. Try re-exporting from your bank."
- Unrecognized CSV format: "We couldn't recognize this format. Supported: Amex, Chase, Discover, Capital One." with link to /docs/export-instructions (stub page)
- More than 2,000 rows: "That's a lot of transactions — please upload one month at a time."
- API failure during categorization or insights: "Something went wrong on our end. Your data is still safe in your browser." with a "[Try again]" button that retries the failed call
- Multi-month CSV: the inline warning + month picker already exists in the UI — wire it up so the selected month filters transactions before sending to the API
- Empty CSV / no transactions parsed: "We couldn't find any transactions in that file."

## Phase 9 — Sample data

Wire up the "Don't have a CSV handy? Try with sample data →" link. Clicking it:

- Loads a pre-made fake transaction dataset (generate ~80 realistic-looking fake transactions spanning Amex + Chase + Discover for a single month)
- Runs the full flow as if the user had uploaded real CSVs
- Includes a mix of categories so the report looks meaningful
- Include 2-3 intentionally weird merchants (e.g., SQ *UNKNOWN VENDOR) to demo the uncategorized review flow

Store the sample data in /lib/sample-data.ts.

## Phase 10 — Analytics

Add Plausible analytics (privacy-respecting, matches the app's ethos).

- Include the Plausible script tag in app/layout.tsx
- Use a data-domain placeholder — I'll swap in the real domain after deploying
- Track these custom events: upload_started, report_generated, pdf_downloaded, report_saved, sample_data_used
- Do NOT use Google Analytics or any tracker that requires a cookie banner

## Working agreement

- Work phase by phase. Complete one, stop, summarize what you did, and wait for my approval.
- Commit to git after each phase with a clear message like "Phase 3: LLM integration with split architecture".
- If a phase requires decisions I haven't made, ask me with one clear question — don't guess.
- If something breaks, don't pile code on top trying to fix it — suggest rolling back to the last clean commit.
- Explain what you did in plain English after each phase. I'm non-technical and reviewing the work, not the code.
