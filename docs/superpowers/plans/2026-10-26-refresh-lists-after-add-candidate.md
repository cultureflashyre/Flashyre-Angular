# Refresh the Candidate Lists After Add Candidate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After a recruiter saves, edits, deletes or verifies someone on the recruiter-workflow-candidate page, every list, tab count and statistic on the page shows the change straight away, without reloading the page.

**Architecture:** One refresh method on the page reloads what the change can touch (Sourced Database, Needs info, the summary counts and the statistics) and every action that changes a person calls it. The server side gets one small change so the statistics are not served stale after a Needs info person is created or deleted.

**Tech Stack:** Angular 18 (the candidate page component), Django cache invalidation, Karma specs.

**Spec:** Dev's message of 2026-10-26 (manual entry works, but the list does not update until the page is reloaded).

## Why the list does not update (checked 26 Oct)

In `recruiter-workflow-candidate.component.ts`, the Add Candidate success handler (around line 2194):
- **Person saved without an email (name and phone only, so a Needs info person):** it calls `loadIntake(1)` and `loadIntakeSummary()` only. It does **not** reload the Sourced Database list, which is built from the combined people list (`loadCandidates`). So a new person shows on the Needs info tab but not on the Sourced Database tab, and the tab counts and the "Total Candidates" statistic stay the same until a reload.
- **Person saved with an email (a candidate):** it inserts the row into the Sourced Database list locally (`masterCandidates.unshift`) and re-sorts. It does not reload Needs info, so an incomplete candidate never appears in Needs info, and the tab counts and statistics do not change. A local insert can also put the row in the wrong place (sort order, page size 30, filters, "newest first" from the server).
- **Statistics:** `fetchStatistics` is cached on the server for 60 seconds and only cleared when a candidate changes, not when a Needs info person is created or deleted.

The page already has the pieces: `loadCandidates(page)`, `loadIntake(page)`, `loadIntakeSummary()`, `fetchStatistics()`. They are simply not all called after a create.

## Global Constraints

- After any change, the lists come from the server (no hand-built rows), so counts, order, pagination and filters are always right.
- The recruiter stays where they are: the active tab, filters, search text and sort are kept; the list goes back to page 1 only after a create (so the new person is visible when the sort is "newest first").
- No visible flicker: the existing list stays on screen until the new data arrives.
- Copy: "Needs info", never "intake".

## Review Focus

1. Creating a person from the Sourced Database tab shows them there, and the Needs info count goes up by one, without a reload. (Task 1 spec.)
2. Creating from the Needs info tab shows them there and also on Sourced Database when the user switches tabs. (Task 1 spec.)
3. With the sort set to "oldest first", the new person is on the last page: the page tells the recruiter ("Created. Sorted oldest first, so it is on the last page") and does not look as if nothing happened. (Task 1 spec.)
4. A person saved with an email shows in Sourced Database and, if incomplete, in Needs info. (Task 1 spec.)
5. The statistics number is current right after a create or delete. (Task 2 test.)

---

## File Structure

- `pages/recruiter-workflow-candidate/recruiter-workflow-candidate.component.ts`: new `refreshAfterChange(options)`; the Add Candidate success handler, the edit, delete, verify and promotion handlers call it.
- `pages/recruiter-workflow-candidate/recruiter-workflow-candidate.intake.spec.ts` (or a new focused spec): refresh behaviour.
- Backend `adb_recruiter_candidate_form/views.py` (statistics cache) and `candidate_intake/` signals or the person service: clear the candidate statistics cache when a Needs info person is created, changed or deleted.

---

### Task 1: One refresh after every change

**Files:** modify the component `.ts`; test in the page spec.

**Interfaces:**
- Produces: `refreshAfterChange(opts: { goToFirstPage?: boolean } = {}): void`, which calls `loadCandidates(goToFirstPage ? 1 : this.currentPage)`, `loadIntake(goToFirstPage ? 1 : this.intakePage)`, `loadIntakeSummary()` and `fetchStatistics()`. It keeps the filters, search and sort.

- [ ] **Step 1: Write failing specs:** after creating a Needs info person (server answers `kind: 'intake'`), `loadCandidates(1)`, `loadIntake(1)`, `loadIntakeSummary()` and `fetchStatistics()` are all called; after creating a candidate, the same calls happen and no hand-built row is inserted into the list; edit, delete and verify call `refreshAfterChange` without resetting the page; with the sort set to oldest first the success message mentions the last page.
- [ ] **Step 2: Run, expect FAIL** (temporary tsconfig with `--include` on the page spec; delete the temp tsconfig afterwards; never the whole suite).
- [ ] **Step 3: Implement** `refreshAfterChange`; replace the two branches in the Add Candidate success handler (the Needs info branch and the local `unshift`) with a call to it; call it from the delete, verify, sidebar-save and promotion handlers (the places that today call only some of the loaders, around lines 797 to 860 and 1125 to 1215). Keep the success alert text.
- [ ] **Step 4: Run, expect PASS; run `npx ng build --configuration=development`.**
- [ ] **Step 5: Commit** `fix(candidates): refresh every list and count after an add, edit or delete`

### Task 2: Statistics are not stale after a Needs info change

**Files:** modify `adb_recruiter_candidate_form/views.py` (where the statistics cache is cleared, around line 963) and `candidate_intake/` (signal or service hook); test `candidate_intake/test_stats_cache.py` (new).

- [ ] **Step 1: Write failing test:** read the statistics (cache filled), create a Needs info person through the create endpoint, read the statistics again and get the new count; the same after deleting that person and after a promotion.
- [ ] **Step 2: Run, expect FAIL** (PowerShell: `$env:ENV_TYPE='unit'; python manage.py test candidate_intake.test_stats_cache --settings=flashyre_django.settings.unit --noinput`).
- [ ] **Step 3: Implement:** clear the candidate statistics cache key (and bump `candidate_list_version`) in the same place candidate saves clear it, for `CandidateIntake` saves, deletes and promotions.
- [ ] **Step 4: Run, expect PASS; run the `candidate_intake` and `adb_recruiter_candidate_form` suites.**
- [ ] **Step 5: Commit** `fix(stats): clear the candidate statistics cache when a Needs info person changes`

### Task 3: Dev deploy (only after Dev says GO)

- [ ] Build and deploy the backend image and the Angular bundle to dev (`gcloud run deploy ... --image=<image>` keeps the existing settings, as noted in the runbook).
- [ ] On dev: add a person with name and phone only, and see them appear on both tabs and in the counts with no reload; add one with an email; edit one; delete one.

---

## Optional extras (only if Dev wants them)

- **Highlight the new row:** scroll to the top and briefly highlight the person just created, so it is obvious where they went.
- **Automatic background refresh:** reload the list every minute while the page is open, so changes by other recruiters appear too. This is a separate decision because it adds server traffic.
