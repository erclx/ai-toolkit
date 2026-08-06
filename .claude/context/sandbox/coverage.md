---
title: Coverage
description: Coverage report, the blast-radius rule for which skills earn an arm, and the per-skill census
---

# Coverage

`aitk sandbox coverage` reports which scenarios declare expectations and which only provision a state. It reads the fixture tree rather than running anything, so it costs nothing and needs no provisioned sandbox.

```bash
aitk sandbox coverage           # framed report on stderr
aitk sandbox coverage --json    # machine copy on stdout
aitk sandbox coverage --strict  # exit 1 while any scenario declares nothing
```

Scenarios and arms count separately. Thirty-three arms across fourteen scenarios out of 60 is 23 percent of scenarios, well under the 55 percent that dividing arms by scenarios produces, and the report prints both rather than picking the flattering one. Both figures floor rather than round, which the current pair does not show, since fourteen of 60 falls the far side of the boundary and floors and rounds alike. `coveragePercent` states the reason and this entry matches what the command prints, so a percentage here that looks a point low is the measure working rather than an entry left stale.

Neither number weighs an arm by what it asserts. An arm can carry a single assertion over its own provisioning, such as `.claude/standards/skill.md` being absent, which is a claim about the fixture rather than about the skill under test. The count reads as scenarios reached rather than behavior covered, since nothing in it separates that arm from one asserting eleven things about a run, so a reader taking either percentage as skill coverage is reading past what the declarations say plainly.

The twelve scenarios declaring `SANDBOX_INJECT_STANDARDS` or `SANDBOX_INJECT_GOV` were recorded as the first candidates for arming, on the grounds that moving to the real installers narrowed what they receive from all 38 source rules to the 20 in `base` and nothing would detect a scenario depending on a rule outside it. That reads stronger than it is. Both flags are booleans naming no rule, so which scenario depends on which rule resolves by reading the twelve skill bodies rather than by paying for twelve arms, and the rule below selects on damage instead. The overlap against the armed arms is still empty and no existing assertion is affected.

A scenario enumerates from its script under `scripts/sandbox/<category>/`, not from the fixture tree. An unarmed scenario has no fixture directory to find, so counting fixtures would hide exactly the arms the report exists to surface. A declaration sitting at the command root belongs to the unnamed arm and reports as `(default)`.

## What earns a declaration

Arm a skill when a wrong run is silent and the damage lands in a target project rather than in the sandbox. Blast radius decides rather than a coverage percentage. A percentage names no particular skill and counts an arm asserting one provisioning fact the same as one asserting eleven things about a run, so it rewards whichever arm is cheapest to write next.

The rule explains the arms already written as well as the next ones. Every skill armed before it was stated mutates a tree with no reader watching, so it describes existing practice rather than only constraining what comes next. `claude-seed-sync` and `setup-init` are the two it selects that the harness can reach.

### The task board arms

`claude/tasks.sh` carries two arms, split because create and archive have disjoint preconditions and one arm running both would assert the second against a tree the first mutated. Both stage the board rather than inheriting one, since `SANDBOX_INJECT_SEEDS` drops `.claude/tasks/` and fills it with nothing but the seeded `index.md`.

The two arms cover different things, and the split follows what already has a test. `aitk tasks archive` is a typed verb whose refusals `src/tasks/archive.test.ts` covers at 27 tests, so the archive arm stages a board that satisfies every gate and asserts the successful move. An arm asserting that the command refuses an open outcome would re-test a unit test through a model session at a dollar a run. The create path has no CLI verb at all, so the skill writes the file from `.claude/standards/tasks.md` and the whole of that arm is prose with nothing underneath it.

Three fixture properties are load-bearing:

- The create board runs three consecutive versions with no gaps, which is what forces the next one and puts the proposed label under an assertion. The slug stays free, so the arm pins the label through a `.claude/tasks/` reply fragment carrying the forced version and leaves the rest to the run.
- The archive task carries a `Pull request:` line and its `Plan:` line already points into `.claude/plans-archive/`. The first satisfies the skill's work-reached-main check without staging a remote, and the second clears the `plan-unswept` gate. A board missing either exercises a refusal, and a `paths` entry over the source file still holds because nothing moved.
- `priority.md` puts the archived task's row first and the control's second. An `absent` entry cannot express a removed table row, so the arm pins the separator line and the row that follows it, and a run that left the row in place pushes the control down and fails the match.

