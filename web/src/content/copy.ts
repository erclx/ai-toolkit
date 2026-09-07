/**
 * Every string on the page, one module, each carrying a verbatim phrase from
 * `README.md`, or the CLI verb, it derives from. A phrase survives a line
 * moving in `README.md`; only a change to the phrase itself invalidates the
 * citation, which `readmeCitations` in `src/gate/measures.ts` checks against
 * the current file. Fresh copy fact-checked against README.md produced four
 * false claims in ten minutes
 * (`.canon/groundwork/73-landing-page/02-section-inventory.md`), so nothing
 * here is written from scratch.
 */

export const site = {
  name: 'canon',
  /**
   * The deployed origin, which a social card's absolute image URL is resolved
   * against. It is the address `.github/workflows/deploy-site.yml` publishes to
   * rather than anything `README.md` states, so it carries no citation.
   */
  origin: 'https://canon.erclx.dev',
}

export const footer = {
  // README.md: canon-allow-readme-paraphrase: states what the page is built
  // from, which no single README sentence says. The claim is checked by the
  // page itself rather than borrowed.
  note: 'Every count and every frame on this page is read from the repository at build time.',
  links: [
    // README.md: "MIT"
    {
      label: 'MIT license',
      href: 'https://github.com/erclx/canon/blob/main/LICENSE',
    },
    { label: 'Documentation', href: 'https://github.com/erclx/canon#readme' },
    { label: 'GitHub', href: 'https://github.com/erclx/canon' },
  ],
}

export const hero = {
  // README.md: "work across more than one repository", the reader's problem
  // rather than a proof claim.
  headline:
    'Once you work across more than one repository, your AI conventions start to drift.',
  // README.md: "keeps one authoritative copy and installs it into each project on demand", what canon is.
  subhead:
    'canon is a CLI and Claude Code plugin that keeps one authoritative copy and installs it into each project on demand.',
  cta: 'See how it installs',
}

export const agentView = {
  // README.md: "It runs on itself"
  heading: 'It runs on itself',
  // README.md: "each in its own git worktree on its own branch, and each opens its own pull request"
  body: 'The workflow this toolkit ships is the workflow that built it. Several Claude Code sessions run at once, each in its own git worktree on its own branch, and each opens its own pull request.',
  // The three bands the surface being re-created renders, in its order. Pinned
  // holds the session doing the dispatching, which an earlier version of this
  // section left out entirely.
  bands: {
    pinned: 'Pinned',
    working: 'Working',
    completed: 'Completed',
  },
  // What the row reads once it lands in the completed band. The activity text
  // it replaces described the session mid-flight, so carrying that text down
  // would have a finished row still claiming to be working.
  landed: 'pull request opened',
  // The page states where its own rows came from, for the reason
  // README.md: "read from the catalogs when the image is built" states it
  // for the catalog counts. The date is filled from the fixture's own
  // readAt rather than written here, so it cannot drift from the read.
  provenance: {
    live: 'Session rows are a real canon sessions list --json read taken on',
    transcribed:
      'The activity text and the pull request number are transcribed, since no verb here reports either.',
  },
}

export const install = {
  heading: 'Two commands and the toolkit is present',
  // README.md: "Add the marketplace, then install the Claude Code plugin."
  lede: 'Add the marketplace, then install the Claude Code plugin.',
  commands: [
    'claude plugin marketplace add https://github.com/erclx/canon',
    'claude plugin install canon@canon',
  ],
  // README.md: "If your session was already open, run"
  note: 'The skills land as /canon:<name>. If your session was already open, run /reload-plugins to pick them up.',
  // README.md: "to read catalogs and run installs, and the plugin doesn't put it on your path" "bun install --global @erclx/canon"
  cliNote:
    "Several skills call the canon CLI to read catalogs and run installs, and the plugin doesn't put it on your path.",
  cliCommand: 'bun install --global @erclx/canon',
  image: {
    src: '/assets/install.png',
    // README.md: "Adding the canon marketplace and installing the plugin in Claude Code"
    alt: 'Adding the canon marketplace and installing the plugin in Claude Code',
  },
}

