---
name: plan-intake
description: Why a brain dump gets a filed inventory rather than ten plans, and why an empty operator slot means unread
---

# Plan intake requirement

## Gap

Without this skill, a brain dump reaches a session that has nowhere to put it. `plan-feature` answers with one plan per independent concern, so forty findings produce ten plan files before anything has been measured. `plan-groundwork` refuses a breadth pass outright, since its qualifying test asks whether the current state is unknown and most items are knowable by grep. What gets filed instead is a list of opinions, because nothing forces a count against the tree and a complaint reads the same whether it covers three sites or three hundred.

Two failure modes cost more than the rest. An operator's silence on an item reads as consent when the folder borrows the plan file's blank-means-accept contract, which ships changes nobody approved across a folder read over weeks. And a report naming only a path cannot distinguish three new items from one reworded sentence in a file that holds a dozen items, so every reader diffs it against memory to find out what moved.

Four more are cheaper to name than to rediscover. A question filed without a pick comes back unresolved, measured across one folder's 19 open items, where every one carrying a suggestion resolved on a bare `ok` and the five carrying none did not.

A session with no numbering convention re-decides the folder shape per dump, so no two intakes are readable the same way and the second one has to be learned from scratch. A question answerable both in the index and on its item resolves to whichever a reader opens first, with no rule saying which wins. And a pass with no write scope starts fixing what it files, which turns a triage into a branch nobody asked for and nobody reviewed.

## Must

- Route each item on whether the repository can answer it today, sending what needs an experiment or an outside source to the groundwork skill and what is already decided to the planning skill
- Measure every problem line against the tree during this pass, carrying a number or a file path rather than a figure from recall
- Close every item with a verdict, and pair every open question with a suggested pick
- Treat an empty operator slot as unread rather than as agreement
- Reserve the index number and carry the domain in every other filename, leaving the rest of the numbering as read order
- Name a newly opened folder with a two-digit ordinal ahead of the slug, taken from the highest one already present across intake and groundwork
- Keep answers on items alone, with the index pointing at them
- Name the heading and the act beside every path the pass wrote
- Confine writes to the intake folder

## Must not

- Write a plan, a task file, a standard, a rule, or a source change
- Fill an operator's answer slot, or infer a disposition from an empty one
- Replace a verdict with an overlap line, which drops the call on exactly the items where a live board task might be the thing that is wrong
- Reserve mid-range numbers, which would force every future intake into one dump's shape
- Date every file, since the first edit to one leaves the rest stale
- Open a folder for a single question, which is either a groundwork track or a plan

## Guards

- No dump given: stop rather than inferring one
- One question rather than a set of findings: stop and route to the groundwork or planning skill

## Out of scope

- Measuring one question in depth, which `plan-groundwork` owns
- Planning a promoted item, which `plan-feature` owns
- Promoting an item onto the board, which `task-board` owns
- Enforcing any of this. The folder is gitignored, so no check reaches its contents and every rule holds only while a session reads it.
