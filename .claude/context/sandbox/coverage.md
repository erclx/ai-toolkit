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

Scenarios and arms count separately. Twenty-five arms across thirteen scenarios out of 59 is 22 percent of scenarios, well under the 42 percent that dividing arms by scenarios produces, and the report prints both rather than picking the flattering one. Both figures floor rather than round, which the current pair does not show, since thirteen of 59 falls the far side of the boundary and floors and rounds alike. `coveragePercent` states the reason and this entry matches what the command prints, so a percentage here that looks a point low is the measure working rather than an entry left stale.

Neither number weighs an arm by what it asserts. An arm can carry a single assertion over its own provisioning, such as `.claude/standards/skill.md` being absent, which is a claim about the fixture rather than about the skill under test. The count reads as scenarios reached rather than behavior covered, since nothing in it separates that arm from one asserting eleven things about a run, and a reader taking 15 percent as skill coverage is reading past what the declarations say plainly.

The twelve scenarios declaring `SANDBOX_INJECT_STANDARDS` or `SANDBOX_INJECT_GOV` were recorded as the first candidates for arming, on the grounds that moving to the real installers narrowed what they receive from all 38 source rules to the 20 in `base` and nothing would detect a scenario depending on a rule outside it. That reads stronger than it is. Both flags are booleans naming no rule, so which scenario depends on which rule resolves by reading the twelve skill bodies rather than by paying for twelve arms, and the rule below selects on damage instead. The overlap against the twenty-five armed arms is still empty and no existing assertion is affected.

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

`claude/toolkit-operator.sh` and `claude/migration-standards.sh` are the first arms whose subject is a decision rather than an artifact. The operator writes nothing at all, so a rule selecting on what a wrong run leaves behind would have exempted it, and the damage is real either way: a target sent to the seed reconciler instead of the installer, or to a domain sync for a domain that has nothing installed to sync.

What let them be asserted at all is `reply`. The four arms pin the skill or command each route names, which is the mechanism `05-testability.md` called for and the arms shipped beside the drift report did not use, so the report was verified against three arms and six real targets while the router reading it had never been executed. Splitting the route from the proposal is what keeps each arm scoring one decision: `claude:toolkit-operator/unmigrated` asserts that the reply reaches `migration-standards`, and `claude:migration-standards/root-layout` asserts what that skill then produces.

A reply pin asserts phrasing, so each one is paired with a `manual` entry naming the negative a substring cannot carry. Three of the four arms also assert over the tree, since neither skill may execute anything: the staged root layout is still at the root and nothing appeared under `.claude/`. The `fresh` arm carries no such pin, because a handoff to `setup-init` may legitimately continue into that skill and write the whole scaffold, and no path assertion separates the router doing the work from the router routing to something that does it.

That leaves `fresh` reachable only from a real run. A standalone `aitk sandbox check` against the provisioned tree reports FAIL with `no assertion ran against this sandbox`, which is the checker refusing a pass it asserted nothing for rather than a defect in the declaration, since the reply arrives on the envelope `scripts/sandbox/run.sh` produces. The cheap iteration path buys nothing for a reply-only arm, and padding one with a path assertion over its own provisioning to keep it green standalone is the silent-green shape the checker exists to prevent.

`claude:migration-standards/root-layout` pins one count, `(3 files)`, which is the exception to the load-bearing-token rule the other pins follow. The root folder holds five markdown files and the toolkit ships three, so the count is the only place in the output where reading the report and listing the folder disagree. The proposed `git mv` moves the whole folder under either detection path, which is what leaves the count carrying the whole difference.

All four passed on 2026-08-04, which is the first time either skill was executed by anything. Two of them cost 6 turns and end where the route is named. The other two carry on into the skill they routed to, `installed` reaching `claude-seed-sync` once the headless standards sync refuses and `fresh` reaching `setup-init` and installing six domains, and both are declared at the cap rather than above an observation for that reason. The `fresh` run is the one whose turn count is not recorded, since `record_run` failed to write it and the envelope went with it.

### The gap the rule names

The rule selects `git-stage` and `git-split` ahead of everything else and the harness cannot assert either, which is the sixth standing limit in `overview.md`. A rule that selects what nothing can check is working correctly. It names the gap instead of hiding it behind a skill nobody nominated.

## The skill census

`--skills` adds a per-skill verdict beside the scenario view. It answers what the scenario count cannot, which is whether anything can fail a given skill.

