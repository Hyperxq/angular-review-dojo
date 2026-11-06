# Capstone: a lesson before the exercises

Every other exercise in the dojo hands you a ticket and a small feature with defects in it. The capstone hands you a pull
request: a description written by its author, about 400 lines of code, and a reviewer's seat. Nobody tells you what is
wrong, or how much is wrong, or which parts that look wrong are fine.

This lesson is about the craft of reviewing a whole pull request, not about any Angular API. You already have the
technical pieces from the other tracks. What turns them into a review is the order you read in, how you decide what each
finding is worth, and how you write it down so the author can act on it.

How to use the lesson:

- Read chapter 0 and chapter 1, then do the exercise with a timer (the dojo suggests 45 minutes).
- Write your whole review before you open `REVIEW.md` on the `solutions` branch. The comparison only teaches you something if
  your review was finished first.
- The examples come from an imaginary pull request in a library app (books, members, loans, holds).

## Chapter 0: reflexes to recalibrate since Angular 17

A reviewer who learned Angular on v17 also carries habits from the pre-v17 codebases they worked in, and some of those
habits now misfire in both directions. Before reading a v22 pull request, retune them, because false alarms cost you
credibility with the author.

Habits that no longer point at a finding, or point at a different one:

| Habit from pre-v17 code | In 22.2.2 |
|-------------------------|-----------|
| "Missing `standalone: true`" | `standalone` defaults to `true`. Not a finding. |
| "Add `ChangeDetectionStrategy.OnPush`" | OnPush is the default. An explicit `Eager` is the thing to ask about; `Default` is a deprecated alias of it. |
| "Every stream needs `takeUntil(this.destroy$)`" | A stream that completes on its own (one HTTP response) has nothing to leak. A stream that never completes (timers, store selections, router events) needs an owner that ends it. Ask "does this complete?", not "is there an unsubscribe?". |
| "Inject through the constructor" | `inject()` is the normal form, and `@Service()` classes cannot use constructor injection at all. |
| "`*ngIf` and `*ngFor` are fine" | `NgIf` and `NgForOf` are `@deprecated 20.0`. Old code the PR does not touch is out of scope: no comment. New code in the PR that uses them is should-fix, because the team pays for it at the next upgrade. |

Things that used to work and now are findings:

| Pattern | Why it fails now |
|---------|------------------|
| A plain field assigned inside `subscribe` and read by the template | The app is zoneless. Nothing tells Angular to render. |
| Mutating an object or array in place and expecting the view to update | OnPush and signals compare by reference. Same reference, no update. |
| Reading `resource.value()` without checking `error()` or `hasValue()` | `value()` throws in the error state. |

The Part 1 tracks cover each of these in depth. In the capstone you only need to recognise them quickly and, just as
important, not to raise the first table as findings.

## Chapter 1: reviewing a pull request (exercise 01)

### The problem

A review can fail in two opposite ways, and both are common. The fast review ("LGTM, small nits") lets a security hole or a
data-loss bug through because the reviewer read the diff top to bottom and ran out of attention before the part that mattered.
The thorough review leaves forty comments of equal weight, the author cannot tell which three must be fixed, and the important
ones are argued about as if they were taste.

A review protects two things: the people who use the feature (it does what the ticket asked, safely) and the team's ability
to keep changing the code. Anything that protects neither is a preference. The craft is in the order you read in, how you
weigh what you find against those two, and how you write it down.

### Read in the order that finds the expensive things first

```flow
Ticket -> Description: what problem, for whom
Description -> Claims to check: every "because" and every "I had to"
Claims to check -> One user action end to end: follow it file by file
One user action end to end -> Data from other people: follow it to every sink
Data from other people -> Rubric pass: correctness, security, architecture, performance, tests, style
Rubric pass -> Unhappy paths: failure, slowness, repetition
Unhappy paths -> Triage: label, order, and cut
Triage -> Summary comment: verdict first
```

