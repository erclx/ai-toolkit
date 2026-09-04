/**
 * Every string on the page, one module, each carrying the `README.md` line
 * or CLI verb it derives from. Fresh copy fact-checked against README.md
 * produced four false claims in ten minutes (`.canon/groundwork/73-landing-page/02-section-inventory.md`),
 * so nothing here is written from scratch.
 */

export const hero = {
  // README.md:15, the reader's problem rather than a proof claim.
  headline:
    'Once you work across more than one repository, your AI conventions start to drift.',
  // README.md:7, what canon is.
  subhead:
    'canon is a CLI and Claude Code plugin that keeps one authoritative copy and installs it into each project on demand.',
  cta: 'See how it installs',
}

export const install = {
  heading: 'Two commands and the toolkit is present',
  // README.md:27
  lede: 'Add the marketplace, then install the Claude Code plugin.',
  commands: [
    'claude plugin marketplace add https://github.com/erclx/canon',
    'claude plugin install canon@canon',
  ],
  // README.md:36
  note: 'The skills land as /canon:<name>. If your session was already open, run /reload-plugins to pick them up.',
  // README.md:38, 41
  cliNote:
    "Several skills call the canon CLI to read catalogs and run installs, and the plugin doesn't put it on your path.",
  cliCommand: 'bun install --global @erclx/canon',
  image: {
    src: '/assets/install.png',
    // README.md:34
    alt: 'Adding the canon marketplace and installing the plugin in Claude Code',
  },
}

export const catalog = {
  heading: 'The size of what installs',
  // README.md:50-58, condensed
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
    // README.md:9
    alt: 'The canon catalog, listing skills, governance rules, and standards with the count each ships, the workflow skills named, and a sample of the rule and standard names',
  },
  // README.md:11
  countNote: 'Read from the catalogs when this page was built.',
}

export const ruleArrival = {
  heading: 'A rule arrives because of what you touched, not at startup',
  // README.md:51
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
  // README.md:60, 64
  body: 'Some domains are copied into your project and become yours to edit, and some are never copied at all. A tooling stack lands as real files under version control. A standard stays here and is opened by name, so there is no copy in your repo to drift from this one.',
  image: {
    src: '/assets/install-surface.png',
    // README.md:62
    alt: 'canon tooling list and canon standards list side by side, the first showing five stacks with their dependency and script counts, the second showing standards against the artifact each governs',
  },
  governance: {
    // README.md:66, 70
    body: 'A rule with a glob loads only when a matching path is edited, and a rule with none loads every session. Stacks compose, so a project inherits every rule its stack depends on.',
    image: {
      src: '/assets/governance.png',
      // README.md:68
      alt: 'canon gov list, showing seven stacks with the rules each carries and a sample of rules beside the path glob that loads each one',
    },
  },
}

export const boardLifecycle = {
  heading: 'Work tracked in files, archived by a merge',
  // README.md:72, 76
  body: '.canon/tasks/ is gitignored session scratch, one row per task in flight, each naming the files it touches and the plan it runs under. A merge is what closes it, not a checkbox someone remembers to tick.',
  image: {
    src: '/assets/task-board.png',
    // README.md:74
    alt: "the task board's Run now table, one row per task in flight, each naming the files it touches and the plan it runs under",
  },
  // README.md:76
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
