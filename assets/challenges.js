/*
 * DailyCoder.io — challenge data
 * --------------------------------
 * This is the ONLY file the morning agent edits. Each day it prepends one new
 * object to the front of the array (newest first). The site renders index[0]
 * as "Today" and the rest as the archive. No backend, no database.
 *
 * Schema for one challenge:
 *   id          unique slug
 *   date        ISO date (YYYY-MM-DD) it goes live
 *   title       short, playful name
 *   blurb       one-line teaser shown on cards
 *   difficulty  "Easy" | "Medium" | "Hard"
 *   minutes     rough time to solve by hand
 *   tags        array of topic tags
 *   prompt      the challenge description (plain text, \n for breaks)
 *   examples    [{ in, out }] worked input/output pairs
 *   constraints array of bullet strings
 *   whyItMatters the "this is good for your brain" note
 *   hint        a nudge, hidden until requested
 *   solution    { lang, code, notes } revealed only after the user opts in
 */
window.CHALLENGES = [
  {
    id: "lingering-poison",
    date: "2026-08-18",
    title: "The Lingering Poison",
    blurb: "Each attack coats the target in poison for d seconds, refreshing on every hit. How long is it poisoned in total?",
    difficulty: "Easy",
    minutes: 8,
    tags: ["simulation", "greedy"],
    prompt: "A creature attacks a target at a series of integer seconds (given as a sorted list timeSeries) and each hit applies a coat of poison that lasts duration seconds. If a new attack lands while the target is still poisoned, the timer refreshes — the poison now lasts duration seconds from that new hit, swallowing any leftover time from the previous coat. Return the total number of seconds the target spends poisoned.\n\nThe reflex is to simulate every second on a clock — and for small inputs that's fine, but the duration can be huge (millions of seconds) and a per-second walk blows up. The click is to stop asking 'is it poisoned at second t?' and start asking, for each attack, 'how much NEW poisoned time does this coat actually contribute?' Two coats that overlap only add the non-overlapping part, and that part is the smaller of the duration and the gap to the next attack.",
    examples: [
      { in: "timeSeries = [1, 4], duration = 2", out: "4" },
      { in: "timeSeries = [1, 2], duration = 2", out: "3" },
      { in: "timeSeries = [1, 2, 3, 4, 5], duration = 5", out: "9" }
    ],
    constraints: [
      "timeSeries is sorted in non-decreasing order; times are non-negative integers.",
      "duration is a non-negative integer (zero means no poison at all).",
      "Aim for O(n) time and O(1) space — do not simulate second-by-second."
    ],
    whyItMatters: "This is the friendliest possible introduction to interval merging. 'Merge overlapping intervals' is a pattern that shows up everywhere: meeting rooms, disk scheduling, range queries, calendar conflicts. The deep idea here is that you never need to build the merged intervals — each attack's real contribution is just min(duration, gap-to-next), because overlap can only eat into the trailing end of a coat, never add to it. That reframe — 'each item contributes the capped gap to its neighbor' — turns an O(n)-space merge into an O(1) running sum. Learning to ask 'how much does this one step actually add?' instead of 'what is the full state?' is the move that scales simulation from toy to real.",
    hint: "For attack i, the poison it lays down would last until timeSeries[i] + duration. But the next attack at timeSeries[i+1] may cut that short — everything between this attack and the next is poisoned for sure, and anything after the next hit is covered by a later coat anyway. So each attack contributes min(duration, timeSeries[i+1] - timeSeries[i]), except the very last attack, which contributes the full duration.",
    solution: {
      lang: "javascript",
      code: "function findPoisonedDuration(timeSeries, duration) {\n  if (duration === 0) return 0;\n  let total = 0;\n  for (let i = 0; i < timeSeries.length; i++) {\n    const next = timeSeries[i + 1];\n    const gap = (next === undefined) ? duration : next - timeSeries[i];\n    total += Math.min(duration, gap);\n  }\n  return total;\n}",
      notes: "Each attack contributes min(duration, gap-to-next); the last attack has no next, so it contributes the full duration. Trace example 1: [1,4], dur 2. Attack at 1: gap = 4-1 = 3, contributes min(2,3)=2 (coat would reach second 3, but the next attack at 4 lands after it expired — no overlap, so the full 2 are new). Attack at 4 (last): contributes the full 2, reaching second 6. Total 4 — two disjoint intervals [1,3) and [4,6). Trace example 2: [1,2], dur 2. Attack at 1: gap = 2-1 = 1, contributes min(2,1)=1 (the coat would reach 3, but the attack at 2 refreshes it, so only the second 1->2 is new). Attack at 2 (last): contributes the full 2, reaching second 4. Total 3 — the merged interval is [1,4), length 3. Trace example 3: [1,2,3,4,5], dur 5. Gaps are all 1 except the last. Contributions: 1+1+1+1+5 = 9, matching the single merged interval [1, 5+5) = [1,10), length 9. The duration===0 guard handles the degenerate 'no poison' case without special-casing the loop. Time O(n), space O(1). The transferable lesson: when a simulation asks 'is the target affected at time t?', ask instead 'how much effect does each event add?' — the per-event sum is almost always cheaper than the per-tick walk."
    }
  },
  {
    id: "hungry-hungry-koko",
    date: "2026-08-17",
    title: "Hungry, Hungry Koko",
    blurb: "Piles of bananas, a deadline in hours. What's the slowest Koko can eat and still finish in time?",
    difficulty: "Medium",
    minutes: 12,
    tags: ["binary-search", "arrays"],
    prompt: "Koko has n piles of bananas. Each hour she picks one pile and eats up to k bananas from it — if the pile has fewer than k, she eats the whole pile and waits out the hour. Given the pile sizes and a deadline of h hours, find the minimum integer eating speed k that lets her finish every pile in time.\n\nThe reflex is to try every speed from 1 upward until one works — and that's correct but painfully slow, because the answer could be as high as the biggest pile. The click is a reframe: you're not searching a pile or an index, you're searching the answer itself. The set of speeds that work is a range [min, ∞), so the boundary between \"too slow\" and \"fast enough\" is a single number — and a single number sitting on a sorted line is binary search waving at you.",
    examples: [
      { in: "piles = [3,6,7,11], h = 8", out: "4" },
      { in: "piles = [30,11,23,4,20], h = 6", out: "23" },
      { in: "piles = [1,1,1,1], h = 4", out: "1" }
    ],
    constraints: [
      "piles[i] and h are positive integers; h is at least the number of piles (she can only touch one pile per hour).",
      "Eating speed k is a positive integer — no fractional bananas per hour.",
      "Aim for O(n log m) where m is the largest pile."
    ],
    whyItMatters: "Binary searching the answer space is one of the most transferable tricks in algorithm design. Any time the question is 'what is the smallest X such that some condition holds' — and the condition is monotone (once X is big enough, it stays big enough) — you can binary search X. That same frame cracks 'minimize the largest sum when splitting an array', 'smallest capacity to ship packages in D days', and 'minimum time to complete tasks'. The pile-eating itself is elementary arithmetic; the cleverness is all in recognizing that you're searching a value, not a position.",
    hint: "Fix a speed k and ask: how many hours would it take? That's just the sum of ceil(pile / k) across all piles — O(n). If that total fits in h, k is fast enough. The answer is the smallest k that's fast enough. So binary search k between 1 and max(piles): if mid works, try slower; if not, speed up.",
    solution: {
      lang: "javascript",
      code: "function minEatingSpeed(piles, h) {\n  let lo = 1;\n  let hi = Math.max(...piles);\n  while (lo < hi) {\n    const mid = Math.floor((lo + hi) / 2);\n    const hours = piles.reduce((s, p) => s + Math.ceil(p / mid), 0);\n    if (hours <= h) {\n      hi = mid;       // mid is fast enough — can we go slower?\n    } else {\n      lo = mid + 1;   // too slow, speed up\n    }\n  }\n  return lo;\n}",
      notes: "The search range is [1, max(piles)]: at speed 1 she eats one banana per hour (likely too slow); at max(piles) she clears any pile in a single hour, so the total is exactly n hours — always fast enough since h >= n. Each mid probe costs O(n) to sum the ceilings, and we do O(log max(piles)) probes, so it's O(n log m) overall. Trace example 1: piles [3,6,7,11], h=8. mid=6 → 1+1+2+2=6 hours, fits, try slower (hi=6). mid=3 → 1+2+3+4=10, too slow (lo=4). mid=5 → 1+2+2+3=8, fits (hi=5). mid=4 → 1+2+2+3=8, fits (hi=4). lo=hi=4, done. The two things people miss: the upper bound is max(piles) not some arbitrary big number, and Math.ceil(p / mid) must use floating division — integer division truncates and silently breaks the count. The monotonicity that makes binary search valid: if speed k finishes in time, every speed above k also finishes in time, so 'fast enough' is a clean threshold."
    }
  },
  {
    id: "backspace-to-the-future",
    date: "2026-08-16",
    title: "Backspace to the Future",
    blurb: "Two strings typed on a terminal with a '#' backspace key. Do they leave the same page behind?",
    difficulty: "Easy",
    minutes: 8,
    tags: ["stacks", "two-pointers"],
    prompt: "Two friends type messages on an old terminal where the '#' character means \"backspace\" — it deletes the previous character that's still on the page (if there is one). Backspacing past the start of the line just leaves an empty line. Given two strings s and t, return whether the text they end up with is the same.\n\nThe reflex is to process left-to-right and delete in place — but in-place deletion means shifting characters or juggling a write pointer, and it's easy to fumble the \"which characters are already gone?\" bookkeeping. The click is to model the page itself: what's actually sitting on it at any moment is a stack of survivors. Push a letter, pop on a '#'. Then the comparison is just \"are the two stacks equal?\" — and you never think about deletion bookkeeping again.",
    examples: [
      { in: "s = \"ab#c\", t = \"ad#c\"", out: "true" },
      { in: "s = \"ab##\", t = \"c#d#\"", out: "true" },
      { in: "s = \"a#c\", t = \"b\"", out: "false" }
    ],
    constraints: [
      "Strings contain only lowercase letters and '#'.",
      "'#' deletes the most recent non-deleted character; backspacing an empty line leaves it empty.",
      "Aim for O(n + m) time."
    ],
    whyItMatters: "The stack isn't a convenience here — it's the honest model of the problem. The page holds a sequence of surviving characters, and backspace only ever removes the most recent survivor, which is exactly LIFO behavior. Recognizing that a messy \"delete and shift\" task is really a stack is the same instinct that turns parentheses matching, undo buffers, and browser history into one-liners. There's a second click hiding here too: because every '#' only affects characters to its left, you can read the strings backward and skip the right number of deleted characters, solving it in O(1) extra space. Two models, one problem — the stack models what's left, the backward read models what was erased.",
    hint: "Process each string into a stack: push a letter, pop on '#'. An empty pop is a no-op, so backspacing an empty line costs nothing. When both stacks are built, are they the same string? For a stretch: can you do it reading from the right and skipping characters that get backspaced?",
    solution: {
      lang: "javascript",
      code: "function backspaceCompare(s, t) {\n  const type = (str) => {\n    const stack = [];\n    for (const ch of str) {\n      if (ch === '#') stack.pop();\n      else stack.push(ch);\n    }\n    return stack.join('');\n  };\n  return type(s) === type(t);\n}",
      notes: "Each string becomes its surviving text in one pass: a letter is pushed onto the stack, a '#' pops the top (Array.prototype.pop on an empty array is a no-op, so backspacing an empty line is free). Comparing the two joined stacks is the answer. Trace the examples: 'ab#c' -> push a, push b, pop b -> [a], push c -> 'ac'; 'ad#c' -> 'ac'; equal, true. 'ab##' -> [a, b], pop b, pop a -> '' ; 'c#d#' -> [c], pop c, [d], pop d -> '' ; equal, true. 'a#c' -> pop a, push c -> 'c'; 'b' -> 'b' ; 'c' !== 'b', false. That's O(n+m) time and O(n+m) space. The O(1)-space version reads each string from the right: keep a 'skip' counter that increments on '#' and decrements when you pass a real (non-#) character to skip over it; when skip is 0 you've found a survivor. Compare survivors pairwise from the end. It's the same idea — '#' only erases to its left — viewed from the opposite direction."
    }
  },
  {
    id: "take-the-stairs",
    date: "2026-08-15",
    title: "Take the Stairs",
    blurb: "A staircase of n steps, and you can climb 1 or 2 at a time. How many distinct ways up?",
    difficulty: "Medium",
    minutes: 10,
    tags: ["recursion", "dynamic-programming"],
    prompt: "You're at the bottom of a staircase with n steps. Each move you can climb either 1 step or 2 steps. How many distinct ways are there to reach the top?\n\nThe natural first thought is recursion: to land on step n you must have come from step n-1 (a 1-step move) or from step n-2 (a 2-step move), so the answer for n is the sum of the answers for n-1 and n-2. That's correct — and it's also Fibonacci, which means a naive recursion recomputes the same subproblems over and over. The click is two-fold: see the recurrence, then realize you only ever need the last two values to climb your way to the answer.",
    examples: [
      { in: "2", out: "2" },
      { in: "3", out: "3" },
      { in: "5", out: "8" }
    ],
    constraints: [
      "n is a positive integer (1 or more).",
      "The naive recursive solution is correct but exponential — aim for O(n) time.",
      "Bonus: can you do it with O(1) extra space?"
    ],
    whyItMatters: "This is the gentlest possible introduction to dynamic programming. The whole field rests on one move: describe the answer to a problem in terms of the answers to smaller versions of itself, then compute bottom-up so each subproblem is solved exactly once. 'What was my last decision?' is the question that turns a scary counting problem into a recurrence — and that same question, asked of trees, grids, and coin-change problems, is how you'll derive a dozen more DP solutions later.",
    hint: "Write out ways(1), ways(2), ways(3), ways(4) by hand. Notice the pattern. Then ask: to compute ways(n), which two earlier answers do I need to keep around — and can I throw the rest away?",
    solution: {
      lang: "javascript",
      code: "function climbStairs(n) {\n  if (n <= 2) return n;\n  let prev = 1, curr = 2;        // ways(1), ways(2)\n  for (let i = 3; i <= n; i++) {\n    [prev, curr] = [curr, prev + curr];\n  }\n  return curr;\n}",
      notes: "The recurrence is ways(n) = ways(n-1) + ways(n-2): your last move was a single step (from n-1) or a double step (from n-2), and those cases don't overlap. That's Fibonacci, shifted by one — ways(1)=1, ways(2)=2, ways(3)=3, ways(4)=5, ways(5)=8. The naive recursion is O(2^n) because it re-solves the same subproblems; the fix is to compute upward and keep only the last two values, making it O(n) time and O(1) space. The destructuring swap [prev, curr] = [curr, prev + curr] rolls the window forward without a temp. This 'last decision' framing is the seed of all dynamic programming."
    }
  },
  {
    id: "happy-or-looping",
    date: "2026-08-14",
    title: "Happy or Looping?",
    blurb: "Replace a number with the sum of its squared digits, again and again. Does it reach 1 — or chase its tail forever?",
    difficulty: "Easy",
    minutes: 10,
    tags: ["hashing", "math"],
    prompt: "A positive integer is called \"happy\" if you can reach 1 by repeatedly replacing it with the sum of the squares of its digits. So 19 -> 1^2 + 9^2 = 82 -> 68 -> 100 -> 1: happy! Given a starting number, return whether it's happy.\n\nThe trap is the word \"repeatedly.\" A sequence that never hits 1 sounds like it could spiral off to infinity — so you might be tempted to give up after some fixed number of tries. Don't. The real question is: what can a sequence like this actually DO, and what does that tell you about how to detect the answer?",
    examples: [
      { in: "19", out: "true" },
      { in: "2", out: "false" },
      { in: "7", out: "true" }
    ],
    constraints: [
      "Input is a positive integer (1 or greater).",
      "Don't cap the iterations at an arbitrary cutoff — use a method that's correct, not lucky.",
      "Aim for clean code; efficiency isn't the point here, the insight is."
    ],
    whyItMatters: "The aha is that this sequence can't run away. Once a number has three or more digits, the sum of squared digits is strictly smaller than the number itself (999 -> 243), so the values are trapped in a small bounded range. A bounded, deterministic sequence has only two possible fates: it reaches 1, or it lands on a value it has already visited and loops forever. That's why a Set — \"have I seen this value before?\" — is the whole algorithm. Recognizing that a problem is really about detecting a cycle, not about simulating forever, is the same instinct behind cycle detection in linked lists, infinite loops in state machines, and fixed-point iteration in numerical methods.",
    hint: "Keep a Set of every value you've produced. Each step, compute the sum of squared digits. If it's 1, you're happy; if it's already in the Set, you've looped. Ask yourself: why is it impossible for the values to grow without bound?",
    solution: {
      lang: "javascript",
      code: "function isHappy(n) {\n  const seen = new Set();\n  while (n !== 1 && !seen.has(n)) {\n    seen.add(n);\n    n = String(n)\n      .split('')\n      .reduce((sum, d) => sum + d * d, 0);\n  }\n  return n === 1;\n}",
      notes: "The loop halts the moment n hits 1 (happy) or revisits a value (looping). The Set is doing the cycle detection. Why is this guaranteed to terminate? For any number of three or more digits, the next value is smaller — a k-digit number n is at most 10^k - 1, but its digit-square sum is at most 81k, and for k >= 3 we have 81k < 10^k - 1. So the sequence is forced down into the single- and double-digit range (at most 162 for two digits, 243 for three), a finite set of values. A deterministic walk on a finite set either hits its target or repeats — there is no third option, no infinite drift. That's the whole proof, and the Set simply catches the repeat. Trivia: every non-happy number eventually falls into the same cycle 4 -> 16 -> 37 -> 58 -> 89 -> 145 -> 42 -> 20 -> 4."
    }
  },
  {
    id: "room-for-one-more",
    date: "2026-08-13",
    title: "Room for One More",
    blurb: "One meeting room, a pile of invites. How many can you actually attend?",
    difficulty: "Medium",
    minutes: 12,
    tags: ["greedy", "sorting"],
    prompt:
      "You have a single conference room and a list of meetings, each with a " +
      "start and end time. A meeting that ends at 3:00 frees the room for one " +
      "that starts at 3:00. Return the maximum number of meetings you can " +
      "attend without any overlap.\n\n" +
      "The natural instinct is to sort by start time and grab from the front — " +
      "but a long meeting that starts early can clobber the whole day. The " +
      "click is figuring out which endpoint to sort by instead, and why it " +
      "works. Trace a small case on paper before you reach for code.",
    examples: [
      { in: "[(1,3), (2,4), (3,5), (0,6)]", out: "2" },
      { in: "[(1,2), (2,3), (3,4), (1,4)]", out: "3" },
      { in: "[(0,5), (3,6), (5,7), (6,8), (8,10)]", out: "3" }
    ],
    constraints: [
      "Times are integers; a meeting [s, e) occupies [s, e) (end-exclusive).",
      "Start times are not sorted — you get them in arbitrary order.",
      "Aim for O(n log n)."
    ],
    whyItMatters:
      "This is the canonical greedy: prove that the locally best choice — the " +
      "meeting that ends earliest — is always safe, and the rest is a one-liner. " +
      "That proof pattern (exchange argument: swapping in the earliest-ending " +
      "meeting never makes things worse) is the engine behind interval " +
      "scheduling, cache eviction, and most \"pick the best next step\" problems " +
      "you'll meet for the rest of your career.",
    hint:
      "Sort by END time, not start time. Pick the earliest-ending meeting first, " +
      "then keep grabbing the next meeting whose start is at or after the last " +
      "chosen end. Ask yourself: why can swapping the earliest-ending meeting " +
      "in for any other never reduce the count?",
    solution: {
      lang: "javascript",
      code:
        "function maxMeetings(meetings) {\n" +
        "  // Greedy: the meeting that ends earliest leaves the most room behind it.\n" +
        "  meetings.sort((a, b) => a[1] - b[1]);\n" +
        "  let count = 0, lastEnd = -Infinity;\n" +
        "  for (const [start, end] of meetings) {\n" +
        "    if (start >= lastEnd) {\n" +
        "      count++;\n" +
        "      lastEnd = end;\n" +
        "    }\n" +
        "  }\n" +
        "  return count;\n" +
        "}",
      notes:
        "Why earliest end? Exchange argument: take any optimal schedule and " +
        "swap its first meeting for the earliest-ending one. The swap never " +
        "causes a new conflict, because the replacement ends no later than " +
        "what it replaced — so the rest of the schedule still fits. By " +
        "induction the greedy choice is always part of some optimal solution. " +
        "The sort is O(n log n); the scan is O(n). Beware the classic wrong " +
        "turn: sorting by start time and picking the first to finish among " +
        "those starting earliest still works here, but it's a coincidence of " +
        "this formulation — sorting by end directly is the idea that " +
        "generalizes."
    }
  },
  {
    id: "three-step-spin",
    date: "2026-08-12",
    title: "The Three-Step Spin",
    blurb: "Rotate an array right by k — in place, O(1) space — using three reversals.",
    difficulty: "Easy",
    minutes: 10,
    tags: ["arrays", "two-pointers"],
    prompt:
      "Given an array of n elements and a non-negative integer k, rotate the " +
      "array to the right by k positions — in place, using only O(1) extra space.\n\n" +
      "The brute-force approach of shifting one element at a time costs O(n·k). " +
      "You can do it in O(n) with a trick that feels like magic the first time " +
      "you see it: three reversals.\n\n" +
      "Trace it on paper before you write code. The whole charm is in watching " +
      "the array fall into place.",
    examples: [
      { in: "[1,2,3,4,5,6,7], k=3", out: "[5,6,7,1,2,3,4]" },
      { in: "[1,2,3], k=4", out: "[3,1,2]" },
      { in: "[-1,-100,3,99], k=2", out: "[3,99,-1,-100]" }
    ],
    constraints: [
      "k can be larger than n — wrap with k mod n.",
      "In place means O(1) extra space; no allocating a second array.",
      "Elements may be any comparable type, including negatives."
    ],
    whyItMatters:
      "The three-reversal trick is a lesson in reframing. \"Move each element " +
      "to its new home\" is the obvious approach and it's painful. \"Tear the " +
      "structure down, then rebuild it in two pieces\" sounds reckless but is " +
      "clean and fast. That instinct — decomposing a shuffle into structural " +
      "transformations — shows up in string rotation, buffer swaps, and anywhere " +
      "you need to rearrange without scratch space.",
    hint:
      "Try [1,2,3,4,5,6,7] with k=3. First reverse the WHOLE array. Now the " +
      "elements that belong at the front are sitting in a block on the left — " +
      "just backwards. Reverse that block, then reverse what's left.",
    solution: {
      lang: "javascript",
      code:
        "function rotate(nums, k) {\n" +
        "  const n = nums.length;\n" +
        "  k = k % n;\n" +
        "  if (k === 0) return nums;\n" +
        "\n" +
        "  function reverse(arr, lo, hi) {\n" +
        "    while (lo < hi) {\n" +
        "      const tmp = arr[lo];\n" +
        "      arr[lo] = arr[hi];\n" +
        "      arr[hi] = tmp;\n" +
        "      lo++;\n" +
        "      hi--;\n" +
        "    }\n" +
        "  }\n" +
        "\n" +
        "  reverse(nums, 0, n - 1);\n" +
        "  reverse(nums, 0, k - 1);\n" +
        "  reverse(nums, k, n - 1);\n" +
        "  return nums;\n" +
        "}",
      notes:
        "Rotating right by k means the last k elements come to the front. " +
        "Reversing the whole array puts those last-k elements at the front " +
        "(backwards) and the first n-k at the back (also backwards). Two more " +
        "reversals fix each half. Every element is touched twice — once in the " +
        "full reversal, once in a partial — so it's O(n) time and O(1) space. " +
        "The k mod n handles the wrap: without it, k=4 on a 3-element array " +
        "walks right off the end."
    }
  },
  {
    id: "the-drifting-hour-hand",
    date: "2026-08-10",
    title: "The Drifting Hour Hand",
    blurb: "Given a time on an analog clock, find the smaller angle between the two hands.",
    difficulty: "Medium",
    minutes: 12,
    tags: ["math", "geometry"],
    prompt:
      "Given a time as \"H:MM\" on a 12-hour analog clock, return the smaller of " +
      "the two angles between the hour hand and the minute hand, in degrees.\n\n" +
      "Most people get this wrong on the first try for one reason: the hour hand " +
      "does not sit politely on the hour and wait. By 3:30 it has already drifted " +
      "halfway toward 4. Draw the clock face before you write a single line.",
    examples: [
      { in: '"3:00"', out: "90" },
      { in: '"3:30"', out: "75" },
      { in: '"12:20"', out: "110" }
    ],
    constraints: [
      "Hours are 1–12, minutes are 0–59. Assume well-formed input.",
      "Return the smaller angle, so the answer is always between 0 and 180.",
      "Fractional answers are fine — 9:45 is 22.5 degrees, not 22 or 23."
    ],
    whyItMatters:
      "This is a tiny lesson in modelling something continuous instead of " +
      "something discrete. The bug isn't in your arithmetic, it's in your mental " +
      "picture — and noticing that gap is a skill that transfers straight to " +
      "dates, timezones, animation curves, and every progress bar you'll ever write.",
    hint:
      "Work in degrees from 12 o'clock. The minute hand is easy: 6 degrees per " +
      "minute. For the hour hand, ask yourself how far it travels in ONE minute " +
      "(hint: 30 degrees per hour), then add that drift on top of the hour mark.",
    solution: {
      lang: "javascript",
      code:
        "function clockAngle(time) {\n" +
        "  const [h, m] = time.split(':').map(Number);\n" +
        "\n" +
        "  // 360 / 60 = 6 degrees per minute\n" +
        "  const minuteAngle = m * 6;\n" +
        "\n" +
        "  // 360 / 12 = 30 degrees per hour, plus the drift: 30 / 60 = 0.5 per minute.\n" +
        "  // h % 12 so that 12 o'clock is 0 degrees, not 360.\n" +
        "  const hourAngle = (h % 12) * 30 + m * 0.5;\n" +
        "\n" +
        "  const diff = Math.abs(hourAngle - minuteAngle);\n" +
        "\n" +
        "  // We want the smaller of the two arcs between the hands\n" +
        "  return Math.min(diff, 360 - diff);\n" +
        "}",
      notes:
        "Two traps, and almost everyone hits at least one. The first is forgetting " +
        "the 0.5-degrees-per-minute drift, which quietly breaks every time except " +
        "the exact hour. The second is returning the raw difference: at 12:40 the " +
        "hands are 220 degrees apart the long way round, so the answer is the " +
        "other arc, 140. The h % 12 keeps 12 o'clock at zero rather than 360."
    }
  },
  {
    id: "reverse-the-vowels",
    date: "2026-06-27",
    title: "Reverse the Vowels",
    blurb: "Flip only the vowels in a string, leave everything else exactly where it is.",
    difficulty: "Easy",
    minutes: 10,
    tags: ["strings", "two-pointers"],
    prompt:
      "Given a string, reverse only the vowels (a, e, i, o, u — both cases) and " +
      "keep every other character in its original position.\n\n" +
      "Sounds trivial until you try to do it in a single pass without rebuilding " +
      "the whole string. Two fingers walking toward each other is all you need.",
    examples: [
      { in: '"hello"', out: '"holle"' },
      { in: '"DailyCoder"', out: '"DeilyCodar"' },
      { in: '"sky"', out: '"sky"' }
    ],
    constraints: [
      "Treat the string as case-sensitive (swap the letters, don't change their case position).",
      "Aim for O(n) time and O(1) extra space beyond the output."
    ],
    whyItMatters:
      "The two-pointer pattern is the workhorse of in-place array problems. " +
      "Doing it by hand once wires in the instinct to walk inward from both ends.",
    hint:
      "Put one pointer at the start, one at the end. Move them toward each other; " +
      "only stop and swap when BOTH are sitting on a vowel.",
    solution: {
      lang: "javascript",
      code:
        "function reverseVowels(s) {\n" +
        "  const vowels = new Set('aeiouAEIOU');\n" +
        "  const arr = [...s];\n" +
        "  let i = 0, j = arr.length - 1;\n" +
        "  while (i < j) {\n" +
        "    if (!vowels.has(arr[i])) { i++; continue; }\n" +
        "    if (!vowels.has(arr[j])) { j--; continue; }\n" +
        "    [arr[i], arr[j]] = [arr[j], arr[i]];\n" +
        "    i++; j--;\n" +
        "  }\n" +
        "  return arr.join('');\n" +
        "}",
      notes:
        "Each pointer only ever moves inward, so every character is visited once — " +
        "O(n). The Set lookup keeps the vowel check O(1)."
    }
  },
  {
    id: "the-lonely-number",
    date: "2026-06-26",
    title: "The Lonely Number",
    blurb: "Every number shows up twice except one. Find the loner — no extra memory allowed.",
    difficulty: "Easy",
    minutes: 8,
    tags: ["arrays", "bit-tricks"],
    prompt:
      "You're handed a list where every value appears exactly twice, except for a " +
      "single value that appears once. Return the lonely one.\n\n" +
      "A hash map solves it instantly — but there's a one-line trick that uses no " +
      "extra space at all. Worth finding by hand at least once.",
    examples: [
      { in: "[4, 1, 2, 1, 2]", out: "4" },
      { in: "[7]", out: "7" },
      { in: "[2, 2, 9, 3, 9, 3, 5]", out: "5" }
    ],
    constraints: [
      "Linear time.",
      "Bonus: solve it with O(1) extra space."
    ],
    whyItMatters:
      "XOR's self-cancelling property (x ^ x = 0) is one of those facts that feels " +
      "like magic until it's muscle memory. Great reminder that arithmetic identities " +
      "can replace data structures.",
    hint:
      "x ^ x = 0, and x ^ 0 = x. What happens if you XOR every number in the list together?",
    solution: {
      lang: "javascript",
      code:
        "function lonely(nums) {\n" +
        "  return nums.reduce((acc, n) => acc ^ n, 0);\n" +
        "}",
      notes:
        "Pairs cancel to 0, leaving only the unpaired value. One pass, no extra memory."
    }
  },
  {
    id: "balanced-brackets",
    date: "2026-06-25",
    title: "Balanced Brackets",
    blurb: "Decide if every (), [], and {} is properly opened and closed in order.",
    difficulty: "Medium",
    minutes: 15,
    tags: ["stacks", "parsing"],
    prompt:
      "Given a string of brackets — (), [], {} — return whether they're balanced: " +
      "every opener has a matching closer, and they nest in the correct order.\n\n" +
      '"([])" is balanced. "([)]" is not. This is the tiny engine inside every code ' +
      "editor that highlights a missing brace.",
    examples: [
      { in: '"([]{})"', out: "true" },
      { in: '"([)]"', out: "false" },
      { in: '"((("', out: "false" }
    ],
    constraints: [
      "Single pass, O(n).",
      "An empty string counts as balanced."
    ],
    whyItMatters:
      "The stack is THE pattern for anything nested — brackets, HTML tags, undo " +
      "history. Recognizing 'this is a stack problem' on sight is a genuine skill.",
    hint:
      "Push every opener onto a stack. On a closer, the top of the stack must be its " +
      "matching opener — otherwise bail early.",
    solution: {
      lang: "javascript",
      code:
        "function isBalanced(s) {\n" +
        "  const pairs = { ')': '(', ']': '[', '}': '{' };\n" +
        "  const stack = [];\n" +
        "  for (const ch of s) {\n" +
        "    if (ch === '(' || ch === '[' || ch === '{') {\n" +
        "      stack.push(ch);\n" +
        "    } else if (ch in pairs) {\n" +
        "      if (stack.pop() !== pairs[ch]) return false;\n" +
        "    }\n" +
        "  }\n" +
        "  return stack.length === 0;\n" +
        "}",
      notes:
        "If the stack isn't empty at the end, some opener never got closed. " +
        "Popping a mismatch (or popping an empty stack) means we're out of order."
    }
  },
  {
    id: "run-length-whisper",
    date: "2026-06-24",
    title: "Run-Length Whisper",
    blurb: 'Compress "aaabbc" into "a3b2c1" by counting consecutive runs.',
    difficulty: "Easy",
    minutes: 10,
    tags: ["strings", "counting"],
    prompt:
      "Implement basic run-length encoding: replace each run of identical, " +
      "consecutive characters with the character followed by its count.\n\n" +
      "It's the ancestor of every compression algorithm and still ships inside image " +
      "formats today. The whole trick is knowing when a run ends.",
    examples: [
      { in: '"aaabbc"', out: '"a3b2c1"' },
      { in: '"abcd"', out: '"a1b1c1d1"' },
      { in: '"zzzzz"', out: '"z5"' }
    ],
    constraints: [
      "Single pass.",
      "Assume the input is non-empty and contains no digits."
    ],
    whyItMatters:
      "Tracking 'current run vs. previous run' is the same state-machine thinking " +
      "behind tokenizers and parsers. Cheap problem, deep transferable pattern.",
    hint:
      "Keep the current character and a counter. When the next character differs, " +
      "flush 'char + count' to the output and reset.",
    solution: {
      lang: "javascript",
      code:
        "function rle(s) {\n" +
        "  let out = '', count = 1;\n" +
        "  for (let i = 1; i <= s.length; i++) {\n" +
        "    if (s[i] === s[i - 1]) {\n" +
        "      count++;\n" +
        "    } else {\n" +
        "      out += s[i - 1] + count;\n" +
        "      count = 1;\n" +
        "    }\n" +
        "  }\n" +
        "  return out;\n" +
        "}",
      notes:
        "Running the loop one past the end (i <= length) lets the final run flush " +
        "without duplicating the logic after the loop."
    }
  },
  {
    id: "mountain-peak",
    date: "2026-06-23",
    title: "Mountain Peak",
    blurb: "Numbers climb, then fall. Find the summit in better than a full scan.",
    difficulty: "Medium",
    minutes: 15,
    tags: ["binary-search", "arrays"],
    prompt:
      "An array strictly increases to a single peak, then strictly decreases. " +
      "Return the index of the peak.\n\n" +
      "Scanning left to right is the obvious O(n). The fun is realizing the slope " +
      "itself tells you which half to throw away — getting you to O(log n).",
    examples: [
      { in: "[1, 3, 5, 4, 2]", out: "2" },
      { in: "[0, 10, 9]", out: "1" },
      { in: "[1, 2, 3, 4]", out: "3" }
    ],
    constraints: [
      "Aim for O(log n).",
      "Exactly one peak is guaranteed."
    ],
    whyItMatters:
      "Binary search isn't just for sorted lookups — any time a property splits the " +
      "space into 'too low / too high', it applies. Spotting that is a real level-up.",
    hint:
      "Compare mid to mid+1. If you're still going uphill, the peak is to the right; " +
      "if downhill, it's at mid or to the left.",
    solution: {
      lang: "javascript",
      code:
        "function peak(arr) {\n" +
        "  let lo = 0, hi = arr.length - 1;\n" +
        "  while (lo < hi) {\n" +
        "    const mid = (lo + hi) >> 1;\n" +
        "    if (arr[mid] < arr[mid + 1]) lo = mid + 1;\n" +
        "    else hi = mid;\n" +
        "  }\n" +
        "  return lo;\n" +
        "}",
      notes:
        "The loop narrows to a single index. Because exactly one peak exists, the " +
        "uphill/downhill slope is always a safe signal for which half to discard."
    }
  },
  {
    id: "pangram-check",
    date: "2026-06-22",
    title: "The Perfect Pangram",
    blurb: 'Does the sentence use every letter A–Z at least once?',
    difficulty: "Easy",
    minutes: 7,
    tags: ["sets", "strings"],
    prompt:
      "Return whether a sentence is a pangram — it contains every letter of the " +
      "English alphabet at least once, ignoring case and punctuation.\n\n" +
      '"The quick brown fox jumps over the lazy dog" is the classic. A Set makes ' +
      "this almost too easy, which is exactly why it's a nice warm-up.",
    examples: [
      { in: '"The quick brown fox jumps over the lazy dog"', out: "true" },
      { in: '"Hello world"', out: "false" },
      { in: '"Pack my box with five dozen liquor jugs"', out: "true" }
    ],
    constraints: [
      "Case-insensitive.",
      "Ignore anything that isn't a letter."
    ],
    whyItMatters:
      "Reaching for a Set the instant you hear 'distinct' or 'at least once' is a " +
      "habit worth keeping sharp. Tiny problem, foundational reflex.",
    hint:
      "Lowercase everything, drop it into a Set, and check whether the Set holds " +
      "all 26 letters.",
    solution: {
      lang: "javascript",
      code:
        "function isPangram(s) {\n" +
        "  const seen = new Set(\n" +
        "    s.toLowerCase().replace(/[^a-z]/g, '')\n" +
        "  );\n" +
        "  return seen.size === 26;\n" +
        "}",
      notes:
        "Strip non-letters, lowercase, dedupe via Set. If 26 distinct letters " +
        "survived, every letter was present."
    }
  }
];
