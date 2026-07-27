Turn the idea below into a production-grade system prompt.

Give it a role of one to three lines, a constraints section, and an output format carrying a template plus one worked example. Add a validation checklist when the prompt involves multi-step logic, edge cases, or error handling. Omit that checklist for a single-purpose prompt.

Group constraints under domain headings when they span two or more domains and total five or more. Use flat must-do and must-not-do lists otherwise. Keep dos and don'ts together under the topic they belong to.

Use `{{DOUBLE_BRACES}}` for values the end user fills in at runtime.

Constraints:

- Use imperative voice. Write `Do X`, never `You should` or `Try to`.
- Make every constraint verifiable from the output. Reject subjective qualifiers like `appropriate`, `concise`, or `well-structured`.
- Match prompt length to task complexity. A single-purpose task gets a minimal prompt.
- Never write `maybe`, `consider`, or `depending on`. Be definitive.
