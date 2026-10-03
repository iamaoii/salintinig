# SalinTinig Phil-IRI Stage 2 Standardization: Implementation Plan v2

Part A: Assessment engine (Phil-IRI Stage 2, Oral Reading)
Part B: Analytics for Web and Mobile (Admin, Teacher, Student, Parent)

Part B depends on Part A. Build Part A first. Part B must not start until Part A has produced complete, standardized profile data.

---

## 0. What changed from v1

| # | Gap in v1 | Fix in v2 |
|---|-----------|-----------|
| 1 | Passage classification only said "use the criteria already implemented" | Section A3 states the manual's per-passage rule: Word Reading and Comprehension are both computed, and the **lower** of the two is the passage profile |
| 2 | GST 14+ was vague ("do not automatically send") | Manual says **discontinue testing**. Now an explicit status: `GST_NOT_REQUIRED` |
| 3 | Adaptive logic described by scenarios only | Explicit state machine with a transition table (A5), driven by what is already established |
| 4 | Adjacent jump undefined: Independent at G2, then Frustration at G3 leaves no Instructional passage between them | New terminal state and open question OQ-3 |
| 5 | Multiple Instructional results (e.g. G3 and G4 both Instructional) undefined | Open question OQ-4, with an interim rule behind a config flag |
| 6 | English Grade 4 with GST 0-7 starts at Grade 1, which is outside the v1 English range (G2-G7) | Open question OQ-1. Engine must never silently clamp |
| 7 | Passage ranges (English G2-G7, Filipino G1-G6) were asserted as fact | Marked **must verify against the actual passage bank** (OQ-2). Ranges live in config, not code |
| 8 | Server role in scoring unspecified | Backend recomputes scores and classification from raw counts. Clients never decide |
| 9 | No handling for lost connections or double submits | Idempotent attempt submission and a DB uniqueness guard against duplicate passages |
| 10 | Post-Test passage selection not addressed | Post-Test uses its own parallel passage sets (OQ-7) |
| 11 | No analytics plan | Part B |

---

## 1. Source of truth

```text
2018 Phil-IRI Manual of Administration (DepEd)
        |
This plan
        |
Existing SalinTinig architecture
        |
Engineering implementation
```

SalinTinig automates Phil-IRI. It does not redefine it. If a rule is not covered by the manual or this plan, **do not invent it**. Add it to the Open Questions list (Section A10), stop on that branch, and report.

Verification note: this plan was checked against secondary copies of the manual (slide decks and document mirrors), not the official PDF. Anything marked OQ must be confirmed against the official DepEd document before release.

---

## A1. Manual-to-system mapping (Stage 1 and Stage 2)

| Manual step | System behavior |
|-------------|-----------------|
| **Stage 1: GST** (Form 1A Filipino, Form 1B English) | Existing GST. Backend computes the raw score and the outcome |
| Raw score **below 14** goes to individual assessment | `GST_REQUIRES_INDIVIDUAL` |
| Raw score **14 and above**: discontinue testing | `GST_NOT_REQUIRED`. No passage attempts and no I/IN/F profile are created |
| **Stage 2, Step 1:** starting passage from GST score | 0-7: 3 grade levels below the learner's grade. 8-13: 2 grade levels below |
| **Step 2:** for each passage compute Word Reading and Comprehension, then the reading level for that passage | Per-passage classification (A3) |
| Independent: give a **higher** passage to find Instructional | Transition table (A5) |
| Instructional: give a **higher** passage to find Frustration | Transition table |
| Frustration: give a **lower** passage to find Instructional | Transition table |
| Once Frustration is identified, give a passage **lower than the starting point** to find Independent | Transition table |
| The aim is to find the learner's Independent, Instructional and Frustration levels | Completion requires all three (A6) |
| Pre-Test (start of school year) and Post-Test (after specialized instruction, using parallel forms) | Separate assessment instances (A7) |
| Optional: Listening Comprehension (non-readers) and Silent Reading | **Out of scope.** Leave an extension point only (A9) |

Pre-Test is scheduled for the first quarter (July to August) per the manual's timeline. Store the period as data. Do not hard-block assessments outside the window unless the school asks for it.

---

## A2. Scope

In scope:

1. GST outcome and starting passage (backend authoritative)
2. Per-passage scoring and classification
3. Adaptive Stage 2 engine
4. Persistence of the full profile, the attempt history and the resumable state
5. English and Filipino separation
6. Pre-Test and Post-Test separation
7. Result screens for the completed profile
8. Web and Mobile integration

