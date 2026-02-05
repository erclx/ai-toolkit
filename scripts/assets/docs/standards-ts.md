# CODING STANDARDS REFERENCE

## STATUS

- **Version**: 1.0.0
- **Owner**: System Architect
- **Last Updated**: 2026-02-05

## PRINCIPLES

- **Type Safety**: TypeScript strict mode is non-negotiable; explicit types are required for all boundaries.
- **Immutability**: Prefer `const` and immutable data structures; avoid side effects in functions.
- **Readability**: Prioritize "Scan-ability" over "Cleverness"; use guard clauses to reduce nesting.
- **Modularity**: Adhere to the Single Responsibility Principle; keep components and functions small (~100 lines max).
- **Export Strategy**: Use **Named Exports** exclusively to enforce consistent naming across imports.

## COMMANDS

```bash
# Analyze code for pattern violations
bun run lint

# Automatically fix formatting and auto-fixable lint errors
bun run lint --fix

# Type check without emitting files
tsc --noEmit
```

## EXAMPLES

### 1. Component Definition

#### ✅ Correct Pattern

```tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button = ({ label, onClick, variant = 'primary' }: ButtonProps) => {
  return (
    <button className={`btn-${variant}`} onClick={onClick}>
      {label}
    </button>
  );
};
```

#### ❌ Incorrect Pattern

```tsx
// Avoid default exports and "any" typing
export default function Button(props: any) {
  return <button onClick={props.click}>{props.text}</button>;
}
```

### 2. Control Flow (Guard Clauses)

#### ✅ Correct Pattern

```typescript
export const processUser = (user: User | null): string => {
  if (!user) {
    return 'Guest';
  }

  if (!user.isActive) {
    return 'Inactive';
  }

  return user.name;
};
```

#### ❌ Incorrect Pattern

```typescript
export const processUser = (user: User | null): string => {
  if (user) {
    if (user.isActive) {
      return user.name;
    } else {
      return 'Inactive';
    }
  } else {
    return 'Guest';
  }
};
```

### 3. Naming Conventions

#### ✅ Correct Pattern

```typescript
const isAuthenticationValid = true;
const maxRetryCount = 3;
const fetchUserData = async () => {};
```

#### ❌ Incorrect Pattern

```typescript
// Avoid vague or Hungarian notation
const valid = true;
const intCount = 3;
const getUser = async () => {}; // "get" implies synchronous access; "fetch" implies async
```

## CONSTRAINTS

- **No `any`**: The use of `any` is strictly prohibited. Use `unknown` or specific generics if necessary.
- **No Console Logs**: Production code must not contain `console.log`. Use a proper logger.
- **No Magic Numbers**: Extract raw numbers and strings into named constants.
- **Comments**: Do not comment "what" the code does (logic). Only comment "why" it does it (intent/business context).
- **File Hygiene**: All files must end with exactly one newline.