export const catalog = {
  heading: 'The size of what installs',
  // README.md: canon-allow-readme-paraphrase: condenses the six domain
  // bullets from the "What is inside" section into six shorter items with
  // different wording, so no single phrase from them survives intact.
  items: [
    'Claude Code plugin: skills that plan a feature, review a diff, sync the planning docs, and run the ship chain from branch through pull request',
    'Governance rules: coding and authoring rules that load into a Claude session when a matching path is edited',
    'Standards: authoring conventions read by name with canon standards <name> rather than copied into your project',
    'Snippets: reusable prompts fired by @ reference, resolved live from the plugin with no install step',
    'Tooling stacks: golden configs, seeds, and a reference per framework, laid down by canon init',
    'Design system: a DESIGN.md token format, a skill that drafts one, and a render command',
  ],
  image: {
    src: '/assets/hero.png',
    // README.md: "the workflow skills named, and a sample of the rule and standard names"
    alt: 'The canon catalog, listing skills, governance rules, and standards with the count each ships, the workflow skills named, and a sample of the rule and standard names',
  },
  // README.md: "read from the catalogs when the image is built"
  countNote: 'Read from the catalogs when this page was built.',
}

export const ruleArrival = {
  heading: 'A rule arrives because of what you touched, not at startup',
  // README.md: "load into a Claude session when a matching path is edited, installed per project and refreshed by sync"
  body: 'Governance rules load into a Claude session when a matching path is edited, installed per project and refreshed by sync.',
  filename: 'src/design/tokens.ts',
  // A real rule from this repository's own corpus, glob-matched on src/**/*.ts.
  rule: {
    path: '.claude/rules/canon/core/060-naming.md',
    glob: 'src/**/*.ts',
    title: 'Naming standards',
    excerpt:
      'Prefix booleans with is, has, should, or can: isLoading, hasAccess.',
  },
}

export const targetReceives = {
  heading: 'What a target receives',
  // README.md: "copied into your project and become yours to edit, and some are never copied at all" "A standard stays here and is opened by name, so there is no copy in your repo to drift from this one"
  body: 'Some domains are copied into your project and become yours to edit, and some are never copied at all. A tooling stack lands as real files under version control. A standard stays here and is opened by name, so there is no copy in your repo to drift from this one.',
  image: {
    src: '/assets/install-surface.png',
    // README.md: "the first showing five stacks with their dependency and script counts"
    alt: 'canon tooling list and canon standards list side by side, the first showing five stacks with their dependency and script counts, the second showing standards against the artifact each governs',
  },
  governance: {
    // README.md: "the glob beside each rule is what decides whether it reaches a session at all" "A rule with a glob loads only when a matching path is edited, and a rule with none loads every session"
    body: 'A rule with a glob loads only when a matching path is edited, and a rule with none loads every session. Stacks compose, so a project inherits every rule its stack depends on.',
    image: {
      src: '/assets/governance.png',
      // README.md: "showing seven stacks with the rules each carries"
      alt: 'canon gov list, showing seven stacks with the rules each carries and a sample of rules beside the path glob that loads each one',
    },
  },
}

export const boardLifecycle = {
  heading: 'Work tracked in files, archived by a merge',
  // README.md: canon-allow-readme-paraphrase: "is gitignored session scratch" "one row per task in flight, each naming the files it touches and the plan it runs under"
  // The first phrase borrows the task-board paragraph's closing sentence and
  // the second borrows the task-board image's own alt text two lines below.
  // "A merge is what closes it, not a checkbox someone remembers to tick" is
  // a synthesized claim with no matching README text, which is what the
  // marker still covers once both borrows above are checked as quotes.
  body: '.canon/tasks/ is gitignored session scratch, one row per task in flight, each naming the files it touches and the plan it runs under. A merge is what closes it, not a checkbox someone remembers to tick.',
  image: {
    src: '/assets/task-board.png',
    // README.md: "one row per task in flight, each naming the files it touches and the plan it runs under"
    alt: "the task board's Run now table, one row per task in flight, each naming the files it touches and the plan it runs under",
  },
  // README.md: "a hand-taken snapshot rather than something the build reads live, and it goes stale the moment the board moves"
  note: 'A hand-taken snapshot rather than something this build reads live, and it goes stale the moment the board moves.',
}

export const callToAction = {
  heading: 'Read the rest, or install it now',
  body: 'Everything above is read from this repository. The documentation is the same way.',
  primary: {
    label: 'Read the docs',
    href: 'https://github.com/erclx/canon#readme',
  },
  secondary: {
    label: 'View on GitHub',
    href: 'https://github.com/erclx/canon',
  },
}