Read the ticket first: what problem must this solve, and for whom? Then ask whether the PR solves that, and only that. A PR
that also "tidies up" three unrelated files is harder to review and harder to revert, and the tidying is where reviewers stop
paying attention. Look at the size too: past about 400 changed lines, attention drops, and asking for a split is a fair
first comment.

Then read the description, as evidence rather than instructions. Authors explain the unusual things they did,
and those explanations point at the code most worth checking: "I disabled the cache because the list was stale", "I copied
the date helper because importing it caused a cycle", "I typed it as `any` because the API types are wrong". For each one,
ask whether the reason is true and whether the change is the right answer to it. An author's reason is a clue. Sometimes
the reason is right and the fix is wrong; sometimes the reason itself is a misunderstanding of how the framework works.
Treat the "How I tested" section the same way: each line is a claim about what was exercised, and a missing line is a path
nobody tried.

Then follow one user action through every file. Pick the main thing the feature does ("a member places a hold") and trace
it: the form, the component, the store, the API client, the list that shows the result, every other place that reads the
same state. Reading file by file in alphabetical order spreads your attention evenly over code that does not deserve it
evenly. Following an action shows you the seams, and most bugs live in the seams.

Then follow data that comes from somebody else. Anything a user typed, anything from a URL, anything another member
created: where does it end up? A template interpolation, a URL, an `innerHTML`, a log line, a request to a third party? This
is the security pass, and it is cheap compared to what it finds.

Then do the rubric pass, in the order the dojo's staff rubric gives: correctness, security, architecture and
maintainability, performance, tests, style. Add accessibility to it: can someone using only a keyboard or a screen reader
complete the action? The order is a priority list. You can write a comment whenever you find
something, but do not let a pile of style comments use up the time you needed for the correctness pass.

Finish with the unhappy paths. Most code in a PR is written for the case where everything works, and most production bugs
live in the other cases. Go back to the user action you traced and ask what happens when each step goes badly.

### Triage: four labels

| Label | Meaning | Merge? |
|-------|---------|--------|
| blocking | Wrong behaviour, a security hole, data loss, or something expensive to undo later. | No, until fixed. |
| should-fix | A real defect or maintainability cost with a clear fix, not an emergency. | In this PR, or in a linked ticket. |
| nit | Taste or small polish. | Yes. Keep them few. |
| question | You cannot tell whether it is a problem. Ask for the reason. | Depends on the answer. |

Three habits make the labels honest.

Decide by impact, not by the rule that was broken. "Violates our rule against `any`" invites a debate about the rule. "The
API sends the hold count as the string `'3'`, so `count + 1` shows 31 holds" ends the debate. If you cannot state the
impact, it is probably not blocking; if you cannot state it at all, it may be a question.

Use a question when you are missing information, and mean it. "Why is the cache disabled here?" is a real question when
there may be a reason you do not know. It is a disguised demand when you already know the answer; in that case, state the
finding.

Keep nits few. Every nit costs the author attention that should go to your blocking comments. If the team has a formatter or
a linter, style findings belong to it, not to you. Three nits per review is plenty; past that, pick the ones you would argue
for.

### "Looks wrong, but is fine"

The most underrated part of a review. Some code looks like a classic mistake and is the correct form. A reviewer who flags it
loses credibility for the comments that matter, and wastes the author's time defending correct code.

When something looks suspicious, check it before you comment. If it turns out fine, either leave no comment or, when another
reader might stumble on it the same way, write one line that says so:

> Looked twice at `HoldRules` being a `@Service()` that uses `inject()` instead of constructor parameters: `@Service()` classes cannot
> use constructor injection, so this is the required form. Fine as is.

"Fine" applies to the line you checked, not to whatever is piped into it. A correct API call can still receive the wrong
stream or the wrong scope; check those separately.

Saying "I checked this and it is correct" is a useful comment. It tells the author which parts of their reasoning held up, and
it tells the next reviewer they can skip it.

> [!TIP]
> For each "looks wrong" moment, write down the reason it would be wrong before you check. If you cannot name the failure,
> it was a shape you recognised, not a defect you found.

