---
name: record-screencast
description: Drives a screencast draft through to a recording. Compiles it with `canon demo compile` when no plan exists yet at the default path, skipping compile when one is already there, then runs `canon demo run` once nothing is unresolved. Reports every unresolved field from the compile or run record and stops rather than guessing one. Use when asked to "record the screencast", "run the demo", "compile and record this draft", or right after `draft-screencast` prints its next-step line. Do NOT use to draft the beats, which is `draft-screencast`, or to fill in a plan's target or URL, which is the operator's own edit.
---

# Record screencast

## Guards

- If no draft path is given, stop: `❌ No draft path. Pass the path draft-screencast printed.`
- Never guess or fill an unresolved field, a target, a URL, or anything else the compile or run record names. Report it and stop. Filling one in reproduces the failure `canon demo run`'s `plan-unresolved` reason exists to catch, one layer up where nothing enforces it.
- Never pass `--force` to compile. A plan already at the default output path may carry timing tuned by hand, and the draft cannot reproduce that, so leave it untouched.
- Drive the application through `canon demo run` alone. Never open a browser, click through the app, or write to the output paths some other way.

## Step 1: resolve the plan path

Derive the default plan path the same way `canon demo compile` does: `<out>/<slug>.json`, where `<out>` defaults to `demos` and `<slug>` defaults to the draft's filename with its extension stripped. `.canon/tmp/screencast/inline-edit.md` resolves to `demos/inline-edit.json`.

## Step 2: compile only when no plan exists yet

Check whether the resolved plan path already exists.

- **It exists.** A person may have tuned it by hand since compiling. Skip compiling and go to Step 3 with this path.
- **It does not exist.** Run:

  ```bash
  canon demo compile <draft> --json
  ```

  Branch on the record rather than the exit code:
  - `reason: draft-missing` or `reason: draft-unreadable`: report the reason, plus the record's `message` when it carries one, and stop.
  - No `reason` key, meaning the plan was written: read `unresolved` off the record.
    - Non-empty: report the plan path and every field the array names, one per line, and stop. Do not proceed to Step 3.
    - Empty: continue to Step 3 with the record's `plan` path.

## Step 3: run

Run:

```bash
canon demo run <plan> --json
```

Branch on the record's `reason`:

- `plan-unresolved`: report every field in `unresolved`, one per line, and stop. This is the path a pre-existing plan takes, since Step 2 skipped compiling and never read its fields.
- Any other reason (`plan-missing`, `plan-unreadable`, `no-output-requested`, `cursor-unreadable`, `engine-missing`, `browser-missing`): report the reason, plus the record's `message` or `install` line when it carries one, and stop.
- No `reason` key, meaning the run wrote its output: continue to Step 4.

## Step 4: output

The record carries `video`, `mp4`, `gif`, and `still`, each a path or `null`. Report each one that is not `null`, one per line, skipping the rest.

Say so plainly if `canon demo compile` or `canon demo run` is not available, rather than driving the application some other way. Both ship with the CLI and this skill ships with the plugin, so a project carrying one and not the other is a real state.
