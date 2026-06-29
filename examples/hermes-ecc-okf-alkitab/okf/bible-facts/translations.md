---
type: concept
id: translations
domain: alkitab
status: draft
---

# Translations / Editions

Which Indonesian Bible editions the app ships, how each is referenced, and the
licensing constraints content roles MUST respect. The Content Lead reads this
before quoting any verse; the app reads it to pick a default edition.

> **VERIFY LICENSING.** Fill the license/permission column from the actual rights
> holder (e.g. LAI — Lembaga Alkitab Indonesia) before publishing any verse text.
> Quoting copyrighted scripture text without permission is a real legal risk.
> Leave `status: draft` until each row's license is confirmed.

## Editions

| Code | Name | Default? | License / permission | Source API |
|---|---|---|---|---|
| TB | Terjemahan Baru | ✅ default | _verify with rights holder_ | _set_ |
| TB2 | Terjemahan Baru Edisi 2 | | _verify_ | _set_ |
| BIS | Bahasa Indonesia Sehari-hari | | _verify_ | _set_ |

## Rules for content roles

- Always cite the edition code with quoted text (e.g. "Yohanes 3:16 (TB)").
- Never paraphrase scripture as if it were a translation; paraphrase = clearly
  labeled commentary, not a verse quote.
- If an edition's license is unconfirmed (`status: draft`), do NOT publish its
  verse text externally — draft only.
