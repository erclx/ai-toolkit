---
name: setup-gov
description: Scope boundary for governance rule install and the authoring it refuses to do in a target
---

# Setup gov requirement

## Gap

Without this skill, a session picks a stack name from memory and installs rules written for a framework the project does not use, passes an extra the catalog does not carry so the install warns on a file it cannot resolve, and adds a rule the picked stack already pulls in.

The two costly failures are quieter. An unmatched technology gets the nearest rule instead of a stop, so the project carries governance authored for something adjacent and nothing marks it as a guess. A rule written directly into the target lands where no sync will ever reach it, so it drifts from the toolkit copy that owns it.

The last failure sits at a boundary rather than inside a run. `setup-init` turns away a project whose language it carries no stack for and sends it here, and a body stating only what this skill does not cover leaves that route running one way, so a person arriving on it reads a skill that never says it is the destination.

## Must

- Read the catalog at run time and resolve both the stack and every extra against it
- Name the evidence file behind each detected technology in the preview, so a wrong match is visible before the install rather than after
- Dedupe extras against the rules the picked stack already resolves
- Run the install non-interactively, since the CLI picker blocks where no terminal is attached
- State the inbound route from `setup-init`, so a project sent here for the language-neutral rule layer can tell it landed at the destination the chain named

## Must not

- Author a rule inside the target project. Rules are authored in the toolkit and reach a project by install or sync.
- Install a stack or extra whose name did not come from the catalog read

## Guards

- An unmatched technology stops and presents the options rather than resolving to a nearby rule. Authoring the missing rule in the toolkit, installing the matching layers without the technology-specific one, and aborting are the three, and this skill picks none of them.

## Out of scope

- The rest of the onboarding chain. This skill installs governance and nothing else, and `setup-init` is the one-shot path that installs governance beside tooling, snippets, and the seeds.
- Scaffolding the rule file an unmatched technology needs. `create-rule` writes one into a target project, and a rule the toolkit should ship is authored under `governance/rules/` against `canon standards rule`.
- Updating rules a project already has, which `canon gov sync` owns
