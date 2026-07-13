# Saves & Anti-Cheat

## Local first

- Everything lives in **browser localStorage**
- Key: `observatory-save-v3` (sealed)
- No server, no login

## Sealed save

Exports include an **integrity hash** over canonical fields.

- Honest export/import works.
- Casual JSON edits that break the hash → **Meteor Justice** (resources scorched + VFX).

This is **client-side deterrence**, not military-grade security.

## Settings

| Action | Result |
|--------|--------|
| Export | Download sealed JSON |
| Import | Load sealed or legacy soft import |
| Reset progress | Fresh island (keeps onboarding seen) |

Code: `src/lib/save.ts`
