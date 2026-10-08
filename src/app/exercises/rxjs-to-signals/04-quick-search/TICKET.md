# S4 - Quick search

**Reported by:** Platform + QA  |  **Area:** Header quick search  |  **Priority:** High

## What we see

- The search endpoint receives a request for every keystroke, plus one as soon as the page opens,
  before anybody typed anything. Since the quick search went live search traffic has gone up
  several times.
- A single letter already triggers a search and fills the list with nearly the whole catalog.
- Typing a word quickly sometimes ends with results that belong to a shorter, earlier version of
  the word.
- Emptying the box does not empty the list.

## Expected

No request until the user has typed at least two characters and paused; results always match the
text in the box; an empty box shows no results.
