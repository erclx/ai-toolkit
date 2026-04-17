Audit prose files for semicolon and em dash violations.

1. Grep the files in scope for `;` and `—`. Reading alone misses occurrences. Grep cannot.
2. Audit every match against `standards/prose.md`.
3. Rewrite each violation. Read the surrounding context and restructure or rephrase as needed.

Do not swap punctuation out lazily. A semicolon replaced with a period is not a fix.
