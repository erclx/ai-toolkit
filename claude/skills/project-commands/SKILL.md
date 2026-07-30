---
name: project-commands
description: Runs a command the project documents in `.claude/context/development.md` and stops there. Use when asked to "start the app", "start the dev server", "run the checks", "run the build", "spin it up", or "what commands does this project have". Do NOT use to confirm a change works in a running app, which needs verification past the launch. Do NOT use to deploy, publish, or release.
---

# Project commands

Read `.claude/context/development.md` from the project root, run the command the user named, report where it landed, and stop.

The value is the stop. A launch that continues into log inspection, browser checks, or unrelated defects is the failure this skill exists to avoid.

## Guards

- Check that `.claude/context/development.md` exists before anything else. If it does not, stop: `❌ No .claude/context/development.md. This project has no documented dev loop.` Do not fall back to `package.json`, a `Makefile`, or a README. A guess is worse than a stop, because the user cannot see it was a guess.
- On a toolkit-scaffolded project the entry is installed by base tooling and extended per stack, so its absence means either a project that never ran `aitk init` or one that deleted the entry. Say which file is missing and let the user decide, rather than reconstructing it.
- If the entry documents no command matching the request, stop and list what it does document. Do not infer a command from a filename or a framework.
- If the resolved command deploys, publishes, releases, migrates, or resets, print it for the user to run and stop. These are not made safe by confirming them.

## Step 1: read the entry

Read `.claude/context/development.md` from the project root. Read the whole entry rather than a named section, since a ship-time docs pass rewrites these files and a required heading would break silently.

Read `.claude/ARCHITECTURE.md` as well when the request names a mode rather than a command ("everything enabled", "with real models", "against staging"). Modes are described there, not in the command table.

Those two files and no others. A third file is a discovery chain, and this skill has none.

## Step 2: resolve the command

Match the request against what the entry documents. Prefer the entry's own wording over a guess at a conventional name, since a project that documents `dev:real` alongside `dev` means the distinction.

State the resolved command before running it. One line, no rationale.

## Step 3: run it

Run the command from the project root. Let the harness background a long-running process rather than managing it in the skill.

- Report the port or URL the command prints, and the log location when one exists
- Confirm a service came up with one check against what it reports listening on
- Leave a process the skill did not start alone. Never stop, restart, or reconfigure one.
- Do not tear down what the skill started. A session that starts a server and stops it has not done what was asked.

If the command fails or never comes up, report the failure and the last output. Do not retry with a different command.

## Step 4: stop

Report and end the turn. Specifically do not:

- Run a second check after the first one passed
- Read the startup log for anything beyond a failure
- Open a browser, take a screenshot, or drive the running app
- Report a defect noticed while starting up, however real

Those belong to a verification request, which is a different ask. When one of them looks warranted, say so in one line and let the user decide.

## Output

```plaintext
▶️ <resolved command>

<what it reported: port, URL, or exit status>
```

For a request with no command to run, list what the entry documents instead:

```plaintext
📋 Documented in .claude/context/development.md

- `<command>`: <purpose as the entry states it>
```