### Writing a comment the author can act on

A good inline comment has four parts, in this order: the label, the impact, the cause, and a suggested fix.

> **Blocking:** due dates are computed with `new Date().setHours(0, 0, 0, 0)` in the browser's time zone, while the API
> stores them in UTC. A member in UTC−5 who borrows after 7 pm sees a due date one day earlier than the one we use for
> fines. Suggest taking the due date from the API response instead of recomputing it.

Compare it with a weak version of the same comment:

> This date handling looks off, can you double-check time zones?

The weak version makes the author do your investigation. The strong one shows what you saw, why it matters, and a way out.
The author can still disagree, but now the disagreement is about something concrete.

More habits worth keeping:

- Suggest, do not rewrite. A short code suggestion helps; rewriting their file in a comment takes the change away from them.
- Comment on the code, never on the person. "This recomputes the due date" works; "you forgot" does not.
- Ask for the test with the fix. For every blocking item, describe the test that would have caught it. A blocking fix without
  a test is a finding of its own.
- Say what is good, specifically. "The hold rules are pure functions with their own tests, nice" tells the author what to
  keep doing.

### The summary comment and the verdict

The inline comments are for the author working through the changes. The summary at the top is for everyone else: the author's
lead, the next reviewer, the person reading the history in a year. Put the verdict first.

> Requesting changes: due dates shift by a day for members west of UTC, and cancelling a hold does not check that the hold
> belongs to the signed-in member. Both are inline with a suggested test.
>
> The rest can wait for a linked ticket if you prefer: the loan history is not paginated, renewals give no feedback while
> they run, and the page size is hard-coded. A couple of nits and one question, none blocking. The hold rules as pure
> functions with tests are a pattern I'd like to see more of.

A verdict follows from the labels:

- **Approve** when nothing blocks. Should-fix items can go to a follow-up ticket, provided the ticket is linked in the PR.
- **Request changes** when anything blocks. Good code elsewhere in the PR does not offset a known security hole or a
  path to data loss.
- **Comment** when you only have questions and the answers decide the verdict.

> [!IMPORTANT]
> Urgency in the description ("we need this before Friday") is information about the author's schedule. It does not change
> any label. If something blocks, say so early and kindly, and offer help: pairing on the fix is often faster than another
> round of review.

### Timeboxing

You will not find everything, and you do not need to. A review that finds the expensive problems in 45 minutes beats a
review that finds everything in a day. When the time is up, write the summary with what you have, and say what you did not
cover ("I did not review the CSS or the seed data for the catalogue").

### When not to comment, and when not to block

- Do not comment on what a formatter or linter would catch; ask for the tool once, if the team lacks it.
- Do not block on taste, on a refactor the PR did not set out to do, or on a finding whose impact you cannot state.
- Do not start over on the second round. A second round checks the answers to your comments and the new commits, not the
  whole PR again.
- Do not hold a question hostage: if the answer would not change your verdict, label it so the author knows it can wait.

### Review questions

- Which sentences in the description are reasons for an unusual choice? What would you have to read to know whether each
  reason is true?
- Pick the main thing a user does with the feature. Have you seen every file that action touches, and every place that shows
  its result?
- For every value that comes from outside the code (users, URLs, other services): what is the last place it reaches?
- What does the user see when each request fails, is slow, or arrives twice?
- What happens if the user acts again before the first action finishes?
- For each finding: can you state the impact in one sentence, and does the label follow from it?
- Before each comment that says "this is wrong": can you name the failure, or only the shape you recognised?
- Does every blocking comment say what to do and which test would have caught it?
- If the author read only your summary, would they know what to fix first?

**Now do exercise 01.**

## After the lesson

Compare your review with `REVIEW.md` on the `solutions` branch in this order: the verdict, then the blocking items, then the
"looks wrong, but is fine" list, then everything else. Note which findings you missed and which you labelled differently, and
for each difference write down whose reasoning you find stronger and why. Then do the dojo's suggested second pass: review a
real pull request from your own work with the same steps.
