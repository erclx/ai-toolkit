Write a bash script that searches for the following pattern across the project.

- Use `git grep` to respect `.gitignore`
- Output format: filename on one line, matches indented below with line numbers
- Hard-code the search targets as a multiline variable if the list is known upfront
- No arrays, pipes only
- Root defaults to `.`, overridable via `$1`
