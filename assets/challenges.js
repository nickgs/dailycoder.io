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
    id: "what-survives-the-collapse",
    date: "2026-08-29",
    title: "What Survives the Collapse?",
    blurb: "A string full of identical adjacent pairs keeps eating itself — remove a pair and new neighbors touch, maybe forming a new pair. What's left when the cascade finally stops?",
    difficulty: "Easy",
    minutes: 8,
    tags: ["stacks", "simulation", "strings"],
    prompt: "You're given a string s of lowercase letters. Scan it for adjacent identical pairs — two of the same letter sitting next to each other — and remove them both. But removing a pair can squeeze previously separated characters together, creating a brand-new pair that also needs removing. Keep going until no adjacent identical pair remains. Return the final string.\n\nExample: \"abbaca\" — the \"bb\" in the middle is a pair, so remove it. That gives \"aaca\", and now the two a's at the front are adjacent — another pair. Remove them too, leaving \"ca\". No more pairs. Done.\n\nThe reflex is to scan left to right, find the first pair, cut it out, and start over from the beginning of the shortened string. That's correct, and for short strings it's fine. But each removal can shift everything after it, and the rescan starts from scratch — so in the worst case you're doing O(n) passes over an O(n) string, for O(n²) total. The wasted work is obvious: after removing a pair, you rescan characters you already know are pair-free, just to get back to where something might have changed.\n\nThe click is that the only place a new pair can form is exactly where you just removed one — the character before the gap now touches the character after it. Everything further back is unchanged. So you don't need to rescan from the start; you need to look at what's right behind your current position. And \"the thing right behind me, that I might need to compare against and possibly retract\" is a stack. Process the string one character at a time. For each character, check it against the top of the stack. If they match, pop — the pair annihilates, and the new top is now exposed for the next comparison. If they don't match, push. One pass, no rescanning, and the cascade handles itself for free.",
    examples: [
      { in: "s = \"abbaca\"", out: "\"ca\"" },
      { in: "s = \"azxxzy\"", out: "\"ay\"" },
      { in: "s = \"abba\"", out: "\"\"" }
    ],
    constraints: [
      "s contains only lowercase English letters (a–z).",
      "The string has between 1 and 2·10^5 characters.",
      "Removal is exhaustive: keep removing adjacent identical pairs until none remain. The order in which you remove pairs doesn't matter — the final string is always the same.",
      "Aim for O(n) time and O(n) space — a single left-to-right pass."
    ],
    whyItMatters: "This puzzle is the gentlest possible introduction to the most versatile tool in your kit: the stack as a \"process and maybe retract\" buffer. The naive approach scans, removes, and rescans — repeating work because it doesn't remember what came before the removal site. The stack remembers. When a pair annihilates, the pop exposes the previous character automatically, so the next incoming character is compared against whatever survived the collapse. No rescan, no bookkeeping — the data structure does the bookkeeping for you.\n\nThe deeper lesson is recognizing the signature: whenever processing a new element might invalidate something you've already committed to — a pair that collapses, a parenthesis that closes, a move you need to undo — a stack is almost always the right shape. The same skeleton powers expression evaluation (operators deferred until their operands are ready), backspace processing in text editors, undo/redo histories, and the \"monotonic stack\" family that solves \"next greater element\" and \"daily temperatures.\" In every case the structure is identical: push forward, and when the incoming element contradicts the top, pop and resolve.\n\nThere's a quieter lesson too, hiding in the claim that \"the order of removal doesn't matter.\" The final string is always the same, no matter which pair you delete first. That's not obvious — you might think different removal orders could cascade differently. But the result is unique, and the stack proves it: the stack processes left to right deterministically and always produces the same output, so any valid sequence of removals must converge to that same answer. This is confluence — the same property that guarantees the Church-Rosser theorem for lambda calculus, and that makes pair-reduction a well-defined operation in free groups. A string and its annihilation rules form a tiny algebra, and the stack is its canonical evaluator.",
    hint: "Walk the string left to right with a stack. For each character: if the stack is non-empty and its top equals the current character, pop — the pair annihilates. Otherwise push the character. When you're done, the stack holds the answer. The cascade is automatic: a pop exposes the element beneath, so the next character is naturally compared against whatever survived the previous collapse.",
    solution: {
      lang: "javascript",
      code: "function removeDuplicates(s) {\n  const stack = [];\n  for (const ch of s) {\n    if (stack.length > 0 && stack[stack.length - 1] === ch) {\n      stack.pop();\n    } else {\n      stack.push(ch);\n    }\n  }\n  return stack.join('');\n}",
      notes: "One pass, one stack, one comparison per character. The stack holds the current \"survivors\" — characters that haven't been annihilated yet. Each incoming character is checked against the top: a match means both die (pop, don't push), a mismatch means the newcomer survives (push). The join at the end turns the survivors back into a string.\n\nTrace example 1: s = \"abbaca\".\n• ch='a': stack empty → push. stack = [a].\n• ch='b': top='a' ≠ 'b' → push. stack = [a, b].\n• ch='b': top='b' = 'b' → pop. stack = [a]. (The \"bb\" pair annihilates.)\n• ch='a': top='a' = 'a' → pop. stack = []. (Cascade! Removing \"bb\" brought the first 'a' next to this 'a'.)\n• ch='c': stack empty → push. stack = [c].\n• ch='a': top='c' ≠ 'a' → push. stack = [c, a].\n• return \"ca\". ✓\n\nHand-check: \"abbaca\" → remove \"bb\" → \"aaca\" → remove \"aa\" → \"ca\". ✓ The stack caught the cascade without rescanning — after popping \"bb\", the exposed 'a' was automatically compared against the incoming 'a' and they annihilated too.\n\nTrace example 2: s = \"azxxzy\".\n• ch='a': push. stack = [a].\n• ch='z': top='a' ≠ 'z' → push. stack = [a, z].\n• ch='x': top='z' ≠ 'x' → push. stack = [a, z, x].\n• ch='x': top='x' = 'x' → pop. stack = [a, z]. (\"xx\" annihilates.)\n• ch='z': top='z' = 'z' → pop. stack = [a]. (Cascade! Removing \"xx\" brought 'z' next to 'z'.)\n• ch='y': top='a' ≠ 'y' → push. stack = [a, y].\n• return \"ay\". ✓\n\nHand-check: \"azxxzy\" → remove \"xx\" → \"azzy\" → remove \"zz\" → \"ay\". ✓\n\nTrace example 3: s = \"abba\".\n• ch='a': push. stack = [a].\n• ch='b': top='a' ≠ 'b' → push. stack = [a, b].\n• ch='b': top='b' = 'b' → pop. stack = [a]. (\"bb\" annihilates.)\n• ch='a': top='a' = 'a' → pop. stack = []. (Cascade — everything collapses.)\n• return \"\". ✓\n\nHand-check: \"abba\" → remove \"bb\" → \"aa\" → remove \"aa\" → \"\". ✓ The entire string eats itself — a dramatic illustration that the cascade can consume characters that were never originally adjacent.\n\nTime O(n) — each character is pushed at most once and popped at most once, so the total work across all operations is at most 2n. Space O(n) for the stack in the worst case (a string with no pairs, like \"abcdef\", fills the stack with all n characters). The key insight is that the stack replaces \"scan, remove, rescan\" with \"push, compare, maybe pop\" — and the cascade, which is the entire difficulty of the naive approach, becomes a free side effect of the pop exposing the element beneath."
    }
  },
  {
    id: "a-window-with-no-echo",
    date: "2026-08-28",
    title: "A Window With No Echo",
    blurb: "Find the longest stretch of a string where no letter repeats. The trick is a window that stretches and snaps — never scanning the same ground twice.",
    difficulty: "Medium",
    minutes: 12,
    tags: ["sliding-window", "hashing", "two-pointers"],
    prompt: "You're given a string s. Find the length of the longest substring in which no character repeats — a contiguous stretch where every letter appears at most once.\n\nThe reflex is to enumerate every substring and check each for duplicates. That's correct, and for short strings it's fine, but it costs O(n^2) substrings times an O(n) uniqueness check — O(n^3) overall, or O(n^2) with a hash set per starting point. The work repeats madly: two substrings that overlap almost entirely re-scan their shared letters from scratch.\n\nThe click is to stop asking \"is THIS substring valid?\" and start asking \"what's the longest valid window ENDING here?\" Walk a right pointer across the string one character at a time. At each step the window [left, right] is a candidate — every character in it is unique. When the next character would create a duplicate, you don't throw the window away and start over; you slide left forward just enough to evict the offender, and the window keeps growing from a new base. Because left and right each only move forward, the whole string is traversed once.\n\nThe subtler click — the one that turns a clunky \"shrink one step at a time\" into a single clean jump — is to remember WHERE each character was last seen. When s[right] repeats, its previous position tells you exactly how far left must travel: to one past that previous occurrence, but never backward. A map from character to its last index makes the eviction a constant-time leap instead of a loop, and the whole thing becomes a one-pass O(n) walk with two pointers and a dictionary.",
    examples: [
      { in: "s = \"abcabcbb\"", out: "3" },
      { in: "s = \"bbbbb\"", out: "1" },
      { in: "s = \"pwwkew\"", out: "3" }
    ],
    constraints: [
      "s contains any characters (uppercase, lowercase, digits, symbols); case matters (\"A\" !== \"a\").",
      "The substring must be contiguous — you can skip characters only by moving the left edge forward, never by deleting from the middle.",
      "Aim for O(n) time and O(min(n, alphabet)) space — a single pass, with the map bounded by the number of distinct characters."
    ],
    whyItMatters: "The sliding window is the single most reusable pattern for \"longest/shortest contiguous subarray that satisfies a condition,\" and this puzzle is its friendliest face. The deep idea is the monotonic frontier: both edges of the window only move in one direction, so no character is ever examined more than twice, and a problem that felt like it needed all-pairs enumeration collapses to a linear scan. That same frame — expand on the right, contract on the left when the invariant breaks, track the best you ever saw — cracks \"minimum window substring,\" \"longest substring with at most K distinct characters,\" \"maximum sum subarray with no duplicates,\" and a dozen interval problems that look different but share the exact same two-pointer skeleton. The second lesson, the easy-to-miss one, is about lazy bookkeeping: the `lastSeen.get(ch) >= left` guard. A map remembers every character you've ever passed, but most of those memories are stale — they sit at positions the window has already left behind. Checking that a remembered index is still inside the current window (>= left) is what stops you from obeying a ghost and yanking left backward into a shorter, wrong answer. That instinct — \"is this cached fact still relevant to my current state?\" — is the same one that keeps LRU caches, generation numbers, and stale-flag detection from lying to you.",
    hint: "Keep a map from each character to the index where you last saw it, plus a left pointer starting at 0. For each right, if you've seen s[right] before AND that previous index is at or past left, jump left to previousIndex + 1 — that one leap evicts the duplicate. Then record the new index and update your best with right - left + 1. The `>= left` check is the whole subtlety: a character seen before the current window began is not actually a duplicate, and obeying it would shrink the window for no reason.",
    solution: {
      lang: "javascript",
      code: "function lengthOfLongestSubstring(s) {\n  let left = 0, best = 0;\n  const lastSeen = new Map();\n  for (let right = 0; right < s.length; right++) {\n    const ch = s[right];\n    if (lastSeen.has(ch) && lastSeen.get(ch) >= left) {\n      left = lastSeen.get(ch) + 1;   // jump past the previous occurrence\n    }\n    lastSeen.set(ch, right);\n    best = Math.max(best, right - left + 1);\n  }\n  return best;\n}",
      notes: "One pass, two pointers, one map. The right pointer advances every iteration and never retreats; the left pointer only ever jumps forward. Each character is written to the map exactly once per position, so the total work is O(n). The map's space is bounded by the number of distinct characters in s.\n\nTrace example 1: s = \"abcabcbb\".\n• right=0 'a': not seen. map{a:0}. best = max(0, 0-0+1) = 1.\n• right=1 'b': not seen. map{a:0,b:1}. best = 2.\n• right=2 'c': not seen. map{a:0,b:1,c:2}. best = 3. (window \"abc\")\n• right=3 'a': seen at 0, 0 >= left(0) → left = 1. set a:3. window \"bca\", len 3. best stays 3.\n• right=4 'b': seen at 1, 1 >= left(1) → left = 2. set b:4. window \"cab\", len 3.\n• right=5 'c': seen at 2, 2 >= left(2) → left = 3. set c:5. window \"abc\", len 3.\n• right=6 'b': seen at 4, 4 >= left(3) → left = 5. set b:6. window \"b\", len 2.\n• right=7 'b': seen at 6, 6 >= left(5) → left = 7. set b:7. window \"b\", len 1.\n• return 3. ✓ The longest unique substrings are \"abc\", \"bca\", \"cab\" — all length 3.\n\nTrace example 2: s = \"bbbbb\".\n• right=0 'b': map{b:0}, best=1.\n• right=1 'b': seen at 0, 0 >= left(0) → left=1. set b:1. window \"b\", len 1.\n• Every later step is identical — left and the previous index chase each other forward one step at a time. best stays 1. ✓\n\nTrace example 3: s = \"pwwkew\".\n• right=0 'p': map{p:0}, best=1.\n• right=1 'w': map{p:0,w:1}, best=2. (window \"pw\")\n• right=2 'w': seen at 1, 1 >= left(0) → left=2. set w:2. window \"w\", len 1. best=2.\n• right=3 'k': map{...,k:3}, window \"wk\", best=2.\n• right=4 'e': map{...,e:4}, window \"wke\", best=3.\n• right=5 'w': seen at 2, 2 >= left(2) → left=3. set w:5. window \"kew\", len 3. best=3.\n• return 3. ✓ (\"wke\" or \"kew\" — both length 3.)\n\nThe guard that makes the jump safe: the condition `lastSeen.get(ch) >= left`. The map remembers EVERY index a character has ever appeared at, but once left moves forward, older entries are stale — they describe positions the window has already abandoned. Without the `>= left` check you'd obey a ghost and potentially drag left backward, producing a window that silently includes a real duplicate.\n\nProof by counterexample — s = \"abba\":\n• right=0 'a': map{a:0}, best=1.\n• right=1 'b': map{a:0,b:1}, best=2. (window \"ab\")\n• right=2 'b': seen at 1, 1 >= left(0) → left=2. set b:2. window \"b\", best=2.\n• right=3 'a': seen at 0, but 0 >= left(2)? NO — 0 < 2, so the previous 'a' is OUTSIDE the current window. Do NOT jump. set a:3. window \"ba\", len 2. best=2.\n• return 2. ✓ Correct — the longest unique substring is \"ab\" or \"ba\", both length 2.\n  Drop the `>= left` guard and at right=3 you'd set left = 0+1 = 1, shrinking backward to window \"bba\" (indices 1..3) — which contains TWO b's. A silent bug that only surfaces on inputs where a character reappears after the window has already moved past its earlier occurrence.\n\nWhy the window is monotonic: left only increases, so no character is ever re-examined from the left side; right only increases, so the right pointer scans the string exactly once. Total pointer movement is at most 2n, hence O(n) time. The map is bounded by the distinct-character count, which is at most min(n, alphabet size) — O(1) for a fixed alphabet like ASCII, O(n) in the general case.\n\nVariants this skeleton directly extends to: \"longest substring with at most K distinct characters\" (swap the duplicate check for a distinct-count check, evicting from the left via the same pointer when the count exceeds K); \"minimum window substring\" (same two pointers, but the invariant is \"contains all target characters,\" and you shrink from the left to MINIMIZE rather than maximize). The shared spine — right advances, left retreats only to repair a broken invariant, best is tracked across the ride — is the whole pattern."
    }
  },
  {
    id: "the-disguise-kit",
    date: "2026-08-27",
    title: "The Disguise Kit",
    blurb: "Two strings can transform into each other if every letter swaps one-for-one — but the swap has to work both ways, or the disguise has a seam.",
    difficulty: "Easy",
    minutes: 8,
    tags: ["hashing", "strings"],
    prompt: "Two strings s and t are called isomorphic if the letters of s can be replaced (consistently, position by position) to get t. Each letter of s maps to exactly one letter of t, and no two letters of s may map to the same letter of t — the pairing is a one-to-one relabeling. Equal-length lowercase strings only.\n\nSo \"egg\" and \"add\" are isomorphic: e→a, g→d, and the second g also→d. But \"foo\" and \"bar\" are not: o would have to map to both a and r. The subtler failure is \"badc\" vs \"baba\": the forward map looks fine (b→b, a→a, d→b, c→a), but two different letters of s (b and d) are both trying to wear the same disguise 'b' in t — that's a collision the forward map alone never notices.\n\nThe reflex is a single dictionary: \"for each s-letter, what t-letter did I assign it?\" and bail on conflict. That catches \"foo\"/\"bar\" but sails right past \"badc\"/\"baba\". The click is that a substitution is a bijection, not just a function — so you need the map running both ways: s[i]→t[i] must be consistent, AND t[i]→s[i] must be consistent. Two tiny maps, one pass, and the seam shows up on its own.",
    examples: [
      { in: "s = \"egg\", t = \"add\"", out: "true" },
      { in: "s = \"foo\", t = \"bar\"", out: "false" },
      { in: "s = \"badc\", t = \"baba\"", out: "false" }
    ],
    constraints: [
      "s and t have equal length, between 1 and 5·10^4 characters; all lowercase English letters.",
      "A valid isomorphism is a bijection: each s-letter maps to one t-letter, and each t-letter is mapped from one s-letter. One-to-one, both directions.",
      "Aim for O(n) time and O(1) extra space — the two maps are bounded by the 26-letter alphabet, so they're constant-size."
    ],
    whyItMatters: "This puzzle is the gentlest possible way to learn a habit that saves you in every state-machine, parser, and data-pipeline bug you'll ever debug: a relationship that looks one-directional often isn't. \"s maps to t\" feels like a function, so you build one dictionary and stop — and the bug is the second dictionary you never wrote. The bijection requirement (no two inputs may share an output) is invisible to a forward-only check, and that asymmetry is exactly where the wrong answers hide. The transferable lesson is to ask, of any mapping you build: \"is this supposed to be one-to-one?\" If yes, enforce it in both directions — a forward map and a reverse map, or a single map plus a set of already-used targets. The same instinct guards \"is this a valid variable renaming?\", \"are these two schemas a real bijection?\", and \"does this decode/encode round-trip?\" Whenever you're translating one alphabet into another, write both dictionaries; the seam is where the mistakes live.",
    hint: "Keep two maps: st (s-letter → t-letter) and ts (t-letter → s-letter). At each index i, if st[s[i]] already exists and isn't t[i], the forward disguise changed — bail. If ts[t[i]] already exists and isn't s[i], two different s-letters are fighting over the same t-letter — bail. Otherwise record both. One pass, two lookups per step. The backward check is the whole point; without it, \"badc\"/\"baba\" slips through.",
    solution: {
      lang: "javascript",
      code: "function isIsomorphic(s, t) {\n  if (s.length !== t.length) return false;\n  const st = {}, ts = {};\n  for (let i = 0; i < s.length; i++) {\n    const cs = s[i], ct = t[i];\n    if (st[cs] !== undefined && st[cs] !== ct) return false; // forward seam\n    if (ts[ct] !== undefined && ts[ct] !== cs) return false; // backward seam\n    st[cs] = ct;\n    ts[ct] = cs;\n  }\n  return true;\n}",
      notes: "Two maps, one pass, one comparison per direction per index. The forward map st catches a letter of s trying to wear two disguises (\"foo\"/\"bar\": o wants to be both a and r). The backward map ts catches two letters of s fighting over one disguise (\"badc\"/\"baba\": b and d both want to be b). Drop either check and a real counterexample sails through — that's the puzzle's whole point.\n\nTrace example 1: s=\"egg\", t=\"add\".\n• i=0: cs=e, ct=a. st[e], ts[a] both undefined → record st[e]=a, ts[a]=e.\n• i=1: cs=g, ct=d. both undefined → record st[g]=d, ts[d]=g.\n• i=2: cs=g, ct=d. st[g]=d===d ✓, ts[d]=g===g ✓. No change.\n• return true. ✓ The two g's share one disguise (d), and no other s-letter grabs d — a clean bijection.\n\nTrace example 2: s=\"foo\", t=\"bar\".\n• i=0: f→b. record st[f]=b, ts[b]=f.\n• i=1: o→a. record st[o]=a, ts[a]=o.\n• i=2: cs=o, ct=r. st[o]=a, but ct=r → a !== r, forward seam → return false. ✓ The letter o tried to map to both a and r.\n\nTrace example 3: s=\"badc\", t=\"baba\".\n• i=0: b→b. record st[b]=b, ts[b]=b.\n• i=1: a→a. record st[a]=a, ts[a]=a.\n• i=2: cs=d, ct=b. st[d] undefined (forward fine). ts[b]=b, but cs=d → b !== d, backward seam → return false. ✓ Two s-letters (b and d) both claim t-letter b. The forward map alone would have said \"fine\" here — the backward map is what catches it.\n\nWhy both maps are unavoidable: a function can be many-to-one without complaining, but a bijection cannot. st enforces \"each input has one output\" (function); ts enforces \"each output has one input\" (injective). Isomorphism needs both, so the check needs both. The maps are bounded by the alphabet size (26 lowercase letters), so they're O(1) space in the strict sense; time is O(n) — a single left-to-right pass that exits early the moment a seam appears.\n\nVariant to chew on later: \"word pattern\" swaps the letters of t for whole words — \"abba\" vs \"dog cat cat dog\" — and the identical two-map structure solves it, because the bijection idea doesn't care whether the tokens are characters or strings."
    }
  },
  {
    id: "peak-without-a-climb",
    date: "2026-08-26",
    title: "Peak Without a Climb",
    blurb: "An unsorted array hides a peak somewhere. You don't need to find the biggest one — any one will do, and that's what makes a binary search possible.",
    difficulty: "Medium",
    minutes: 10,
    tags: ["binary-search", "arrays"],
    prompt: "You're given an array of numbers where no two neighbors are equal — every adjacent pair is strictly greater or strictly less. A \"peak\" is an index i whose value is greater than both of its neighbors (where a neighbor exists). The first and last elements only need to beat their single neighbor, so the ends can be peaks too. Return the index of ANY peak.\n\nAt first glance this looks hopeless for anything faster than a linear scan: the array isn't sorted, so what could binary search even mean here? The reflex is to walk the whole thing and report the first index that's bigger than both neighbors — O(n), fine for small inputs, but it ignores the one piece of information you actually have: every step is a slope, either up or down.\n\nThe click is that you don't need the highest peak, just a peak, and a peak is a local property. Look at the middle. If the middle is climbing (nums[mid] < nums[mid+1]), then the array is going up to the right — and going up must eventually come down (the last element is a peak if nothing else is), so a peak exists somewhere to the right. Throw away the left half. If instead the middle is falling (nums[mid] > nums[mid+1]), a peak exists to the left, including possibly mid itself. Throw away the right half. Each step halves the search space, never missing a peak, because you always walk uphill — and uphill always ends at a summit.",
    examples: [
      { in: "nums = [1, 2, 3, 1]", out: "2" },
      { in: "nums = [1, 2, 1, 3, 5, 6, 4]", out: "5" },
      { in: "nums = [1]", out: "0" }
    ],
    constraints: [
      "nums[i] !== nums[i+1] for every adjacent pair — no plateaus, so every comparison is strictly up or down.",
      "The array has at least one element; a single element is trivially a peak.",
      "Any valid peak index is an acceptable answer; the puzzle asks for existence, not a specific one.",
      "Aim for O(log n) time — you do not need to look at every element."
    ],
    whyItMatters: "This puzzle is the cleanest demonstration of a habit that pays off forever: when the question is \"does one exist?\" rather than \"find the best one,\" the search can be dramatically shorter. The array looks unsorted, but it's locally directional — every step is a slope — and a slope always leads to a local maximum before the boundary forces it down. That's enough structure for binary search, because \"go toward the higher neighbor\" can never walk you past a peak without landing on one. The transferable lesson is about exploiting local guarantees: you don't need the data globally ordered, you need a property that tells you which half still contains an answer. The same instinct powers finding a bitonic sequence's tip, searching a rotated sorted array, and ternary search on a unimodal function — all cases where \"which way is up?\" alone shrinks the problem. When a problem feels like it needs a full scan, ask: do I actually need every element, or just a direction that's guaranteed to lead somewhere good?",
    hint: "Compare nums[mid] with nums[mid+1]. If nums[mid] < nums[mid+1], you're on an upward slope, so a peak lies to the RIGHT — set lo = mid + 1. Otherwise you're on a downward slope, so a peak lies at mid or to its LEFT — set hi = mid. Loop while lo < hi; when they meet, lo is a peak index. You never compare to a sorted whole, only to the single neighbor that tells you which way is uphill.",
    solution: {
      lang: "javascript",
      code: "function findPeakElement(nums) {\n  let lo = 0, hi = nums.length - 1;\n  while (lo < hi) {\n    const mid = (lo + hi) >> 1;\n    if (nums[mid] < nums[mid + 1]) {\n      lo = mid + 1;      // uphill — peak is to the right\n    } else {\n      hi = mid;          // downhill — peak is at mid or to the left\n    }\n  }\n  return lo;\n}",
      notes: "One comparison per iteration, and the interval halves each time — classic binary search, but on an array that isn't sorted. The key that makes it legal: adjacent values are never equal, so nums[mid] vs nums[mid+1] is always a strict decision, and whichever way is uphill is guaranteed to reach a peak before the boundary stops it. Going uphill can't trap you in a valley, because the only thing that ends an uphill run is a peak (a drop) or the array's edge (which is itself a peak).\n\nTrace example 1: [1,2,3,1], length 4.\n• lo=0, hi=3. mid=1. nums[1]=2 < nums[2]=3 → uphill. lo=2.\n• lo=2, hi=3. mid=2. nums[2]=3 > nums[3]=1 → downhill. hi=2.\n• lo=2, hi=2 → return 2. Value 3: greater than left (2) and right (1). ✓ A genuine peak.\n\nTrace example 2: [1,2,1,3,5,6,4], length 7.\n• lo=0, hi=6. mid=3. nums[3]=3 < nums[4]=5 → uphill. lo=4.\n• lo=4, hi=6. mid=5. nums[5]=6 > nums[6]=4 → downhill. hi=5.\n• lo=4, hi=5. mid=4. nums[4]=5 < nums[5]=6 → uphill. lo=5.\n• lo=5, hi=5 → return 5. Value 6: greater than left (5) and right (4). ✓ Another valid peak here was index 1 (value 2 > 1 on both sides), but the search found index 5 first — and the puzzle only needs any peak, so both are correct answers.\n\nTrace example 3: [1], length 1.\n• lo=0, hi=0. The while condition (lo < hi) is false immediately → return 0. A lone element has no neighbors to beat, so by definition it's a peak. ✓\n\nWhy the invariant holds: when nums[mid] < nums[mid+1], the slope points right, and the right region [mid+1, hi] must contain a peak — either a later interior peak, or the last element itself (which only needs to beat its left neighbor, and the uphill run guarantees that). When nums[mid] > nums[mid+1], the region [lo, mid] must contain a peak — mid could be one (it's higher than its right neighbor), and if not, the leftward region was reached via an uphill slope that ends in a peak. So the surviving half always contains at least one peak, and the interval shrinks strictly (mid+1 > lo when going right; mid < hi when going left, since mid floors below hi). The loop converges to a single index that, by construction, is a peak.\n\nTime O(log n) — each iteration halves the range. Space O(1) — three integers, no recursion, no extra array. The whole trick is trusting that \"head uphill\" is a complete strategy when you only need any summit, not the highest one."
    }
  },
  {
    id: "are-we-going-in-circles",
    date: "2026-08-25",
    title: "Are We Going in Circles?",
    blurb: "A linked list might loop back on itself forever. Two runners — one fast, one slow — will tell you in one pass, no extra memory.",
    difficulty: "Easy",
    minutes: 8,
    tags: ["linked-list", "two-pointers"],
    prompt: "You're given the head of a singly linked list. Each node points to its next node, and the last node's next pointer is normally null — but maybe not. A \"cycle\" happens when some node's next pointer points back to an earlier node in the list instead, so a portion of the list loops forever. Given the head, return whether the list contains a cycle.\n\nThe reflex is a paper trail: walk the list and remember every node you've visited in a Set. If you reach null, no cycle; if you reach a node you've already seen, cycle found. That's correct, and it's O(n) time — but it's also O(n) space, because the Set holds a copy of every node you visited.\n\nThe click is to stop asking \"have I been here before?\" and start asking \"can anything moving faster than me catch up from behind?\" Send two runners around the list: a tortoise moving one node per step, and a hare moving two. On a straight list, the hare simply reaches the end. But on a list with a cycle, both runners are trapped inside the loop — and the hare, gaining one node per step on the tortoise, must eventually lap it. Their meeting is the proof that a cycle exists.",
    examples: [
      { in: "head = [3, 2, 0, -4], pos = 1", out: "true" },
      { in: "head = [1, 2], pos = 0", out: "true" },
      { in: "head = [1], pos = -1", out: "false" }
    ],
    constraints: [
      "pos is the index (0-based) of the node the tail connects back to; -1 means no cycle. It's given only so you can picture the list — your code receives just the head node.",
      "The list has between 0 and 10^4 nodes; node values can be anything.",
      "Aim for O(n) time and O(1) extra space — no Set, no visited markers."
    ],
    whyItMatters: "This puzzle is the friendliest introduction to Floyd's cycle-detection algorithm, and the idea underneath it reaches far beyond linked lists. \"Send a probe at two different speeds and see if they collide\" is the same principle that finds a cycle in a function's iteration graph (Pollard's rho factoring), detects infinite loops in sequence generation, and underlies the algorithm that finds a duplicate number in an array without sorting or extra space. The deeper lesson is a modeling move: when you need to detect a repeat in a sequence you can't store, don't store the sequence — arrange for two traversals of it at different speeds and let the repeat reveal itself through their relative motion. A finite cycle and two different step sizes guarantee a meeting; that's a proof hiding inside an algorithm.",
    hint: "Initialize slow and fast to head. Each iteration: slow moves one step (slow = slow.next), fast moves two (fast = fast.next.next). If fast or fast.next ever becomes null, the list ends — no cycle. If slow === fast after a step, the hare has lapped the tortoise — cycle confirmed. Why must they meet? Inside the cycle, the gap between them shrinks by one each step, so it can't help but hit zero.",
    solution: {
      lang: "javascript",
      code: "function hasCycle(head) {\n  let slow = head, fast = head;\n  while (fast && fast.next) {\n    slow = slow.next;\n    fast = fast.next.next;\n    if (slow === fast) return true;\n  }\n  return false;\n}",
      notes: "The while condition is the straight-list exit: if fast is null (hare ran off the end) or fast.next is null (hare has one node left, so its two-step jump falls off), there's no cycle. Inside the loop, slow advances one and fast advances two; the identity check slow === fast (same object, not same value) catches the lap.\n\nTrace example 1: [3,2,0,-4], pos = 1. The list is 3→2→0→-4→(back to 2)→0→-4→2→... Both runners start at node 3.\n• Iteration 1: slow = 2, fast = 0. (slow: 3→2; fast: 3→2→0)\n• Iteration 2: slow = 0, fast = 2. (slow: 2→0; fast: 0→-4→2, cycling back)\n• Iteration 3: slow = -4, fast = -4. (slow: 0→-4; fast: 2→0→-4) slow === fast → true. ✓\n\nTrace example 2: [1,2], pos = 0. The list is 1→2→(back to 1)→2→...\n• Iteration 1: slow = 2, fast = 1. (slow: 1→2; fast: 1→2→1, cycling back)\n• Iteration 2: slow = 1, fast = 1. (slow: 2→1; fast: 1→2→1) slow === fast → true. ✓\n\nTrace example 3: [1], pos = -1. The list is 1→null. fast = head = 1 (truthy), fast.next = null (falsy), so the while condition fails immediately → return false. ✓ A single node with no cycle is the shortest no-cycle list.\n\nWhy they must meet inside a cycle: once both runners are inside the loop, call the gap between them g (the number of steps fast is ahead of slow, measured cyclically). Each step, slow advances 1 and fast advances 2, so the gap shrinks by 1. Since the cycle is finite, g must hit 0 — and a gap of 0 means they're on the same node. The hare gains one node per step and can never jump over the tortoise without landing on it, because it's closing in one node at a time on a finite ring.\n\nTime O(n) — in the worst case the hare travels at most 2n nodes before the meeting. Space O(1) — two pointers, no Set."
    }
  },
  {
    id: "multiply-everything-except-me",
    date: "2026-08-24",
    title: "Multiply Everything Except Me",
    blurb: "For every spot in the array, multiply all the others — but you're not allowed to divide. Two passes do the impossible.",
    difficulty: "Medium",
    minutes: 12,
    tags: ["prefix-sum", "arrays"],
    prompt: "You're given an array of numbers. Return a new array of the same length where each position i holds the product of every element except nums[i]. So for [1, 2, 3, 4] you'd return [24, 12, 8, 6] — at index 0 you multiply 2 × 3 × 4 = 24, at index 1 you multiply 1 × 3 × 4 = 12, and so on.\n\nHere's the catch: you may not use division. The obvious solution — compute the total product, then divide by each element — is off the table. (And it should be: it breaks the moment a zero shows up, since you'd be dividing by zero.)\n\nThe reflex is, for each index, loop over the whole array multiplying everything except that one. That's correct but O(n²) — n separate passes, each touching n-1 elements. The click is realizing that every answer is just two pieces glued together: the product of everything to the LEFT of i, times the product of everything to the RIGHT of i. And those left and right products overlap massively from one index to the next — so you can compute them incrementally, not from scratch.",
    examples: [
      { in: "nums = [1, 2, 3, 4]", out: "[24, 12, 8, 6]" },
      { in: "nums = [-1, 1, 0, -3, 3]", out: "[0, 0, 9, 0, 0]" },
      { in: "nums = [2, 3]", out: "[3, 2]" }
    ],
    constraints: [
      "You may NOT use division anywhere in your solution.",
      "The array has at least two elements; values are integers (positive, negative, or zero).",
      "Aim for O(n) time and O(1) extra space (not counting the output array)."
    ],
    whyItMatters: "This puzzle teaches the single most reusable idea in array problem-solving: when a computation at each index shares structure with its neighbors, don't recompute — accumulate. The left-product at index i is just the left-product at index i-1 times nums[i-1], so a single forward pass builds every left-product. The same trick run backward builds every right-product. The deeper lesson is recognizing prefix and suffix products as building blocks — the same instinct that turns 'range sum query' into a prefix-sum array, that makes rolling hashes work, and that underlies every cumulative-aggregation pattern from running statistics to dynamic programming tables. When you catch yourself doing 'for each element, scan the whole array,' ask: what does this element's answer share with the one before it? If the answer is 'almost everything,' there's a running product waiting to be extracted.",
    hint: "Split the problem in two. The answer at index i is (product of everything left of i) × (product of everything right of i). First, walk forward and fill the result so that result[i] = product of nums[0..i-1]. Then walk backward with a running 'right product' variable, multiplying it into each result[i] — the right product at index i is the product of nums[i+1..n-1]. Two passes, one output array, zero division.",
    solution: {
      lang: "javascript",
      code: "function productExceptSelf(nums) {\n  const n = nums.length;\n  const result = new Array(n);\n\n  // Forward pass: result[i] = product of everything to the LEFT of i.\n  result[0] = 1;\n  for (let i = 1; i < n; i++) {\n    result[i] = result[i - 1] * nums[i - 1];\n  }\n\n  // Backward pass: fold in the product of everything to the RIGHT.\n  let right = 1;\n  for (let i = n - 1; i >= 0; i--) {\n    result[i] *= right;\n    right *= nums[i];\n  }\n  return result;\n}",
      notes: "The forward pass stores the running left-product: result[0] = 1 (nothing to the left), result[1] = nums[0], result[2] = nums[0] × nums[1], and so on. The backward pass walks from the right end, carrying a 'right' variable that is the product of everything seen so far to the right of the current index. At each index, multiplying the stored left-product by the running right-product gives the final answer — then 'right' is extended by nums[i] before moving left.\n\nTrace example 1: [1, 2, 3, 4]. Forward pass: result = [1, 1, 2, 6] (result[1] = 1×1 = 1, result[2] = 1×2 = 2, result[3] = 2×3 = 6). Backward pass: i=3: result[3] = 6×1 = 6, right = 1×4 = 4. i=2: result[2] = 2×4 = 8, right = 4×3 = 12. i=1: result[1] = 1×12 = 12, right = 12×2 = 24. i=0: result[0] = 1×24 = 24. Final: [24, 12, 8, 6]. ✓ Verify index 0: 2×3×4 = 24. ✓ Index 2: 1×2×4 = 8. ✓\n\nTrace example 2: [-1, 1, 0, -3, 3]. Forward pass: result = [1, -1, -1, 0, 0] (the zero at index 2 poisons everything downstream). Backward pass: i=4: result[4] = 0×1 = 0, right = 1×3 = 3. i=3: result[3] = 0×3 = 0, right = 3×(-3) = -9. i=2: result[2] = (-1)×(-9) = 9, right = (-9)×0 = 0. i=1: result[1] = (-1)×0 = 0, right = 0×1 = 0. i=0: result[0] = 1×0 = 0. Final: [0, 0, 9, 0, 0]. ✓ Only index 2 — the zero itself — has a nonzero product, because neither its left-product (-1×1 = -1) nor its right-product (-3×3 = -9) involves zero. Every other index multiplies by the zero and collapses to 0. This is exactly why the division approach fails: you'd try to divide the total product (which is 0) by zero. ✓\n\nTrace example 3: [2, 3]. Forward: result = [1, 2]. Backward: i=1: result[1] = 2×1 = 2, right = 1×3 = 3. i=0: result[0] = 1×3 = 3. Final: [3, 2]. ✓\n\nTime O(n) — two linear passes. Space O(1) extra — the output array is the only allocation, and it's the thing you were asked to return, not auxiliary storage. The key insight is that prefix and suffix products are cumulative: each is a one-step extension of the previous, so you never recompute from scratch. The same 'accumulate, don't recompute' instinct is what makes prefix sums, rolling hashes, and a host of DP optimizations work."
    }
  },
  {
    id: "there-is-no-column-zero",
    date: "2026-08-23",
    title: "There Is No Column Zero",
    blurb: "Excel numbers its columns A, B, ... Z, AA, AB ... — but the conversion hides a trap. There's no zero digit.",
    difficulty: "Easy",
    minutes: 8,
    tags: ["math", "strings"],
    prompt: "Spreadsheets label columns with letters instead of numbers: column 1 is A, 2 is B, ..., 26 is Z, 27 is AA, 28 is AB, and so on. Given a positive integer n, return its column title — the letter label a spreadsheet would show.\n\nYour first instinct is probably \"this is just base-26.\" Write A as 0, B as 1, ... Z as 25, and convert like you would any base. And it almost works — until you try n = 26. In standard base-26 that's \"10\", which would map to \"A@\"... but there is no @. The alphabet has twenty-six letters and no zero, so the place-value system you learned in school doesn't apply directly. Something is off by one, and it infects every digit.\n\nThe click is figuring out what to do about that missing zero. In ordinary base-10, the digit 0 means \"nothing in this place.\" Here, every position always has a letter from A to Z — there is no \"nothing.\" So the mapping isn't digit = remainder; it's digit = remainder + 1, which means you have to subtract 1 before taking each remainder. That single subtraction fixes the off-by-one at every level, and the rest is a textbook base conversion loop.",
    examples: [
      { in: "n = 1", out: "\"A\"" },
      { in: "n = 28", out: "\"AB\"" },
      { in: "n = 701", out: "\"ZY\"" }
    ],
    constraints: [
      "n is a positive integer (1 or greater).",
      "The output uses only uppercase letters A–Z; there is no zero digit.",
      "Aim for O(log n) time — the number of digits in the title."
    ],
    whyItMatters: "This puzzle is about a category error: a number system that looks like base-26 but isn't, because it's missing a digit. Standard positional notation needs a zero — without it, every place value is shifted by one, and a naive conversion silently produces wrong answers. The fix (subtract 1 before each modulo) is small, but the lesson is large: not every \"counting with symbols\" system follows the base-n template, and the moment a representation has no zero you're in bijective numeration territory. Bijective base-26 shows up in spreadsheet columns, in Excel cell references, in license plate schemes, and in the way some databases encode IDs as short strings. Recognizing \"this looks like base conversion but the zero is missing\" saves you from debugging mysterious off-by-one errors that only appear at Z, ZZ, and ZZZ — the exact boundaries where the shift compounds.",
    hint: "In normal base-10, you take n % 10 to get the last digit. Here, A is 1 (not 0), so the last \"digit\" is (n-1) % 26, mapped to a letter. After extracting it, divide by 26 — but you already subtracted 1, so use floor((n-1) / 26) to move to the next place. Loop until n reaches 0, prepending each letter.",
    solution: {
      lang: "javascript",
      code: "function convertToTitle(n) {\n  let result = '';\n  while (n > 0) {\n    n--;                            // shift from 1-indexed to 0-indexed\n    result = String.fromCharCode(65 + (n % 26)) + result;\n    n = Math.floor(n / 26);\n  }\n  return result;\n}",
      notes: "The algorithm is a standard base-conversion loop with one crucial tweak: decrement n before each modulo. In ordinary base-26, the digits run 0–25 and the digit 0 maps to the first symbol. But here the first symbol is A = 1, not A = 0 — there is no zeroth letter. Subtracting 1 before taking the remainder converts from the spreadsheet's 1-indexed alphabet to the 0-indexed offset that modulo produces: remainder 0 → A, 1 → B, ..., 25 → Z. After extracting the digit, floor(n / 26) moves to the next place — but since n was already decremented, this is effectively floor((n-1) / 26), which is correct for a system with no zero.\n\nTrace example 1: n = 1. n-- → 0, 0 % 26 = 0, char = fromCharCode(65) = 'A', n = floor(0/26) = 0. Result: \"A\".\n\nTrace example 2: n = 28. n-- → 27, 27 % 26 = 1, char = fromCharCode(66) = 'B', n = floor(27/26) = 1. Next: n-- → 0, 0 % 26 = 0, char = 'A', n = 0. Result: \"AB\". Verify: A×26 + B = 1×26 + 2 = 28. ✓\n\nTrace example 3: n = 701. n-- → 700, 700 % 26 = 24 (since 26×26 = 676, remainder 24), char = fromCharCode(89) = 'Y', n = floor(700/26) = 26. Next: n-- → 25, 25 % 26 = 25, char = fromCharCode(90) = 'Z', n = floor(25/26) = 0. Result: \"ZY\". Verify: Z×26 + Y = 26×26 + 25 = 676 + 25 = 701. ✓\n\nThe trap that catches everyone on the first try: without the n--, n = 26 would produce remainder 0, which maps to... what? There's no letter for zero. You'd either crash or silently emit a garbage character. The decrement shifts 26 into the range 0–25 where it maps cleanly to Z, and the same fix propagates correctly to every higher place. Time O(log₂₆ n) — one iteration per digit of the title; space O(log n) for the output string."
    }
  },
  {
    id: "can-you-reach-the-exit",
    date: "2026-08-22",
    title: "Can You Reach the Exit?",
    blurb: "An array of jump powers and one question: can you get from the front door to the exit?",
    difficulty: "Medium",
    minutes: 10,
    tags: ["greedy", "arrays"],
    prompt: "You're standing at the front of an array. Each cell tells you the maximum number of steps you can jump forward from that position — so if nums[i] is 3, you can jump to i+1, i+2, or i+3 (or stay put and jump 0). Starting at index 0, can you reach the last index?\n\nThe reflex is to explore: from index 0, try every jump length, then from each landing spot try every jump length again, branching like a tree. That's correct — and it's exponential, because the same positions get revisited from different paths. You could memoize, but why build a search at all when the question isn't 'what's the path?' but merely 'is the exit within reach?'\n\nThe click is a single variable. Walk left to right and keep track of the furthest index you can currently reach. At each position, if it's within reach, extend your reach using its jump power. The moment your reach meets or passes the last index, you're done. The moment you arrive at a position beyond your reach, you're stuck — there's a gap you can't cross, and no amount of clever pathfinding changes that.",
    examples: [
      { in: "nums = [2, 3, 1, 1, 4]", out: "true" },
      { in: "nums = [3, 2, 1, 0, 4]", out: "false" },
      { in: "nums = [0]", out: "true" }
    ],
    constraints: [
      "nums[i] is a non-negative integer (zero means you can't jump from that spot).",
      "The array has at least one element; a single-element array is trivially reachable.",
      "Aim for O(n) time and O(1) space — no recursion, no memoization, no backtracking."
    ],
    whyItMatters: "This puzzle teaches the single most useful greedy instinct: when the question is 'can I get there?' rather than 'what's the best way?', you often don't need to plan a route at all — you just need to track a frontier. The furthest-reachable index is that frontier. It only moves forward, it only grows, and it collapses the entire branching search into one pass. That same instinct — replace 'explore all paths' with 'maintain the set of reachable states' — is what turns BFS into DP, what makes interval scheduling a sort-then-sweep, and what powers every reachability check from regex matching to garbage collection. The deeper lesson: when a problem feels like search, ask whether the answer depends on which path you take or merely on whether a path exists. If only existence matters, a frontier variable is almost always enough.",
    hint: "You don't need to know HOW you get to the exit — only WHETHER you can. Keep one variable: the furthest index reachable so far. Walk the array; at each index i, if i is within reach, update reach to max(reach, i + nums[i]). If reach ever reaches the last index, return true. If i ever passes reach, return false — there's a gap you can't cross.",
    solution: {
      lang: "javascript",
      code: "function canJump(nums) {\n  let reach = 0;\n  const last = nums.length - 1;\n  for (let i = 0; i < nums.length; i++) {\n    if (i > reach) return false;       // gap — can't get here\n    reach = Math.max(reach, i + nums[i]);\n    if (reach >= last) return true;    // exit is in range\n  }\n  return reach >= last;\n}",
      notes: "One pass, one variable, no allocation. The loop walks each index in order; reach is the furthest position any visited cell can launch you to. Two early exits make it clean: if i > reach, you've hit a position nobody can jump to, so the exit is unreachable; if reach >= last, the exit is already within range, so you're done.\n\nTrace example 1: [2,3,1,1,4], last = 4. i=0: 0 ≤ reach(0), reach = max(0, 0+2) = 2. i=1: 1 ≤ 2, reach = max(2, 1+3) = 4. 4 ≥ 4 → true. (You don't even need to look at the rest — the exit is in range from index 1.)\n\nTrace example 2: [3,2,1,0,4], last = 4. i=0: reach = max(0, 0+3) = 3. i=1: reach = max(3, 1+2) = 3. i=2: reach = max(3, 2+1) = 3. i=3: reach = max(3, 3+0) = 3. i=4: 4 > 3 → false. The zero at index 3 creates a dead zone — every path lands on or before index 3, and from there nobody can jump past it. No amount of route-finding changes that, which is exactly why the greedy works: the frontier can't lie.\n\nTrace example 3: [0], last = 0. i=0: 0 ≤ 0, reach = max(0, 0+0) = 0. 0 ≥ 0 → true. You're already at the exit.\n\nTime O(n), space O(1). The key insight is monotonicity: reach only increases, so there's no backtracking, no revisiting, no state to store. The problem asks 'is there a path?' and the frontier variable answers it without ever constructing one."
    }
  },
  {
    id: "double-vision",
    date: "2026-08-20",
    title: "Double Vision",
    blurb: "Is one string just the other spun around? One concatenation settles it.",
    difficulty: "Easy",
    minutes: 6,
    tags: ["strings", "two-pointers"],
    prompt: "You're given two strings, s and goal. Return whether goal is a rotation of s — that is, whether you can obtain goal by taking some characters off the front of s and sticking them on the back (or equivalently, spinning s around its own center). \"abcde\" spun right by two becomes \"cdeab\"; spun by zero it stays \"abcde\".\n\nThe reflex is to try every rotation: spin by 0, by 1, by 2, ... up to n-1, and compare each to goal. That's correct, and for short strings it's fine — but each spin costs O(n) work and there are n of them, so O(n^2) overall. The click is one sentence long and it turns the whole thing into a single substring check. No loops over rotations, no slicing, no two-pointer walk. Just glue the string to itself and look.",
    examples: [
      { in: "s = \"abcde\", goal = \"cdeab\"", out: "true" },
      { in: "s = \"abcde\", goal = \"abced\"", out: "false" },
      { in: "s = \"aa\", goal = \"a\"", out: "false" }
    ],
    constraints: [
      "Both strings contain any characters; case matters (\"A\" !== \"a\").",
      "A string is always a rotation of itself (spin by zero).",
      "Aim for O(n) time."
    ],
    whyItMatters: "This is a lesson in structural reframing: instead of enumerating every transformation and testing each one, build a single structure that contains all of them at once and search it. Concatenating s to itself produces a string in which every rotation of s appears as a contiguous substring — starting at index k you read exactly s[k:] + s[:k]. So \"is goal a rotation?\" collapses to \"is goal a substring of s+s?\", and a substring search is O(n). That instinct — don't generate-and-test, embed-and-search — is the same one behind suffix arrays, rolling hashes, and the way databases index text. There's a second, smaller lesson in the length guard: without it, \"a\" would match inside \"a\"+\"a\" and give a false positive, because a fragment of a rotation is not a rotation. Equality of length is what promotes a mere substring into a genuine rotation.",
    hint: "Write s next to itself: s + s. Now every position you start reading n characters from gives you exactly one rotation of s. So goal is a rotation of s exactly when it appears as a substring of s+s — provided the two strings are the same length. Guard the length first, then do the one check.",
    solution: {
      lang: "javascript",
      code: "function rotateString(s, goal) {\n  return s.length === goal.length && (s + s).includes(goal);\n}",
      notes: "The length guard short-circuits the false cases where goal is a fragment rather than a full rotation; only when the lengths match does the substring check even run. Trace example 1: s=\"abcde\", goal=\"cdeab\". Lengths equal (5). s+s = \"abcdeabcde\". Reading 5 characters starting at index 2 gives \"cdeab\" — a match, so true. Trace example 2: s=\"abcde\", goal=\"abced\". Lengths equal. s+s = \"abcdeabcde\"; its length-5 substrings are \"abcde\", \"bcdea\", \"cdeab\", \"deabc\", \"eabcd\" (and then they repeat). \"abced\" never appears, so false — it isn't any rotation, only a transposition. Trace example 3: s=\"aa\", goal=\"a\". Lengths differ (2 vs 1), so the guard returns false without ever running the search. This is the case that punishes a naive \"does s+s contain goal?\" — without the guard, \"a\" would be found inside \"aaaa\" and you'd wrongly answer true.\n\nWhy the construction is complete: s+s contains exactly the n rotations of s as its length-n substrings (starting at indices 0 through n-1), so a length-equal substring of s+s is provably a rotation, and every rotation is provably found. The empty-string edge case falls out for free: both empty, lengths equal, \"\" is a substring of \"\", true. Time O(n) — the cost of a linear substring search; space O(n) to hold the doubled string."
    }
  },
  {
    id: "loners-party-of-two",
    date: "2026-08-19",
    title: "Loners, Party of Two",
    blurb: "Every number appears twice — except two of them. Find both, without using any extra memory.",
    difficulty: "Medium",
    minutes: 12,
    tags: ["bit-tricks", "arrays"],
    prompt: "You're handed a list where every value appears exactly twice, except for two distinct values that each appear once. Return both loners, in any order.\n\nIf you've met the one-loner version of this, your hand already knows the move: XOR the whole list and the pairs cancel themselves out. Try it here and you get something frustrating — not an answer, but a ^ b, the two loners fused into a single number you can't pull apart.\n\nThat fused number is not a dead end, though. It's a map. The click is realizing what a 1 bit in a ^ b actually tells you: it marks a position where a and b disagree. And a position where the two answers disagree is a rule you can sort the entire list by — one that is guaranteed to put a and b in different rooms, while keeping every duplicate pair together in the same room.",
    examples: [
      { in: "[1, 2, 1, 3, 2, 5]", out: "[3, 5]" },
      { in: "[4, 4, 7, 9]", out: "[7, 9]" },
      { in: "[0, 1]", out: "[0, 1]" }
    ],
    constraints: [
      "Every value appears exactly twice except two distinct values, which appear once each.",
      "Values fit in 32-bit signed integers; the list has at least two elements.",
      "Return order does not matter.",
      "A hash map is a fine warm-up, but aim for O(n) time and O(1) extra space."
    ],
    whyItMatters: "One equation, two unknowns is a wall you hit constantly, and the way through is almost never more algebra — it's finding a way to split the population so each half contains exactly one unknown. That's the whole trick here, and it's why this puzzle is worth more than the bit manipulation it's dressed in. XOR hands you a ^ b, which looks like a loss; it's actually a difference map, because every 1 bit in it is a coordinate where the two answers provably disagree. Pick any one of those coordinates and it becomes a partition rule with two properties you need: it separates a from b (they differ there, by construction), and it never separates a duplicate pair (identical numbers agree on every bit). So each room now holds one loner plus a pile of self-cancelling pairs — which is exactly the easy version of this problem, twice. The transferable habit: when a signal collapses two things you want into one thing you don't, ask what that combined signal still tells you about how they differ. A difference is often enough to divide by, even when it isn't enough to answer with.",
    hint: "XOR everything together. You won't get a or b — you'll get a ^ b. Now stare at that result bit by bit: a 1 can only appear where a and b disagree, so pick one such bit and ask which of the two loners has it set. Sorting the whole list by that single bit puts a in one bucket and b in the other, while both copies of every duplicate always land in the same bucket. The lowest set bit is the easiest one to grab: x & -x isolates it in one step.",
    solution: {
      lang: "javascript",
      code: "function twoLoners(nums) {\n  let xorAll = 0;\n  for (const n of nums) xorAll ^= n;\n\n  // Every 1 bit here marks a position where the two loners differ.\n  // Isolate the lowest one; any single differing bit would do.\n  const bit = xorAll & -xorAll;\n\n  let a = 0, b = 0;\n  for (const n of nums) {\n    if (n & bit) a ^= n;\n    else b ^= n;\n  }\n  return [a, b];\n}",
      notes: "Two passes, four variables, no allocation. Pass one XORs everything down to a ^ b, since every duplicate pair cancels. That value is never 0 — the two loners are distinct, so they must differ somewhere — which guarantees at least one 1 bit to work with. x & -x isolates the lowest of them: in two's complement, -x is ~x + 1, so x and -x agree on exactly one bit, the lowest set one. Pass two sorts by that bit and XORs each bucket down; duplicates cancel inside whichever bucket they land in, leaving one loner per side.\n\nTrace example 1: [1, 2, 1, 3, 2, 5]. The 1s and 2s cancel, so xorAll = 3 ^ 5 = 011 ^ 101 = 110 = 6. Then bit = 6 & -6 = 2 (binary 010). Bucket 'bit set' collects 2 (010), 3 (011), 2 (010) and XORs to 3; bucket 'bit clear' collects 1, 1, 5 and XORs to 5. Result [3, 5].\n\nTrace example 2: [4, 4, 7, 9]. The 4s cancel, xorAll = 7 ^ 9 = 0111 ^ 1001 = 1110 = 14, and bit = 14 & -14 = 2. Only 7 has bit 1 set, so that bucket XORs to 7; 4, 4 and 9 fill the other and cancel down to 9. Result [7, 9].\n\nTrace example 3: [0, 1]. xorAll = 1, bit = 1, buckets are [1] and [0]. Result [1, 0] — order is unspecified, and 0 falling out correctly is the reassuring part, since it is exactly the value that breaks approaches built on products or truthiness checks.\n\nTime O(n), space O(1). Picking the lowest set bit is convention, not necessity — any differing bit partitions just as well, and x & -x is simply the cheapest way to name one."
    }
  },
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