```bash
aitk sandbox coverage --skills  # per-skill census, scenario view kept
```

A skill reports one of three verdicts. `asserted` means an arm paired to it declares a mechanical assertion. `should-be-asserted` is the honest default rather than a work queue, and the rule above decides which of them earns an arm. `exempt` means no arm should be written, and it holds only with a reason.

The denominators disagree on purpose. Eleven of 55 skills are asserted where thirteen of 59 scenarios are, because `infra:wiki` and `infra:drift` are both armed and drive a CLI domain rather than a skill. Both numbers print, since replacing the scenario view would lose the rollout `--strict` is written against. The gap widens whenever a command surface earns an arm ahead of the skill that reads it, which is the ordinary order once a skill routes on what the command reports.

### Pairing a scenario to a skill

Pairing tries two spellings, `<category>-<command>` first and bare `<command>` second. The first alone reaches 29 skills, and the fallback is what pairs `claude/setup-init.sh` to `setup-init` rather than to a `claude-setup-init` that does not exist. Stating one spelling while shipping two is what let the earlier audit report a paired skill as unpaired, so the rule lives in `skillForScenario` and this paragraph describes code rather than substituting for it.

The census counts `claude/skills/`, not `.claude/skills/`. The second holds toolkit-internal skills that reach no target, and folding them in would inflate a denominator meant to describe what ships.

### The ship-time audit

The ship-time pairing audit reads it. `aitk-sandbox-check` used to prompt whenever its own `<category>/<rest>.sh` split found no file, and the answer was a per-run label that reached nothing, so the next branch touching the same skill asked again. It now resolves the skill here first, taking the `scenarios` entry as the pairing and the verdict as the report.

The prompt survives where evidence of a scenario outlives both spellings. Eleven skills are carried with no scenario, and two of them have a file at `infra/<rest>.sh`: `setup-gov` and `setup-indexes`. The audit offers that path and records neither answer on its own, because the file proves a scenario exists rather than proving it exercises the skill. `setup-gov` against `infra/gov.sh` is a real pairing, where `migration-standards` against `infra/standards.sh` was the case that showed the prompt can offer a vacuous one, since that scenario stages the install and sync trees the `aitk standards` CLI walks and exercises nothing the skill decides. That skill now pairs to `claude/migration-standards.sh` and leaves the prompt behind, which is the ordinary way a wrong pairing retires. An internal skill draws no prompt at all, being absent from the denominator above by construction rather than unknown.

### Exemptions

An exemption lives in `scripts/sandbox/exempt.toml`, keyed by skill with a `reason`. It cannot live in the arm's `manual` array, the other home for prose a checker cannot assert: `resolveVerdict` fails any declaration carrying zero mechanical assertions, so an `expect.toml` holding only an exempt reason goes red the moment it is written. An exempt skill has no assertion to pair the prose with, which is what makes it exempt, so the two cases cannot share a home. Two reasons qualify and nothing else does, a harness limit the checker cannot reach past and a skill that writes no artifact. "Nobody has written one yet" is `should-be-asserted`.

A verdict decays in one direction, so an armed arm outranks an exemption rather than the reverse. Two kinds of wrong exemption print as errors and exit 1 without `--strict`, since a claim nobody can check is worse than no claim. One names a skill the tree no longer carries. The other names a skill an arm now asserts, which is the case the armed-wins rule creates rather than one the tree arrives with, and reporting the verdict while dropping the entry would leave committed data nobody is told to delete.

An arm reports as `<category>:<command>/<arm>` rather than bare. A skill two scenarios drive can hold two arms of the same name, and `(default)` twice in one list reads as a repeat. Deduplicating instead would report one arm where two assert, which understates in the direction this measure exists to keep honest.

Losing an exemption is invisible in the counts, because the skill reclassifies to `should-be-asserted` and rejoins a queue someone already ruled it out of. So the parser throws on a file that does not parse and on a table carrying no usable `reason`, rather than reporting the smaller set that survived. `runCoverage` catches both and frames them, for the reason `resolveVerdict` catches its own parse: a typo in a declaration reads the way a pattern that does not compile does rather than as a stack trace.

`aitk sandbox check` takes `--strict` as well, which turns a single `unchecked` verdict into a non-zero exit. Both flags stay opt-in so the undeclared majority keeps running.
