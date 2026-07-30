---
name: project-commands
description: Runs a command the project documents in `.claude/context/development.md` and stops there. Use when asked to "start the app", "start the dev server", "run the checks", "run the build", "spin it up", or "what commands does this project have". Do NOT use to confirm a change works in a running app, which needs verification past the launch. Do NOT use to deploy, publish, or release.
---

# Project commands

Read `.claude/context/development.md` from the project root, run the command the user named, report where it landed, and stop.

The value is the stop. A launch that continues into log inspection, browser checks, or unrelated defects is the failure this skill exists to avoid.

## Guards

- Check that `.claude/context/development.md` exists before anything else. If it does not, stop: `❌ No .claude/context/development.md. This project has no documented dev loop.` Name the missing file and let the user decide. Do not read another file to reconstruct it, because a guess is worse than a stop when the user cannot see it was a guess.
- If the entry documents no command matching the request, stop and list what it does document. Do not infer a command from a filename or a framework.
- If the resolved command has an effect that outlives the process and stopping it does not undo, print it for the user to run and stop. Deploying, publishing, releasing, migrating, and resetting are the common shapes, and the test is the effect rather than the name. A script called `infra:apply` or `promote` qualifies.

## Step 1: read the entry

Read `.claude/context/development.md` from the project root, the whole entry rather than a named section. That file and no others. A second file is a discovery chain, and this skill has none.

## Step 2: resolve the command

Match the request against what the entry documents, reading the stated purpose and not only the command name. A project that documents two similar commands separately means the distinction, and the purpose column is where it says which is which.

When the request maps to more than one documented command, resolve all of them. A project that starts as a frontend and a backend has two rows in the table and one request covering both, and running one of the two reports success on half an app.

State the resolved command before running it. One line, no rationale.

## Step 3: run it

Run each resolved command as the entry writes it, from the project root. When a command only works from a subdirectory, the entry has to say so, since the table gives the skill nothing else to go on.

A command that terminates runs in the foreground. A command that stays up runs in the background, by setting the Bash tool's `run_in_background` parameter on the call. Nothing backgrounds a process on its own, and a foreground dev server blocks until the tool timeout kills it, which reports as a command that never came up and leaves nothing running.

Decide from what the entry says the command does, not from its name. When the entry does not say, treat a server, watcher, or preview as staying up.

- Read a backgrounded command's output back before checking anything against it. The call that starts it returns immediately and carries no port.
- Report the port or URL each command prints, and the log location when one exists
- Confirm a service came up with one check against what it reports listening on
- Leave a process the skill did not start alone. Never stop, restart, or reconfigure one.
- Do not tear down what the skill started. A session that starts a server and stops it has not done what was asked.

If a command fails or never comes up, report the failure and the last output. Do not retry with a different command, and do not abandon the others.

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

One block per command when the request resolved to more than one.

For a request with no command to run, list what the entry documents instead:

```plaintext
📋 Documented in .claude/context/development.md

- `<command>`: <purpose as the entry states it>
```
