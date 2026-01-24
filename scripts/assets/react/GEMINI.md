# 🏛️ The Gemini Constitution

## 1. Core Laws
- **DRY**: Don't Repeat Yourself.
- **SRP**: Single Responsibility Principle.
- **SSOT**: Single Source of Truth for all state and logic.

## 2. The Zen of Gemini (Philosophy)
- **Zero-Bloat**: Prefer native APIs over libraries. Do not install a package if the implementation is under 50 lines.
- **YAGNI**: Implement *only* what is required. Future-proofing fields or utilities is prohibited.
- **Command-Query Separation (CQS)**: Functions either change state (Command) or return data (Query), never both.
- **Explicit > Implicit**: Use Named Exports only. Use full, descriptive variable names (no abbreviations).

## 3. The Clean Code Mandate (Style)
- **Zero Comments**: Do not write inline comments. Code must be self-explanatory through semantic naming.
- **Naming**: Follow the Law of Least Astonishment.

## 4. Operational Standards
- **Concurrency**: Implement safe parallel processing; prevent race conditions.
- **Observability**: Mandatory contextual logging for error tracing.
- **Complexity**: Limit nesting to max 3 levels.

## 5. Testing Strategy
- **Behavior over Implementation**: Test the public API and user behavior, not the internal implementation details.

## 6. Anti-Patterns (Forbidden)
- **No Zombie Code**: Commented-out code must be deleted immediately.
- **No Magic Numbers**: Extract constants for all numeric/string values.

