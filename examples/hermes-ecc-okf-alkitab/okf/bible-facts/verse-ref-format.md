---
type: concept
id: verse-ref-format
domain: alkitab
status: draft
---

# Verse Reference Format (Indonesian)

Canonical rules for parsing, validating, and rendering scripture references in the
Alkitab Indonesia app. Every role — Developer, Reviewer, Content Lead, and any
validation gate — reads THIS as the single source of truth. Do not re-derive.

## Reference grammar

```
<Book> <Chapter>:<Verse>[-<Verse>][, <Verse>...]
```

- **Book** — Indonesian book name (see `book-codes.md`), e.g. `Yohanes`, `Kejadian`.
  Abbreviations resolve through the alias table in `book-codes.md`.
- **Chapter / Verse** — integers ≥ 1.
- **Range** — `Yohanes 3:16-17` (inclusive). Start ≤ end.
- **List** — `Mazmur 23:1, 4, 6` (comma-separated verses within one chapter).
- **Cross-chapter ranges** are NOT supported in v1 (`Yoh 3:16-4:2` → reject).

## Examples

| Input | Valid? | Notes |
|---|---|---|
| `Yohanes 3:16` | ✅ | single verse |
| `Kejadian 1:1-3` | ✅ | range |
| `Mazmur 23:1, 4, 6` | ✅ | verse list |
| `Yohanes 3` | ✅ | whole chapter (verse omitted) |
| `Yohanes 3:` | ❌ | dangling colon → reject |
| `Yohannes 3:16` | ❌ | unknown book → reject (see alias table first) |
| `Yohanes 3:16-4:2` | ❌ | cross-chapter range unsupported in v1 |
| `Yohanes 3:0` | ❌ | verse < 1 |

## Validation contract (the oracle)

A reference is valid iff: book resolves via `book-codes.md`; chapter and verse are
integers ≥ 1; chapter ≤ the book's chapter count; range start ≤ end; no
cross-chapter range. A malformed reference must **fail closed** (never render a
broken link or crash the reader).

> This is the oracle the retro pointed at: the "null verse-ref crash" leak class.
> Any CI check named `verse-ref-validation` enforces exactly this contract.