Neither arm asserts `.claude/tasks/index.md`. A hook regenerates it, so an assertion there would read hook behavior rather than the skill's. Both leave the main-worktree-root guard in `manual`: a standalone sandbox repository has no linked worktree, so `pwd` and the main root are one path and no run distinguishes them.

### The intake arms

`claude/intake.sh` is the clearest case the blast-radius rule selects. The folder it writes is gitignored in every target, so no check in this repository or in a consuming one ever reads its shape, and a run that files a dump into the wrong numbering leaves a record cited for weeks with nothing reporting the drift.

The `file` arm pins the slug through the invocation rather than letting the run derive it. `paths` and `content` both match an exact path, so a slug taken from the dump's wording would leave every assertion naming a folder that may not exist. What that gives up is one line of the body against the whole of the folder shape, and the numbering still gets asserted, since the index links its cluster files and the pattern requires a two-digit number and a domain name in each link.

The `route` arm asserts a refusal instead of an artifact. Its three `absent` entries name the three folders a wrong turn would create, which is what separates a decline from a run that quietly opened a groundwork track, and the reply pin catches a stop that refuses without naming where the question goes. Whether the refusal turned on the question needing measurement or on the prompt being short is the part no assertion reaches, so it sits in `manual`.

### The routing arms

`claude/toolkit-operator.sh` and `claude/migration-standards.sh` are the first arms whose subject is a decision rather than an artifact. Almost everything the operator routes ends in a handoff or a report, so a rule selecting on what a wrong run leaves behind exempts nearly all of it, and the damage is real either way: a target sent to the seed reconciler instead of the installer, or to a domain sync for a domain that has nothing installed to sync. The ignore-only route is the single exception, since it runs `aitk tooling inject --gitignore` itself and the file it merges into is the artifact.

What let them be asserted at all is `reply`. Seven arms pin the skill or command each route names, which is the mechanism `05-testability.md` called for and the arms shipped beside the drift report did not use, so the report was verified against three arms and six real targets while the router reading it had never been executed. Splitting the route from the proposal is what keeps each arm scoring one decision: `claude:toolkit-operator/unmigrated` asserts that the reply reaches `migration-standards`, and `claude:migration-standards/root-layout` asserts what that skill then produces.

A reply pin asserts phrasing, so each one is paired with a `manual` entry naming the negative a substring cannot carry. Six of the seven arms also assert over the tree, in two directions. Five pin what a run must leave alone, since the skill may execute nothing there: the staged root layout is still at the root, nothing appeared under `.claude/`, the audit arm's staged entry and plan survive a pass that only measures, and the folder the reverse walk found sits where it was staged.

The `gitignore` arm pins what the write produced instead, the managed entries back in the file and the install stamp left as the inject wrote it, which separates the narrow mode from a full inject running under its name. The `fresh` arm carries no such pin, because a handoff to `setup-init` may legitimately continue into that skill and write the whole scaffold, and no path assertion separates the router doing the work from the router routing to something that does it.

That leaves `fresh` reachable only from a real run. A standalone `aitk sandbox check` against the provisioned tree reports FAIL with `no assertion ran against this sandbox`, which is the checker refusing a pass it asserted nothing for rather than a defect in the declaration, since the reply arrives on the envelope `scripts/sandbox/run.sh` produces. The cheap iteration path buys nothing for a reply-only arm, and padding one with a path assertion over its own provisioning to keep it green standalone is the silent-green shape the checker exists to prevent.

`claude:migration-standards/root-layout` pins one count, `(3 files)`, which is the exception to the load-bearing-token rule the other pins follow. The root folder holds five markdown files and the toolkit ships three, so the count is the only place in the output where reading the report and listing the folder disagree. The proposed `git mv` moves the whole folder under either detection path, which is what leaves the count carrying the whole difference.

`claude:toolkit-operator/unclaimed` is the second exception, and the only arm whose reply names no skill and no command. The reverse walk reports a folder the toolkit stopped shipping and offers nothing, so the token that has to survive is the attribution rather than a route.

Its first run is why the arm carries two guards. The `aitk` on that machine was 0.64.0, predating the 0.70.0 that added `reverse`, so the report came back with no such key. The run answered from a filesystem walk of its own instead, and the word `dropped` landed in the prose describing that walk, so all three assertions passed against a run that never read the section. A reply pin cannot see the difference, since a correct run and a hand-rolled substitute name the same folder in the same words.

