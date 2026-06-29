---
type: dataset
id: book-codes
domain: alkitab
status: draft-incomplete
canon: protestant-66
---

# Book Codes — Indonesian (Terjemahan Baru)

Maps Indonesian book names → stable OSIS codes, with common abbreviations and
chapter counts. The chapter count is part of the verse-ref validation oracle
(`verse-ref-format.md`).

> **INCOMPLETE ON PURPOSE.** A representative, verified subset is filled in below.
> Complete the remaining books and **verify every name/count against your shipping
> edition** before this leaves `status: draft-incomplete`. Do not trust an
> AI-generated full canon unchecked — wrong canonical data poisons every role.

## Old Testament (start)

| OSIS | Indonesian | Aliases | Chapters |
|---|---|---|---|
| GEN | Kejadian | Kej | 50 |
| EXO | Keluaran | Kel | 40 |
| LEV | Imamat | Im | 27 |
| NUM | Bilangan | Bil | 36 |
| DEU | Ulangan | Ul | 34 |
| ... | _(complete Yosua → Maleakhi)_ | | |

## New Testament (start)

| OSIS | Indonesian | Aliases | Chapters |
|---|---|---|---|
| MAT | Matius | Mat | 28 |
| MRK | Markus | Mrk | 16 |
| LUK | Lukas | Luk | 24 |
| JHN | Yohanes | Yoh | 21 |
| ACT | Kisah Para Rasul | Kis | 28 |
| ... | _(complete Roma → Wahyu)_ | | |

## Usage

- Parsers resolve a token to OSIS via Indonesian name OR alias (case-insensitive).
- A name not in this table is an **unknown book** → reject the reference.
- `Chapters` bounds the chapter component during validation.
