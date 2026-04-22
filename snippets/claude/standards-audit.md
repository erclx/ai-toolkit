Audit changed files against toolkit authoring standards before claiming compliance.

1. Run `git diff main --name-only` to get the changed file list.
2. For each file, pick the applicable standards:
   - Any markdown with prose: `standards/prose.md`
   - `SKILL.md` under `.claude/skills/` or `claude/skills/`: also `standards/skill.md`
   - `README.md`: also `standards/readme.md`
   - Branch names proposed in the session: `standards/branch.md`
   - PR titles or bodies drafted in the session: `standards/pr.md`
3. Read each applicable standard. Audit the file against every rule:
   - Pattern rules: grep for banned tokens from the standard.
   - Judgment rules: check each new rule against "ban the shape not instances", "crisp one-line phrasing", and "imperative voice" from `standards/skill.md`.
4. Grep every changed markdown file for `—` and `;`. Both are banned in prose.
5. Report violations grouped by file with line references. If clean, respond with `✅ No violations.`

Reporting only. Do not fix violations.