Out of scope: analytics redesign (Part B, separate phase), Silent Reading and Listening Comprehension, authentication, enrollment, Story Library, practice activities, and unrelated admin features.

---

## A3. Per-passage scoring and classification

Compute on the **backend** from raw inputs (word count, miscue count, number of questions, number of correct answers, reading time).

```text
Word Reading Score  = (number of words - number of miscues) / number of words x 100
Comprehension Score = correct answers / number of questions x 100
Reading Speed (wpm) = number of words read / reading time in seconds x 60
```

| Level | Word Reading | Comprehension |
|-------|--------------|---------------|
| Independent | 97-100% | 80-100% |
| Instructional | 90-96% | 59-79% |
| Frustration | 89% and below | 58% and below |

**Combined rule (per passage):** classify Word Reading and Comprehension separately, then take the **lower** level. Independent is the highest and Frustration is the lowest.

| Word Reading | Comprehension | Passage profile |
|--------------|---------------|-----------------|
| Independent | Independent | Independent |
| Independent | Instructional | Instructional |
| Independent | Frustration | Frustration |
| Instructional | Independent | Instructional |
| Instructional | Instructional | Instructional |
| Instructional | Frustration | Frustration |
| Frustration | any | Frustration |

Implementation notes:

- Store `word_reading_level`, `comprehension_level` and the combined `classification` on every attempt.
- The classification never depends on the passage grade versus the enrolled grade.
- Define rounding explicitly before coding (for example, 96.5% and 89.5% fall between the manual's bands). Record the choice as OQ-8 if the manual does not settle it.
- Keep the existing evidence: miscue records, transcript, audio reference, timing and comprehension responses.

---

## A4. Starting passage and language ranges

```text
offset = 3 if gst_raw_score in 0..7
offset = 2 if gst_raw_score in 8..13
(14+ is GST_NOT_REQUIRED, no starting passage)

starting_level = enrolled_grade - offset
```

Examples: Grade 6 with GST 6 starts at Grade 3. Grade 6 with GST 10 starts at Grade 4.

Passage ranges are **configuration**, not constants in code:

```text
ENGLISH:  min = 2, max = 7   (VERIFY, OQ-2)
FILIPINO: min = 1, max = 6   (VERIFY, OQ-2)
```

Rules:

- Student scope stays Grades 4-6. Passage range is a different concept.
- If `starting_level` falls outside the language range, **do not clamp silently**. Create the assessment with status `NEEDS_REVIEW` and terminal reason `STARTING_POINT_OUT_OF_RANGE`, and surface it to the teacher. Known case: **English, Grade 4, GST 0-7 gives Grade 1.** (OQ-1)
- The server picks the starting passage. Clients never compute it.

---

## A5. Adaptive engine

### A5.1 State

Persist on the assessment record. Reuse existing fields where equivalents exist.

```text
starting_passage_level
current_target_level      (the next passage the client must administer)
independent_level
instructional_level
frustration_level
search_state
status                    (IN_PROGRESS | COMPLETE | TERMINATED | NEEDS_REVIEW)
terminal_reason
```

Attempt history lives in the attempts table. The engine rebuilds all state from it, so resume and recomputation always agree.

### A5.2 States

```text
INITIAL_PASSAGE
SEARCHING_INSTRUCTIONAL_UP      after Independent
SEARCHING_FRUSTRATION_UP        after Instructional, Frustration unknown
SEARCHING_INSTRUCTIONAL_DOWN    after Frustration, Instructional unknown
SEARCHING_INDEPENDENT_DOWN      Instructional known, Independent unknown
COMPLETE
UPPER_BOUNDARY_REACHED          (terminal)
LOWER_BOUNDARY_REACHED          (terminal)
NO_INSTRUCTIONAL_BETWEEN        (terminal, adjacent jump, OQ-3)
NEEDS_REVIEW                    (terminal until resolved)
```

### A5.3 Transition table

The result is for the passage at level `L` just administered.

| From state | Result at L | Record | Next state | Next target |
|------------|-------------|--------|------------|-------------|
| INITIAL_PASSAGE | Independent | I = L | SEARCHING_INSTRUCTIONAL_UP | L + 1 |
| INITIAL_PASSAGE | Instructional | IN = L | SEARCHING_FRUSTRATION_UP | L + 1 |
| INITIAL_PASSAGE | Frustration | F = L | SEARCHING_INSTRUCTIONAL_DOWN | L - 1 |
| SEARCHING_INSTRUCTIONAL_UP | Independent | I = L (raise to highest) | same | L + 1 |
| SEARCHING_INSTRUCTIONAL_UP | Instructional | IN = L | SEARCHING_FRUSTRATION_UP | L + 1 |
| SEARCHING_INSTRUCTIONAL_UP | Frustration | F = L | NO_INSTRUCTIONAL_BETWEEN | none (OQ-3) |
| SEARCHING_FRUSTRATION_UP | Frustration | F = L | if I known: COMPLETE, else SEARCHING_INDEPENDENT_DOWN | none, or (IN - 1) |
| SEARCHING_FRUSTRATION_UP | Instructional | IN per OQ-4 | same | L + 1 |
| SEARCHING_FRUSTRATION_UP | Independent | not defined | NEEDS_REVIEW | none (OQ-5) |
| SEARCHING_INSTRUCTIONAL_DOWN | Frustration | F = L (lowest) | same | L - 1 |
| SEARCHING_INSTRUCTIONAL_DOWN | Instructional | IN = L | SEARCHING_INDEPENDENT_DOWN | L - 1 |
| SEARCHING_INSTRUCTIONAL_DOWN | Independent | I = L | NO_INSTRUCTIONAL_BETWEEN | none (OQ-3) |
| SEARCHING_INDEPENDENT_DOWN | Independent | I = L | COMPLETE | none |
| SEARCHING_INDEPENDENT_DOWN | Instructional | IN per OQ-4 | same | L - 1 |
| SEARCHING_INDEPENDENT_DOWN | Frustration | not defined | NEEDS_REVIEW | none (OQ-5) |

Boundary override, applied before any move:

- If the next target is above the language maximum, set `UPPER_BOUNDARY_REACHED`.
- If the next target is below the language minimum, set `LOWER_BOUNDARY_REACHED`.
- Never request a nonexistent passage. Never infer I, IN or F for a level that was not administered.
- Whether to keep searching in the opposite direction after a boundary is hit (for example, Instructional at the top passage with Independent still unknown) is **not defined by the manual**. v2 keeps v1's behavior (terminate with the partial profile) and records it as OQ-6.

### A5.4 Duplicate-passage protection

Algorithm for choosing the next target:

```text
cursor = L
loop:
    cand = cursor + direction
    if cand is out of language range -> boundary terminal
    if cand already has an attempt:
        apply its recorded classification through the same transition rules
        cursor = cand
        continue
    else:
        return cand as next target
```

This prevents the G3, G4, G3, G4 loop. A tested level is **never re-administered**. If an attempt is invalid (for example, an audio failure), the teacher voids it explicitly. The voided attempt is kept for history, and only then may that level be re-administered.

Database guard: a unique index on `(assessment_id, passage_grade_level)` for non-voided attempts.

### A5.5 Profile derivation

Derive the profile from the full attempt set so recomputation always gives the same answer:

```text
F  = lowest Frustration level above the established IN
     (if IN is unknown, the lowest Frustration level tested so far)
IN = Instructional level adjacent to F (rule for multiples: OQ-4)
I  = highest Independent level below IN
     (if IN is unknown, the highest Independent level tested so far)
```

This reproduces v1's scenarios B and E (multiple Independent, multiple Frustration). B and E are reasonable readings of the flowchart but are not stated word for word in the manual, so record them as OQ-9 for sign-off.

---

## A6. Completion

`COMPLETE` requires:

```text
independent_level IS NOT NULL
AND instructional_level IS NOT NULL
AND frustration_level IS NOT NULL
```

Any other end is `TERMINATED` with a reason (`UPPER_BOUNDARY_REACHED`, `LOWER_BOUNDARY_REACHED`, `NO_INSTRUCTIONAL_BETWEEN`) or `NEEDS_REVIEW`. Terminated profiles keep only the levels actually established. The frontend never decides completion.

---

## A7. Data model (additive migrations)

Audit the existing schema first and reuse what exists. Conceptually:

**Assessment** (one per student, language, type and period)

```text
id, student_id
assessment_type          PRE_TEST | POST_TEST
language                 ENGLISH | FILIPINO
assessment_period        (school year, and quarter if used)
gst_id / gst_raw_score / gst_outcome
starting_passage_level
independent_level, instructional_level, frustration_level
search_state, current_target_level
status, terminal_reason
profile_basis            STANDARD_V2 | LEGACY_STOP_AT_INSTRUCTIONAL
is_legacy_incomplete     boolean
started_at, completed_at
```

**Passage attempt**

```text
id, assessment_id, student_id
passage_id, passage_grade_level, language
sequence_number
word_count, miscue_count, word_reading_score, word_reading_level
questions_total, questions_correct, comprehension_score, comprehension_level
classification
reading_time_seconds, reading_speed_wpm
transcript, audio_reference
client_attempt_id        (idempotency key)
is_voided, void_reason
started_at, completed_at
```

Constraints and indexes:

- Unique `(student_id, language, assessment_type, assessment_period)` for the active assessment
- Unique `(assessment_id, passage_grade_level)` where `is_voided = false`
- Unique `client_attempt_id` per assessment, so a retried submit never double-counts
- Index `(student_id, language, assessment_type)` for profile lookups

Rules:

- Pre-Test and Post-Test never overwrite each other, and English and Filipino never overwrite each other.
- Do not drop or overwrite `student.reading_level`. Keep it temporarily as a compatibility field (Part B, B7) and stop treating it as the profile.
- Legacy records (stopped at Instructional): migrate as `I = known, IN = known, F = NULL`, `profile_basis = LEGACY_STOP_AT_INSTRUCTIONAL`, `is_legacy_incomplete = true`. **Never fabricate a Frustration level.** Where history only holds a latest classification and no per-passage rows, preserve it as-is and mark it legacy.

---

## A8. API contract

Follow existing conventions. Conceptual endpoints:

```text
POST /phil-iri/assessments
     body: student_id, language, assessment_type
     server reads GST, returns outcome and (if required) first target

POST /phil-iri/assessments/:id/attempts
     body: client_attempt_id, passage_id, raw metrics, transcript, audio ref
     server scores, classifies, runs the engine

GET  /phil-iri/assessments/:id
     rebuilds state for resume

GET  /phil-iri/students/:id/profiles
     all profiles by language and type (feeds result screens and analytics)

POST /phil-iri/attempts/:id/void        (teacher or admin only)
```

Attempt submit response:

```json
{
  "classification": "INSTRUCTIONAL",
  "wordReading": { "score": 94, "level": "INSTRUCTIONAL" },
  "comprehension": { "score": 80, "level": "INDEPENDENT" },
  "profile": { "independentLevel": 2, "instructionalLevel": 3, "frustrationLevel": null },
  "adaptiveState": { "status": "IN_PROGRESS", "searchingFor": "FRUSTRATION", "direction": "UP" },
  "nextPassage": { "gradeLevel": 4, "passageId": "..." },
  "terminalReason": null
}
```

On completion, `nextPassage` is `null` and `status` is `COMPLETE`.

---

## A9. Web, Mobile and results

**Resume.** `GET assessment` must rebuild tested passages, known levels, search state and the next target. It must survive refresh, app restart, connection loss and navigation away.

**Web (React) and Mobile (Flutter).**

- Remove any local `calculateNextPassage` logic. Render the backend response only.
- Show the next passage from `nextPassage`. Do not compute it.
- Queue and retry failed submits using the same `client_attempt_id`.

**Result screens** (where the completed result is shown). Replace "Reading Level: Instructional" with:

```text
Phil-IRI Oral Reading Profile (English, Pre-Test)

Independent Level:    Grade 2
Instructional Level:  Grade 3
Frustration Level:    Grade 4

Path: G2 Independent -> G3 Instructional -> G4 Frustration
```

For terminated profiles, show only the established levels plus a plain reason (for example, "No higher passage available"). For legacy records, show the stored levels with a "Completed under the earlier assessment version" note.

Extension point only: listening comprehension and silent reading attach to the same assessment record later. Do not build them now.

---

## A10. Open questions (do not invent, confirm against the official manual or DepEd)

| ID | Question |
|----|----------|
| OQ-1 | English, Grade 4, GST 0-7: the starting level is Grade 1, which is outside the English range configured. What does the manual intend? |
| OQ-2 | Confirm the exact graded-passage range available for English and for Filipino in the official passage sets |
| OQ-3 | Adjacent jump (Independent then Frustration at the next grade with no Instructional between): what does the manual prescribe? |
| OQ-4 | Multiple Instructional results at consecutive levels: which is the Instructional level? Interim rule (config flag, needs sign-off): the Instructional level adjacent to the Frustration level |
| OQ-5 | Non-monotonic results (for example, Frustration then a higher Independent): manual guidance? Interim: `NEEDS_REVIEW` |
| OQ-6 | After hitting a boundary, continue searching the opposite direction? Interim: terminate with the partial profile |
| OQ-7 | Post-Test: starting passage rule and parallel-set selection |
| OQ-8 | Rounding at band edges (for example, 96.5%) |
| OQ-9 | Confirm "highest Independent" and "lowest Frustration above Instructional" as the intended boundary definitions |

---

## A11. Phases

1. **Audit** (no code changes): GST flow, adaptive flow, stop condition, classification logic, schema, affected Web/Mobile/Backend files, and every consumer of `reading_level` or latest classification
2. **Domain model:** minimum schema changes
3. **Backend engine:** one centralized service plus pure functions (scoring, classification, derivation, next target)
4. **Migration:** additive, legacy-safe
5. **API integration**
6. **Web integration**
7. **Mobile integration**
8. **Result screens**
9. **Automated tests**
10. **Regression testing**

---

## A12. Tests

Unit tests for the engine, as pure functions with no DB:

| Test | Input sequence | Expected |
|------|----------------|----------|
| A | G2 I, G3 IN, G4 F | I=2, IN=3, F=4, COMPLETE |
| B | G2 I, G3 I, G4 IN, G5 F | I=3, IN=4, F=5, COMPLETE |
| C | G3 IN, G4 F, G2 I | I=2, IN=3, F=4, COMPLETE |
| D | G4 F, G3 IN, G2 I | I=2, IN=3, F=4, COMPLETE |
| E | G5 F, G4 F, G3 IN, G2 I | I=2, IN=3, F=4, COMPLETE |
| F | G2 I, G3 I, G4 I, G5 IN, G6 F | I=4, IN=5, F=6, COMPLETE |
| G | English: G6 I, G7 I | I=7, IN=null, F=null, UPPER_BOUNDARY_REACHED, never request G8 |
| H | Filipino upper boundary | Never request G7 |
| I | English lower boundary | Never request below G2 |
| J | Filipino lower boundary | Never request below G1 |
| K | GST 14+ | `GST_NOT_REQUIRED`, no attempts, no profile |
| L | Resume after G2 I, G3 IN | Next target G4, searching Frustration. Does not restart |
| M | Direction changes | No passage administered twice |
| N | Post-Test created | Pre-Test profile unchanged |
| O | English profile written | Filipino profile unchanged |
| P | Classification matrix | All 9 word-reading by comprehension combinations produce the lower level (A3) |
| Q | Band edges | 97, 96, 90, 89 word reading and 80, 79, 59, 58 comprehension classify correctly |
| R | Adjacent jump | G2 I then G3 F ends `NO_INSTRUCTIONAL_BETWEEN` with no loop |
| S | Starting out of range | English G4 with GST 0-7 gives `NEEDS_REVIEW`, no clamp |
| T | Idempotent submit | Same `client_attempt_id` twice records one attempt |
| U | Void | Voided attempt is kept and its level may then be re-administered |
| V | Legacy migration | Legacy row gets F=null, `is_legacy_incomplete = true`, no fabricated level |

Integration tests: Grades 4, 5 and 6, each in English and Filipino, Pre-Test and Post-Test, on both Web and Mobile, including refresh/restart mid-assessment.

---

## A13. Absolute prohibitions

Do not: stop at Instructional; use the latest passage as the whole profile; classify by grade distance; infer untested passages; generate nonexistent passages; share ranges across languages; overwrite Pre-Test, Post-Test or the other language; discard attempts; allow adaptive loops; let Web and Mobile hold separate algorithms; fabricate history; invent Phil-IRI rules.

---

# Part B: Analytics

## B1. Principles

1. **Analytics reads only standardized assessment data** (Part A tables). It never recomputes classification.
2. **One backend analytics layer** serves Web and Mobile. No platform computes its own metrics.
3. **Three levels, never one label.** Dashboards never collapse a learner into a single "Instructional/Frustration" tag derived from the last passage.
4. **Separate by language and by Pre/Post.** English and Filipino are never merged. Pre and Post are never merged.
5. **Honest populations.** Complete, terminated, `NEEDS_REVIEW`, legacy and GST-not-required learners are shown as distinct groups. Legacy and incomplete profiles are never silently counted as complete.
6. **Respect the manual's wording** for Phil-IRI terms. Anything SalinTinig derives beyond the manual is labelled as a SalinTinig metric (see B3).

## B2. Source data

| Source | Used for |
|--------|----------|
| Assessment (profile and status) | Level distributions, completion funnel, growth |
| Passage attempt | Word reading, comprehension, speed, miscues, assessment path |
| GST record | Screening outcomes and coverage |
| Enrollment, section, school, teacher | Scoping and rollups |
| Parent-student link (new, B6) | Parent access |

## B3. Metric definitions

**Phil-IRI metrics (direct from stored data)**

| Metric | Definition |
|--------|------------|
| GST coverage | Learners with a GST outcome / enrolled learners, per language |
| Screening outcome | Share `GST_REQUIRES_INDIVIDUAL` vs `GST_NOT_REQUIRED` |
| Completion funnel | Requires individual, started, complete, terminated, needs review, per language and period |
| Profile distribution | Count of learners by Independent level, by Instructional level and by Frustration level (grade of passage), complete profiles only |
| Per-passage results | Word reading %, comprehension %, wpm, classification per administered passage |
| Miscue patterns | Miscue categories from existing miscue records, per learner, section and passage |
| Assessment path | Sequence of passages and classifications for one learner |

**SalinTinig-derived metrics (label clearly; product decision, not a Phil-IRI category)**

| Metric | Definition |
|--------|------------|
| Grade gap | `enrolled_grade - instructional_level`, complete profiles only. Shown as a number, not given a new classification name |
| Growth | Post minus Pre for each of Independent, Instructional and Frustration levels, same learner and language, both complete |
| Growth in speed and comprehension | Change in average wpm and comprehension on comparable passages, only where the same passage level exists in both tests |

Do not invent new classification categories. Display the three levels as they are.

Edge rules:

- Terminated profiles show the established levels only and are excluded from distributions that need all three, but are listed in a "partial" count.
- Growth is computed only when both tests are complete in the same language. Otherwise show "not enough data."
- Legacy records appear in a separate "earlier version" segment and are excluded from growth.
- Small groups: hide aggregates for fewer than a school-defined minimum (suggest 5) in cross-section views to avoid singling out learners.

## B4. Data layer

Build on Supabase/Postgres with views or RPCs. Confirm the existing pattern during the audit.

```text
v_learner_profile            one row per student, language, type, period (levels, status, path summary)
v_attempt_detail             one row per attempt with computed fields
v_section_summary            aggregates by section, grade, language, type, period
v_school_summary             aggregates by school
v_completion_funnel          funnel counts
v_growth_pre_post            Pre/Post deltas for eligible learners
```

- Use row-level security so every role sees only what it is allowed to see (B5). Views should respect the caller's permissions.
- If dashboards are slow, convert section and school summaries to materialized views refreshed when an assessment completes or is voided. Do not cache on the client.
- Provide a temporary compatibility view that exposes the old latest-classification shape (`v_legacy_latest_classification`) so existing dashboards keep working until they migrate, then delete it (B7).

API: expose the above through the existing backend (for example `/analytics/students/:id`, `/analytics/sections/:id`, `/analytics/schools/:id`, `/analytics/funnel`, `/analytics/growth`). Both clients call the same endpoints. Filters: language, assessment type, period, grade, section.

## B5. Views by role

### Teacher (Web full, Mobile essentials)

Scope: only the teacher's assigned sections.

- **Class overview:** completion funnel, GST outcomes, and a profile distribution chart (Independent / Instructional / Frustration levels) per language, with Pre/Post toggle
- **Roster table:** each learner's three levels, status badge (Complete / Partial / Needs review / Not required / Legacy), last assessed date. Sortable by grade gap
- **Action lists:** learners needing assessment, `NEEDS_REVIEW` items (with the reason, for example starting point out of range), partial profiles at a boundary (candidate for the optional listening-comprehension referral), legacy records to reassess
- **Learner drill-down:** profile card, assessment path, per-passage scores, miscue breakdown, audio and transcript playback, Pre vs Post comparison, void attempt action
- **Export:** CSV and print-friendly summary of the section profile
- **Mobile:** class overview, roster, learner profile and alerts. Heavy tables, charts with many filters and exports stay Web-only

### Admin (school level) (Web primary, Mobile summary)

Scope: the admin's school.

- School rollups by grade and section: funnel, level distribution, Pre/Post growth, per language
- Teacher completion monitor: how many assigned learners have been assessed
- Data quality panel: legacy count, `NEEDS_REVIEW` count, GST-not-required count, out-of-range starting points
- Export of summary tables
- **Mobile:** headline numbers and the data-quality panel only

Super Admin (if the project keeps this role): the same views scoped across schools, with school comparison. Apply the small-group suppression rule.

### Student (Mobile primary, Web mirror)

Scope: own data only.

- Own profile card per language: "Independent / Instructional / Frustration" with a short plain-language explanation of each (reading comfortably, reading with teacher support, too hard for now)
- Assessment path visual for the latest assessment
- Pre vs Post progress when available, framed as growth
- No ranking or comparison against other learners
- Wording must be encouraging and age-appropriate (Grades 4-6). Do not show "Frustration" as a label on a failing-style screen; keep the Phil-IRI term but pair it with supportive text. Content decisions here need teacher or school input
- Link the learner to practice content only if the project already has a recommendation hook, and treat that as a later enhancement

### Parent (new, optional "if ever")

This role does not exist yet. Do not build it until the school approves.

- Requires a **parent-student link** table (parent_id, student_id, verified_by, verified_at, active) and a verified onboarding flow (teacher or admin confirms the link)
- Scope: only linked children, **read-only**
- Content: child's latest completed profile per language, Pre vs Post progress, plain-language summary, suggested home reading support written by the school
- No class averages, no other learners, no raw audio by default (audio of a minor is sensitive; make it opt-in by the school if at all)
- Supports English and Filipino text
- Notifications (optional): "A new reading profile is available"
- Privacy: learner data belongs to minors. Review consent, retention and parental-access rules against the Data Privacy Act (RA 10173) and DepEd data policy with the school before launch. Confirm the exact requirements with the DPO. This is not legal advice
- **Mobile primary**, with a simple Web page

## B6. Platform split

| Capability | Web (React) | Mobile (Flutter) |
|------------|-------------|-------------------|
| Teacher analytics | Full | Essentials |
| Admin and Super Admin analytics | Full | Summary |
| Student results | Yes | Primary |
| Parent view | Simple page | Primary |
| Exports | Yes | No (share link or summary only) |
| Chart interactivity and filters | Full | Reduced |

Rules for both: same API, same field names, same status labels. No client-side metric calculations. Show loading, empty ("no assessment yet") and partial states explicitly. Cache recent summaries on mobile for offline viewing and show the "last updated" time.

## B7. Migration from the old model

1. **Audit** every query, chart and screen that reads `student.reading_level` or the latest attempt's classification. Produce the list that the Part A report requires
2. Serve those screens from `v_legacy_latest_classification` temporarily so nothing breaks
3. Migrate each screen to the profile-based views, one role at a time
4. Remove the compatibility view and the legacy reads once nothing uses them
5. Existing historical charts show legacy data with the "earlier version" label and are never merged into standardized distributions

## B8. Analytics phases

| Phase | Work |
|-------|------|
| B-1 | Audit existing analytics and list dependencies on the old model |
| B-2 | Finalize metric definitions and the small-group rule with the school and teachers |
| B-3 | SQL views and row-level-security policies, with tests per role |
| B-4 | Analytics API and contract tests |
| B-5 | Teacher then Admin dashboards on Web |
| B-6 | Teacher and Admin essentials on Mobile |
| B-7 | Student views on Mobile and Web |
| B-8 | Parent role and views (only if approved), including the privacy review |
| B-9 | Remove the compatibility view |
| B-10 | Regression and permissions testing |

## B9. Analytics tests

- **Permissions:** each role sees only its scope. Test a teacher against another teacher's section, a student against another student, a parent against an unlinked child, and an admin against another school
- **Correctness:** distributions match raw attempt data for seeded fixtures covering complete, terminated, legacy, Pre/Post and both languages
- **Separation:** English figures never include Filipino and Pre figures never include Post
- **Growth:** computed only for eligible learners and excluded for legacy
- **Suppression:** groups under the minimum are hidden
- **Parity:** Web and Mobile show identical numbers for the same learner and filter
- **Performance:** summary endpoints respond acceptably for a full school load

## B10. Reporting back after Part B

Report: views and endpoints added, role-by-role screens delivered (Web and Mobile), the dependency list that was retired, remaining legacy-compat items, privacy review outcome for the Parent role, and any metric definitions that still need school sign-off.
