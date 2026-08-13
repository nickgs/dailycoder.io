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