Provisioning therefore refuses a CLI that attributes no unclaimed folder, which is the two-speed release risk `ARCHITECTURE.md` records arriving in the harness rather than in a target. Reading attribution rather than the bare key is what makes the guard prove the walk reached the staged folder instead of proving only that the field exists.

Writing that guard is what surfaced the deeper defect. Every section of the report, the reverse walk included, is gated on `isManagedTarget`, and the arm staged a `package.json` and a dropped folder and none of the three markers that gate reads. The section came back empty for that reason rather than for the CLI's, and the first probe that appeared to work had run after `stage_setup` returned, against a tree the harness had since given a `.claude/skills/` copy of the skill under test.

An arm inheriting its premise from dev-skill injection holds only while the branch changes that skill, so the fixture stages a short `CLAUDE.md` and owns the gate itself. Short is load-bearing, since a file past the 250-line checkpoint adds a `migration-claude-md` candidate and the arm would score two decisions in one reply.

The declaration also pins the folder name beside the verdict, against the general rule that a name history decides does not belong in a pin, because the second guard fails provisioning the moment that root comes back and a reader sees the fragility where it is rather than inside a declaration going quietly vacuous.

The `audits`, `gitignore`, and `unclaimed` arms sit at the default cap rather than above an observation. The first two have never been run. The third has, and the run it produced is the false green above rather than a turn count worth declaring against. The other four passed on 2026-08-04, which is the first time either skill was executed by anything.

Two of them cost 6 turns and end where the route is named. The other two carry on into the skill they routed to, `installed` reaching `claude-seed-sync` once the headless standards sync refuses and `fresh` reaching `setup-init` and installing six domains, and both are declared at the cap rather than above an observation for that reason. The `fresh` run is the one whose turn count is not recorded, since `record_run` failed to write it and the envelope went with it.

### The superseded arm and the guard that fixed the skill

`claude/migration-superseded.sh` stages three retired `.claude/` files against the folders that replaced them, and its assertions run in the two directions the proposal shape demands. Three `paths` entries and three `content` pins hold the retired files byte-identical, since the content is project-authored and a run that produced a correct split and then applied it fails nowhere else.

Three `absent` entries name the destination folders, and `.claude/hooks` carries the extra weight: no standard declares `appliesTo` over it, so a run proposing a shape there had to invent one, which the absence catches whether or not the reply admitted to it. The reply pins name the standard each entry resolved to rather than the destination folder, because the folder comes free off the report while the standard separates a shape read from the project's installed copy from one the run made up.

No agent has driven this arm, so it sits at the default cap beside `audits` and `gitignore` and its verdict is weaker than the number reports. Every mechanically scored assertion on it is a no-write claim, and a no-write claim holds on a tree the skill never ran against, so `10 asserted, 0 failed` and the `asserted` verdict both describe assertions no run has exercised.

Only the three `reply` pins separate a correct proposal from a session that did nothing, and scoring those needs an envelope. An arm whose assertions are all negative earns that note rather than the count it prints, which generalizes past this one: a proposal-only skill cannot be covered by tree assertions alone.

Provisioning is what corrected the skill rather than the run. The fixture asserts its own premise, that the staged file is tracked and ignored at once, and the guard failed against a tree that was correct. `git check-ignore` consults the index and reports a tracked path as not ignored, so the flagless form returns nothing in exactly the state the step exists to find. Both the skill and the guard read `--no-index` now.

An arm that staged the state without asserting it would have shipped a step that reports every tracked-while-ignored file as clean, and no reply pin could have seen it, since the skill would have said nothing about a file it believed was fine.

### The groundwork arms assert nothing and refuse the bare prompt

`scripts/sandbox/fixtures/claude/groundwork/` does not exist, so every `claude:groundwork` arm returns `state: unchecked` with nothing asserted and a verdict from it confirms only that the session completed.

The scenario also cannot be driven by the bare `/aitk:claude-groundwork` prompt the ship-time check specifies. The skill's first guard refuses a missing topic and returns in under four seconds without creating a folder, so the run reports success having exercised nothing past the guard. Each arm names its intended prompt on its own `Action:` line and has to be driven with that topic to reach the creation path. A scenario whose skill guards on an argument is the general case this names, and the check's no-argument rule is what a caller has to override for it.

### The gap the rule names

The rule selects `git-stage` and `git-split` ahead of everything else and the harness cannot assert either, which is the sixth standing limit in `.claude/context/sandbox/overview.md`. A rule that selects what nothing can check is working correctly. It names the gap instead of hiding it behind a skill nobody nominated.

