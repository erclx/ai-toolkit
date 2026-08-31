---
name: repo-metadata
description: Why an About text nobody re-derives drifts from the README it summarizes, and why writing it stays a second, explicit step
---

# Repo metadata requirement

## Gap

Without this skill, a repository's GitHub About description, homepage, and topics are set once by hand and never checked again. Nothing in either skill corpus reads or writes them, so a README rewrite carries no signal back to the three fields a stranger reads before the README, and they drift silently. That already happened here: the About text disagreed with the README's own opening line, and nobody noticed until someone read both side by side.

A session that fixes this by hand skips the gate a repeatable proposal would have given it. It reads the README once, writes a description from memory, and never records what it compared against or gives anyone else a chance to see the diff before it goes out. The write is also public and immediate: `gh repo edit` changes what every visitor to the repository page sees, with no draft state and no second confirmation from GitHub itself.

## Must

- Compute the proposal from the tree alone, through `canon repo metadata propose`, and report the diff against the remote before any write is discussed
- Route the choice of which fields to write through the structured question surface, since which field to accept is the operator's preference to decide
- Run `canon repo metadata apply` only in a turn separate from the one that ran propose, carrying only the fields the operator answered in this conversation

## Must not

- Call apply in the same invocation that ran propose, whatever the operator's request already names
- Write a field the operator has not answered in this conversation, even when the CLI's own proposal suggested a value for it
- Read an absent field in the proposal as a suggestion to clear what the remote already carries
- Edit `README.md` or any repository setting other than description, homepage, and topics
- Fire from a request with no repository-metadata content, since a skill invoked on a vague signal risks presenting a write path the operator never asked for

## Guards

- No `gh` remote resolves. Stop, naming the refusal `canon repo metadata propose` reports, since a proposal with nothing to compare against is a suggestion nobody asked for.
- `canon repo metadata propose` or `apply` does not resolve on an older install. Report that rather than proceeding, since the fix without the verb reintroduces the hand-written write this skill exists to gate.

## Out of scope

- Editing the README's own content, which is a request against that file rather than against repository metadata
- Repository settings outside description, homepage, and topics, such as visibility or branch protection, which carry a different blast radius and no local source to propose from
- Any repeat run outside a target project's own tree, since the proposal is computed from that tree's README and manifest rather than from this toolkit's shape
