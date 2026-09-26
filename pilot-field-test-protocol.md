---
doc_id: thinkboard-lite-pilot-field-test
title: Pilot field test — Q7, Q8, Q9
version: "1.0"
status: ready-to-run
updated: 2026-09-26
phase: "Pilot / human gate"
extends: ["todo-task-000-split.md", "01-thinkboard-lite-spec.md"]
companion: ["architecture.blueprint.json", "todo-task-012-notes-and-handwriting.md", "todo-task-024-ink-transcription.md"]
authority: "The script a human runs to answer Q7/Q8/Q9. It answers nothing by itself."
---

# Pilot field test — Q7, Q8, Q9

**Why this exists.** Three of the four genuinely unanswered registry items are device questions an agent cannot
answer. They gate real work:

| id | question | gates |
|---|---|---|
| **Q7** | Does the OS handwriting input (Apple Scribble / Gboard / Samsung) produce usable Bahasa Indonesia in the app's plain textarea? | decides whether **024** exists and whether `ink-pad` gets a painter |
| **Q8** | The real tablet mix (iPad vs S Pen vs other Android) | **012, 022** |
| **Q9** | Do pilot users have styluses at all? | **012** |

**What the app gives the test.** The note sheet's "Tulis tangan" tab is a **plain `<textarea>`** (no
`contenteditable`, no rich text) — deliberately, so the OS's own stylus-to-text conversion is what is measured
(03 §3, task 012 g1/g2). There is **no model call and no network** in that path (RULE: transcription is the OS's).

**Who and how long.** 3 pilot users, their own tablets, **~45 minutes each** for Q7 plus a **2-minute survey**.
The cheapest high-value item on the registry.

---

## 0. Before you start

- One tablet per participant, **charged**, with the pilot build open on a workspace that has a document.
- Each participant's **own stylus** (do not hand out a substitute — Q9 is about what they *have*).
- The test document: `example_notes.pdf` (Indonesian/English assignment text) is fine; have a plain paragraph ready.
- A stopwatch and this file. Record raw text, not summaries.

---

## 1. Survey — Q9 and Q8 (per participant, ~2 minutes)

| field | P1 | P2 | P3 |
|---|---|---|---|
| name / role | | | |
| device make + model | | | |
| OS + version | | | |
| screen (inches) | | | |
| **stylus?** built-in / bought separately / **none** | | | |
| stylus model | | | |
| would they handwrite in class? (y/n/sometimes) | | | |

**Read the answers like this**
- **Q9** — if **no one** has a stylus, the working assumption ("assume a pen") is wrong: record it and expect 012's
  pen path and 024 to be re-scoped. If some do, record **how many of three** and which.
- **Q8** — the mix drives 022's device parity and the pixel ratio / touch-target work. Record the platforms, not
  just "tablet".

---

## 2. Q7 — the 45-minute Bahasa Indonesia handwriting test (per participant)

Open the app → a highlight → the note sheet → **"Tulis tangan"**. Switch the tablet's keyboard to its handwriting
input. Time each task; keep the raw text.

| # | task | minutes | what to record |
|---|---|---|---|
| T1 | Write 5 short sentences of your own, in Bahasa Indonesia. | 5 | time, raw text, misrecognized words (list them) |
| T2 | Copy 3 sentences from the document, verbatim. | 10 | the exact source, the produced text, per-sentence error count |
| T3 | Answer freely: "Apa temuan utama wawancara Anda, dan mengapa itu penting?" (3–5 sentences). | 10 | did a coherent answer come out; how many corrections |
| T4 | Write two sentences, then fix a word with the keyboard and continue writing. | 10 | does switching inputs lose or duplicate text |
| T5 | Write two paragraphs without lifting the pen; rest your palm on the screen. | 10 | palm rejection: did the page scroll / select / highlight while writing |

**Per task, also note:** felt latency (fine / noticeable / unusable), whether the cursor jumped, and whether a
correction was needed.

**Proposed pass bar (confirm with the owner before running — it is a product call, not an agent's):**
- **Usable** if T1/T2 land **≥ 90% of words correct without correction** and T3 reads as the participant's answer.
- **Borderline** at 70–90%, or if palm rejection fails on T5.
- **Not usable** below 70%, or if the textarea loses/duplicates text in T4.

**How the result decides work**
- Usable → **024 (ink transcription) stays**, and `ink-pad` gets its painter; 012's handwriting tab is validated.
- Borderline/not usable → **024 is re-scoped** (typed notes only; the "Tulis tangan" tab stays a plain textarea),
  and the blueprint's `ink-pad.status` stays conditional/absent.

---

## 3. Results — where to put the answers

Copy this block, fill it, and hand it back. Then the registry and blueprint can be moved off `unanswered`:

```
Q8 device mix:      P1=<model/OS/stylus>  P2=<...>  P3=<...>
Q9 styluses:        <n> of 3 have one — <which>
Q7 verdict:         usable | borderline | not usable
Q7 evidence:        T1 <errors>, T2 <errors>, T3 <readable?>, T4 <input switch ok?>, T5 <palm rejection?>
024 decision:       keep | re-scope ; ink-pad: painter | conditional | absent
owner sign-off:     <name, date>
```

**Then the agent updates:** `todo-task-000-split.md` §4.1 (Q7/Q8/Q9 → `confirmed` with the evidence),
`architecture.blueprint.json` `openQuestions[]` (`state: "confirmed"`), and the gates on 012 / 022 / 024 — from the
returned block, not from an assumption.

---

## 4. Why an agent cannot do this

Q7 needs **real people writing real Indonesian on real devices**; Q8 needs the **actual fleet**; Q9 needs the
**actual styluses**. No amount of code, emulation or unit test substitutes for the hardware and the humans, so the
registry leaves all three `unanswered` until this page comes back filled.