## The skill census

`--skills` adds a per-skill verdict beside the scenario view. It answers what the scenario count cannot, which is whether anything can fail a given skill.

```bash
aitk sandbox coverage --skills  # per-skill census, scenario view kept
```

A skill reports one of three verdicts. `asserted` means an arm paired to it declares a mechanical assertion. `should-be-asserted` is the honest default rather than a work queue, and the rule above decides which of them earns an arm. `exempt` means no arm should be written, and it holds only with a reason.

The denominators disagree on purpose. Twelve of 56 skills are asserted where fourteen of 60 scenarios are, because `infra:wiki` and `infra:drift` are both armed and drive a CLI domain rather than a skill. Both numbers print, since replacing the scenario view would lose the rollout `--strict` is written against. The gap widens whenever a command surface earns an arm ahead of the skill that reads it, which is the ordinary order once a skill routes on what the command reports.

### Pairing a scenario to a skill

Pairing tries two spellings, `<category>-<command>` first and bare `<command>` second. The first alone reaches 29 skills, and the fallback is what pairs `claude/setup-init.sh` to `setup-init` rather than to a `claude-setup-init` that does not exist. Stating one spelling while shipping two is what let the earlier audit report a paired skill as unpaired, so the rule lives in `skillForScenario` and this paragraph describes code rather than substituting for it.

The census counts `claude/skills/`, not `.claude/skills/`. The second holds toolkit-internal skills that reach no target, and folding them in would inflate a denominator meant to describe what ships.

### The ship-time audit

The ship-time pairing audit reads it. `aitk-sandbox-check` used to prompt whenever its own `<category>/<rest>.sh` split found no file, and the answer was a per-run label that reached nothing, so the next branch touching the same skill asked again. It now resolves the skill here first, taking the `scenarios` entry as the pairing and the verdict as the report.

The prompt survives where evidence of a scenario outlives both spellings. Eleven skills are carried with no scenario, and two of them have a file at `infra/<rest>.sh`: `setup-gov` and `setup-indexes`. The audit offers that path and records neither answer on its own, because the file proves a scenario exists rather than proving it exercises the skill.

`setup-gov` against `infra/gov.sh` is a real pairing, where `migration-standards` against `infra/standards.sh` was the case that showed the prompt can offer a vacuous one, since that scenario stages the install and sync trees the `aitk standards` CLI walks and exercises nothing the skill decides. That skill now pairs to `claude/migration-standards.sh` and leaves the prompt behind, which is the ordinary way a wrong pairing retires. An internal skill draws no prompt at all, being absent from the denominator above by construction rather than unknown.

### Exemptions

An exemption lives in `scripts/sandbox/exempt.toml`, keyed by skill with a `reason`. It cannot live in the arm's `manual` array, the other home for prose a checker cannot assert: `resolveVerdict` fails any declaration carrying zero mechanical assertions, so an `expect.toml` holding only an exempt reason goes red the moment it is written.

An exempt skill has no assertion to pair the prose with, which is what makes it exempt, so the two cases cannot share a home. Two reasons qualify and nothing else does, a harness limit the checker cannot reach past and a skill that writes no artifact. "Nobody has written one yet" is `should-be-asserted`.

A verdict decays in one direction, so an armed arm outranks an exemption rather than the reverse. Two kinds of wrong exemption print as errors and exit 1 without `--strict`, since a claim nobody can check is worse than no claim. One names a skill the tree no longer carries. The other names a skill an arm now asserts, which is the case the armed-wins rule creates rather than one the tree arrives with, and reporting the verdict while dropping the entry would leave committed data nobody is told to delete.

An arm reports as `<category>:<command>/<arm>` rather than bare. A skill two scenarios drive can hold two arms of the same name, and `(default)` twice in one list reads as a repeat. Deduplicating instead would report one arm where two assert, which understates in the direction this measure exists to keep honest.

Losing an exemption is invisible in the counts, because the skill reclassifies to `should-be-asserted` and rejoins a queue someone already ruled it out of. So the parser throws on a file that does not parse and on a table carrying no usable `reason`, rather than reporting the smaller set that survived. `runCoverage` catches both and frames them, for the reason `resolveVerdict` catches its own parse: a typo in a declaration reads the way a pattern that does not compile does rather than as a stack trace.

`aitk sandbox check` takes `--strict` as well, which turns a single `unchecked` verdict into a non-zero exit. Both flags stay opt-in so the undeclared majority keeps running.
