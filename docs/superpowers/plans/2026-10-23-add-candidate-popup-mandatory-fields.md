# Add Candidate Popup: Mandatory Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The "Add Candidate" popup on the recruiter-workflow-candidate page asks only for what is mandatory, and the three fields that are required to save are first name, last name and phone number. Everything else in the popup becomes optional or is removed, so the form matches the rules the database now enforces.

**Architecture:** Only the Angular form changes for the popup itself. The backend already accepts a partial candidate: a row missing a mandatory column is saved with `legacy_incomplete` set, and the Needs info list shows what is still missing. The plan changes the form validators, the template labels and the field list, then checks the save path for the reduced set of fields.

**Tech Stack:** Angular 18 reactive forms, Karma specs, existing candidate create endpoint.

**Spec:** Dev's message of 2026-10-23 (only phone number, first name and last name mandatory in the Add Candidate popup; remove fields that are not mandatory).

## Global Constraints

- Mandatory in the popup (asterisk and required validator): first name, last name, phone number (at least one, 10 digits).
- Email, skills, highest qualification and preferred location are no longer required in the popup. They remain optional fields where they are useful; the popup itself never blocks on them.
- Resume: the popup currently requires a resume file (`isFileMissing`). Dev's message does not list the resume as mandatory, so the plan makes it optional (see Question 1).
- The popup's save must never produce a row the database rejects. A row missing a mandatory column on the database side (email, skills, education, preferred location) is saved through the existing flag-off path, which sets `legacy_incomplete` on the backend, so it is accepted and appears in Needs info.
- No backend rule changes: the database check and the Needs info rule stay as built.
- Copy: "Needs info", never "intake".

## Review Focus

1. A popup candidate with only name and phone is saved and appears in Needs info, with the missing fields listed (not rejected by the database check). (Task 2 spec and dev check.)
2. A popup candidate with a duplicate phone or email already in the system gets the existing duplicate message, not a silent create. (Task 2 spec.)
3. Fields that are removed from the popup are still editable in the Needs info sidebar, so no data entry capability is lost. (Task 3 check.)
4. Field labels show the asterisk only on the three mandatory fields, and the Save button is not blocked by unfilled optional fields. (Task 1 spec.)

---

## Current state (checked 23 Oct)

`initializeForm` in `recruiter-workflow-candidate.component.ts` (around line 1541) marks these as required: first name, last name, phone numbers (at least one), email, total experience, relevant experience, expected CTC min and max, current CTC, preferred location, current location, notice period, gender, role (work experience), skills, highest qualification. `onSubmit` (around line 2140) also requires a resume file (`isFileMissing`). The template (`recruiter-workflow-candidate.component.html`, from line 915) has five sections: identity, contact, experience and CTC, role and skills, location and notice period.

## File Structure

- `pages/recruiter-workflow-candidate/recruiter-workflow-candidate.component.ts`: `initializeForm` validators, `onSubmit` checks (resume requirement, the list of invalid fields in the alert).
- `pages/recruiter-workflow-candidate/recruiter-workflow-candidate.component.html`: section markup (required asterisks, hidden or removed fields), the save button state.
- `pages/recruiter-workflow-candidate/recruiter-workflow-candidate.intake.spec.ts` (or a new spec next to it): validator and submit behaviour.
- `services/recruiter-workflow-candidate.service.ts`: payload only, if a field is removed from the payload.

---

### Task 1: Only the three mandatory fields are required

**Files:** modify the component `.ts` (`initializeForm`) and `.html` (asterisks and removed sections); test in the page spec.

- [ ] **Step 1: Write failing specs:** with only first name, last name and one valid phone filled, `candidateForm.valid` is true; with first name missing it is false; with no phone it is false; email, total experience, relevant experience, CTC, notice period, gender, role, skills, education and locations all empty still gives a valid form; a malformed phone is still invalid; the asterisk appears only on the three labels (DOM check).
- [ ] **Step 2: Run the spec, expect FAIL** (temporary tsconfig with `--include` on the page spec; delete the temp tsconfig afterwards; never the whole suite).
- [ ] **Step 3: Implement.** Keep `first_name` and `last_name` validators (letters only, max length). Keep `phone_numbers` with `minPhoneNumbersValidator` and `phoneNumberValidator`. Remove `required` from the other controls in `initializeForm`; keep their format validators (email format, number range, CTC pattern, max length) so an entered value is still checked. Remove the asterisk from the other labels. Remove the cross-field validators only if they then fail on empty values (`minMaxValidator` and `singleRelevantVsTotalValidator` must allow empty values).
- [ ] **Step 4: Run, expect PASS; run `npx ng build --configuration=development`.**
- [ ] **Step 5: Commit** `feat(candidate-form): only first name, last name and phone are mandatory in Add Candidate`

### Task 2: Resume and save path

**Files:** modify the component `.ts` (`onSubmit`), spec.

- [ ] **Step 1: Write failing specs:** saving with no resume file succeeds when the three mandatory fields are valid (the resume is optional, pending Question 1); a duplicate phone or email returns the existing message; the payload contains only the fields that have values (no empty strings for removed fields).
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement.** Remove the `isFileMissing` blocking condition and its `showFileError` path if Question 1 is answered "optional"; keep it if Dev wants the resume required. Make the alert list only the invalid mandatory fields.
- [ ] **Step 4: Run, expect PASS.**
- [ ] **Step 5: Commit** `feat(candidate-form): resume optional, save partial candidates`

### Task 3: Check with the backend and Needs info

- [ ] Confirm the create call for a partial candidate (name and phone only) is accepted by the candidate create endpoint and lands in Needs info with the right `missing_fields`. This is a read-only check on dev after deploy, or a backend test if the endpoint path differs with `CANDIDATE_INTAKE_ENABLED`.
- [ ] Confirm the sidebar (Needs info) still edits email, skills, education, locations and experience for the person.

### Task 4: Dev deploy (only after Dev says GO)

- [ ] Build and deploy the Angular dev bundle (no backend change expected). Check the popup on dev: fill only name and phone, save, see the person in Needs info.

---

## Questions for Dev

1. Should the resume file stay optional in the Add Candidate popup? (Recommended: yes, since Dev listed only three mandatory fields.)
2. Should the removed fields (total and relevant experience, CTC, notice period, gender, role) be removed from the popup entirely, or kept as optional fields? (Recommended: keep them as optional, so data entered by a recruiter is not lost; they are cheap to fill.)
3. Should email, skills, highest qualification and preferred location stay visible as optional fields in the popup? (Recommended: yes, marked optional. If a recruiter fills them, the person may reach Candidates sooner.)
