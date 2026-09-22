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
    id: "the-perfect-trade",
    date: "2026-09-22",
    title: "The Perfect Trade",
    blurb: "A week of stock prices, one chance to buy, one chance to sell — buy before you sell, and maximize the spread. The reflex is to compare every pair of days; the click is that the best sell for any given day is always against the cheapest day before it, so one running minimum replaces every look back.",
    difficulty: "Easy",
    minutes: 6,
    tags: ["arrays", "greedy"],
    prompt: "You're given an array prices where prices[i] is the price of a single stock on day i. You may buy on one day and sell on a later day — you must buy before you sell, and you can only make one transaction. Return the maximum profit you can achieve. If no profit is possible (the price never goes up), return 0.\n\nSo prices = [7, 1, 5, 3, 6, 4] returns 5: buy at 1 on day 1, sell at 6 on day 4 — a profit of 5. You could also buy at 1 and sell at 5 (profit 4), but 6 gives the better spread. prices = [7, 6, 4, 3, 1] returns 0: the price drops every day, so there's no later day to sell at a gain. And prices = [2, 4, 1] returns 2: buy at 2 on day 0, sell at 4 on day 1 — a profit of 2. Day 2's price of 1 is the cheapest, but there's no day after it to sell.\n\nThe reflex is to compare every pair of days — for each buy day, scan every later sell day and track the best profit. That's correct, and for 6 days it's instant. But it's O(n²) comparisons, most of which can't beat the best you've already found. The structure you're missing is that the best selling partner for any day is always the same thing: the cheapest price that appeared before it. You don't need to remember which day that was, or how many days ago — just the price.\n\nThe click is to scan left to right and maintain a single running value: the minimum price seen so far. At each day, the best profit you could make selling today is today's price minus that minimum. Keep the largest such profit across the whole pass. One variable tracks the best buy, one tracks the best profit, and the answer falls out in one pass — O(n) time, O(1) space.\n\nThe deeper click is why a running minimum is sufficient. You never need to consider buying at a price that isn't the cheapest so far, because any higher buy price would yield a strictly worse profit at every future sell point. So at each day the decision \"what was the best day to buy?\" collapses to a single comparison — is today cheaper than everything before me? — and the answer is just a number you carry forward. The best pair isn't found by searching pairs; it's found by maintaining a one-number summary of the past and comparing each new day against it.",
    examples: [
      { in: "prices = [7, 1, 5, 3, 6, 4]", out: "5" },
      { in: "prices = [7, 6, 4, 3, 1]", out: "0" },
      { in: "prices = [2, 4, 1]", out: "2" }
    ],
    constraints: [
      "prices has between 1 and 10^5 elements; each price is a non-negative integer up to 10^4.",
      "You may make at most one transaction: buy on one day, sell on a strictly later day. You must buy before you sell.",
      "Return the maximum profit achievable. If no profitable transaction exists, return 0.",
      "Aim for O(n) time and O(1) extra space — a single left-to-right pass with a running minimum. No nested loops over buy/sell pairs."
    ],
    whyItMatters: "This puzzle is the friendliest introduction to the running-aggregate pattern — the habit of maintaining a one-number summary of everything you've seen so far, instead of looking back at each step. The transferable reframe is from \"find the best pair\" to \"for each endpoint, what was the best starting point?\" — and if the best starting point is always a simple aggregate of the past (the minimum, the maximum, the sum), then a single variable replaces every look back. That same instinct powers the running maximum in interval merging (the cluster's furthest reach), the running balance in the gas station problem (the tank that triggers a reset), and the running prefix sum in subarray-sum problems. In each case the question \"what happened before me?\" collapses to one number you carry forward.\n\nThe subtler lesson is about the gap between \"correct\" and \"efficient.\" The nested-loop solution is correct — it checks every pair and takes the maximum. But it pays O(n²) time for information that's already latent in a single running value. The minimum-so-far is the only fact about the past that matters for the future, and maintaining it costs one comparison per step. Recognizing when a question about the entire past can be answered by a single summary — and choosing to maintain that summary incrementally rather than recompute it — is what separates an O(n²) pairwise search from an O(n) scan.\n\nThere's also a boundary subtlety worth naming: the \"no profit\" case. When prices only decrease, the running minimum keeps updating but the profit at each day is never positive, so the best stays 0. This isn't a special case — it falls out of the algorithm naturally, because 0 is the initial value and nothing ever beats it. The choice to initialize the best to 0 (not to negative infinity) is what encodes the constraint \"if you can't profit, return 0\" — you're saying the default transaction is \"don't trade at all,\" and any actual profit must beat doing nothing.",
    hint: "Walk the prices left to right. Keep one variable: the minimum price seen so far. At each day, compute price - minSoFar and keep the maximum. Update minSoFar if today's price is lower. You never need to remember which day was cheapest — only the price.",
    solution: {
      lang: "javascript",
      code: "function maxProfit(prices) {\n  let minPrice = Infinity;\n  let best = 0;\n  for (const price of prices) {\n    minPrice = Math.min(minPrice, price);\n    best = Math.max(best, price - minPrice);\n  }\n  return best;\n}\n",
      notes: "One pass, two variables, O(n) time, O(1) space. minPrice tracks the cheapest price seen so far (initialized to Infinity so the first price always wins). best tracks the maximum profit found (initialized to 0 so a non-profitable market returns 0). At each day, two operations: update the minimum, then compute today's potential profit and keep the best.\n\nTrace example 1: prices = [7, 1, 5, 3, 6, 4].\n• minPrice = ∞, best = 0.\n• day 0, price 7: minPrice = min(∞, 7) = 7. best = max(0, 7 − 7) = 0.\n• day 1, price 1: minPrice = min(7, 1) = 1. best = max(0, 1 − 1) = 0.\n• day 2, price 5: minPrice = 1. best = max(0, 5 − 1) = 4.\n• day 3, price 3: minPrice = 1. best = max(4, 3 − 1) = 4.\n• day 4, price 6: minPrice = 1. best = max(4, 6 − 1) = 5.\n• day 5, price 4: minPrice = 1. best = max(5, 4 − 1) = 5.\n• return 5. ✓\n  Buy at 1 (day 1), sell at 6 (day 4). The running minimum found 1 on day 1 and never beat it; every subsequent day's profit was measured against that 1, and day 4's price of 6 gave the best spread.\n\nTrace example 2: prices = [7, 6, 4, 3, 1].\n• minPrice = ∞, best = 0.\n• day 0, price 7: minPrice = 7. best = max(0, 0) = 0.\n• day 1, price 6: minPrice = 6. best = max(0, 0) = 0.\n• day 2, price 4: minPrice = 4. best = max(0, 0) = 0.\n• day 3, price 3: minPrice = 3. best = max(0, 0) = 0.\n• day 4, price 1: minPrice = 1. best = max(0, 0) = 0.\n• return 0. ✓\n  Every day sets a new minimum — the price only falls. No day's profit is positive, so best stays at 0 (the \"don't trade\" default).\n\nTrace example 3: prices = [2, 4, 1].\n• minPrice = ∞, best = 0.\n• day 0, price 2: minPrice = 2. best = max(0, 2 − 2) = 0.\n• day 1, price 4: minPrice = 2. best = max(0, 4 − 2) = 2.\n• day 2, price 1: minPrice = 1. best = max(2, 1 − 1) = 2.\n• return 2. ✓\n  Buy at 2 (day 0), sell at 4 (day 1). Day 2's price of 1 is the cheapest overall, but there's no day after it to sell — the algorithm handles this correctly because the minimum drops to 1 on day 2, but day 2 is the last day, so that cheap price never produces a profit.\n\nWhy the running minimum suffices: at each day, the best possible profit from selling today is today's price minus the cheapest price on any earlier day. You don't need to know which day that was, or how many candidates there were — just the minimum value. Any buy price that isn't the minimum would give a worse profit at every future sell point, so the minimum is the only candidate worth tracking. This is what collapses an O(n²) pair search into an O(n) scan: the entire history is summarized by one number.\n\nWhy initialization matters: minPrice starts at Infinity (not 0 or the first element) so the first price always becomes the initial minimum. best starts at 0 (not −∞) because the problem says \"return 0 if no profit is possible\" — the default action is \"don't trade,\" and only a positive profit beats it."
    }
  },
  {
    id: "the-collapsed-shifts",
    date: "2026-09-21",
    title: "The Collapsed Shifts",
    blurb: "A schedule is a list of shifts, each with a start and end, and some overlap. You want the same coverage described in the fewest contiguous blocks — merge every overlapping pair into one. The reflex is to compare every pair for overlap; the click is that sorting by start time turns \"overlaps\" into \"starts before the cluster ends,\" and a single forward sweep fuses them all — the cluster's end is just a running maximum.",
    difficulty: "Medium",
    minutes: 10,
    tags: ["intervals", "sorting", "arrays"],
    prompt: "You're given a list of work shifts, each one a pair [start, end] marking when it begins and ends (inclusive of both endpoints — a shift that ends at 4 connects seamlessly with one that starts at 4). Some shifts overlap or touch, leaving the schedule cluttered. Merge every overlapping pair until nothing left can be merged, and return the result as a list of non-overlapping intervals sorted by start time.\n\nSo [[1,3],[2,6],[8,10],[15,18]] returns [[1,6],[8,10],[15,18]]: the shifts [1,3] and [2,6] overlap (2 falls inside [1,3]) and fuse into [1,6], while [8,10] and [15,18] sit apart (15 is past 10) and stay separate. [[1,4],[4,5]] returns [[1,5]]: the two shifts meet exactly at 4, which counts as overlapping under the inclusive-end rule, so they collapse into one block [1,5]. And [[1,4],[0,4]] returns [[0,4]]: [0,4] starts earlier and fully covers [1,4], so after sorting by start time they merge into a single [0,4] — the wider range swallows the narrower one.\n\nThe reflex is to compare every pair of shifts, fusing any two that overlap, and repeat until no more merges are possible. That's correct — for n shifts there are O(n^2) pairs, and each round of merging might collapse only a few, so you could end up re-checking pairs you already know about. Almost all of that work is wasted, because overlap is a relationship that becomes trivial once the shifts are in order: two intervals can overlap only if the later one starts before the earlier one ends — and \"the earlier one\" only makes sense once you've sorted by start.\n\nThe click is to sort the shifts by start time first. Once they're ordered, any shift that overlaps the current cluster must come immediately after it and must start before the cluster ends — because everything before has already been folded in, and everything after starts later. So a single left-to-right sweep suffices: keep one running cluster [start, end]. For each new shift, if its start is at or before the cluster's end, it overlaps — fold it in by extending the cluster's end to the max of the two ends (a shift that pokes out further grows the cluster; one fully inside leaves it unchanged). If its start is past the cluster's end, there's a gap — close out the current cluster and start a fresh one. One sort, one pass, done.\n\nThe deeper click is why the cluster's end is a running maximum rather than the last shift's end. A short shift swallowed by a long one — [1,10] then [2,3] — must not shrink the cluster, so you take the max of the two ends, not the second one. A long shift that starts inside but reaches far — [1,3] then [2,10] — must extend the cluster past its own end, again via the max. The cluster's end is \"the furthest reach of everything absorbed so far,\" and max-ing on each fold is exactly what maintains that invariant. This is incremental aggregate maintenance — the same instinct as the running counter in a sliding window, where one comparison updates a summary instead of recomputing it from scratch.",
    examples: [
      { in: "intervals = [[1,3],[2,6],[8,10],[15,18]]", out: "[[1,6],[8,10],[15,18]]" },
      { in: "intervals = [[1,4],[4,5]]", out: "[[1,5]]" },
      { in: "intervals = [[1,4],[0,4]]", out: "[[0,4]]" }
    ],
    constraints: [
      "intervals is an array of [start, end] pairs; its length is between 1 and 10^4. Each start and end is an integer with 0 <= start <= end <= 10^4.",
      "Two intervals overlap if one's start is at or before the other's end (touching counts — [1,4] and [4,5] merge). Merge all overlapping intervals until none overlap.",
      "Return the merged intervals sorted by start time. The merged set covers exactly the same points on the line as the original set.",
      "Aim for O(n log n) time — dominated by the sort — and O(n) space for the output. The sweep after sorting is a single O(n) pass."
    ],
    whyItMatters: "This puzzle is the friendliest introduction to the intervals family — a cluster of problems (merge, insert, meeting rooms, non-overlapping intervals, the skyline) that all share one move: sort by start time, then sweep. The transferable habit is the reframe that turns a pairwise relationship into a linear one. \"Does A overlap B?\" is a question about two arbitrary intervals, and answering it for all pairs is O(n^2). But \"does the next shift start before the current cluster ends?\" is a question about adjacent, sorted intervals — and answering it for all of them is O(n). Sorting doesn't sort the intervals for their own sake; it sorts the questions, collapsing a web of pairwise comparisons into a single chain of neighbor comparisons. Once you internalize that sorting restructures the work and not just the data, a whole family of interval and scheduling problems becomes one sort plus one sweep.\n\nThe subtler lesson is the running maximum. The naive merge compares each new shift against the last shift's end, but the last shift's end isn't the cluster's reach — a long shift absorbed early, then a short one, would wrongly shrink the cluster if you took the second end. The cluster's end is \"the furthest reach of everything folded in so far,\" and maintaining it as a running max (not a running last) is what keeps the merge correct under interleaved long and short shifts. This is the same instinct behind the running counter in the sliding window — maintain a summary that one comparison updates, instead of recomputing the whole summary each step. Incremental aggregate maintenance is what separates an O(n) sweep from an O(n^2) rescan, and the running max is its quietest, most useful form.\n\nThere's also a boundary subtlety worth naming: the choice of <= versus < at the touching point. [1,4] and [4,5] merge under <= (inclusive ends, touching counts as overlap) but stay separate under < (half-open ends, touching is a gap). Neither is wrong — they encode different conventions about whether a shift \"owns\" its endpoint — but the choice must be made deliberately and applied consistently, because an off-by-one at the boundary is the single most common bug in interval code. The same boundary discipline appears in every range query (is the range [lo, hi] or [lo, hi)?), in binary search's inclusive-versus-exclusive upper bound, and in half-open array slicing. Recognizing that \"do these touch?\" is a convention, not a fact, and stating it up front, is what keeps an interval solution from passing every test except the one at the seam.",
    hint: "Sort the intervals by start time. Then sweep left to right, keeping one running cluster [start, end]. For each next interval: if its start is at or before the cluster's end, it overlaps — fold it in by setting the cluster's end to the max of the two ends (a long shift extends the cluster, a short one inside it changes nothing). If its start is past the cluster's end, there's a gap — push the finished cluster and start a new one with this interval. One sort, one pass.",
    solution: {
      lang: "javascript",
      code: "function merge(intervals) {\n  if (!intervals.length) return [];\n  intervals.sort((a, b) => a[0] - b[0]);\n  const merged = [intervals[0]];\n  for (let i = 1; i < intervals.length; i++) {\n    const last = merged[merged.length - 1];\n    if (intervals[i][0] <= last[1]) last[1] = Math.max(last[1], intervals[i][1]);\n    else merged.push(intervals[i]);\n  }\n  return merged;\n}\n",
      notes: "One sort by start time, one forward sweep, one running cluster. O(n log n) time (the sort dominates), O(n) space for the output list. The sweep itself is O(n) — each interval is pushed once and its end possibly updated once.\n\nTrace example 1: intervals = [[1,3],[2,6],[8,10],[15,18]].\n  Already sorted by start.\n• merged = [[1,3]].\n• i=1: [2,6]. 2 <= 3 → last[1] = max(3,6) = 6. merged = [[1,6]].\n• i=2: [8,10]. 8 <= 6? No → push. merged = [[1,6],[8,10]].\n• i=3: [15,18]. 15 <= 10? No → push. merged = [[1,6],[8,10],[15,18]].\n• return [[1,6],[8,10],[15,18]]. ✓\n  [2,6] starts inside [1,3]'s reach, so the two fuse; [8,10] starts past 6, opening a gap and a fresh cluster; [15,18] starts past 10, another gap. Three clusters, matching the three disjoint coverage bands.\n\nTrace example 2: intervals = [[1,4],[4,5]].\n  Sorted by start.\n• merged = [[1,4]].\n• i=1: [4,5]. 4 <= 4? Yes (touching counts as overlap under the <= rule) → last[1] = max(4,5) = 5. merged = [[1,5]].\n• return [[1,5]]. ✓\n  The <= at the boundary is what fuses them. With < (half-open ends) they'd stay separate — that's the convention choice the constraint fixes.\n\nTrace example 3: intervals = [[1,4],[0,4]].\n  Sort by start → [[0,4],[1,4]].\n• merged = [[0,4]].\n• i=1: [1,4]. 1 <= 4 → last[1] = max(4,4) = 4. merged = [[0,4]].\n• return [[0,4]]. ✓\n  Sorting reorders [1,4] and [0,4] so the earlier-starting shift leads. [1,4] starts inside [0,4]'s reach and doesn't extend it, so the max leaves the end at 4 — the wider range swallows the narrower one. This is the running-max doing its job: a short shift inside a long cluster never shrinks it.\n\nWhy the running max and not the last end: the cluster's end must be the furthest reach of everything absorbed so far, not merely the most recent shift's end. Consider [[1,10],[2,3]]: after fusing, the cluster is [1,10]; the short [2,3] starts inside and ends earlier, so max(10,3) = 10 keeps the long reach. If the code took the last end (3), it would wrongly report [1,3] and orphan the tail of [1,10]. The running max is the invariant; the last end is a bug wearing its clothes. The same max-maintenance instinct is what keeps a sliding window's running counter honest — one comparison updates a summary that would otherwise need a full rescan.\n\nWhy sorting is the whole trick: before sorting, \"do A and B overlap?\" requires comparing two arbitrary intervals and is O(n^2) over all pairs. After sorting by start, \"does the next shift overlap the current cluster?\" reduces to one comparison — next.start <= cluster.end — because everything before the cluster has been folded in and everything after starts later. Sorting doesn't just order the data; it orders the questions, collapsing a pairwise web into a linear chain. This is the single move behind the entire intervals family: merge, insert (sweep until you hit the new interval's place), non-overlapping intervals (count the gaps), and meeting rooms II (sweep start and end events together). Master the sort-then-sweep once and the family falls."
    }
  },
  {
    id: "the-stonecutters-ledger",
    date: "2026-09-20",
    title: "The Stonecutter's Ledger",
    blurb: "Roman numerals carved in stone are mostly additive — but a smaller symbol before a larger one means subtraction. You could match the six subtractive pairs as two-letter tokens, but a single peek at the next symbol turns every glyph into one bookkeeping entry: add it, unless it's smaller than what follows, in which case subtract it. One pass, one map of seven values, no pair table.",
    difficulty: "Easy",
    minutes: 6,
    tags: ["math", "strings"],
    prompt: "You're given a string representing a Roman numeral — the number system carved into monuments across the ancient world, where letters stand for fixed values: I = 1, V = 5, X = 10, L = 50, C = 100, D = 500, M = 1000. Most of the time you just add up the symbols: \"VI\" is 5 + 1 = 6, \"LXX\" is 50 + 10 + 10 = 70. But the Romans hated four identical symbols in a row, so they invented a subtractive shortcut: when a smaller symbol appears immediately before a larger one, the smaller is subtracted instead of added. \"IV\" is 5 - 1 = 4 (not 6), \"IX\" is 10 - 1 = 9, \"XL\" is 50 - 10 = 40, \"XC\" is 90, \"CD\" is 400, \"CM\" is 900. Given a valid Roman numeral (between 1 and 3999), return its integer value.\n\nSo \"III\" returns 3: three I's, all additive — 1 + 1 + 1. \"IV\" returns 4: I before V is subtractive, so 5 - 1 = 4. And \"MCMXCIV\" returns 1994: M (1000) + CM (900) + XC (90) + IV (4) = 1994 — three subtractive pairs hiding inside one long inscription.\n\nThe reflex is to scan for the two-character subtractive tokens first — walk the string looking for \"IV\", \"IX\", \"XL\", \"XC\", \"CD\", \"CM\", consume each as a pair and add its value, then add whatever single symbols remain. That works, but it needs a second lookup table for the six special pairs and careful index bookkeeping to avoid double-counting or skipping a symbol. You're pattern-matching tokens when the underlying rule is simpler than the token list suggests.\n\nThe click is that every subtractive pair has exactly one property in common: the first symbol's value is less than the second's. So you never need to recognize the pairs as units at all. Walk the string left to right, and at each symbol peek at the next one. If the current symbol's value is less than the next symbol's value, it's the front of a subtractive pair — subtract it. Otherwise, add it. That's the entire algorithm: one comparison per symbol, one pass, no pair table.\n\nThe deeper click is why a subtract-then-add across two iterations produces the right total. Take \"IV\": at the I (value 1), the next symbol V (5) is larger, so you subtract 1 — running total -1. At the V (value 5), there is no next symbol, so you add 5 — running total 4. The pair's contribution (5 - 1 = 4) fell out of two independent decisions, neither of which knew it was part of a pair. The same happens for \"CM\": subtract 100, then later add 1000, netting 900. The subtractive pair is never assembled as a unit; it emerges from the ledger entries.",
    examples: [
      { in: "s = \"III\"", out: "3" },
      { in: "s = \"IV\"", out: "4" },
      { in: "s = \"MCMXCIV\"", out: "1994" }
    ],
    constraints: [
      "s is a string of between 1 and 15 characters, containing only the characters I, V, X, L, C, D, M.",
      "s is a valid Roman numeral representing an integer between 1 and 3999, following standard subtractive notation (the six pairs IV, IX, XL, XC, CD, CM). You do not need to validate the input.",
      "Return the integer value of the Roman numeral.",
      "Aim for O(n) time and O(1) extra space — one left-to-right pass with a peek at the next symbol. No pair table beyond the seven single-symbol values."
    ],
    whyItMatters: "This puzzle is the friendliest introduction to the look-ahead trick — the habit of deciding what a symbol means by peeking at its neighbor rather than matching it as part of a fixed token. The transferable habit is to ask, whenever a rule depends on a relationship between adjacent elements: can one comparison replace an explicit token table? The same instinct powers run-length encoding (a run is decided by comparing each element to the next), detecting a local peak (an element is a peak if it's bigger than both neighbors), merging two sorted arrays (compare the two fronts, take the smaller), and parsing any grammar where the meaning of a token depends on what follows it. Once you internalize that 'depends on the next element' is a one-peek question, a whole family of small parsers collapses into a single loop.\n\nThe subtler lesson is about separation of concerns — and why this algorithm does not validate. Roman numerals have strict formation rules (you can't write \"IC\" for 99, and \"IIII\" is disallowed even though it would compute correctly), but checking those rules is a different problem from computing the value. This solution assumes a well-formed numeral and evaluates it; mixing validation into evaluation produces a more complex, less reusable function. The same discipline applies to compilers (lexing and parsing vs. code generation), to spreadsheets (a formula's value vs. whether the formula is well-typed), and to any system where 'is this input legal?' and 'what does this input mean?' are best answered separately. Recognizing that evaluation can be simpler than validation — and choosing the simpler one when the input is guaranteed — is what keeps a 6-line solution from ballooning into 60.\n\nThere's also a quieter observation: Roman numerals are a non-positional number system. There are no place values — no 'hundreds column' or 'tens column' — just additive symbols with a subtraction patch for compactness. That's why a single left-to-right sweep suffices and why no carries propagate. Arabic numerals (and binary, and every positional system) need place value because a digit's contribution depends on its position; Roman symbols need only a peek because a symbol's contribution depends only on its single right neighbor. Recognizing which kind of system you're parsing tells you immediately how much context each symbol needs.",
    hint: "Walk the string left to right. At each symbol, look at the next one. If the current symbol's value is less than the next symbol's value, subtract it (it's the front of a subtractive pair like IV or CM); otherwise add it. You only need a map of the seven single-symbol values — I, V, X, L, C, D, M. The six subtractive pairs take care of themselves, because subtracting the small symbol now and adding the large one on the next iteration nets out to the pair's value.",
    solution: {
      lang: "javascript",
      code: "function romanToInt(s) {\n  const v = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };\n  let total = 0;\n  for (let i = 0; i < s.length; i++) {\n    const cur = v[s[i]];\n    const next = v[s[i + 1]] || 0;\n    if (cur < next) total -= cur;\n    else total += cur;\n  }\n  return total;\n}\n",
      notes: "One pass, one map of seven values, O(n) time, O(1) space. At each symbol, peek at the next. If the current value is smaller than the next, it's the lead of a subtractive pair — subtract it; the larger partner gets added on the following iteration, and the two entries net to the pair's value. No two-character token table is needed.\n\nTrace example 1: s = \"III\".\n  v: I=1, V=5, X=10, L=50, C=100, D=500, M=1000.\n• total = 0.\n• i=0 'I': cur=1, next=v['I']=1. 1 < 1 false → total = 0 + 1 = 1.\n• i=1 'I': cur=1, next=v['I']=1. 1 < 1 false → total = 1 + 1 = 2.\n• i=2 'I': cur=1, next=v[undefined]=0. 1 < 0 false → total = 2 + 1 = 3.\n• return 3. ✓ (Three additive I's; no peek ever triggers subtraction.)\n\nTrace example 2: s = \"IV\".\n• total = 0.\n• i=0 'I': cur=1, next=v['V']=5. 1 < 5 true → total = 0 - 1 = -1. (I is the front of a subtractive pair — subtract it.)\n• i=1 'V': cur=5, next=v[undefined]=0. 5 < 0 false → total = -1 + 5 = 4. (V is the back of the pair — add it. The two entries net to 5 - 1 = 4.)\n• return 4. ✓\n  Notice the pair was never assembled as a unit. The I was subtracted on its own merit (it's smaller than what follows), and the V was added on its own merit (nothing follows it). The 4 emerged from two independent bookkeeping entries.\n\nTrace example 3: s = \"MCMXCIV\".\n  v: M=1000, C=100, X=10, I=1, V=5.\n• total = 0.\n• i=0 'M': cur=1000, next=v['C']=100. 1000 < 100 false → total = 1000. (M is additive.)\n• i=1 'C': cur=100, next=v['M']=1000. 100 < 1000 true → total = 1000 - 100 = 900. (C is the front of CM — subtract.)\n• i=2 'M': cur=1000, next=v['X']=10. 1000 < 10 false → total = 900 + 1000 = 1900. (The M that closed CM is added here.)\n• i=3 'X': cur=10, next=v['C']=100. 10 < 100 true → total = 1900 - 10 = 1890. (X is the front of XC — subtract.)\n• i=4 'C': cur=100, next=v['I']=1. 100 < 1 false → total = 1890 + 100 = 1990. (The C that closed XC is added here.)\n• i=5 'I': cur=1, next=v['V']=5. 1 < 5 true → total = 1990 - 1 = 1989. (I is the front of IV — subtract.)\n• i=6 'V': cur=5, next=v[undefined]=0. 5 < 0 false → total = 1989 + 5 = 1994. (The V that closed IV is added here.)\n• return 1994. ✓ (M=1000, CM=900, XC=90, IV=4 → 1000 + 900 + 90 + 4 = 1994.)\n  Watch the three subtractive pairs each contribute across two steps: CM is -100 (i=1) then +1000 (i=2) = 900; XC is -10 (i=3) then +100 (i=4) = 90; IV is -1 (i=5) then +5 (i=6) = 4. The opening M is a plain +1000. Six independent ledger entries sum to 1994, none of them aware it was part of a pair.\n\nWhy the peek-ahead rule covers every subtractive pair: the six subtractive pairs (IV, IX, XL, XC, CD, CM) share exactly one property — the first symbol's value is smaller than the second's. The rule 'if cur < next, subtract' captures that property without enumerating the pairs, so any valid subtractive pair is handled correctly and any additive symbol (where cur >= next, or there is no next) is added. This is why the algorithm needs no validation: given a well-formed Roman numeral, the look-ahead rule alone reproduces the standard value."
    }
  },
  {
    id: "the-buried-sums",
    date: "2026-09-19",
    title: "The Buried Sums",
    blurb: "An array of integers hides stretches that add up to exactly k. Counting every subarray is O(n^2), but a running prefix sum turns each \u201cis there a matching earlier sum?\u201d into a single hash-map lookup \u2014 and the answer falls out in one pass.",
    difficulty: "Medium",
    minutes: 12,
    tags: ["prefix-sum", "hashing", "arrays"],
    prompt: "You're given an array of integers nums and an integer k. Return the total number of contiguous subarrays whose elements sum to exactly k. The integers may be positive, negative, or zero \u2014 so you can't use sliding pointers (a negative number can shrink a sum or grow it), and you can't assume the array is sorted.\n\nSo nums = [1, 1, 1] and k = 2 returns 2: the subarray [1, 1] at indices 0\u20131 sums to 2, and the subarray [1, 1] at indices 1\u20132 also sums to 2 \u2014 two distinct stretches, same total. nums = [1, 2, 3] and k = 3 returns 2: [1, 2] (indices 0\u20131) sums to 3, and [3] (index 2) sums to 3. And nums = [1, -1, 0] and k = 0 returns 3: [1, -1] (indices 0\u20131) sums to 0, [1, -1, 0] (indices 0\u20132) sums to 0, and [0] (index 2) sums to 0 \u2014 three buried stretches, all collapsing to zero.\n\nThe reflex is to enumerate every contiguous subarray and sum each one. There are O(n^2) subarrays (every pair of start and end indices), and summing each takes up to O(n) \u2014 O(n^3) naively, or O(n^2) if you keep a running sum per starting point. For a thousand elements that's a million subarrays; for a hundred thousand, it's ten billion. Almost all of that work recomputes sums you've already partially calculated, and the structure you're missing is that a subarray's sum is just the difference of two prefix sums.\n\nThe click is the prefix sum. Define prefix[j] as the sum of nums[0] through nums[j], and prefix[-1] as 0 (the empty prefix). Then the sum of any subarray from index i to j is prefix[j] - prefix[i-1]. So a subarray sums to k exactly when prefix[j] - prefix[i-1] = k \u2014 which rearranges to prefix[i-1] = prefix[j] - k. That means: for each position j, the number of subarrays ENDING at j that sum to k is exactly the number of earlier positions whose prefix sum equals prefix[j] - k. If you keep a hash map of prefix-sum \u2192 count as you walk, each position answers in O(1) \u2014 one lookup, one increment, one pass.\n\nThe deeper click is why the hash map makes this O(n) instead of O(n^2). Without it, for each j you'd scan back through all earlier prefix sums looking for matches \u2014 that's the O(n^2) trap all over again, just shifted from \u201csum every subarray\u201d to \u201ccompare every pair of prefix sums.\u201d The map collapses that scan into a single key lookup. And because you insert each prefix sum into the map AFTER looking it up (not before), you never count a subarray that starts and ends at the same position in a way that would double-count \u2014 the map only holds prefix sums from positions strictly before j. The one subtlety is seeding the map with {0: 1} before the loop starts, representing the empty prefix: a subarray starting at index 0 has prefix[-1] = 0, so if prefix[j] itself equals k, the lookup prefix[j] - k = 0 finds that seed and counts the full prefix as one valid subarray.",
    examples: [
      { in: "nums = [1, 1, 1], k = 2", out: "2" },
      { in: "nums = [1, 2, 3], k = 3", out: "2" },
      { in: "nums = [1, -1, 0], k = 0", out: "3" }
    ],
    constraints: [
      "nums has between 1 and 2\u00d710^5 elements; each value is an integer that may be positive, negative, or zero.",
      "k is an integer (may be positive, negative, or zero). Return the count of contiguous subarrays whose sum equals k.",
      "Two subarrays are distinct if they occupy different index ranges, even if their elements are identical.",
      "Aim for O(n) time and O(n) extra space \u2014 one pass with a running prefix sum and a hash map of prefix-sum \u2192 frequency. No nested loops over subarray endpoints."
    ],
    whyItMatters: "This puzzle is the friendliest introduction to the prefix-sum + hash-map pattern \u2014 a combination that turns a quadratic subarray search into a linear scan, and that generalizes to a surprising number of problems. The transferable habit is the reframe: instead of asking \u201cwhich subarray sums to k?\u201d (a question about ranges), ask \u201cfor each ending position, how many starting positions have a prefix sum that differs from mine by exactly k?\u201d (a question about pairs of scalars). That reframe collapses a two-dimensional search into a one-dimensional scan with a hash lookup, and it's the same instinct behind range-sum queries (prefix sums without the map), subarray-sum-divisible-by-k (prefix sums modulo k), longest subarray with sum 0 (prefix sums with a map of first occurrence), and continuous-subarray-sum (prefix sums with modular arithmetic). Once you internalize that a subarray's sum is a difference of two prefix sums, a whole family of \u201ccount the subarrays that\u2026\u201d problems becomes one pass.\n\nThe subtler lesson is about the seeding trick \u2014 initializing the map with {0: 1} \u2014 and why omitting it is the bug everyone hits on their first attempt. Without the seed, you miss every subarray that starts at index 0 and sums to k, because the matching prefix sum (the empty prefix, value 0) was never recorded. The seed represents the empty prefix as a valid \u201cbefore-the-start\u201d position, and it's the same kind of off-by-one that haunts every prefix-sum problem: the sum from i to j is prefix[j] - prefix[i-1], and when i = 0, prefix[i-1] = prefix[-1] = 0 \u2014 the empty sum. Recognizing that the empty prefix is a real, countable entity \u2014 not a special case to handle separately, but a value to seed into the map \u2014 is what turns a solution that works on most inputs into one that works on all of them. The same seeding discipline appears in dynamic programming base cases, in graph algorithm initialization (the source node starts at distance 0), and in any algorithm where \u201cthe state before the first element\u201d matters. Get the seed right and the loop body stays clean; get it wrong and you're patching special cases forever.",
    hint: "Keep a running prefix sum and a hash map of prefix-sum \u2192 count. For each element, update the prefix sum, then check how many earlier positions had prefix sum equal to (current prefix sum - k) \u2014 that's the number of subarrays ending here that sum to k. Add it to your total. Then record the current prefix sum in the map. Seed the map with {0: 1} before the loop to catch subarrays that start at index 0.",
    solution: {
      lang: "javascript",
      code: "function subarraySum(nums, k) {\n  let count = 0, prefixSum = 0;\n  const map = new Map();\n  map.set(0, 1); // seed: the empty prefix has sum 0\n  for (const num of nums) {\n    prefixSum += num;\n    if (map.has(prefixSum - k)) {\n      count += map.get(prefixSum - k);\n    }\n    map.set(prefixSum, (map.get(prefixSum) || 0) + 1);\n  }\n  return count;\n}\n",
      notes: "One pass, one hash map, one running prefix sum. For each position, the number of subarrays ending here that sum to k is the count of earlier prefix sums equal to (current prefix - k). The map stores prefix-sum \u2192 frequency, so each lookup is O(1). Total O(n) time, O(n) space.\n\nTrace example 1: nums = [1, 1, 1], k = 2.\n  map = {0:1}, count = 0, prefixSum = 0.\n\u2022 num = 1: prefixSum = 1. Need 1 - 2 = -1. map has no -1 \u2192 count += 0. map.set(1, 1). map = {0:1, 1:1}.\n\u2022 num = 1: prefixSum = 2. Need 2 - 2 = 0. map has 0:1 \u2192 count += 1. count = 1. map.set(2, 1). map = {0:1, 1:1, 2:1}.\n\u2022 num = 1: prefixSum = 3. Need 3 - 2 = 1. map has 1:1 \u2192 count += 1. count = 2. map.set(3, 1). map = {0:1, 1:1, 2:1, 3:1}.\n\u2022 return 2. \u2713 (Subarrays [1,1] at 0\u20131 and [1,1] at 1\u20132.)\n  Notice: the seed {0:1} is what catches the first subarray \u2014 when prefixSum reaches 2 and we look for 2 - 2 = 0, the seed provides that match. Without it, the answer would be 1 instead of 2.\n\nTrace example 2: nums = [1, 2, 3], k = 3.\n  map = {0:1}, count = 0, prefixSum = 0.\n\u2022 num = 1: prefixSum = 1. Need 1 - 3 = -2. Not in map. map = {0:1, 1:1}.\n\u2022 num = 2: prefixSum = 3. Need 3 - 3 = 0. map has 0:1 \u2192 count += 1. count = 1. map = {0:1, 1:1, 3:1}.\n\u2022 num = 3: prefixSum = 6. Need 6 - 3 = 3. map has 3:1 \u2192 count += 1. count = 2. map = {0:1, 1:1, 3:1, 6:1}.\n\u2022 return 2. \u2713 ([1,2] from indices 0\u20131 sums to 3; [3] at index 2 sums to 3.)\n  The first match comes from the seed (prefix[-1]=0, giving the full prefix [1,2]=3). The second comes from prefix[1]=3 matching prefix[2]-k=6-3=3 (giving [3]). Two different mechanisms, same map.\n\nTrace example 3: nums = [1, -1, 0], k = 0.\n  map = {0:1}, count = 0, prefixSum = 0.\n\u2022 num = 1: prefixSum = 1. Need 1 - 0 = 1. Not in map. map = {0:1, 1:1}.\n\u2022 num = -1: prefixSum = 0. Need 0 - 0 = 0. map has 0:1 \u2192 count += 1. count = 1. map = {0:2, 1:1}.\n\u2022 num = 0: prefixSum = 0. Need 0 - 0 = 0. map has 0:2 \u2192 count += 2. count = 3. map = {0:3, 1:1}.\n\u2022 return 3. \u2713 ([1,-1] at 0\u20131 sums to 0; [1,-1,0] at 0\u20132 sums to 0; [0] at index 2 sums to 0.)\n  This example shows why the approach handles negatives and zeros that sliding windows cannot. The prefix sum returns to 0 twice (after index 1 and after index 2), and each return to 0 means every earlier position with prefix sum 0 starts a valid subarray. The map's count for 0 grows from 1 \u2192 2 \u2192 3, and each growth means more subarrays will be found the next time prefix sum hits 0.\n\nWhy the seed {0: 1} is essential: a subarray starting at index 0 has no \u201cprevious\u201d prefix sum in the array \u2014 its prefix[i-1] is the empty prefix, sum 0. Without seeding the map with that value, you miss every valid subarray that begins at the first element. In example 1, omitting the seed gives count = 1 instead of 2 (you'd catch only the second [1,1]). In example 2, omitting it gives count = 1 instead of 2 (you'd catch only [3]). The seed is not a special case \u2014 it's the base case, the same way a recursive function needs a base case to terminate.\n\nWhy this can't be done with sliding pointers: the two-pointer / sliding-window technique works when the sum is monotonic \u2014 expanding the window always increases the sum (all positives) and shrinking always decreases it. With negative numbers, expanding can decrease the sum and shrinking can increase it, so there's no clean \u201cmove left when too big, move right when too small\u201d strategy. The prefix-sum + hash-map approach doesn't care about monotonicity at all \u2014 it works for any mix of signs because it's tracking exact sums, not sliding a window. This is why the problem specifies that integers may be negative: it rules out the easier sliding-window solution and forces the prefix-sum insight.\n\nWhy the hash map is necessary: without it, for each position j you'd scan all earlier positions looking for prefix sums equal to prefix[j] - k \u2014 that's O(n) per position, O(n^2) total. The map collapses the \u201cscan all earlier positions\u201d step into a single key lookup, which is O(1) average. This is the same upgrade that turns two-sum from O(n^2) (check every pair) to O(n) (hash each element, check for complement). The pattern is always: if you're searching for a matching value among a set that grows incrementally, a hash map turns the search from a scan into a lookup."
    }
  },
  {
    id: "the-smallest-window",
    date: "2026-09-18",
    title: "The Smallest Window",
    blurb: "Two strings, one haystack and one alphabet of required letters. Find the tiniest stretch of the haystack that holds every required letter at least as many times as it's asked for. The reflex is to check every substring; the click is a window that grows on the right to become valid and then shrinks on the left to become minimal — a single counter turns \"is this window good?\" into an O(1) glance.",
    difficulty: "Hard",
    minutes: 14,
    tags: ["sliding-window", "strings", "hashing"],
    prompt: "You're given two strings, s and t. Find the minimum-length contiguous substring of s that contains every character of t — including duplicates. So if t = \"AABC\", the answer must hold at least two A's, one B, and one C, all inside one unbroken slice of s. If no such substring exists, return the empty string. If several substrings tie for shortest, return any one of them.\n\nSo s = \"ADOBECODEBANC\" and t = \"ABC\" returns \"BANC\": the slice from index 9 to 12 holds B, A, N, C — every required letter (A, B, C) is present, and nothing shorter works. s = \"a\" and t = \"a\" returns \"a\": the whole string is itself the only valid window. And s = \"a\" and t = \"aa\" returns \"\": the haystack only has one 'a' but two are required, so no valid window exists.\n\nThe reflex is to enumerate every substring of s and, for each, check whether it contains all of t's letters with the right multiplicities. That's correct, but there are O(n^2) substrings and each check is O(n) — O(n^3) naively, or O(n^2) with a frequency map per starting point. Almost all of that work is redundant: two substrings that overlap almost entirely re-scan the same characters from scratch, and you keep asking \"is THIS window valid?\" over a sea of windows that differ by one character.\n\nThe click is to stop asking \"is this window valid?\" for every window and instead grow and shrink a single window until it just barely becomes valid, then squeeze it. Plant two pointers, left and right, both at the start of s. March right forward one character at a time, adding each character to a running tally. The moment the window [left, right] contains every required letter (with multiplicity), it's valid — and now you squeeze left forward as far as you can while the window STAYS valid, recording the shortest valid window you see. Then right advances again, and the dance repeats. Because left and right each only move forward across the whole string, the entire pass is O(|s|), even though the window expands and contracts many times.\n\nThe deeper click — the part that turns a clunky \"re-scan the window to check validity\" into a clean O(1) test — is a single integer called haveCount, balanced against needCount (the number of DISTINCT letters t requires). For each distinct letter, need stores how many copies are required. As right adds a character, if that character's running count in the window just reached its required amount, haveCount ticks up by one. The window is valid exactly when haveCount equals needCount — one integer comparison, no rescanning. When left removes a character and its count drops below the required amount, haveCount ticks down. That single counter is what makes the squeeze loop cheap: you can shrink aggressively and know instantly the moment you've broken validity, so you never over-shrink and never re-scan.",
    examples: [
      { in: "s = \"ADOBECODEBANC\", t = \"ABC\"", out: "\"BANC\"" },
      { in: "s = \"a\", t = \"a\"", out: "\"a\"" },
      { in: "s = \"a\", t = \"aa\"", out: "\"\"" }
    ],
    constraints: [
      "s and t are strings of English letters (upper and lower case, case-sensitive); lengths between 1 and 10^5.",
      "t may contain duplicate letters — the window must include at least as many copies of each letter as t requires. Order does not matter.",
      "Return the minimum-length contiguous substring of s containing every character of t (with multiplicity). If none exists, return the empty string. If several tie for shortest, any one is acceptable.",
      "Aim for O(|s|) time and O(|alphabet|) extra space — two pointers that each move forward only, plus a small frequency map. No nested loops over substrings."
    ],
    whyItMatters: "This is the canonical Hard sliding-window problem, and it earns its difficulty honestly: the window expands, contracts, and the answer pops out without ever enumerating a substring. The transferable habit is the two-phase dance — expand the right edge until the window satisfies the condition, then contract the left edge until it just barely stops satisfying it, recording the best you saw at each peak. That same expand-then-squeeze skeleton cracks \"longest substring with at most K distinct characters,\" \"smallest subarray with sum at least S,\" \"substring with concatenation of all words,\" and every \"smallest contiguous thing that meets a condition\" problem. Once you internalize the dance, a whole family of Hard problems collapses into the same two pointers and the same while loop.\n\nThe subtler lesson — and the one that separates a working solution from an elegant one — is the haveCount/needCount counter. The naive squeeze re-scans the window's frequency map to test validity on every contraction, turning a clean O(n) into a hidden O(n × alphabet). The single counter reduces \"is this window valid?\" to one integer comparison, because it tracks how many of the DISTINCT required letters are currently satisfied rather than re-tallying all of them. This is the same instinct behind any incremental bookkeeping: when a condition is a conjunction of sub-conditions (each letter's count meets its quota), maintain a count of how many sub-conditions hold, and bump it exactly when a sub-condition flips from unsatisfied to satisfied (or vice versa). Incremental aggregate tracking is what makes event-driven simulation, online statistics, and database materialized views cheap instead of recomputed. Recognizing that a validity test can be promoted from \"recompute\" to \"maintain a counter that ticks on the boundary\" is the move that turns an O(n^2) window scan into an O(n) one — and it's the move most people miss on a first pass.",
    hint: "Grow the right pointer until the window contains every letter t needs (track a haveCount that ticks up the moment a letter's running count reaches its required amount). Once valid, shrink the left pointer as far as possible while haveCount stays equal to needCount, recording the shortest window at each step. When shrinking drops a required letter below its quota, haveCount ticks down and the window is no longer valid — so right advances again. Both pointers only move forward, so it's one pass.",
    solution: {
      lang: "javascript",
      code: "function minWindow(s, t) {\n  if (s.length < t.length) return \"\";\n  const need = {};\n  for (const c of t) need[c] = (need[c] || 0) + 1;\n  let needCount = 0;\n  for (const k in need) needCount++;          // distinct required letters\n  const have = {};\n  let haveCount = 0, left = 0, bestL = 0, bestLen = Infinity;\n  for (let right = 0; right < s.length; right++) {\n    const c = s[right];\n    have[c] = (have[c] || 0) + 1;\n    if (need[c] && have[c] === need[c]) haveCount++;   // a letter just became satisfied\n    while (haveCount === needCount) {                  // window is valid — squeeze\n      if (right - left + 1 < bestLen) { bestLen = right - left + 1; bestL = left; }\n      const d = s[left];\n      have[d]--;\n      if (need[d] && have[d] === need[d] - 1) haveCount--;  // a letter just broke\n      left++;\n    }\n  }\n  return bestLen === Infinity ? \"\" : s.slice(bestL, bestL + bestLen);\n}\n",
      notes: "One pass, two pointers, a frequency map, and one integer counter. Each index is visited by right once and by left at most once, so the total work is O(|s|). The map holds at most the alphabet size. The whole subtlety is haveCount: it counts how many of t's DISTINCT letters currently meet their quota inside the window, so validity is one integer comparison instead of a rescan.\n\nTrace example 1: s = \"ADOBECODEBANC\", t = \"ABC\".\n  need = {A:1, B:1, C:1}, needCount = 3. (Index: 0:A 1:D 2:O 3:B 4:E 5:C 6:O 7:D 8:E 9:B 10:A 11:N 12:C.)\n• right=0 'A': have{A:1}, have[A]==1 → haveCount=1.\n• right=1 'D': have{A:1,D:1}. need[D] none → haveCount stays 1.\n• right=2 'O': have{...O:1}. haveCount=1.\n• right=3 'B': have[B]=1 → haveCount=2.\n• right=4 'E': have[E]=1. haveCount=2.\n• right=5 'C': have[C]=1 → haveCount=3 == needCount. Valid!\n   Squeeze: len 5-0+1=6 → best=\"ADOBEC\" (bestL=0,bestLen=6). Remove s[0]='A': have[A]=0 == need[A]-1 → haveCount=2. left=1. Not valid → stop squeezing.\n• right=6 'O': have[O]=2. haveCount=2.\n• right=7 'D': have[D]=2.\n• right=8 'E': have[E]=2.\n• right=9 'B': have[B]=2. need[B]=1, have[B]=2 != 1 → haveCount stays 2.\n• right=10 'A': have[A]=1 == need[A] → haveCount=3. Valid!\n   Squeeze: len 10-1+1=10, not < 6. Remove 'D'(s[1]): need[D] none → haveCount stays 3. left=2. Still valid.\n   len 10-2+1=9, not < 6. Remove 'O'(s[2]): none → haveCount 3. left=3. Still valid.\n   len 10-3+1=8. Remove 'B'(s[3]): have[B]=1, need[B]=1 → still satisfied, haveCount stays 3. left=4. Still valid.\n   len 10-4+1=7. Remove 'E'(s[4]): none → haveCount 3. left=5. Still valid.\n   len 10-5+1=6, not < 6. Remove 'C'(s[5]): have[C]=0 == need[C]-1 → haveCount=2. left=6. Not valid → stop.\n• right=11 'N': have[N]=1. haveCount=2.\n• right=12 'C': have[C]=1 → haveCount=3. Valid!\n   Squeeze: len 12-6+1=7, not < 6. Remove 'O'(s[6]): none → haveCount 3. left=7.\n   len 12-7+1=6, not < 6. Remove 'D'(s[7]): none → haveCount 3. left=8.\n   len 12-8+1=5 < 6 → best=\"EBANC\" (bestL=8,bestLen=5). Remove 'E'(s[8]): none → haveCount 3. left=9.\n   len 12-9+1=4 < 5 → best=\"BANC\" (bestL=9,bestLen=4). Remove 'B'(s[9]): have[B]=0 == need[B]-1 → haveCount=2. left=10. Not valid → stop.\n• return s.slice(9,13) = \"BANC\". ✓\n  Notice the squeeze at the end peeled O, D, E off the left even though none were required — they were dead weight, and the counter only flinched when a REQUIRED letter (B) fell below quota.\n\nTrace example 2: s = \"a\", t = \"a\".\n  need{a:1}, needCount=1.\n• right=0 'a': have{a:1}, have[a]==1 → haveCount=1 == needCount. Valid.\n   Squeeze: len 1 → best=\"a\" (bestLen=1,bestL=0). Remove 'a': have[a]=0 == need-1 → haveCount=0. left=1. Stop.\n• return \"a\". ✓\n\nTrace example 3: s = \"a\", t = \"aa\".\n  s.length(1) < t.length(2) → return \"\" immediately. ✓ The haystack can't even hold the required count, so no window exists.\n\nWhy haveCount is the heart of it: validity is \"every required letter's window-count is at least its quota.\" That's a conjunction over the distinct letters of t. haveCount tracks how many of those conjuncts are currently true, and it changes ONLY when a letter crosses its quota boundary — going from need[c]-1 to need[c] (satisfied) or need[c] to need[c]-1 (broken). So the squeeze can shrink aggressively and discover the breaking point in O(1) per step, without ever rescanning the map. That single counter is what makes the window expand-and-contract O(|s|) instead of O(|s| × alphabet), and it's the same incremental-aggregate trick behind online statistics, event counters, and materialized views: don't recompute the aggregate, maintain it on the boundary where it changes."
    }
  },
  {
    id: "the-retreating-shores",
    date: "2026-09-17",
    title: "The Retreating Shores",
    blurb: "A row of walls stands along the waterfront. Pick any two to form a basin — the water it holds is set by the shorter wall and the distance between them. Start at the widest pair and move the shorter wall inward, because the taller one can only shrink the basin further.",
    difficulty: "Medium",
    minutes: 10,
    tags: ["two-pointers", "greedy"],
    prompt: "You're given an array of non-negative integers called height, where height[i] represents the height of a vertical wall at position i. The walls stand on a flat waterfront, equally spaced one unit apart. Pick any two walls, and the water between them forms a rectangle: the water level is set by the shorter of the two walls (water spills over the lower one), and the width is the distance between them. Find the pair of walls that holds the most water, and return that maximum area.\n\nSo height = [1, 8, 6, 2, 5, 4, 8, 3, 7] returns 49: the walls at index 1 (height 8) and index 8 (height 7) are 7 units apart, and the shorter wall is 7, so the basin holds 7 × 7 = 49. No other pair does better. height = [1, 1] returns 1: two walls of height 1, one unit apart — the basin holds 1 × 1 = 1. And height = [4, 3, 2, 1, 4] returns 16: the two end walls are both height 4 and 4 units apart, so the basin holds 4 × 4 = 16 — the tallest walls at the widest span.\n\nThe reflex is to check every pair: for each left wall, scan every right wall, compute the area, and track the maximum. That is O(n^2) — correct, but for 10,000 walls it is 50 million comparisons, and most of them are wasted. A pair of short walls close together can never beat a pair of tall walls far apart, so you are re-checking configurations that were doomed from the start.\n\nThe click is to start with the widest possible container — the two end walls — and narrow inward, but only from one side at a time. Two pointers, left at 0 and right at n-1, give you the widest span. At each step, compute the area, then move the pointer at the shorter wall inward by one. Why the shorter wall? Because the area is capped by the shorter wall's height, and the width is shrinking. Moving the taller wall inward can only make things worse: the width decreases, and the height is still capped by the same shorter wall (or an even shorter one). The only move that could possibly improve the area is moving the shorter wall — maybe the next wall inward is taller, and the height increase outweighs the width decrease. So you always sacrifice the shorter wall and keep the taller one in play.\n\nThe deeper click is why this greedy elimination is safe — why you never skip the optimal pair. When you move the shorter pointer inward, you are eliminating every container that pairs the old shorter wall with any wall between the two pointers. But all those containers are bounded by the old shorter wall's height, and they are narrower than the current one — so each holds less water than the container you just measured. The optimal pair is never among the eliminated containers, because every one of them is strictly worse than what you already have. This elimination argument is what makes the algorithm correct, not just fast.",
    examples: [
      { in: "height = [1, 8, 6, 2, 5, 4, 8, 3, 7]", out: "49" },
      { in: "height = [1, 1]", out: "1" },
      { in: "height = [4, 3, 2, 1, 4]", out: "16" }
    ],
    constraints: [
      "height has between 2 and 10^5 elements; each value is a non-negative integer up to 10^4.",
      "The area between walls at positions i and j (i < j) is min(height[i], height[j]) × (j - i) — the shorter wall sets the water level, the distance sets the width.",
      "Return the maximum area achievable by any pair of walls. Each wall is used at most once in the pair.",
      "Aim for O(n) time and O(1) extra space — two pointers from the ends, moving the shorter wall inward. No nested loops."
    ],
    whyItMatters: "This puzzle is the friendliest possible introduction to a greedy elimination pattern that feels risky but is provably safe: you discard most of the search space at each step, and you prove that the discarded portion can't contain the answer. The instinct — move the shorter wall, because the taller one might still be useful — is the kind of heuristic a human would reach for intuitively, but the proof that it's correct is what turns a lucky guess into a trustworthy algorithm.\n\nThe transferable habit is to ask, of any problem where you're searching over pairs or combinations: can I eliminate a whole class of candidates with one comparison? The container problem eliminates every pair involving the shorter wall at the current width, because they're all narrower and none is taller. That same instinct powers the two-pointer approach to 3Sum (sort, then for each element, two-pointer the rest), the merge step of merge sort (compare the two front elements, take the smaller), and the partition step of quicksort (swap toward the pivot). In each case, one comparison tells you which entire region of the search space to abandon.\n\nThe subtler lesson is about why moving the taller wall is the wrong move, not just a suboptimal one. If you move the taller wall inward, the width shrinks by one, and the height is still capped by the shorter wall (or by an even shorter wall if the new one is shorter). So the area can only decrease or stay the same — it can never increase. The taller wall is doing useful work just by being tall; moving it wastes that height. Only the shorter wall is blocking the area from being larger, so only moving it can potentially help. This asymmetry — the shorter wall is the bottleneck — is the structural insight that makes the greedy choice obvious once you see it. The same bottleneck-identification appears in the maximin problem in game theory (your best move is to improve your worst outcome), in the water-jug puzzle, and in any optimization where the answer is set by the weakest link. Find the bottleneck, and you know where to act.",
    hint: "Start with two pointers at the ends — that is the widest container. Compute its area. Then move the pointer at the shorter wall inward by one (if they are equal, move either). Why? Because the area is set by the shorter wall, and the width is shrinking — moving the taller wall can only reduce the area further. The shorter wall is the bottleneck; moving it is the only way the area might improve. Repeat until the pointers meet, tracking the best area you have seen.",
    solution: {
      lang: "javascript",
      code: "function maxArea(height) {\n  let left = 0, right = height.length - 1;\n  let best = 0;\n  while (left < right) {\n    const h = Math.min(height[left], height[right]);\n    best = Math.max(best, h * (right - left));\n    if (height[left] < height[right]) {\n      left++;\n    } else {\n      right--;\n    }\n  }\n  return best;\n}\n",
      notes: "Two pointers from the ends, one pass, O(n) time, O(1) space. Each step computes the current area, records the best, and moves the shorter wall inward. The taller wall stays put — it might pair with a taller wall later.\n\nTrace example 1: height = [1, 8, 6, 2, 5, 4, 8, 3, 7].\n• left=0, right=8. h=min(1,7)=1. area=1×8=8. best=8. 1<7 → left=1.\n• left=1, right=8. h=min(8,7)=7. area=7×7=49. best=49. 8>7 → right=7.\n• left=1, right=7. h=min(8,3)=3. area=3×6=18. 8>3 → right=6.\n• left=1, right=6. h=min(8,8)=8. area=8×5=40. 8>=8 → right=5.\n• left=1, right=5. h=min(8,4)=4. area=4×4=16. 8>4 → right=4.\n• left=1, right=4. h=min(8,5)=5. area=5×3=15. 8>5 → right=3.\n• left=1, right=3. h=min(8,2)=2. area=2×2=4. 8>2 → right=2.\n• left=1, right=2. h=min(8,6)=6. area=6×1=6. 8>6 → right=1.\n• left=1, right=1 → stop.\n• return 49. ✓ (Walls at index 1 and 8: height 8 and 7, width 7, area 49.)\n  Notice how the algorithm finds the optimum early (step 2) and then spends the rest of the pass confirming nothing else beats it. The shorter wall keeps moving, but 49 stands.\n\nTrace example 2: height = [1, 1].\n• left=0, right=1. h=min(1,1)=1. area=1×1=1. best=1. 1>=1 → right=0.\n• left=0, right=0 → stop.\n• return 1. ✓ (Two equal walls, one unit apart — the only possible container.)\n\nTrace example 3: height = [4, 3, 2, 1, 4].\n• left=0, right=4. h=min(4,4)=4. area=4×4=16. best=16. 4>=4 → right=3.\n• left=0, right=3. h=min(4,1)=1. area=1×3=3. 4>1 → right=2.\n• left=0, right=2. h=min(4,2)=2. area=2×2=4. 4>2 → right=1.\n• left=0, right=1. h=min(4,3)=3. area=3×1=3. 4>3 → right=0.\n• left=0, right=0 → stop.\n• return 16. ✓ (The two end walls — both height 4, 4 units apart — form the best basin. The inner walls are all shorter, so they can not compete despite being closer.)\n\nWhy moving the shorter wall is correct: at each step, the area is min(h[L], h[R]) × (R - L). The width (R - L) is decreasing by 1 each step regardless of which pointer moves. The height is set by the shorter wall. If you move the taller wall, the height can only stay the same or decrease (the new wall might be shorter), and the width definitely decreases — so the area can only get worse. If you move the shorter wall, the height might increase (the next wall might be taller), which could offset the width loss. So moving the shorter wall is the only move that could possibly improve the area.\n\nWhy no optimal pair is skipped: when you move the shorter pointer (say left at height hL) inward, you eliminate every container pairing the old left wall with any wall between left+1 and right. Each of those containers has height at most hL (because left was the shorter wall, or equal) and width < (R - L). So each eliminated container has area at most hL × (its width) < hL × (R - L) = the area you just measured. The optimal pair can not be among the eliminated containers because every one of them is strictly worse than what you already have. The elimination is safe — you are only throwing away pairs that are proven to be suboptimal."
    }
  },
  {
    id: "the-wallflower",
    date: "2026-09-16",
    title: "The Wallflower",
    blurb: "Every number in the list arrives with an identical partner — except one wallflower standing alone. You could sort, you could tally, but a single XOR operator cancels every pair and leaves the solo dancer standing. One pass, one variable, zero extra space.",
    difficulty: "Easy",
    minutes: 6,
    tags: ["bit-manipulation", "arrays"],
    prompt: "You're given a non-empty array of integers. Every element appears exactly twice, except for one element which appears exactly once. Find that single element.\n\nSo nums = [2, 2, 1] returns 1: the pair of 2s cancel and 1 is left standing. nums = [4, 1, 2, 1, 2] returns 4: the two 1s cancel, the two 2s cancel, and 4 was never paired. And nums = [1] returns 1: a single guest at the party, no partner to cancel with.\n\nThe reflex is to reach for a frequency map — walk the array, tally how many times each number appears, then scan the map for the entry with count 1. That's correct and it's O(n) time, but it costs O(n) extra space for the map, and it ignores a property of the numbers themselves that makes the map unnecessary. A second reflex is to sort the array and look for the unpaired neighbor — but sorting is O(n log n) and it destroys the original order for no good reason.\n\nThe click is that XOR (^) is its own inverse: a ^ a = 0 for any integer a. XOR is also commutative and associative, so the order of operations doesn't matter. If you XOR every number in the array together, each pair cancels to 0 (a ^ a = 0), and 0 XOR anything is that anything (0 ^ x = x). So the running XOR of the entire array collapses to exactly the one unpaired value — no map, no sort, no extra space. One variable, one pass.\n\nThe deeper click is why commutativity and associativity matter here. Because XOR is commutative (a ^ b = b ^ a) and associative ((a ^ b) ^ c = a ^ (b ^ c)), you can rearrange the XOR of the entire array into any order you like. Group each pair together: (2 ^ 2) ^ (1 ^ 1) ^ 4 = 0 ^ 0 ^ 4 = 4. The pairs vanish and the singleton survives, regardless of where it sits in the array or what order the elements arrive in. This is why the algorithm doesn't need the array to be sorted or the singleton to be in any particular position — the algebra guarantees the result.\n\nThis self-canceling property makes XOR a quiet workhorse across computing. It's the engine behind parity checks (flip one bit, XOR detects it), swap-without-temp (a ^ b into a, then back into b), one-time-pad encryption (XOR the plaintext with a key, XOR again with the same key to decrypt), and the missing-number trick (XOR all indices with all values to find the one value that's absent). Whenever a problem involves pairs that should cancel and one element that doesn't, XOR is the first tool to reach for.",
    examples: [
      { in: "nums = [2, 2, 1]", out: "1" },
      { in: "nums = [4, 1, 2, 1, 2]", out: "4" },
      { in: "nums = [1]", out: "1" }
    ],
    constraints: [
      "nums has between 1 and 3×10^4 elements; each value is an integer in the range [-3×10^4, 3×10^4].",
      "Every element appears exactly twice, except for one element which appears exactly once. The array is not sorted.",
      "Your solution must run in O(n) time and use O(1) extra space — no hash map, no sorting. Use the XOR operator.",
      "The result is guaranteed to be a valid 32-bit signed integer (no overflow)."
    ],
    whyItMatters: "This puzzle is the friendliest possible introduction to bit manipulation — the idea that the bitwise operators aren't just low-level plumbing, but carry algebraic properties you can exploit to replace entire data structures. The XOR operator has three properties that make it magical for this problem: it's its own inverse (a ^ a = 0), it has 0 as its identity (0 ^ a = a), and it's commutative and associative (order doesn't matter). Those three properties together mean that XOR-ing a stream of values where everything appears twice and one thing appears once is a computation that collapses to the singleton — no bookkeeping required.\n\nThe transferable habit is to ask, of any problem involving pairs and a single outlier: is there an operation that cancels pairs? XOR cancels identical pairs. Subtraction cancels if you can pair them in order. Set symmetric difference cancels identical sets. The pattern is always the same — find the operation whose self-inverse property makes the pairs vanish, and the outlier falls out for free. This is the same instinct behind finding the missing number from 0 to n (XOR all indices with all values), detecting a single bit flip in a data stream (parity bits), and the swap-two-variables-without-a-temp trick.\n\nThe subtler lesson is about the gap between 'correct' and 'elegant.' The hash-map solution is correct and runs in the same asymptotic time. But it pays O(n) space for information that's already latent in the numbers themselves — the pairing structure that XOR exploits for free. The XOR solution doesn't store anything because it doesn't need to remember the counts; it relies on the algebra to do the bookkeeping implicitly. Recognizing when a problem's structure makes a data structure unnecessary — when the data itself carries the answer if you apply the right operation — is what separates a programmer who reaches for the standard tool from one who reaches for the elegant one.",
    hint: "XOR is its own inverse: a ^ a = 0 for any a. And 0 ^ x = x. So if you XOR every number in the array together, each pair cancels to 0, and 0 XOR the singleton is the singleton. One variable, one pass, no map needed.",
    solution: {
      lang: "javascript",
      code: "function singleNumber(nums) {\n  let result = 0;\n  for (const num of nums) {\n    result ^= num;\n  }\n  return result;\n}\n",
      notes: "One pass, one variable, O(n) time, O(1) space. The running XOR starts at 0 (the identity element) and accumulates each number. Every paired value cancels itself (a ^ a = 0); the unpaired value has nothing to cancel with, so it survives as the final result.\n\nTrace example 1: nums = [2, 2, 1].\n• result = 0.\n• result ^= 2 → 2. (0 ^ 2 = 2.)\n• result ^= 2 → 0. (2 ^ 2 = 0 — the first pair cancels.)\n• result ^= 1 → 1. (0 ^ 1 = 1 — the singleton survives.)\n• return 1. ✓\n\nTrace example 2: nums = [4, 1, 2, 1, 2].\n• result = 0.\n• result ^= 4 → 4. (Binary: 000 ^ 100 = 100.)\n• result ^= 1 → 5. (Binary: 100 ^ 001 = 101.)\n• result ^= 2 → 7. (Binary: 101 ^ 010 = 111.)\n• result ^= 1 → 6. (Binary: 111 ^ 001 = 110.)\n• result ^= 2 → 4. (Binary: 110 ^ 010 = 100.)\n• return 4. ✓\n  Notice the intermediate values look chaotic (4, 5, 7, 6, 4) — the XOR doesn't 'track' the singleton as it goes. It only collapses to the answer at the end, after every pair has cancelled. The 1s cancel (appearing at positions 1 and 3), the 2s cancel (positions 2 and 4), and 4 was never paired.\n\nTrace example 3: nums = [1].\n• result = 0.\n• result ^= 1 → 1. (0 ^ 1 = 1 — nothing to cancel with.)\n• return 1. ✓\n\nWhy commutativity and associativity guarantee correctness: because XOR is commutative (a ^ b = b ^ a) and associative ((a ^ b) ^ c = a ^ (b ^ c)), the final result doesn't depend on the order of the array. You can mentally rearrange the XOR chain to group each pair: for [4, 1, 2, 1, 2], that's (1 ^ 1) ^ (2 ^ 2) ^ 4 = 0 ^ 0 ^ 4 = 4. No matter where the singleton sits or what order the pairs arrive in, the result is the same. This is why the algorithm needs no sorting — the algebra handles the pairing for you.\n\nWhy the hash-map approach is correct but wasteful: a Map counting occurrences finds the singleton in O(n) time, but it spends O(n) space storing information that XOR computes for free. The XOR solution exploits the fact that the pairing structure is already encoded in the numbers themselves — you don't need to remember the counts because the operation a ^ a = 0 does the bookkeeping implicitly.\n\nEdge cases: a single-element array returns that element (0 ^ x = x). Negative numbers work because JavaScript's bitwise XOR operates on 32-bit signed integers — -3 ^ -3 = 0 just as reliably as 3 ^ 3 = 0. The result is always a valid 32-bit signed integer because the unpaired value fits in that range by the constraints."
    }
  },
  {
    id: "the-robbers-route",
    date: "2026-09-15",
    title: "The Robber's Route",
    blurb: "A row of houses, each with cash inside. You can rob any house but never two adjacent ones — the alarm chains them together. The reflex is to try every combination; the click is that each house asks only one question: rob this one plus the best of two ago, or skip and carry the best of one ago.",
    difficulty: "Medium",
    minutes: 10,
    tags: ["dynamic-programming", "arrays"],
    prompt: "You're a burglar casing a street of houses arranged in a row. Each house has a known amount of cash inside — given as a non-negative integer array houses, where houses[i] is the money in house i. You can rob any house you like, but adjacent houses are wired to a shared alarm: if you rob two houses in a row (house i and house i+1), the alarm trips. So you must pick a subset of houses, no two adjacent, that maximizes the total cash. Return that maximum.\n\nSo houses = [1, 2, 3, 1] returns 4: rob house 0 (cash 1) and house 2 (cash 3) — total 4 — skipping houses 1 and 3. Robbing house 1 and house 3 would give only 3. houses = [2, 7, 9, 3, 1] returns 12: rob house 0 (2), house 2 (9), and house 4 (1) — total 12 — the best selection skips the 7 and the 3 because taking them would block access to the richer 9. And houses = [2, 1, 1, 2] returns 4: rob house 0 (2) and house 3 (2) — total 4 — even though the houses in between look tempting, taking either would block the other end.\n\nThe reflex is to enumerate every valid subset of houses (no two adjacent) and take the maximum total. That's correct — for 4 houses there are 8 subsets and you can check them all. But for 100 houses, the number of valid subsets is the 100th Fibonacci number — over 350 digits long. You'd be enumerating an astronomically large search space, and almost every subset is strictly worse than the best. The structure you're missing is that the decision at each house is local: you either rob it or you don't, and that choice only interacts with what you did at the previous house.\n\nThe click is that the best total up to house i satisfies a simple recurrence. Let dp[i] be the maximum cash you can collect from houses 0 through i. At house i you have two options: rob it (collect houses[i], but then you couldn't have robbed house i-1, so you add dp[i-2]), or skip it (carry forward dp[i-1]). The better option wins: dp[i] = max(dp[i-1], dp[i-2] + houses[i]). That's it — one pass, each house is one comparison and one addition, and the answer is dp[n-1].\n\nThe deeper click is that the recurrence only ever looks back two steps, so you don't need an array at all. Two variables — the best up to two houses ago and the best up to the previous house — roll forward like a Fibonacci pair. Each step computes the new best, shifts the window, and forgets everything older. O(n) time, O(1) space, and the entire table collapses into three numbers. The array you would have built is gone — not because you optimized it away, but because the dependency structure never needed it.",
    examples: [
      { in: "houses = [1, 2, 3, 1]", out: "4" },
      { in: "houses = [2, 7, 9, 3, 1]", out: "12" },
      { in: "houses = [2, 1, 1, 2]", out: "4" }
    ],
    constraints: [
      "houses has between 1 and 100 elements; each value is a non-negative integer up to 400.",
      "You may rob any subset of houses as long as no two robbed houses are adjacent (index difference of at least 2).",
      "Return the maximum total cash achievable. An empty street returns 0.",
      "Aim for O(n) time and O(1) extra space — the recurrence only looks back two steps, so no array is needed."
    ],
    whyItMatters: "This puzzle is the friendliest possible introduction to dynamic programming — the idea that a problem with an exponential search space can collapse to a linear scan when each decision only depends on a fixed window of prior decisions. The recurrence dp[i] = max(dp[i-1], dp[i-2] + houses[i]) looks obvious once you see it, but the instinct to reach for it is what separates brute force from dynamic programming: you stop asking 'what is the best subset?' and start asking 'at each house, what is the best I can do so far?' The subset is never enumerated; it's implicit in the chain of choices.\n\nThe transferable habit is to look for overlapping subproblems — situations where the same sub-question ('best total up to house i') is asked and re-asked across many branches of a search tree. Once you spot that the same question repeats, you cache the answer (in a table, or in two rolling variables) and turn an exponential tree into a linear chain. That same instinct powers longest-increasing-subsequence, edit distance, knapsack, and every problem where 'the best solution to the whole' decomposes into 'the best solution to a prefix plus one decision.'\n\nThe subtler lesson is the space optimization, and it's more than a neat trick: it's a window into the structure of the recurrence itself. The dp table stores an answer for every house, but the recurrence only ever reads dp[i-1] and dp[i-2] — a window of width 2. When a recurrence's lookback is bounded by a constant k, you need only k variables, not a full table. Recognizing this collapses O(n) space to O(1) without changing a line of logic. The same observation turns the Fibonacci recurrence into two rolling variables, turns edit distance from O(n*m) space to O(min(n,m)) space, and turns sliding-window-maximum from a deque-of-all-positions into a deque-of-relevant-positions. Whenever you build a dp table, ask: how far back does the recurrence actually look? That width is the only memory you need.",
    hint: "Walk the houses left to right, tracking two values: the best total up to the previous house (prev1) and the best up to two houses ago (prev2). At each house, the best you can do is max(prev1, prev2 + houses[i]) — either skip this house and carry prev1, or rob it and add to prev2. Shift the window forward. No array needed; two rolling variables suffice.",
    solution: {
      lang: "javascript",
      code: "function rob(houses) {\n  let prev2 = 0; // best total up to two houses ago\n  let prev1 = 0; // best total up to the previous house\n  for (const money of houses) {\n    const best = Math.max(prev1, prev2 + money);\n    prev2 = prev1;\n    prev1 = best;\n  }\n  return prev1;\n}\n",
      notes: "One pass, two rolling variables, O(n) time, O(1) space. The recurrence is dp[i] = max(dp[i-1], dp[i-2] + houses[i]), but since each step only reads the last two values, the entire dp table collapses into prev1 and prev2.\n\nTrace example 1: houses = [1, 2, 3, 1].\n• prev2=0, prev1=0.\n• house 1: best = max(0, 0+1) = 1. prev2=0, prev1=1. (Rob house 0: total 1.)\n• house 2: best = max(1, 0+2) = 2. prev2=1, prev1=2. (Rob house 1 alone: total 2. Better than robbing house 0.)\n• house 3: best = max(2, 1+3) = 4. prev2=2, prev1=4. (Rob house 0 + house 2: total 4. Better than skipping to keep 2.)\n• house 1: best = max(4, 2+1) = 4. prev2=4, prev1=4. (Skip house 3: 4 is still the best — robbing house 1 + house 3 gives only 3.)\n• return 4. ✓ (Rob houses 0 and 2: 1 + 3 = 4.)\n\nTrace example 2: houses = [2, 7, 9, 3, 1].\n• prev2=0, prev1=0.\n• house 2: best = max(0, 0+2) = 2. prev2=0, prev1=2. (Rob house 0: total 2.)\n• house 7: best = max(2, 0+7) = 7. prev2=2, prev1=7. (Rob house 1 alone: 7 > 2.)\n• house 9: best = max(7, 2+9) = 11. prev2=7, prev1=11. (Rob house 0 + house 2: 2+9 = 11. Better than 7.)\n• house 3: best = max(11, 7+3) = 11. prev2=11, prev1=11. (Skip house 3: 11 is still best. Robbing house 1+3 = 10 < 11.)\n• house 1: best = max(11, 11+1) = 12. prev2=11, prev1=12. (Rob the best-up-to-3 plus house 4: 11+1 = 12.)\n• return 12. ✓ (Rob houses 0, 2, and 4: 2 + 9 + 1 = 12.)\n\nTrace example 3: houses = [2, 1, 1, 2].\n• prev2=0, prev1=0.\n• house 2: best = max(0, 0+2) = 2. prev2=0, prev1=2. (Rob house 0: total 2.)\n• house 1: best = max(2, 0+1) = 2. prev2=2, prev1=2. (Skip house 1: 2 is still better. Robbing house 1 alone gives 1.)\n• house 1: best = max(2, 2+1) = 3. prev2=2, prev1=3. (Rob house 0 + house 2: 2+1 = 3.)\n• house 2: best = max(3, 2+2) = 4. prev2=3, prev1=4. (Rob best-up-to-1 + house 3: 2+2 = 4. Better than 3.)\n• return 4. ✓ (Rob houses 0 and 3: 2 + 2 = 4. The two middle houses are a trap — taking either blocks the richer end.)\n\nWhy the recurrence is correct: at each house i, the optimal choice is either to skip it (the best total up to i is the same as up to i-1) or to rob it (you collect houses[i] plus the best total up to i-2, since i-1 is now off-limits). No third option exists — you either take this house or you don't — and the two cases cover every valid subset. The recurrence doesn't remember which houses were robbed; it only remembers the best total, and that's all the next house needs.\n\nWhy O(1) space works: the recurrence reads dp[i-1] and dp[i-2] and writes dp[i]. Once dp[i] is computed, dp[i-2] is never read again. So two variables — prev1 (dp[i-1]) and prev2 (dp[i-2]) — are sufficient. Each step computes best, then shifts: prev2 becomes the old prev1, prev1 becomes best. The entire dp array is replaced by a sliding window of width 2.\n\nThe space-optimization principle generalizes: any recurrence whose lookback is bounded by a constant k can be computed with k rolling variables instead of an O(n) table. Fibonacci needs 2, the house robber needs 2, a 3rd-order recurrence needs 3. The width of the lookback is the width of the memory you keep."
    }
  },
  {
    id: "the-hare-and-the-tortoise",
    date: "2026-09-14",
    title: "The Hare and the Tortoise",
    blurb: "A corridor of rooms might loop back on itself — but you can't see the connection from the entrance. Send a hare and a tortoise through at different speeds. If one laps the other, you've found the loop — in O(1) space, no map of the floor plan required.",
    difficulty: "Easy",
    minutes: 8,
    tags: ["linked-list", "two-pointers"],
    prompt: "You're given the head of a singly linked list. Each node has a value and a next pointer to the next node. The last node's next pointer might be null (the corridor ends) or might point back to some earlier node in the list (the corridor loops — you'd walk it forever). You can't tell from any single node whether it's part of a loop; you can only learn it by walking. Return true if the list contains a cycle, false if it terminates.\n\nThe list is described by two things: an array of values in order, and a position pos — the 0-indexed node the tail's next pointer connects back to (or -1 if the tail points to null). So values = [3, 2, 0, -4] with pos = 1 means: 3 → 2 → 0 → -4 → back to 2, and the cycle is 2 → 0 → -4 → 2 → ... — return true. values = [1, 2] with pos = 0 means: 1 → 2 → back to 1 — return true. And values = [1] with pos = -1 means: 1 → null — a single room, no loop — return false.\n\nThe reflex is to remember where you've been: walk the list and drop each visited node into a hash set; if you ever arrive at a node already in the set, there's a cycle; if you reach null, there isn't. That's correct and it's O(n) time — but it costs O(n) extra space for the set, and it throws away a structural fact you could exploit: a cycle means the list is infinite, and two travelers moving at different speeds through an infinite loop can never stay ahead of each other forever.\n\nThe click is Floyd's tortoise and hare. Send two pointers from the head: the tortoise moves one node per step, the hare moves two. If there's no cycle, the hare reaches null first and you stop — return false. If there is a cycle, the hare enters it, runs around, and eventually catches the tortoise from behind — they land on the same node, and you return true. No set, no map, no memory of where you've been: two pointers, constant space.\n\nThe deeper click is why the hare is guaranteed to catch the tortoise, not just chase it forever. Once both are inside the cycle, think of the gap between them (measured in steps around the cycle). Each tick, the tortoise advances 1 and the hare advances 2, so the gap shrinks by exactly 1. A gap that shrinks by 1 each step must reach 0 — it can never skip over 0, because it goes ..., 3, 2, 1, 0. If the gap were shrinking by 2, the hare could leapfrog the tortoise (gap 1 → gap -1, a miss), but a relative speed of 1 guarantees a meeting. So the hare doesn't just chase the tortoise — it closes on it at a fixed rate, and a fixed closing rate in a finite space means a guaranteed collision.",
    examples: [
      { in: "values = [3, 2, 0, -4], pos = 1", out: "true" },
      { in: "values = [1, 2], pos = 0", out: "true" },
      { in: "values = [1], pos = -1", out: "false" }
    ],
    constraints: [
      "The list has between 0 and 10^4 nodes; each value is an integer between -10^5 and 10^5.",
      "pos is the 0-indexed position the tail connects back to, or -1 if the tail points to null. The cycle (if any) always begins at a node that is already in the list — no external references.",
      "Return true if some node's next pointer eventually leads back to an earlier node (a cycle); false if following next pointers reaches null.",
      "Aim for O(n) time and O(1) extra space — do not store visited nodes in a set. Use Floyd's two-pointer cycle detection."
    ],
    whyItMatters: "This puzzle is the friendliest introduction to the two-pointer technique on linked lists, and to a principle that reaches far beyond them: when a structure might be infinite, relative motion reveals it. The tortoise and hare work because a cycle is the only way two pointers moving at different speeds can meet again — in an acyclic list, the hare simply reaches the end and stops. That same instinct — 'send probes at different speeds and see if one laps the other' — is the backbone of cycle detection in directed graphs (where you'd look for a repeated state), in iteration-detection for pseudo-random sequences (Brent's improvement to Floyd's method), and even in the Pollard rho integer-factorization algorithm, which finds a factor by running two copies of a polynomial iteration at different speeds and watching for a collision modulo the unknown factor. The transferable habit is to ask, of any 'does this terminate?' or 'is there a repeat?' question: can two travelers at different speeds settle it without remembering the path?\n\nThe subtler lesson is why a relative speed of 1 is what makes the meeting guaranteed, and why a faster hare wouldn't help. Inside the cycle, the gap between the hare and the tortoise shrinks by 1 each step — so it passes through every integer value down to 0, and 0 is the meeting. If the hare moved 3 steps per tick (relative speed 2), the gap would shrink by 2 and could jump from 1 to -1, skipping 0 and never landing on the tortoise — you'd chase forever in a cycle of odd length. The choice of speeds (1 and 2) isn't arbitrary; it's the fastest pair that still guarantees a collision in every cycle. Recognizing that 'faster is not always better' — that the relative speed must divide the structure you're searching — is what turns a neat trick into a method you can trust and extend.",
    hint: "Two pointers from the head: a slow pointer (tortoise) moving one node per step and a fast pointer (hare) moving two. If the hare ever reaches null (or its next is null), the list terminates — return false. If the hare and tortoise ever land on the same node, there's a cycle — return true. No set needed; the gap inside the cycle shrinks by 1 each step, so a collision is guaranteed.",
    solution: {
      lang: "javascript",
      code: "function hasCycle(head) {\n  let slow = head, fast = head;\n  while (fast && fast.next) {\n    slow = slow.next;\n    fast = fast.next.next;\n    if (slow === fast) return true;\n  }\n  return false;\n}\n",
      notes: "Two pointers, one pass, constant space. The tortoise (slow) advances one node; the hare (fast) advances two. If the list is acyclic, fast reaches null first and the loop ends. If it's cyclic, both pointers enter the cycle and the gap between them shrinks by 1 each step until they collide. O(n) time, O(1) space.\n\nTrace example 1: values = [3, 2, 0, -4], pos = 1.\n  List: 3 → 2 → 0 → -4 → (back to 2). Cycle: 2 → 0 → -4 → 2 → ...\n• slow = 3, fast = 3 (both at head).\n• Step 1: slow = 2, fast = 0. (slow: 3→2; fast: 3→2→0.)\n• Step 2: slow = 0, fast = 2. (slow: 2→0; fast: 0→-4→2.)\n• Step 3: slow = -4, fast = -4. (slow: 0→-4; fast: 2→0→-4.) slow === fast → return true. ✓\n  Notice the gap inside the cycle: at step 1, the hare is 1 node ahead of the tortoise (both in the cycle from step 1 on). The gap is 1 → shrinks by 1 → 0 at step 3. The hare lapped back to the tortoise.\n\nTrace example 2: values = [1, 2], pos = 0.\n  List: 1 → 2 → (back to 1). Cycle: 1 → 2 → 1 → ...\n• slow = 1, fast = 1 (both at head, which is in the cycle).\n• Step 1: slow = 2, fast = 1. (slow: 1→2; fast: 1→2→1.)\n• Step 2: slow = 1, fast = 1. (slow: 2→1; fast: 1→2→1.) slow === fast → return true. ✓\n  The gap starts at 0 (both at head), and after one lap the hare returns to where the tortoise now sits.\n\nTrace example 3: values = [1], pos = -1.\n  List: 1 → null.\n• slow = 1, fast = 1. fast.next is null → the while condition (fast && fast.next) fails immediately.\n• return false. ✓ A single node with no cycle — the hare can't even take one step.\n\nWhy the meeting is guaranteed inside a cycle: suppose the cycle has length L. Once both pointers are inside it, the hare gains 1 step on the tortoise each tick (hare moves 2, tortoise moves 1, relative speed 1). The gap, measured modulo L, decreases by 1 each tick. Starting from any gap value in {0, 1, ..., L-1}, it must reach 0 within at most L steps — because a sequence that counts down by 1 through every integer cannot skip 0. So they collide in at most L steps after both enter the cycle, and L ≤ n, giving O(n) total time.\n\nWhy a faster hare would break: if the hare moved 3 steps per tick (relative speed 2), the gap would shrink by 2 each tick. In a cycle of odd length L, starting from gap 1, the gap goes 1 → -1 (mod L) = L-1 → L-3 → ... and may skip 0 entirely — the hare leapfrogs the tortoise every lap and never lands on it. Speeds 1 and 2 are the fastest pair with a relative speed (1) that divides every possible cycle length, so the collision is guaranteed for all L.\n\nEdge case — empty list: if head is null, the while condition fails immediately and we return false. A null list trivially has no cycle.\n\nThe hash-set alternative (O(n) time, O(n) space) is correct but uses linear memory:\n\n  function hasCycle(head) {\n    const seen = new Set();\n    let node = head;\n    while (node) {\n      if (seen.has(node)) return true;\n      seen.add(node);\n      node = node.next;\n    }\n    return false;\n  }\n\nIt remembers every visited node. Floyd's method achieves the same result with two pointers and no memory — the relative motion of the two travelers is the detector."
    }
  },
  {
    id: "running-on-empty",
    date: "2026-09-13",
    title: "Running on Empty",
    blurb: "A circular road trip has gas stations, each with fuel to give and fuel to burn. Total fuel is enough for the whole trip — but only one starting station gets you all the way around. The stations that fail tell you exactly where the right one must be.",
    difficulty: "Medium",
    minutes: 10,
    tags: ["greedy", "arrays"],
    prompt: "You're driving a circular route with n gas stations. At station i you can fill up gas[i] liters, and driving from station i to the next station (clockwise) costs cost[i] liters. Your tank starts empty at whichever station you choose, and you can fill up there before departing. You want to complete the full circuit — visit every station in order and return to your starting point — without the tank ever going negative. Return the index of the starting station that makes this possible, or -1 if no station works.\n\nSo gas = [1, 2, 3, 4, 5] and cost = [3, 4, 5, 1, 2] returns 3: starting at station 3, you fill 4 liters, burn 1 to reach station 4 (tank 3), fill 5 more (tank 8), burn 2 to reach station 0 (tank 6), fill 1 (tank 7), burn 3 to reach station 1 (tank 4), fill 2 (tank 6), burn 4 to reach station 2 (tank 2), fill 3 (tank 5), burn 5 to return to station 3 (tank 0). You made it around. And gas = [2, 3, 4] with cost = [3, 4, 3] returns -1: total fuel is 9 but the total cost is 10, so no matter where you start, you'll run dry before completing the circuit.\n\nThe reflex is to try every station as a starting point and simulate the circuit for each — n starting points, each a trip of up to n steps, O(n²) time. It's correct, and for five stations it's instant. But for a route with 100,000 stations, that's ten billion steps — most of them re-tracing the same segments you already drove. The structure you're missing is that the failures are informative: if you start at station A and your tank goes negative somewhere around station B, then every station between A and B is also a dead end — because each one would have started with even less fuel than you had when you drove past it. The failure doesn't just say \"A doesn't work\" — it says \"nothing from A to B can work,\" and the valid start must be after B.\n\nThe click is a one-pass greedy. Walk the stations in order, tracking a running tank — the fuel you'd have if you'd started at the current candidate. Each step, add gas[i] - cost[i] to the tank. If the tank ever goes negative, this stretch is unreachable from the current candidate: reset the candidate to i + 1 and the tank to 0, as if you're saying \"start fresh from the next station.\" After one pass, check the grand total: if total gas >= total cost, a solution exists, and the candidate you landed on is it. If total gas < total cost, return -1 — the route is genuinely infeasible.\n\nThe deeper click is why resetting is safe. The key observation is that if you can't reach station B from station A, then you can't reach station B from any station between A and B either. Here's why: when your tank went negative at some point between A and B, it means the cumulative surplus from A to that point was negative. Any station between A and that point would have started with at most as much fuel as you had when you passed it (you arrived with a non-negative tank and filled up there), so it faces the same deficit or worse. This means the stretch from A to the failure point is a dead zone — no station in it can be a valid start — so you can safely discard the entire stretch and look only at what comes after. The algorithm is, in disguise, a series of \"skip the dead zone\" moves, each one shrinking the candidate range, all converging on the one station that survives.",
    examples: [
      { in: "gas = [1, 2, 3, 4, 5], cost = [3, 4, 5, 1, 2]", out: "3" },
      { in: "gas = [2, 3, 4], cost = [3, 4, 3]", out: "-1" },
      { in: "gas = [3, 1, 5, 2, 8], cost = [4, 3, 5, 2, 5]", out: "2" }
    ],
    constraints: [
      "gas and cost have the same length n, between 1 and 10^5. Each value is a non-negative integer up to 10^4.",
      "gas[i] is the fuel available at station i; cost[i] is the fuel burned driving from station i to station i + 1 (wrapping around). The tank starts at 0 and must never go negative.",
      "If no starting station can complete the circuit, return -1. If one exists, it is unique — return its index.",
      "Aim for O(n) time and O(1) extra space — no nested-loop simulation."
    ],
    whyItMatters: "This puzzle is the friendliest introduction to the greedy reset — a pattern where each failure doesn't just reject one candidate but eliminates an entire range of them, so the answer falls out of one pass. The instinct that makes it work is: \"if I can't get from here to there, then nothing between here and there can get to there either.\" That same argument powers the maximum-subarray reset (when the running sum goes negative, drop the whole prefix — it can only drag down any future sum), the jump-game greedy (if you can't reach position j from any position before i, skip to i), and the scheduling intuition that a locally bad prefix can be discarded without loss. The transferable habit is to ask, of any problem where you're searching for a starting point: does each failure tell me not just that this candidate is wrong, but that a whole range of candidates is wrong? If the failures partition the search space, one pass suffices.\n\nThe subtler lesson is about the relationship between the feasibility check and the search. The algorithm does two things in one pass: it checks feasibility (total gas >= total cost) and it finds the start (the reset candidate). These are not independent — the feasibility check is what makes the reset safe. If the total is non-negative, then the surplus accumulated in the good stretches must be enough to cover the deficits in the bad ones, so the last surviving candidate — the one that never got reset — sits at the beginning of a stretch with enough surplus to carry through every deficit that follows. The proof is a conservation argument: the total surplus equals the total deficit plus whatever's left, so the last good stretch must generate enough surplus to absorb every subsequent dip. Recognizing that a feasibility condition and a search can share the same pass — that the invariant that makes the answer exist is also the invariant that makes the search correct — is what separates a clever trick from a general technique.",
    hint: "Walk the stations in one pass, tracking a running tank (gas[i] - cost[i] accumulated). Whenever the tank goes negative, the current candidate is a dead end — and so is every station between it and the failure point. Reset the candidate to the next station and the tank to 0. After the pass, check whether total gas >= total cost: if yes, return the candidate; if no, return -1.",
    solution: {
      lang: "javascript",
      code: "function canCompleteCircuit(gas, cost) {\n  let total = 0, tank = 0, start = 0;\n  for (let i = 0; i < gas.length; i++) {\n    tank += gas[i] - cost[i];\n    if (tank < 0) {\n      start = i + 1;\n      tank = 0;\n    }\n    total += gas[i] - cost[i];\n  }\n  return total >= 0 ? start : -1;\n}\n",
      notes: "One pass, three running variables. The tank tracks the fuel you'd have if you started at the current candidate — when it goes negative, the candidate through this point is a dead zone, so you reset. The total is the global fuel balance; if it's non-negative, a solution exists, and the surviving candidate is it. O(n) time, O(1) space.\n\nTrace example 1: gas = [1, 2, 3, 4, 5], cost = [3, 4, 5, 1, 2].\n• total=0, tank=0, start=0.\n• i=0: tank = 0 + (1−3) = −2. tank < 0 → start=1, tank=0. total = −2.\n• i=1: tank = 0 + (2−4) = −2. tank < 0 → start=2, tank=0. total = −4.\n• i=2: tank = 0 + (3−5) = −2. tank < 0 → start=3, tank=0. total = −6.\n• i=3: tank = 0 + (4−1) = 3. tank ≥ 0 → keep going. total = −3.\n• i=4: tank = 3 + (5−2) = 6. tank ≥ 0 → keep going. total = 0.\n• total = 0 ≥ 0 → return 3. ✓\n  Verify by simulation: start at 3 with empty tank. Fill 4, burn 1 → tank 3 (at stn 4). Fill 5, burn 2 → tank 6 (at stn 0). Fill 1, burn 3 → tank 4 (at stn 1). Fill 2, burn 4 → tank 2 (at stn 2). Fill 3, burn 5 → tank 0 (back at stn 3). Circuit complete. ✓\n  The first three stations each had a deficit (gas < cost), so each was reset. Station 3 is the first with a surplus large enough to carry through the rest.\n\nTrace example 2: gas = [2, 3, 4], cost = [3, 4, 3].\n• total = (2−3) + (3−4) + (4−3) = −1 − 1 + 1 = −1.\n• total < 0 → return −1. ✓\n  Total fuel (9) is less than total cost (10). No starting station can complete the circuit — the route is infeasible regardless of where you begin.\n\nTrace example 3: gas = [3, 1, 5, 2, 8], cost = [4, 3, 5, 2, 5].\n• total=0, tank=0, start=0.\n• i=0: tank = 0 + (3−4) = −1. tank < 0 → start=1, tank=0. total = −1.\n• i=1: tank = 0 + (1−3) = −2. tank < 0 → start=2, tank=0. total = −3.\n• i=2: tank = 0 + (5−5) = 0. tank ≥ 0 → keep going. total = −2.\n• i=3: tank = 0 + (2−2) = 0. tank ≥ 0 → keep going. total = −1.\n• i=4: tank = 0 + (8−5) = 3. tank ≥ 0 → keep going. total = 0.\n• total = 0 ≥ 0 → return 2. ✓\n  Verify by simulation: start at 2 with empty tank. Fill 5, burn 5 → tank 0 (at stn 3). Fill 2, burn 2 → tank 0 (at stn 4). Fill 8, burn 5 → tank 3 (at stn 0). Fill 3, burn 4 → tank 2 (at stn 1). Fill 1, burn 3 → tank 0 (back at stn 2). Circuit complete. ✓\n  Stations 0 and 1 are dead zones — each has a deficit, so the algorithm skips past them. Station 2 breaks even (5−5=0) but doesn't go negative, so it survives. Stations 3 and 4 add surplus, and the cumulative surplus (3 from station 4) is enough to carry through the deficits at the start of the route (stations 0 and 1 cost 3 combined). The conservation argument: total surplus (8−5=3 at station 4) exactly covers the total deficit (−1 at station 0, −2 at station 1 = −3), so the last surviving candidate (station 2) is the one whose surplus feeds the wrap-around.\n\nWhy the reset is safe: if the tank goes negative at position j, then the cumulative sum from the current start to j is negative. Any station between the start and j would have started with at most as much fuel as you had when you passed it (you arrived with a non-negative tank and filled up), so it faces the same deficit or worse. The entire stretch [start, j] is a dead zone — no station in it can reach beyond j — so discarding it and restarting at j+1 loses nothing. The last candidate that survives to the end is the one whose surplus carries through every subsequent deficit, which is exactly the valid starting point.\n\nWhy the feasibility check is necessary: if total gas < total cost, no starting station can complete the circuit — the route is infeasible by conservation of fuel. The algorithm would return some candidate, but that candidate can't actually make it around, so the total check gates the return. When total ≥ 0, the surplus in the good stretches must cover the deficits in the bad stretches, so the last surviving candidate — sitting at the head of the final good stretch — has enough surplus to absorb every dip that follows in the wrap-around."
    }
  },
  {
    id: "the-peak-of-the-trail",
    date: "2026-09-11",
    title: "The Peak of the Trail",
    blurb: "A trail's elevation readings hide a local high point — a spot higher than both its neighbors. Scanning left to right works, but the slope under your feet can guide you to a peak in logarithmic time, even though the elevations aren't sorted.",
    difficulty: "Easy",
    minutes: 8,
    tags: ["binary-search", "arrays"],
    prompt: "You're given an array of integers representing elevation readings along a trail, in order. A reading is a \"peak\" if it's strictly higher than both of its neighbors. The two ends of the array have an implicit neighbor of negative infinity, so the first element only needs to beat the second, and the last only needs to beat the second-to-last. Return the index of any peak.\n\nSo [1, 2, 3, 1] returns 2: the reading 3 is higher than 2 on its left and 1 on its right. [1, 2, 1, 3, 5, 6, 4] returns 5: reading 6 is higher than 5 on its left and 4 on its right (index 1, value 2, is also a peak, but any one peak is a valid answer). And [1, 2] returns 1: the last element 2 beats 1 on its left and faces -∞ on its right.\n\nThe reflex is to walk left to right, checking each element against its neighbors until you find a peak — O(n) time, and for a short trail that's fine. But most of the work is wasted: you're checking flat stretches and valleys you don't care about, when all you need is one local high point and the slope under your feet already tells you which way to climb.\n\nThe click is that binary search works here even though the array isn't sorted. Pick the middle element. If it's a peak, you're done. If its right neighbor is higher, then you're standing on an uphill slope — and since the right edge of the array is -∞, the trail must come back down somewhere to the right. That transition from climbing to falling is a peak, guaranteed. So go right. If instead the left neighbor is higher, the same logic points left — go that way. Each step halves the search space, and you converge on a peak in O(log n) time.\n\nThe deeper click is why the guarantee holds. The argument is inductive: if nums[mid] < nums[mid+1], then the right half [mid+1, n-1] has a peak because it starts with an uphill step (nums[mid] → nums[mid+1]) and ends with a cliff (-∞ beyond the last element). You can't go up forever and then drop off a cliff without a peak somewhere in between — that's the intermediate value intuition applied to a discrete sequence. The same argument works for the left half. So every step of the binary search doesn't just shrink the search space — it preserves the invariant that a peak exists in the remaining range. That invariant is what makes the algorithm correct, not luck.",
    examples: [
      { in: "elevations = [1, 2, 3, 1]", out: "2" },
      { in: "elevations = [1, 2, 1, 3, 5, 6, 4]", out: "5" },
      { in: "elevations = [1, 2]", out: "1" }
    ],
    constraints: [
      "elevations has between 1 and 10^4 elements; each value is an integer that may be negative, zero, or positive.",
      "A peak is an element strictly greater than both neighbors; endpoints compare against only one neighbor (the other side is -∞).",
      "Adjacent elements are never equal, so a peak always exists.",
      "Return any valid peak index — multiple peaks may exist and any one is acceptable.",
      "Aim for O(log n) time using binary search — the array is not sorted, but the local slope is enough to guide you."
    ],
    whyItMatters: "This puzzle teaches the most surprising use of binary search: it works on unsorted data, as long as you can ask a directional question at each step. The classic binary search looks for a value in a sorted array — \"is the target left or right of the middle?\" But the underlying machinery is more general: any time you can examine the middle and determine which half must contain the answer, you can halve the search space. Here, the question isn't \"is the target here?\" but \"which direction is uphill?\" — and the slope tells you where a peak must live.\n\nThe transferable habit is to recognize when a problem has a monotonic or directional structure that binary search can exploit, even if the data isn't sorted. Finding a peak, finding the transition point in a bitonic array, finding the insertion point for a value in a sorted array, finding the first true in a predicate array — all share the same skeleton: examine the middle, decide which half contains the answer, discard the other. The peak problem is the most counterintuitive of the family because the array looks chaotic, but the local comparison is all the direction you need.\n\nThe subtler lesson is about invariants. The reason this works isn't that you happen to move toward a peak — it's that each step preserves the guarantee that a peak exists in the remaining range. You start knowing a peak exists (the array is finite and bounded by -∞ on both ends). Each step replaces the current range with a sub-range that still contains a peak, by the uphill-cliff argument. When the range collapses to a single element, that element must be a peak — not by luck, but because the invariant never broke. Recognizing that a binary search is really an invariant-preservation argument is what separates \"I memorized the template\" from \"I understand why it's correct.\"",
    hint: "Don't scan left to right. Pick the middle element and compare it to its right neighbor. If the right neighbor is higher, a peak must exist somewhere to the right (you're climbing uphill, and the right edge is -∞ — the trail has to come back down). Go right. If the middle is higher than its right neighbor, the peak is at mid or to its left. Halve the range each step.",
    solution: {
      lang: "javascript",
      code: "function findPeakElement(nums) {\n  let lo = 0, hi = nums.length - 1;\n  while (lo < hi) {\n    const mid = Math.floor((lo + hi) / 2);\n    if (nums[mid] > nums[mid + 1]) {\n      // mid is higher than its right neighbor: peak is at mid or to the left\n      hi = mid;\n    } else {\n      // mid's right neighbor is higher (or equal): peak is to the right\n      lo = mid + 1;\n    }\n  }\n  return lo;\n}\n",
      notes: "Binary search on an unsorted array. Each step compares nums[mid] to nums[mid+1] — one comparison, no neighbor on the other side needed. O(log n) time, O(1) space.\n\nTrace example 1: nums = [1, 2, 3, 1].\n• lo=0, hi=3. mid=1. nums[1]=2, nums[2]=3. 2 < 3 → go right: lo=2.\n• lo=2, hi=3. mid=2. nums[2]=3, nums[3]=1. 3 > 1 → peak is at 2 or left: hi=2.\n• lo=2, hi=2 → return 2. ✓ (value 3: 3 > 2 on the left, 3 > 1 on the right.)\n\nTrace example 2: nums = [1, 2, 1, 3, 5, 6, 4].\n• lo=0, hi=6. mid=3. nums[3]=3, nums[4]=5. 3 < 5 → go right: lo=4.\n• lo=4, hi=6. mid=5. nums[5]=6, nums[6]=4. 6 > 4 → peak is at 5 or left: hi=5.\n• lo=4, hi=5. mid=4. nums[4]=5, nums[5]=6. 5 < 6 → go right: lo=5.\n• lo=5, hi=5 → return 5. ✓ (value 6: 6 > 5 on the left, 6 > 4 on the right.)\n  Note: index 1 (value 2) is also a peak (2 > 1 and 2 > 1), but the binary search found index 5 — any peak is a valid answer.\n\nTrace example 3: nums = [1, 2].\n• lo=0, hi=1. mid=0. nums[0]=1, nums[1]=2. 1 < 2 → go right: lo=1.\n• lo=1, hi=1 → return 1. ✓ (value 2: beats 1 on the left, faces -∞ on the right.)\n\nWhy the invariant holds: at every step, the range [lo, hi] contains a peak. Initially this is true because the whole array has a peak (it's finite, bounded by -∞ on both ends, and adjacent elements are never equal). When nums[mid] < nums[mid+1], the right half [mid+1, hi] contains a peak: you're stepping uphill from mid to mid+1, and the right edge is -∞, so the sequence must transition from climbing to descending somewhere in [mid+1, hi]. That transition is a peak. When nums[mid] > nums[mid+1], the left half [lo, mid] contains a peak: mid itself could be one (if nums[mid] > nums[mid-1] too), or the peak is further left — but by the same uphill-cliff argument applied to the left side. Each step halves the range while preserving the guarantee, so the single remaining element must be a peak.\n\nWhy only one comparison is needed: the algorithm only checks nums[mid] vs nums[mid+1], never nums[mid] vs nums[mid-1]. This is sufficient because the comparison splits the range cleanly: if mid is higher than its right neighbor, the peak is at mid or left (hi = mid); if the right neighbor is higher, the peak is strictly to the right (lo = mid + 1). The left neighbor is never needed — the invariant does the heavy lifting.\n\nEdge case — single element [5]: lo=0, hi=0, the while loop doesn't execute, return 0. A single element is trivially a peak (both neighbors are -∞).\n\nEdge case — strictly increasing [1, 2, 3]: mid=1, nums[1]=2 < nums[2]=3 → lo=2. lo=2, hi=2 → return 2. The last element is a peak (3 > 2, right edge is -∞). Correct.\n\nEdge case — strictly decreasing [3, 2, 1]: mid=1, nums[1]=2 > nums[2]=1 → hi=1. lo=0, hi=1, mid=0, nums[0]=3 > nums[1]=2 → hi=0. return 0. The first element is a peak (3 > 2, left edge is -∞). Correct."
    }
  },
  {
    id: "waiting-for-warmer",
    date: "2026-09-10",
    title: "Waiting for Warmer",
    blurb: "Each day in the forecast, you want to know how many days until a warmer one. The reflex is to scan forward for each day — but a stack of unanswered days resolves them all in a single left-to-right pass.",
    difficulty: "Medium",
    minutes: 10,
    tags: ["stacks", "arrays"],
    prompt: "You're given an array of daily high temperatures — one integer (degrees Celsius) per day, in calendar order. For each day, return how many days you must wait until a strictly warmer day. If no warmer day ever follows, the answer for that day is 0.\n\nSo [73, 74, 75, 71, 69, 72, 76, 73] returns [1, 1, 4, 2, 1, 1, 0, 0]: after day 0 (73°) you wait 1 day for 74°, after day 2 (75°) you wait 4 days for 76°, and after day 6 (76°) nothing warmer follows so the answer is 0. And [55, 50, 53, 60] returns [3, 1, 1, 0]: day 0 (55°) waits 3 days for 60°, day 1 (50°) waits 1 day for 53°, and the last day has nothing warmer.\n\nThe reflex is, for each day, to scan forward until you find a warmer temperature — two nested loops, O(n²) time. It's correct and for eight days it's instant. But if the forecast runs a year, that's 365² ≈ 130,000 comparisons, and most of the work is wasted: you keep re-scanning the same suffix, re-checking the same temperatures, for each starting day. The structure you're missing is that each day's answer is the NEAREST warmer day to its right — and \"nearest element to the right that's bigger\" is a question a stack can answer in one pass.\n\nThe click is a monotonic stack — a stack of indices whose answers are still unknown, always decreasing in temperature (coldest day on top). Walk left to right. For each day, while the stack's top is colder than today, pop it and fill in its answer (today's index minus its index — that's the wait). Then push today's index onto the stack — it's now waiting for its own warmer future. The key insight is that a warm day resolves a whole run of colder days in a burst: every colder day sitting on the stack above a hot day is waiting for exactly this kind of arrival, and the nearest one to the right is the first one to arrive. Days that never get popped have no warmer future, and their answer stays 0.\n\nThe deeper click is why the monotonic property makes the answers correct. The stack is always decreasing — not because you sort it, but because any violation gets popped the instant a warmer day arrives. So the top of the stack is always the coldest undecided day, and the first day warm enough to pop it is necessarily the nearest warmer day to its right (every day between them was pushed and popped earlier, meaning each was colder than the day above it — so none was warm enough). The monotonic invariant isn't extra bookkeeping; it's maintained by the same pops that produce the answers, which is what makes the whole thing one clean pass.",
    examples: [
      { in: "temps = [73, 74, 75, 71, 69, 72, 76, 73]", out: "[1, 1, 4, 2, 1, 1, 0, 0]" },
      { in: "temps = [55, 50, 53, 60]", out: "[3, 1, 1, 0]" },
      { in: "temps = [70, 71]", out: "[1, 0]" }
    ],
    constraints: [
      "temps has between 1 and 10^5 elements; each temperature is an integer between 1 and 100 (degrees Celsius).",
      "For each day i, answer[i] is the number of days until the first day j > i with temps[j] > temps[i], or 0 if no such j exists.",
      "Aim for O(n) time using a monotonic decreasing stack — avoid the O(n²) nested-loop approach."
    ],
    whyItMatters: "This puzzle is the friendliest introduction to the monotonic stack — a pattern that sounds exotic but answers a surprisingly common question: \"for each element, what's the nearest element to the right that satisfies some property?\" Next greater element, stock span (the nearest day to the left with a higher price), the sliding-window maximum, and the building block of the largest-rectangle-in-histogram problem — all are the same skeleton with a different comparison. The transferable habit is to recognize the shape: if a problem asks \"for each position, find the nearest position to the right (or left) that passes a test,\" and the test is a comparison (warmer, taller, cheaper), a monotonic stack does it in one pass. The stack isn't storing data — it's storing a queue of questions that a future element will answer all at once.\n\nThe subtler lesson is about the invariant the stack maintains for free. The stack is always decreasing in temperature — not because you sort it, but because any element that violates the order gets popped (resolved) the instant a warmer day arrives. That invariant is what makes the algorithm correct: the top of the stack is always the coldest undecided day, so the first day warm enough to resolve it is also the nearest warmer day to its right. If the stack were not monotonic, a warm day might resolve a day that wasn't its nearest warmer — but the monotonic property guarantees every pop is the right answer. Recognizing that a data structure's invariant can be maintained by the same operations that solve the problem — no extra bookkeeping — is what turns a clever trick into a general-purpose tool.",
    hint: "Don't scan forward for each day. Keep a stack of indices whose answers are still unknown — it's always decreasing in temperature (coldest on top). When a warm day arrives, it resolves every colder day on the stack: pop each one and set its answer to the distance. Days that never get resolved have answer 0.",
    solution: {
      lang: "javascript",
      code: "function dailyTemperatures(temps) {\n  const n = temps.length;\n  const answer = new Array(n).fill(0);\n  const stack = []; // indices with decreasing temps (coldest on top)\n\n  for (let i = 0; i < n; i++) {\n    while (stack.length && temps[stack[stack.length - 1]] < temps[i]) {\n      const prev = stack.pop();\n      answer[prev] = i - prev;\n    }\n    stack.push(i);\n  }\n  return answer;\n}\n",
      notes: "One pass, one monotonic decreasing stack. Each index is pushed once and popped at most once, so the inner while loop runs at most n times total — O(n) time, O(n) space for the stack and answer array.\n\nTrace example 1: temps = [73, 74, 75, 71, 69, 72, 76, 73].\n• i=0: stack empty, push 0. stack=[0] (73°).\n• i=1: 73° < 74° → pop 0, answer[0] = 1−0 = 1. Push 1. stack=[1] (74°).\n• i=2: 74° < 75° → pop 1, answer[1] = 2−1 = 1. Push 2. stack=[2] (75°).\n• i=3: 75° > 71° → no pop. Push 3. stack=[2,3] (75°, 71°).\n• i=4: 71° > 69° → no pop. Push 4. stack=[2,3,4] (75°, 71°, 69°).\n• i=5: 69° < 72° → pop 4, answer[4] = 5−4 = 1. 71° < 72° → pop 3, answer[3] = 5−3 = 2. 75° > 72° → stop. Push 5. stack=[2,5] (75°, 72°).\n• i=6: 72° < 76° → pop 5, answer[5] = 6−5 = 1. 75° < 76° → pop 2, answer[2] = 6−2 = 4. Stack empty → push 6. stack=[6] (76°).\n• i=7: 76° > 73° → no pop. Push 7. stack=[6,7] (76°, 73°).\n• answer = [1, 1, 4, 2, 1, 1, 0, 0]. ✓\n  Notice day 6 resolves three days at once: day 5 (72° → 1 day), day 2 (75° → 4 days). A single warm arrival clears the whole backlog.\n\nTrace example 2: temps = [55, 50, 53, 60].\n• i=0: stack empty, push 0. stack=[0] (55°).\n• i=1: 55° > 50° → no pop. Push 1. stack=[0,1] (55°, 50°).\n• i=2: 50° < 53° → pop 1, answer[1] = 2−1 = 1. 55° > 53° → stop. Push 2. stack=[0,2] (55°, 53°).\n• i=3: 53° < 60° → pop 2, answer[2] = 3−2 = 1. 55° < 60° → pop 0, answer[0] = 3−0 = 3. Stack empty → push 3. stack=[3].\n• answer = [3, 1, 1, 0]. ✓\n  Day 3 (60°) resolves the entire backlog — both day 0 and day 2 were waiting for exactly this.\n\nTrace example 3: temps = [70, 71].\n• i=0: stack empty, push 0. stack=[0] (70°).\n• i=1: 70° < 71° → pop 0, answer[0] = 1−0 = 1. Stack empty → push 1. stack=[1].\n• answer = [1, 0]. ✓\n\nWhy each answer is correct: the stack is always decreasing in temperature, so the coldest undecided day is on top. When day i arrives and the top is colder, i is the first warmer day the top has encountered — every day between the top and i was pushed and popped earlier (meaning each was colder than whatever was above it), so none was warm enough to resolve the top. That's why one pass suffices: the monotonic property guarantees the first warm day to pop an index is the nearest warmer day to its right.\n\nWhy O(n) despite the nested loop: each index is pushed exactly once and popped at most once. The inner while loop's total iterations across the entire function is at most n — not n per iteration. The stack's lifetime is 2n operations (n pushes + at most n pops), so the amortized cost per element is O(1). This is the same amortization argument behind hash-table resizing and dynamic-array doubling: a nested loop whose inner body runs a bounded total number of times is still O(n)."
    }
  },
  {
    id: "the-pen-name",
    date: "2026-09-09",
    title: "The Pen Name",
    blurb: "Two strings use different letters but follow the exact same pattern — each character in the first has a fixed stand-in in the second. But the aliasing must work both ways, and that's where most solutions stumble.",
    difficulty: "Easy",
    minutes: 7,
    tags: ["hashing", "strings"],
    prompt: "You're given two strings s and t of the same length. They're \"isomorphic\" if you can replace every occurrence of a character in s with a fixed character to get t — each character in s maps to one and only one character in t, and no two characters in s map to the same character in t. In other words, the mapping is a bijection: one-to-one and onto. Return true if the strings are isomorphic, false otherwise.\n\nSo s = \"egg\" and t = \"add\" return true: e maps to a, g maps to d, and g maps to d again — consistent both ways. s = \"foo\" and t = \"bar\" return false: the first o maps to a, but the second o maps to r — one character tried to wear two disguises. And s = \"ab\" and t = \"aa\" return false: a maps to a and b maps to a — two different characters tried to claim the same pen name.\n\nThe reflex is to build one map: for each position, record what s[i] maps to in t, and complain if it ever changes. That catches \"foo\" → \"bar\" (o flips from a to r). But it lets \"ab\" → \"aa\" slip through: a always maps to a, b always maps to a — each s-character is individually consistent. The problem is that a and b both claim a, and a one-directional map never checks that.\n\nThe click is that a bijection runs in both directions. If s maps to t one-to-one, then t maps back to s one-to-one — and you need to verify both. Two maps, not one: s→t to catch a character that switches aliases, and t→s to catch two characters sharing an alias. One pass, two lookups per character, done.\n\nThere's a second click that sidesteps maps entirely. Two strings are isomorphic if and only if they have the same \"shape\" — the same pattern of character repetitions. Encode each string as the index of each character's first appearance: \"egg\" becomes [0, 1, 1] (e is new at 0, g is new at 1, g was seen at 1), and \"add\" also becomes [0, 1, 1]. If the two encoded patterns are identical, the strings are isomorphic. No maps, no bijection proof — just pattern matching.",
    examples: [
      { in: "s = \"egg\", t = \"add\"", out: "true" },
      { in: "s = \"foo\", t = \"bar\"", out: "false" },
      { in: "s = \"ab\", t = \"aa\"", out: "false" }
    ],
    constraints: [
      "s and t have the same length, between 1 and 5×10^4 characters.",
      "Both strings contain only printable ASCII characters.",
      "Aim for O(n) time and O(1) extra space — the character set is bounded, so your maps never exceed it.",
      "The mapping must be a bijection: each s-character maps to exactly one t-character, and no two s-characters map to the same t-character."
    ],
    whyItMatters: "This puzzle teaches a habit that prevents a whole family of bugs: when a relationship must be bidirectional, checking one direction is never enough. The one-map solution feels complete — it verifies that every s-character stays consistent — but it's blind to collisions from the other side. The same trap appears wherever you build a mapping that should be one-to-one: database column matching, graph isomorphism, state-machine relabeling, cipher construction. If the mapping must be invertible, test invertibility, don't just test forward consistency.\n\nThe deeper lesson is about the two views of the same invariant. The two-map solution checks the bijection directly — s→t and t→s must both be functions. The pattern-encoding solution checks it structurally — two strings are isomorphic exactly when their repetition patterns match. Same truth, different access: one is procedural (walk and verify), the other is representational (encode and compare). The pattern view is why isomorphism generalizes: it's not about characters at all, it's about structural shape, and shape comparison is the foundation of pattern matching, compression, and formal language theory. Whenever a problem is really about structure rather than content, ask: can I encode the structure and compare encodings instead of verifying element by element?",
    hint: "You need two maps, not one. The forward map (s → t) catches a character that switches its alias mid-stream, but only the reverse map (t → s) catches two different characters claiming the same alias. Or, if you'd rather skip maps: encode each string as the index of each character's first appearance — 'egg' and 'add' both have the shape [0, 1, 1]. Same shape, same isomorphism.",
    solution: {
      lang: "javascript",
      code: "function isIsomorphic(s, t) {\n  if (s.length !== t.length) return false;\n  const mapST = new Map();\n  const mapTS = new Map();\n  for (let i = 0; i < s.length; i++) {\n    const cs = s[i], ct = t[i];\n    if (mapST.has(cs) && mapST.get(cs) !== ct) return false;\n    if (mapTS.has(ct) && mapTS.get(ct) !== cs) return false;\n    mapST.set(cs, ct);\n    mapTS.set(ct, cs);\n  }\n  return true;\n}\n",
      notes: "One pass, two maps, two lookups per character. O(n) time, O(1) space — the maps are bounded by the character set (128 ASCII or 26 lowercase letters), so they never grow with input size.\n\nTrace example 1: s = \"egg\", t = \"add\".\n• i=0: cs='e', ct='a'. Both maps empty. Set e→a, a→e.\n• i=1: cs='g', ct='d'. Neither map has 'g' or 'd'. Set g→d, d→g.\n• i=2: cs='g', ct='d'. mapST has g→d ✓ (matches). mapTS has d→g ✓ (matches).\n• return true. ✓ (e always maps to a, g always maps to d; both directions consistent.)\n\nTrace example 2: s = \"foo\", t = \"bar\".\n• i=0: cs='f', ct='b'. Set f→b, b→f.\n• i=1: cs='o', ct='a'. Set o→a, a→o.\n• i=2: cs='o', ct='r'. mapST has o→a, but ct='r' ≠ 'a'. return false. ✓\n  (The forward map catches it: o tried to map to both a and r.)\n\nTrace example 3: s = \"ab\", t = \"aa\".\n• i=0: cs='a', ct='a'. Set a→a (forward), a→a (reverse).\n• i=1: cs='b', ct='a'. mapST has no 'b' — forward check passes. But mapTS has 'a'→'a', and cs='b' ≠ 'a'. return false. ✓\n  (The reverse map catches it: 'a' in t was already claimed by 'a' in s, so 'b' can't also map to 'a'. The forward map alone would have missed this — a→a and b→a are each individually consistent, but two s-characters share one t-character.)\n\nWhy both maps are necessary: the forward map (s→t) verifies that each s-character maps to exactly one t-character — it catches \"foo\"/\"bar\" where o flips. The reverse map (t→s) verifies that each t-character is claimed by exactly one s-character — it catches \"ab\"/\"aa\" where a and b collide. Drop either map and you get false positives on a different class of input. A bijection is a two-way contract; checking one direction is like checking a mirror with one eye closed.\n\nThe pattern-encoding alternative (no maps, same complexity):\n\n  function isIsomorphic(s, t) {\n    if (s.length !== t.length) return false;\n    const pat = (str) => {\n      const idx = [];\n      const first = new Map();\n      for (let i = 0; i < str.length; i++) {\n        if (!first.has(str[i])) first.set(str[i], i);\n        idx.push(first.get(str[i]));\n      }\n      return idx.join(',');\n    };\n    return pat(s) === pat(t);\n  }\n\nPattern trace for \"egg\" → [0,1,1] and \"add\" → [0,1,1]: identical → true.\nPattern trace for \"foo\" → [0,1,1] and \"bar\" → [0,1,2]: different → false.\nPattern trace for \"ab\" → [0,1] and \"aa\" → [0,0]: different → false.\n\nSame results, no bijection proof needed — just structural shape comparison. The pattern view is why isomorphism generalizes beyond strings: any two sequences that produce the same first-occurrence pattern are structurally identical, regardless of what their elements are."
    }
  },
  {
    id: "the-fork-in-the-tree",
    date: "2026-09-08",
    title: "The Fork in the Tree",
    blurb: "Two values live somewhere in a binary search tree. Their lowest common ancestor is the node where their root-to-leaf paths first split — find it in one walk down, no parent pointers, no extra space.",
    difficulty: "Medium",
    minutes: 10,
    tags: ["trees", "binary-search-tree"],
    prompt: "You're given the root of a binary search tree and two values p and q, both guaranteed to be present in the tree. Return the value of their lowest common ancestor — the deepest node that is an ancestor of both p and q. (A node counts as an ancestor of itself, so if p is an ancestor of q, the answer is p.)\n\nIn a binary search tree, every node's left subtree holds smaller values and its right subtree holds larger values. So the search path from the root to any value is a single walk: go left when the value is smaller, go right when it's larger, stop when you land on it.\n\nSo for the tree [6,2,8,0,4,7,9,null,null,3,5] — that's level order, reading top to bottom, left to right — with p = 2 and q = 8, the answer is 6: 2 lives in the left subtree of the root and 8 lives in the right subtree, so the root itself is where the two paths diverge. With p = 2 and q = 4, the answer is 2: both live in the left subtree of 6, but at node 2 their paths split (4 is in 2's right subtree), and since 2 is itself one of the targets, it's the ancestor. And for the compact tree [2,1,3] with p = 1 and q = 3, the answer is 2: 1 goes left from the root, 3 goes right, so the root is the fork.\n\nThe reflex is to find the path to p and the path to q (two walks, storing each path in an array), then compare them node by node until they diverge. That's correct, but it's O(h) extra space for the two path arrays, and it's doing more work than the tree asks of you. The BST ordering already tells you, at every node, which way each value lies — you don't need to record the paths to compare them; you just walk the one path they share.\n\nThe click is that the LCA is the first node where p and q go in different directions — one left, one right — or where one of them is the node itself. Walk down from the root. If both values are less than the current node, they're both in the left subtree: go left. If both are greater, go right. The moment they disagree (one left, one right, or one equals the node), you're standing on the LCA — stop and return it. One walk, O(h) time, O(1) extra space, no path arrays, no parent pointers.\n\nThe subtler click is the self-ancestor case. When p is an ancestor of q — say p = 2, q = 4 — the walk reaches node 2 and 4 is in its right subtree. At that moment p equals the current node, so neither \"both less\" nor \"both greater\" is true, and you fall through to return the node. No special case needed: a value equals itself, so it goes neither left nor right, and the general rule absorbs it.",
    examples: [
      { in: "root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8", out: "6" },
      { in: "root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 4", out: "2" },
      { in: "root = [2,1,3], p = 1, q = 3", out: "2" }
    ],
    constraints: [
      "root is a binary search tree with between 2 and 10^4 nodes; all node values are distinct integers.",
      "p and q are both present in the tree and p != q. Return the value of the lowest common ancestor.",
      "A node is an ancestor of itself, so if one target is an ancestor of the other, it is the answer.",
      "Aim for O(h) time and O(1) extra space — no path arrays, no parent pointers, no recursion stack."
    ],
    whyItMatters: "This puzzle is the friendliest introduction to the idea that a data structure's built-in ordering can do your work for you. In a general binary tree, finding the lowest common ancestor means visiting most of the tree — a post-order traversal that checks every subtree for both targets, O(n) time. But a BST narrows the search to a single root-to-leaf path, because the ordering tells you at every node which way each target lies. You don't search the tree; you walk the one path the two targets share, and stop where it forks. That's O(h) instead of O(n) — the difference between touching every node and touching only the ones on a single branch.\n\nThe transferable habit is to ask, of any tree problem: does the data's ordering prune the search? If the tree is a BST, a single comparison tells you which half of the tree to ignore — and for problems like range queries, nearest-neighbor lookups, or predecessor/successor, that pruning is the whole algorithm. The LCA is just the cleanest case: the answer is the one node where the two search paths stop overlapping, and the ordering hands it to you for free.\n\nThe subtler lesson is about special cases that vanish into the general logic. When p is an ancestor of q, you might reach for a special case: \"if node.val === p or node.val === q, return node.\" But the general rule already covers it — a value equals itself, so it satisfies neither \"both less\" nor \"both greater,\" and the else branch returns the node. Recognizing when a special case is already absorbed by the main logic is a habit that keeps code short and bugs few. The cleanest algorithm is often the one with the fewest branches, not the most.",
    hint: "Walk down from the root. At each node: if p and q are both less than the node's value, go left; if both are greater, go right. The moment they disagree — one on each side, or one equal to the node — you're at the lowest common ancestor. Return it. No special case for when a target is the node itself; the general rule handles it.",
    solution: {
      lang: "javascript",
      code: "function lowestCommonAncestor(root, p, q) {\n  let node = root;\n  while (node) {\n    if (p < node.val && q < node.val) node = node.left;\n    else if (p > node.val && q > node.val) node = node.right;\n    else return node;\n  }\n  return null;\n}\n",
      notes: "One walk from the root, one comparison per step, O(h) time, O(1) space.\n\nTrace example 1: root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8.\n• node = 6. p = 2 < 6, but q = 8 > 6 → not both less, not both greater → return 6. ✓\n  (2 is in the left subtree, 8 is in the right subtree; the root is where the paths fork.)\n\nTrace example 2: root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 4.\n• node = 6. p = 2 < 6 and q = 4 < 6 → both less → go left, node = 2.\n• node = 2. p = 2 is not < 2 (it equals node.val), so the first condition fails; q = 4 > 2, so the second condition fails too → return 2. ✓\n  (2 is itself one of the targets and an ancestor of 4; the self-ancestor case is caught by the else branch with no special-casing.)\n\nTrace example 3: root = [2,1,3], p = 1, q = 3.\n• node = 2. p = 1 < 2, q = 3 > 2 → not both less, not both greater → return 2. ✓\n  (1 goes left from the root, 3 goes right; the root is the fork.)\n\nWhy this is O(h) and not O(n): a BST search never visits both children of the same node — one comparison eliminates an entire subtree. The walk from root to LCA is at most h steps (the tree height), touching one node per level. A general binary tree has no ordering to prune with, so finding the LCA there requires a full traversal — O(n). The BST ordering is the difference.\n\nWhy the self-ancestor case needs no special handling: if p equals node.val, then p < node.val is false and p > node.val is false, so neither \"both less\" nor \"both greater\" can be true. The code falls through to `return node`, which is correct — a node is its own ancestor. The same logic handles q being the current node, or both being different from but on opposite sides of the current node. One branch, three situations, all correct.\n\nEdge case — p or q not in the tree: the problem guarantees both are present, so the walk always finds the LCA. If the guarantee were lifted, you'd need a follow-up pass to confirm both values exist, since the walk can return a candidate even if one target is absent (the paths would still fork at some node)."
    }
  },
  {
    id: "the-empty-chair",
    date: "2026-09-07",
    title: "The Empty Chair",
    blurb: "A row of chairs is numbered 0 through n, but only n guests arrive — one number is a no-show. Find the empty chair without sorting, and without spending any extra space.",
    difficulty: "Easy",
    minutes: 6,
    tags: ["math", "bit-manipulation"],
    prompt: "You're handed an array of n distinct integers. Each one lies between 0 and n inclusive, and exactly one number in that range is absent — the array has n slots for the n+1 possible values 0..n, so somebody didn't show up. Return the missing number.\n\nSo [3, 0, 1] returns 2 (the range is 0..3, and 2 is the one not listed). [0, 1] returns 2 (range 0..2, only 0 and 1 are present). And [9, 6, 4, 2, 3, 5, 7, 0, 1] returns 8 (range 0..9, every digit except 8 is sitting in its chair).\n\nThe reflex is to sort the array and scan for the first gap — O(n log n) time — or drop every value into a hash set and check each number 0..n for membership — O(n) time but O(n) space. Both are correct. But you're ignoring a fact the problem hands you for free: the numbers aren't arbitrary, they're a complete arithmetic range with a single hole, and a complete range has a sum you can write down without looking at the array at all.\n\nThe click is Gauss's formula. The sum of every integer from 0 to n is n(n+1)/2 — a closed form computable in O(1), no iteration needed. The sum of the array you were handed is whatever it is. The difference between the full sum and the actual sum is exactly the missing number, because every present value contributes its share and the one absent value is the only thing making the two totals differ. One pass to add up the array, one subtraction, done — O(n) time, O(1) space, no sorting, no set.\n\nThe deeper click is a second solution that doesn't even trust arithmetic to stay in range: XOR. A number XOR-ed with itself is 0, and XOR is commutative and associative, so XOR-ing together all the values 0..n and then all the array elements causes every present number to cancel its own copy in a pair — leaving the missing number alone in the residue, like the one guest nobody paired off. One pass, one running accumulator, no multiplication, no overflow concern, O(1) space. It's the same cancellation instinct that powers the single-number trick (every element twice but one) and, in a different form, the majority-vote idea from earlier this week: when everything but the answer has a partner that annihilates it, the unpartnered survivor is your answer.",
    examples: [
      { in: "nums = [3, 0, 1]", out: "2" },
      { in: "nums = [0, 1]", out: "2" },
      { in: "nums = [9, 6, 4, 2, 3, 5, 7, 0, 1]", out: "8" }
    ],
    constraints: [
      "nums contains n distinct integers, each in the range [0, n]; exactly one number in [0, n] is missing. n (the array length) is between 1 and 10^4.",
      "The array has exactly n elements for the n+1 possible values 0..n — that one gap is the answer.",
      "Aim for O(n) time and O(1) extra space — no sorting, no hash set."
    ],
    whyItMatters: "This puzzle is the friendliest introduction to two ideas that look like magic until you trace them: the closed-form invariant and the cancellation. The first says, \"a complete arithmetic range has a sum you can write down without inspecting it\" — n(n+1)/2 — so the missing number drops out of one subtraction. That same instinct — \"don't count what you can compute in closed form\" — is what makes summing 1..100 a one-liner, what powers prefix-sum range queries, and what turns \"find the one disturbed element in a known range\" into an arithmetic identity. Whenever a dataset is \"a known range with one element disturbed,\" ask: what invariant does the undisturbed range satisfy, and how does the disturbance show up in it?\n\nThe deeper lesson is the XOR solution and the cancellation principle behind it. x ^ x = 0 means every number that appears twice annihilates; the one number that appears once — the missing value, because you XOR the full range against the array — is left standing. That's the same mechanism as the single-number puzzle (every element twice but one), and a cousin, in a different form, of the majority-vote cancellation from earlier this week. The transferable habit is to ask of any \"find the odd one out\" problem: is there an operation under which everything-but-the-answer cancels? If yes, you need no counts, no sets, no sorts — one accumulator does the whole job. And XOR has a bonus the sum doesn't: it can't overflow, so it's the safer choice when n is large or the language's integers are bounded.",
    hint: "Sum the array in one pass; the missing number is n(n+1)/2 minus that sum (Gauss's formula for 0 + 1 + ... + n). Or, if you'd rather avoid arithmetic entirely: XOR all the values 0..n together with all the array values — every present number cancels its own copy (x ^ x = 0), leaving the missing one as the sole survivor.",
    solution: {
      lang: "javascript",
      code: "function missingNumber(nums) {\n  const n = nums.length;\n  let sum = 0;\n  for (const v of nums) sum += v;\n  return (n * (n + 1)) / 2 - sum;\n}\n",
      notes: "One pass to sum the array, one subtraction. n(n+1)/2 is the sum of the complete range 0..n; the array holds that same range minus one element, so the difference is exactly the missing value. O(n) time, O(1) space — no sorting, no set.\n\nTrace example 1: nums = [3, 0, 1]. n = 3. Full sum = 3·4/2 = 6. Array sum = 3 + 0 + 1 = 4. Missing = 6 − 4 = 2. ✓ (Range 0..3, present {0,1,3}, absent 2.)\n\nTrace example 2: nums = [0, 1]. n = 2. Full sum = 2·3/2 = 3. Array sum = 0 + 1 = 1. Missing = 3 − 1 = 2. ✓ (Range 0..2, present {0,1}, absent 2.)\n\nTrace example 3: nums = [9, 6, 4, 2, 3, 5, 7, 0, 1]. n = 9. Full sum = 9·10/2 = 45. Array sum = 9+6+4+2+3+5+7+0+1 = 37. Missing = 45 − 37 = 8. ✓ (Range 0..9, everything but 8 is seated.)\n\nWhy the subtraction is exact: the complete set is {0, 1, ..., n}; the array is that set with one element removed. So sum(complete) = sum(array) + missing, which rearranges to missing = sum(complete) − sum(array). Nothing else can fill the gap because all the other values are present and accounted for.\n\nThe XOR alternative (overflow-proof, same complexity):\n\n  function missingNumber(nums) {\n    let x = 0;\n    for (let i = 0; i <= nums.length; i++) x ^= i;       // XOR the full range 0..n\n    for (const v of nums) x ^= v;                          // XOR the array\n    return x;\n  }\n\nXOR trace for [3, 0, 1], n = 3:\n• Full range 0..3: 0 ^ 1 = 1, ^ 2 = 3, ^ 3 = 0.  → x = 0.\n• Array: 0 ^ 3 = 3, ^ 0 = 3, ^ 1 = 2.  → x = 2.\n• return 2. ✓  Each present number (0, 1, 3) appeared once in the range and once in the array, so each cancelled itself; 2 appeared only in the range, never in the array, so it survived.\n\nXOR trace for [0, 1], n = 2:\n• Full range 0..2: 0 ^ 1 = 1, ^ 2 = 3.  → x = 3.\n• Array: 3 ^ 0 = 3, ^ 1 = 2.  → x = 2.\n• return 2. ✓\n\nXOR trace for [9, 6, 4, 2, 3, 5, 7, 0, 1], n = 9:\n• Full range 0..9: 0^1=1, ^2=3, ^3=0, ^4=4, ^5=1, ^6=7, ^7=0, ^8=8, ^9=1.  → x = 1.\n• Array: 1^9=8, ^6=14, ^4=10, ^2=8, ^3=11, ^5=14, ^7=9, ^0=9, ^1=8.  → x = 8.\n• return 8. ✓\n\nWhen to prefer which: the sum is the more readable one-liner and the one most people reach for first. The XOR is the same O(n)/O(1) but immune to integer overflow — relevant in languages with fixed-width ints when n is large (n=10^4 is harmless for JS doubles, but the habit matters in C/Java with 32-bit ints, where n(n+1)/2 overflows near n ≈ 65535). Both rest on the same root idea: the undisturbed range satisfies a known invariant (a known sum, or a known XOR), and the disturbance is the only thing that breaks it."
    }
  },
  {
    id: "two-stones-one-survivor",
    date: "2026-09-06",
    title: "Two Stones, One Survivor",
    blurb: "Each round, smash the two heaviest stones together. Equal weights annihilate both; a mismatch leaves a shard of the difference. What weight is left standing when the dust settles?",
    difficulty: "Medium",
    minutes: 10,
    tags: ["heap", "simulation"],
    prompt: "You have a pile of stones, each with a positive integer weight. You'll smash them together in rounds until one stone (or none) remains. Each round: pick the two heaviest stones in the pile, call their weights x and y with x <= y. If x == y, both stones are destroyed outright — nothing survives the collision. If x != y, the stone of weight x is destroyed and the stone of weight y is replaced by a new stone of weight y - x (the chip left after the lighter one erodes it). Put any survivor back into the pile and repeat. Stop when the pile has one stone or none; return that stone's weight, or 0 if the pile is empty.\n\nSo [2,7,4,1,8,1] returns 1: smash 8&7 -> shard 1, pile becomes [4,2,1,1,1]; smash 4&2 -> shard 2, pile [2,1,1,1]; smash 2&1 -> shard 1, pile [1,1,1]; smash 1&1 -> both gone, pile [1]; one stone left, return 1. And [1] trivially returns 1 — no smashes happen. A pile that grinds itself to nothing, like [10,4,3,9], returns 0.\n\nThe reflex is to sort the pile, smash the top two, then re-sort after each round (because the shard you put back might be lighter than what's underneath). That's correct, and for six stones it's fine. But every round you're re-sorting a nearly-sorted pile from scratch — O(n log n) per round, O(n) rounds, O(n^2 log n) total. Worse, you keep paying to find the two heaviest when you only ever change one element per round. The structure you're missing: you always need the maximum, you always need the second maximum, and you only ever insert one new value between rounds. That's a heap's exact job description.\n\nThe click is to hold the stones in a max-heap. Each round, pop the top twice — that's your y and x, the two heaviest, in O(log n). If they differ, push y - x back in, again O(log n). If they're equal, push nothing. Repeat while the heap has more than one element. One pass of n inserts to build the heap (O(n)), then at most n-1 smash rounds each costing O(log n) — O(n log n) total, and crucially you never touch a stone you don't need. The heap isn't just \"a faster sort\"; it's the structure that matches the operation. You always extract the max and you always insert one element, so a priority queue is exactly the right shape, and a full sort every round is paying for information you throw away.\n\nThe deeper click is why the heap can't lose the answer. Each smash removes two stones and adds at most one, so the pile shrinks by at least one every round — the loop can run at most n-1 times before a single stone (or zero) remains. And the shard y - x is never larger than y, so it goes back into the heap at a weight no greater than the stone it came from; the heap property is preserved by construction. There's no bookkeeping to get wrong, no order to maintain beyond \"always pop the biggest,\" and no case where a stone hides from the smash schedule. The whole algorithm is: build, then repeatedly extract-two / maybe-insert-one / until-done. That's it.\n\nEdge cases worth a thought: a single stone returns its own weight (no smashes). Two equal stones return 0 (both annihilate). Two unequal stones return their difference (one shard, nothing to smash it against). And because weights are positive and the shard y - x is strictly less than y when x > 0, the shard is always a smaller, positive stone — you never produce a zero-weight or negative-weight stone, so the pile stays well-formed throughout.",
    examples: [
      { in: "stones = [2,7,4,1,8,1]", out: "1" },
      { in: "stones = [1]", out: "1" },
      { in: "stones = [10,4,3,9]", out: "0" }
    ],
    constraints: [
      "stones has between 1 and 30 elements; each weight is a positive integer up to 1000.",
      "Each round removes the two heaviest stones and may insert one shard of weight y - x (when x != y) or nothing (when x == y). Repeat until one or zero stones remain.",
      "Return the weight of the last stone, or 0 if none remain.",
      "Aim for O(n log n) time using a max-heap — avoid re-sorting the whole pile each round."
    ],
    whyItMatters: "This puzzle is the friendliest possible introduction to the heap as a data structure that earns its keep, rather than a heap as an implementation detail of a sort. The problem isn't \"sort these stones\" — it's \"repeatedly find and remove the two largest, then maybe add one new value.\" That's an access pattern (extract-max, extract-max, insert) that a sorted array serves badly (each insert shifts the tail) and a heap serves perfectly (O(log n) per operation, no shifting). Recognizing that the OPERATION, not the data, dictates the structure is the transferable skill: every time you find yourself re-sorting after a tiny mutation, a priority queue is waving its hand. It's why Dijkstra's algorithm uses a heap (relax one edge, maybe decrease one distance) instead of re-sorting the frontier, why A* uses one (insert the next frontier node), why merge-sort's k-way merge uses one (grab the smallest head across k runs), and why task schedulers, event loops, and Huffman coding all reach for the same shape.\n\nThe subtler lesson is about invariants that make a greedy choice safe. \"Always smash the two heaviest\" feels like a heuristic, but it's forced: the rules mandate picking the two heaviest, so the only freedom you have is how efficiently you find them. The heap is the efficient finder; the smash rule is the invariant. When you separate those two concerns — \"what must I do each round\" (the rule) from \"how do I do it fast\" (the structure) — the algorithm nearly writes itself, and you stop reaching for a full sort out of habit. The next time a problem says \"repeatedly take the top two and recombine,\" ask: is the data changing by one element at a time? If yes, the heap was built for exactly this.",
    hint: "Keep all stones in a max-heap. While the heap has more than one stone: pop the largest (y), pop the next largest (x). If y > x, push y - x back onto the heap. If y == x, push nothing (both are gone). When the loop ends, return the heap's single element, or 0 if the heap is empty. JavaScript has no built-in max-heap, so store negated weights in a MinHeap (push -w, pop and negate) or build the heap over an array with Math.max selection — either way you only ever touch the top two.",
    solution: {
      lang: "javascript",
      code: "function lastStoneWeight(stones) {\n  // Max-heap via negated values in a MinHeap.\n  const heap = new MinHeap();\n  for (const w of stones) heap.push(-w);\n  while (heap.size() > 1) {\n    const y = -heap.pop();   // heaviest\n    const x = -heap.pop();   // second heaviest\n    if (y > x) heap.push(-(y - x));\n  }\n  return heap.size() === 1 ? -heap.pop() : 0;\n}\n\nclass MinHeap {\n  constructor() { this.a = []; }\n  size() { return this.a.length; }\n  push(v) {\n    this.a.push(v);\n    let i = this.a.length - 1;\n    while (i > 0) {\n      const p = (i - 1) >> 1;\n      if (this.a[p] <= this.a[i]) break;\n      [this.a[p], this.a[i]] = [this.a[i], this.a[p]];\n      i = p;\n    }\n  }\n  pop() {\n    const top = this.a[0];\n    const last = this.a.pop();\n    if (this.a.length) {\n      this.a[0] = last;\n      let i = 0;\n      for (;;) {\n        const l = 2 * i + 1, r = 2 * i + 2;\n        let m = i;\n        if (l < this.a.length && this.a[l] < this.a[m]) m = l;\n        if (r < this.a.length && this.a[r] < this.a[m]) m = r;\n        if (m === i) break;\n        [this.a[m], this.a[i]] = [this.a[i], this.a[m]];\n        i = m;\n      }\n    }\n    return top;\n  }\n}\n",
      notes: "One heap, one loop, no re-sorting. We store negated weights so the standard min-heap's \"smallest on top\" gives us the most-negative — i.e. the heaviest stone — on each pop. Each round is two pops and at most one push, all O(log n); the loop runs at most n-1 times; building the heap is O(n). Total O(n log n).\n\nTrace example 1: stones = [2,7,4,1,8,1].\nHeap (shown as the stones, max on top): {8,7,4,2,1,1}.\n• pop 8 (y), pop 7 (x). 8>7 → push 1. Heap: {4,2,1,1,1}.\n• pop 4, pop 2. 4>2 → push 2. Heap: {2,1,1,1}.\n• pop 2, pop 1. 2>1 → push 1. Heap: {1,1,1}.\n• pop 1, pop 1. Equal → push nothing. Heap: {1}.\n• size==1 → return 1. ✓\n\nTrace example 2: stones = [1].\nHeap: {1}. size==1, loop never runs. Return 1. ✓ A lone stone never gets smashed.\n\nTrace example 3: stones = [10,4,3,9].\nHeap: {10,9,4,3}.\n• pop 10, pop 9. 10>9 → push 1. Heap: {4,3,1}.\n• pop 4, pop 3. 4>3 → push 1. Heap: {1,1}.\n• pop 1, pop 1. Equal → push nothing. Heap: {}.\n• size==0 → return 0. ✓ The pile grinds itself to nothing.\n\nWhy a heap beats re-sorting: after each smash, at most one new value enters the pile, and it's never larger than the stone it came from. A full re-sort pays O(n log n) to re-derive an ordering where only one element moved; a heap pays O(log n) to restore just the affected path. Over n rounds that's the difference between O(n^2 log n) and O(n log n). The lesson generalizes: when the data mutates by one element per step and you only ever need the extreme, the heap is the structure that matches the operation — reach for it whenever you see \"repeatedly take the top, recombine, put back.\""
    }
  },
  {
    id: "more-than-half-the-room",
    date: "2026-09-05",
    title: "More Than Half the Room",
    blurb: "One value shows up more than half the time in an unsorted array. Find it — without sorting, without counting, without a dictionary. A single counter and a clever cancellation do the whole job.",
    difficulty: "Easy",
    minutes: 8,
    tags: ["arrays", "voting"],
    prompt: "You're given an array of integers. Exactly one value is the majority: it appears more than ⌊n/2⌋ times — strictly more than half the array. The array isn't sorted, the values can be anything, and you're guaranteed a majority always exists. Return that majority value.\n\nSo [3, 2, 3] returns 3 (three appears twice out of three), and [2, 2, 1, 1, 1, 2, 2] returns 2 (two appears four times out of seven, edging past the three ones).\n\nThe reflex is to count: walk the array, tally each value in a hash map, then scan the map for the one whose count exceeds n/2. That's correct and it's O(n) time — but it costs O(n) extra space for the map, and it throws away a structural fact you could have used: a majority, by definition, outnumbers every other value combined. You don't need to know HOW MANY times each value appears; you only need to know which value survives when opposites cancel.\n\nThe click is a cancellation game. Imagine pairing up two DIFFERENT values and throwing both away. Repeat until only one value is left. Whatever remains must be the majority, because the majority has more copies than all the others put together — even after you pair every non-majority copy against a majority copy, a few majority copies are still standing. You don't need to actually form pairs; you just track a candidate and a count. When the count is zero, adopt the current value as the candidate (you have nothing to cancel it against). When the current value matches the candidate, the count goes up (another ally). When it differs, the count goes down (a cancelation — one of the candidate's side, one of the other side, both gone). One pass, two variables, no map.\n\nThe deeper click is why the cancellation is safe even though the pairs are \"imaginary.\" Each decrement of the count removes one candidate-value and one non-candidate value from consideration. The majority value starts with a surplus of at least one over n/2, so no matter how the cancellations line up, the surplus can never be fully consumed — the majority always ends with count > 0. And the algorithm doesn't need to know in advance which value is the majority: whenever the count hits zero, the prefix so far has canceled itself out completely, so the majority of the WHOLE array must also be the majority of the remaining suffix — and the algorithm simply restarts its candidate on that suffix. The guarantee propagates through the restarts, and the final candidate is always the true majority.",
    examples: [
      { in: "nums = [3, 2, 3]", out: "3" },
      { in: "nums = [2, 2, 1, 1, 1, 2, 2]", out: "2" },
      { in: "nums = [1]", out: "1" }
    ],
    constraints: [
      "nums has between 1 and 5·10^4 elements; values are arbitrary integers.",
      "A majority element is guaranteed to exist: some value appears strictly more than ⌊n/2⌋ times. You do not need to verify the result.",
      "Aim for O(n) time and O(1) extra space — no hash map, no sorting."
    ],
    whyItMatters: "This puzzle is the cleanest possible introduction to the Boyer-Moore majority vote, and the idea underneath it reaches far beyond arrays. \"Pair distinct elements and discard both\" is a cancellation argument: you exploit the fact that the majority outnumbers everything else combined, so it must be the last one standing after all the cancellations. That same instinct — \"I don't need exact counts, I need to know which value survives when opposites annihilate\" — powers space-efficient frequency estimation in streaming (the Misra-Gries and Count-Min sketches both generalize this trick to find heavy-hitters in one pass over data too big to store), consensus protocols that tolerate up to half the nodes failing, and the \"cancel a vote with a counter-vote\" structure hiding inside game-tree pruning. The transferable lesson is to ask, of any \"find the most frequent\" question: is the winner frequent ENOUGH that I can trade exact counting for a cancellation invariant? If it's a strict majority, one counter suffices; if it's merely a plurality, you need a little more machinery — but the cancellation idea still does most of the work.\n\nThe subtler lesson is about the count==0 restart. When the running count hits zero, the prefix you've scanned has canceled itself to nothing — equal numbers of the eventual majority and its opposition have been removed. That means the majority of the remaining suffix is the same as the majority of the whole, so adopting the next element as a fresh candidate can never lose the true answer. The algorithm is, in disguise, a sequence of small cancellation rounds, each handing off to the next, all converging on the same survivor. Recognizing that a zero count is a license to restart — not a failure — is what turns the trick from a lucky heuristic into a proof.",
    hint: "Keep a candidate (start as null) and a count (start at 0). Walk the array once. If count is 0, set candidate to the current element. Then add 1 to count if the current element equals the candidate, or subtract 1 if it differs. The majority always survives as the final candidate — every cancellation removes one majority and one non-majority, and the majority has at least one copy to spare.",
    solution: {
      lang: "javascript",
      code: "function majorityElement(nums) {\n  let candidate = null, count = 0;\n  for (const num of nums) {\n    if (count === 0) candidate = num;\n    count += (num === candidate) ? 1 : -1;\n  }\n  return candidate;\n}\n",
      notes: "Two variables, one pass, no map. The candidate is the current best guess for the majority; the count is how many uncanceled copies of it we're holding. When count hits zero, the prefix has canceled out entirely and we restart on the next element. The majority always ends as the candidate because every decrement pairs one majority copy with one non-majority copy, and the majority has a surplus.\n\nTrace example 1: nums = [3, 2, 3].\n• num=3: count==0 → candidate=3. 3===3 → count=1.\n• num=2: count!=0. 2!==3 → count=0. (A 3 and a 2 cancel.) candidate still 3.\n• num=3: count==0 → candidate=3. 3===3 → count=1.\n• return 3. ✓ 3 appears 2/3 times — the majority.\n\nTrace example 2: nums = [2, 2, 1, 1, 1, 2, 2].\n• num=2: count==0 → candidate=2. count=1.\n• num=2: 2===2 → count=2. (Two allies.)\n• num=1: 1!==2 → count=1. (A 1 cancels a 2.)\n• num=1: 1!==2 → count=0. (Another 1 cancels the last 2; prefix [2,2,1,1] is fully canceled.)\n• num=1: count==0 → candidate=1. count=1. (Restart on the suffix [1,2,2].)\n• num=2: 2!==1 → count=0. (A 2 cancels the 1.)\n• num=2: count==0 → candidate=2. count=1. (Restart on [2].)\n• return 2. ✓ 2 appears 4/7 times — the majority. Notice the candidate briefly became 1 in the middle; the zero-count restart is what lets the true majority reclaim the lead.\n\nTrace example 3: nums = [1].\n• num=1: count==0 → candidate=1. 1===1 → count=1.\n• return 1. ✓ A single element is trivially the majority.\n\nWhy the majority always survives: let m be the count of the majority value and let r = n - m be the count of all the others. Since m > n/2, we have m > r. Each time the count decrements, one majority copy and one non-majority copy are removed from consideration (the decrement happens when the current element differs from the candidate, and if the candidate is the majority, that current element is a non-majority). Even in the worst case, where every non-majority element cancels a majority copy, we remove r pairs — consuming r majority copies — but m > r, so at least m - r > 0 majority copies remain. The count can never stay at zero with the majority fully gone. When count==0 the prefix is balanced, so the majority of the suffix equals the majority of the whole, and restarting the candidate on the next element preserves the invariant. Time is O(n) — a single pass, constant work per element. Space is O(1) — two variables, no auxiliary storage."
    }
  },
  {
    id: "n-ways-to-nest",
    date: "2026-09-03",
    title: "N Ways to Nest",
    blurb: "Given n pairs of parentheses, list every arrangement where every opener finds its closer and nesting never dips below zero. The trick: at each step you have two choices, and the constraint tells you exactly when each is legal.",
    difficulty: "Medium",
    minutes: 12,
    tags: ["recursion", "backtracking"],
    prompt: "You're given a positive integer n representing n pairs of parentheses. Generate all strings of length 2n, using exactly n '(' and n ')' characters, such that the string is \"well-formed\": at no point reading left to right does the count of ')' exceed the count of '(', and at the end the counts are equal. Return all valid strings.\n\nSo for n = 3, the answer is [\"((()))\",\"(()())\",\"(())()\",\"()(())\",\"()()()\"] — five strings, each a different way of nesting three pairs so that every opener finds its closer and no closer appears before its opener.\n\nThe reflex is to generate all possible arrangements of n '(' and n ')' — that's C(2n, n) candidates — and then filter for the valid ones. That's correct, and for n = 3 it's only 20 candidates so it's painless. But C(2n, n) grows fast: n = 8 gives 12,870 candidates, and the vast majority are invalid — strings like \")))((((\" that close before they open. You're doing work proportional to the raw search space, not the valid part of it, and throwing away almost everything you build.\n\nThe click is that you never need to generate an invalid string. At each step of building the string left to right, you have exactly two choices: add '(' or add ')'. The well-formedness constraint tells you precisely when each is legal — you can add '(' as long as you haven't used all n of them, and you can add ')' only when the number of '(' you've placed so far exceeds the number of ')' you've placed (otherwise you'd close a parenthesis that was never opened, which is the one thing well-formedness forbids). So the recursion writes itself: track how many '(' and ')' you've placed. If both reach n, you're done — emit the string. Otherwise, try '(' if you still have opens left, and try ')' if opens exceeds closes. Every path the recursion explores produces a valid string; nothing is generated and then thrown away.\n\nThe deeper click is about why this \"generate only valid\" approach works at all. The constraint — \"closes never exceed opens\" — is a running invariant, checkable at every prefix of the string, not just at the end. When a constraint can be verified incrementally as you build, you can prune the search tree at every branch, not just at the leaves. That's what backtracking is: don't wait to validate the whole answer; validate each step as you take it, and never walk down a branch that's already doomed. The moment closes would exceed opens, that branch is dead — and everything past it in the search tree is never visited.",
    examples: [
      { in: "n = 3", out: "[\"((()))\",\"(()())\",\"(())()\",\"()(())\",\"()()()\"]" },
      { in: "n = 1", out: "[\"()\"]" },
      { in: "n = 2", out: "[\"(())\",\"()()\"]" }
    ],
    constraints: [
      "n is a positive integer between 1 and 8.",
      "Every output string has length 2n, uses exactly n '(' and n ')', and is well-formed: at no prefix does ')' count exceed '(' count.",
      "The order of strings in the output doesn't matter; return all unique valid strings.",
      "Aim for O(C_n) time where C_n is the n-th Catalan number — generate only valid strings, never filtering invalid ones."
    ],
    whyItMatters: "This puzzle is the friendliest possible introduction to backtracking: the idea that you prune a search tree at every branch, not just at the leaves. The constraint (\"closes never exceed opens\") is checkable at every prefix, so you can reject a doomed branch the moment it violates the invariant — never generating a single invalid string. That same instinct powers every backtracking problem: N-Queens (reject a column conflict the moment you place the queen, not after the whole board is filled), Sudoku solvers (reject a digit the instant it conflicts with its row, column, or box), and subset-sum (stop adding once you overshoot the target). In every case, the win is the same: the search tree shrinks from \"all candidates\" to \"only viable candidates,\" and for problems with exponential raw search spaces, that pruning is the difference between finishing and not.\n\nThe subtler lesson is about constraints as running invariants. A constraint that can be expressed as a condition on the current partial state (\"opens placed so far ≤ n,\" \"closes placed so far ≤ opens\") is a constraint you can enforce at every step, not just verify at the end. Recognizing which constraints are prefix-checkable is what turns a brute-force enumeration into a pruned search. The Catalan number C_n = C(2n, n) / (n + 1) counts exactly the fraction of raw arrangements that are well-formed, and for large n that fraction is tiny — so the pruning isn't a nice-to-have, it's the only thing that makes the search tractable. When you catch yourself saying \"generate everything, then filter,\" ask: can I check the constraint one piece at a time? If yes, you can build only the valid answers and skip the garbage entirely.",
    hint: "Track two counters: open (how many '(' you've placed) and close (how many ')' you've placed). At each call: if open == n and close == n, emit the string. Otherwise, if open < n, recurse with open + 1 (place a '('). If close < open, recurse with close + 1 (place a ')'). The second condition is the key: you can only close a parenthesis that's already been opened. Every recursive call produces a valid prefix, so no filtering is ever needed.",
    solution: {
      lang: "javascript",
      code: "function generateParenthesis(n) {\n  const result = [];\n  function backtrack(open, close, current) {\n    if (open === n && close === n) {\n      result.push(current);\n      return;\n    }\n    if (open < n) {\n      backtrack(open + 1, close, current + '(');\n    }\n    if (close < open) {\n      backtrack(open, close + 1, current + ')');\n    }\n  }\n  backtrack(0, 0, '');\n  return result;\n}\n",
      notes: "Two counters, two recursive branches, zero filtering. The function builds a string character by character, and every complete path through the recursion tree produces a valid string — nothing is generated and then discarded.\n\nTrace example 1: n = 3. The recursion tree (abbreviated — showing only the branches that fire):\n• backtrack(0,0,''): open<3 → go '(' . close<0? no.\n• backtrack(1,0,'('): open<3 → go '(' . close<open (0<1) → go ')'.\n• backtrack(2,0,'(('): open<3 → go '(' . close<open (0<2) → go ')'.\n• backtrack(3,0,'((('): open==3, can't add '('. close<open (0<3) → go ')'.\n• backtrack(3,1,'((()'): close<open (1<3) → go ')'.\n• backtrack(3,2,'((())'): close<open (2<3) → go ')'.\n• backtrack(3,3,'((()))'): open==3 && close==3 → emit \"((()))\". ✓\n• backtrack(2,1,'(()'): open<3 → go '(' . close<open (1<2) → go ')'.\n• backtrack(3,1,'(()('): close<open (1<3) → go ')'.\n• backtrack(3,2,'(()()'): close<open (2<3) → go ')'.\n• backtrack(3,3,'(()())'): emit \"(()())\". ✓\n• backtrack(2,2,'(())'): open<3 → go '(' . close<open? 2<2? no.\n• backtrack(3,2,'(())('): close<open (2<3) → go ')'.\n• backtrack(3,3,'(())()'): emit \"(())()\". ✓\n• backtrack(1,1,'()'): open<3 → go '(' . close<open? 1<1? no.\n• backtrack(2,1,'()('): open<3 → go '(' . close<open (1<2) → go ')'.\n• backtrack(3,1,'()(('): close<open (1<3) → go ')'.\n• backtrack(3,2,'()(()'): close<open (2<3) → go ')'.\n• backtrack(3,3,'()(())'): emit \"()(())\". ✓\n• backtrack(2,2,'()()'): open<3 → go '(' . close<open? 2<2? no.\n• backtrack(3,2,'()()('): close<open (2<3) → go ')'.\n• backtrack(3,3,'()()()'): emit \"()()()\". ✓\n• Final result: [\"((()))\",\"(()())\",\"(())()\",\"()(())\",\"()()()\"] — 5 strings, matching C_3 = 5. ✓\n\nTrace example 2: n = 1.\n• backtrack(0,0,''): open<1 → go '('. close<open? 0<0? no.\n• backtrack(1,0,'('): open==1, can't add '('. close<open (0<1) → go ')'.\n• backtrack(1,1,'()'): open==1 && close==1 → emit \"()\". ✓\n• Result: [\"()\"] — C_1 = 1. ✓\n\nTrace example 3: n = 2.\n• backtrack(0,0,''): open<2 → go '('.\n• backtrack(1,0,'('): open<2 → go '('. close<open (0<1) → go ')'.\n• backtrack(2,0,'(('): close<open (0<2) → go ')'.\n• backtrack(2,1,'(()'): close<open (1<2) → go ')'.\n• backtrack(2,2,'(())'): emit \"(())\". ✓\n• backtrack(1,1,'()'): open<2 → go '('. close<open? 1<1? no.\n• backtrack(2,1,'()('): close<open (1<2) → go ')'.\n• backtrack(2,2,'()()'): emit \"()()\". ✓\n• Result: [\"(())\",\"()()\"] — C_2 = 2. ✓\n\nWhy no invalid string is ever generated: the condition close < open is checked before every ')' branch. If adding ')' would make closes exceed opens, the branch simply doesn't fire — the recursion never visits that node. This is the difference between \"generate and filter\" (O(C(2n,n)) candidates, most discarded) and \"generate only valid\" (O(C_n) candidates, none discarded). For n = 8, C_8 = 1,430 valid strings vs C(16,8) = 12,870 raw arrangements — the pruning eliminates 89% of the search space before it's even built.\n\nWhy the order is deterministic: the recursion always tries '(' before ')' when both are legal. This produces strings in a canonical order (most-nested-first), but any ordering is a valid answer — the problem asks for the set, not a sorted list."
    }
  },
  {
    id: "mirror-on-the-sidewalk",
    date: "2026-09-02",
    title: "Mirror on the Sidewalk",
    blurb: "A phrase written in chalk reads the same forward and backward — once you ignore the smudges. Two pointers from each end tell you in one pass, without cleaning anything.",
    difficulty: "Easy",
    minutes: 8,
    tags: ["two-pointers", "strings"],
    prompt: "You're given a string s. Decide whether it's a palindrome, considering only alphanumeric characters (letters a–z, A–Z, digits 0–9) and ignoring case. Spaces, punctuation, and everything else is a smudge — skip it. So \"A man, a plan, a canal: Panama\" reads the same front-to-back once you strip the smudges and lower everything: \"amanaplanacanalpanama\". Return true or false.\n\nThe reflex is to build a cleaned copy: iterate over s, push each alphanumeric character (lowercased) into a new string, then compare that string to its reverse. That's correct — and it's two passes plus an O(n) string allocation. It works, but it does unnecessary work: you're building a whole second string just to check a mirror, when a mirror is a relationship between two positions, not a property of a cleaned copy.\n\nThe click is that a palindrome is symmetric, and symmetry is checked from the outside in. Set one pointer at each end of the raw string. Walk them toward the center. If the character under a pointer isn't alphanumeric, skip it — advance that pointer inward without comparing. When both pointers sit on alphanumeric characters, compare them (case-insensitively). If they disagree, it's not a palindrome. If they agree, advance both and keep going. The pointers meet in the middle and never cross, so every relevant pair is checked exactly once. No cleaned copy, no reverse, no second pass — one walk, two pointers, constant space.\n\nThe deeper click is that skipping is free. The smudges don't change the answer; they just push the real characters further apart. So instead of cleaning the string and then asking \"is it a mirror?\", you let the pointers step over the noise and ask the mirror question directly on the raw string. The skipping is not a workaround — it's the clean way to express \"I only care about alphanumeric positions, and I care about them in order.\"",
    examples: [
      { in: 's = "A man, a plan, a canal: Panama"', out: "true" },
      { in: 's = "race a car"', out: "false" },
      { in: 's = " "', out: "true" }
    ],
    constraints: [
      "s has between 1 and 2·10^5 characters; any printable ASCII is possible.",
      "Consider only alphanumeric characters (a–z, A–Z, 0–9); ignore everything else. Case does not matter: 'A' equals 'a'.",
      "An empty string (after ignoring non-alphanumeric) is a palindrome — return true.",
      "Aim for O(n) time and O(1) extra space — no cleaned copy, no reverse."
    ],
    whyItMatters: "This is the friendliest possible introduction to the most important habit in two-pointer problem-solving: when a relationship is symmetric, check it from the outside in, not by building a transformed copy and comparing. The reflex — clean the string, reverse it, compare — works, but it does work the problem doesn't require: a full string allocation and a second pass, all to answer a question that's really about pairs of positions. The two-pointer walk asks the question directly, and the smudges cost nothing because skipping is a constant-time skip, not a transformation.\n\nThe deeper lesson is about what to ignore. The string is full of noise — spaces, commas, colons — and the noise is irrelevant to the answer. The instinct to 'clean first, then solve' is powerful and often right, but it silently pays a cost: extra space, extra passes, and a transformed copy that's disconnected from the original positions. The two-pointer approach keeps you in the original string and treats the noise as something to step over, not something to remove. That same instinct — 'the noise doesn't change the answer, so don't materialize its absence' — is what makes in-place deduplication, in-place partitioning (Dutch flag), and constant-space merge possible. When the irrelevant parts are frequent and the relevant parts are sparse, skipping beats cleaning.",
    hint: "Two pointers, lo at the start and hi at the end. While lo < hi: if s[lo] isn't alphanumeric, lo++. If s[hi] isn't alphanumeric, hi--. When both are alphanumeric, compare them case-insensitively — if they differ, return false; otherwise lo++, hi--. If the loop finishes, return true. The key: skip the noise on the fly instead of building a cleaned string.",
    solution: {
      lang: "javascript",
      code: "function isPalindrome(s) {\n  let lo = 0, hi = s.length - 1;\n  while (lo < hi) {\n    while (lo < hi && !/[a-z0-9]/i.test(s[lo])) lo++;   // skip smudges from left\n    while (lo < hi && !/[a-z0-9]/i.test(s[hi])) hi--;   // skip smudges from right\n    if (s[lo].toLowerCase() !== s[hi].toLowerCase()) return false;\n    lo++;\n    hi--;\n  }\n  return true;\n}",
      notes: "Two pointers walk inward from each end. The inner while-loops skip non-alphanumeric characters — they guard on lo < hi, so a pointer can never cross the other. When both pointers sit on alphanumeric characters, the comparison is case-insensitive. If they differ, the mirror is broken; if they match, advance both and continue. The loop ends when lo >= hi — every pair has been checked.\n\nTrace example 1: s = \"A man, a plan, a canal: Panama\" (length 21).\n• lo=0 'A', hi=20 'a' — both alphanumeric. 'a' === 'a'. lo=1, hi=19.\n• lo=1 ' ' → skip. lo=2 'm', hi=19 'm' — 'm' === 'm'. lo=3, hi=18.\n• lo=3 'a', hi=18 'a' — match. lo=4, hi=17. (hi skips ',' at index 17 and lands on 'a' at 16.)\n• Every remaining alphanumeric pair agrees — \"amanaplanacanalpanama\" is a palindrome. lo meets hi, the loop ends.\n• return true. ✓\n\nTrace example 2: s = \"race a car\" (length 9).\n• lo=0 'r', hi=8 'r' — 'r' === 'r'. lo=1, hi=7.\n• lo=1 'a', hi=7 'a' — 'a' === 'a'. lo=2, hi=6.\n• lo=2 'c', hi=6 'c' — 'c' === 'c'. lo=3, hi=5.\n• lo=3 'e', hi=5 'a' — hi=5 is ' ' → skip, hi=4. hi=4 is 'a' → not ' ' so stop. Now lo=3 'e', hi=4 'a' — 'e' !== 'a' → return false. ✓\nCleaned: \"raceacar\" — first three pairs match (r, a, c) but the fourth pair is 'e' vs 'a'. Not a palindrome.\n\nTrace example 3: s = \" \" (length 1).\n• lo=0, hi=0. lo < hi is false (0 < 0) → the outer loop never runs.\n• return true. ✓ A string with no alphanumeric characters is an empty palindrome — nothing to compare, trivially true.\n\nWhy skipping is safe: the inner while-loops guard on lo < hi, so they can never push a pointer past the other. A string of all smudges (like \".,!\") simply skips until lo >= hi and returns true. Each character is visited at most once by each pointer, so the total work is O(n). Space is O(1) — two integer pointers, no cleaned copy."
    }
  },
  {
    id: "how-many-ones",
    date: "2026-09-01",
    title: "How Many Ones?",
    blurb: "Count the 1-bits in every number from 0 to n — not one at a time, but all at once, with a trick that makes each answer free.",
    difficulty: "Medium",
    minutes: 10,
    tags: ["bit-manipulation", "dynamic-programming"],
    prompt: "You're given a non-negative integer n. For every number from 0 to n, count how many of its binary digits are 1. Return an array where ans[i] is the number of 1-bits in i.\n\nSo for n = 5, the answer is [0, 1, 1, 2, 1, 2] — zero has zero 1-bits, one (0b1) has one, two (0b10) has one, three (0b11) has two, four (0b100) has one, and five (0b101) has two.\n\nThe reflex is to loop from 0 to n and, for each number, count its 1-bits by shifting and masking — or by calling a popcount function. That's correct, and for each individual number it's O(number of bits). But you're computing n+1 answers, so that's O(n log n) total. Worse, you're recomputing the same work over and over: the bit-pattern of i shares almost all its structure with the bit-pattern of i >> 1.\n\nThe click is that the number of 1-bits in i is exactly the number of 1-bits in (i >> 1) — that's i with its last bit dropped — plus that last bit itself (i & 1). Shift right by one removes the lowest bit; everything else is a smaller number you've already counted. So ans[i] = ans[i >> 1] + (i & 1). You compute each answer from the answer one position back, in one operation, and the whole array fills in a single O(n) pass.\n\nThe deeper click is a second recurrence that's even more elegant: ans[i] = ans[i & (i - 1)] + 1. The expression i & (i - 1) clears i's lowest set bit — that's Brian Kernighan's trick — so i has exactly one more 1-bit than the number you get by clearing its lowest bit. Either recurrence turns a problem that felt like n independent popcounts into a single forward scan where each answer costs one addition.",
    examples: [
      { in: "n = 5", out: "[0, 1, 1, 2, 1, 2]" },
      { in: "n = 0", out: "[0]" },
      { in: "n = 8", out: "[0, 1, 1, 2, 1, 2, 2, 3, 1]" }
    ],
    constraints: [
      "n is a non-negative integer between 0 and 10^5.",
      "ans[0] = 0 by definition — zero has no 1-bits.",
      "Aim for O(n) time — each answer computed in O(1) from a previous one, not by re-counting bits."
    ],
    whyItMatters: "This puzzle is the friendliest introduction to the most useful idea in bit manipulation: a number's bit-pattern is not independent of its neighbors — it's a recycled version of a smaller number you've already solved. The recurrence ans[i] = ans[i >> 1] + (i & 1) isn't a coincidence; it's the observation that shifting right by one bit maps i to a strictly smaller number, and the only thing you lost is the bit you can read off with a single AND. That same instinct — 'the answer for this input is the answer for a smaller input plus a constant-time correction' — is the definition of dynamic programming, and it shows up wherever a problem's inputs overlap structurally: Levenshtein distance (edit one character, reuse the rest), knapsack (add one item, reuse the capacity), and every prefix-product or running-sum computation. The transferable lesson is to look at a batch of related computations and ask: what does each one share with the one before it? If the answer is 'almost everything,' there's a recurrence waiting to be extracted.\n\nThe subtler lesson is about the two recurrences themselves. ans[i >> 1] + (i & 1) says 'drop the last bit and add it back.' ans[i & (i - 1)] + 1 says 'clear the lowest set bit and count it.' Both are correct, both are O(1), but they slice the problem differently: the first walks by consecutive integers, the second by the number of set bits. Brian Kernighan's i & (i - 1) is the same trick that counts a single number's set bits in O(number of 1s) instead of O(number of bits) — it jumps directly to the next smaller number with one fewer bit, skipping all the zeros. Seeing both recurrences side by side is seeing the same structure from two angles, and that's what makes a technique transferable rather than memorized.",
    hint: "For each i from 1 to n, ans[i] = ans[i >> 1] + (i & 1). The right shift drops the lowest bit; ans[i >> 1] was already computed (it's a smaller index); i & 1 is the bit you just dropped. One lookup, one addition, one pass. Initialize ans[0] = 0.",
    solution: {
      lang: "javascript",
      code: "function countBits(n) {\n  const ans = new Array(n + 1);\n  ans[0] = 0;\n  for (let i = 1; i <= n; i++) {\n    ans[i] = ans[i >> 1] + (i & 1);\n  }\n  return ans;\n}",
      notes: "One array, one pass, one addition per element. ans[0] = 0 is the base case — zero has no 1-bits. Each subsequent answer is the answer for i >> 1 (i with its last bit dropped — always a smaller index, already computed) plus the last bit itself (i & 1, which is 0 or 1). The recurrence is correct because binary representation is positional: shifting right by one removes exactly the lowest bit, leaving the rest intact, so the 1-count of i is the 1-count of (i >> 1) plus the dropped bit.\n\nTrace example 1: n = 5.\n• ans[0] = 0. (base case)\n• i=1: ans[1 >> 1] + (1 & 1) = ans[0] + 1 = 0 + 1 = 1. (0b1 → 1 bit)\n• i=2: ans[2 >> 1] + (2 & 1) = ans[1] + 0 = 1 + 0 = 1. (0b10 → 1 bit; shift drops the 0, add nothing)\n• i=3: ans[3 >> 1] + (3 & 1) = ans[1] + 1 = 1 + 1 = 2. (0b11 → 2 bits; shift drops a 1, add it back)\n• i=4: ans[4 >> 1] + (4 & 1) = ans[2] + 0 = 1 + 0 = 1. (0b100 → 1 bit; shift drops the 0)\n• i=5: ans[5 >> 1] + (5 & 1) = ans[2] + 1 = 1 + 1 = 2. (0b101 → 2 bits; shift drops a 1, add it back)\n• return [0, 1, 1, 2, 1, 2]. ✓\n\nTrace example 2: n = 0.\n• ans[0] = 0. The loop doesn't run (i starts at 1, 1 > 0). return [0]. ✓\n\nTrace example 3: n = 8.\n• ans[0] = 0.\n• i=1: ans[0] + 1 = 1.     (0b0001)\n• i=2: ans[1] + 0 = 1.     (0b0010)\n• i=3: ans[1] + 1 = 2.     (0b0011)\n• i=4: ans[2] + 0 = 1.     (0b0100)\n• i=5: ans[2] + 1 = 2.     (0b0101)\n• i=6: ans[3] + 0 = 2.     (0b0110)\n• i=7: ans[3] + 1 = 3.     (0b0111)\n• i=8: ans[4] + 0 = 1.     (0b1000 — one bit, and 8>>1=4 which had 1 bit)\n• return [0, 1, 1, 2, 1, 2, 2, 3, 1]. ✓\n\nWhy the recurrence works: i >> 1 is floor(i / 2) — it's i with the last binary digit removed. The binary representation of i is the binary representation of (i >> 1) with one extra digit appended: a 0 if i is even, a 1 if i is odd. So the number of 1-bits in i equals the number of 1-bits in (i >> 1) — all the bits above the last — plus the last bit, which is exactly i & 1. Since i >> 1 is always less than i (for i ≥ 1), ans[i >> 1] was already computed earlier in the pass. That's the whole trick: each answer is a smaller answer plus a single bit.\n\nThe alternative recurrence — ans[i] = ans[i & (i - 1)] + 1 — uses Brian Kernighan's identity: i & (i - 1) clears the lowest set bit of i. So i has exactly one more 1-bit than (i & (i - 1)), which is a smaller number already in the table. This version counts by set bits rather than by consecutive integers, and it's the same trick that lets you count a single number's bits in O(number of 1s) instead of O(number of bits). Both recurrences are O(n) for the full array; the i >> 1 version is slightly more cache-friendly because it accesses consecutive indices.\n\nTime O(n) — one addition per element. Space O(n) for the output array (or O(1) extra if you don't count the output). The naive approach — a popcount per number — is O(n log n) because each popcount walks all log(n) bit positions. The recurrence collapses that to O(n) by reusing the overlap: each answer inherits all but one bit from a neighbor that's already been solved."
    }
  },
  {
    id: "five-dollar-lemonade",
    date: "2026-08-31",
    title: "Five-Dollar Lemonade",
    blurb: "Every cup is five dollars. Every customer pays with a five, a ten, or a twenty. Can you make change for the whole line?",
    difficulty: "Easy",
    minutes: 8,
    tags: ["greedy", "arrays"],
    prompt: "You run a lemonade stand where every cup costs $5. Customers line up in a fixed order, and each buys exactly one cup. You start with zero cash on hand. Each customer pays with a $5, $10, or $20 bill. You must give correct change: $5 back for a $10, and $15 back for a $20. You can only pay change from the bills you've already collected. Return whether you can serve every customer in line.\n\nThe reflex is to keep all the bills you've collected and, for each $20 customer, try every combination of change — a $10 and a $5, or three $5s, or (if neither works) give up. That's correct but clumsy: you're searching when you should be deciding. A $20 customer needs $15, and there are only two ways to make it: $10+$5 or $5+$5+$5. The question isn't 'which combination works?' but 'which one should I prefer?'\n\nThe click is that $5 bills are strictly more useful than $10 bills. A $5 can make change for a $10 customer AND a $20 customer; a $10 can only help with a $20. So when a $20 customer arrives and both options are available, you should always spend the $10 first — it preserves a $5 you might desperately need for the next $10 customer who walks up. Track just two counters: fives and tens. For a $5 customer, increment fives. For a $10 customer, decrement fives and increment tens (if fives is zero, you can't make change — return false). For a $20 customer, prefer the $10+$5 route; if you can't, fall back to three $5s; if neither works, return false.\n\nThe deeper click is the exchange argument — the proof that greedy isn't just convenient, it's optimal. Suppose a non-greedy approach gives three $5s for a $20 instead of a $10+$5. Later, a $10 customer arrives and there are no $5s left. Could the non-greedy choice have made things better? No — you could have swapped: give $10+$5 to the earlier $20, freeing a $5 for this $10. The swap never hurts (the $10 was available at the time, since the non-greedy choice left it sitting in the drawer), and it always helps (the $5 is now free). So any valid non-greedy solution can be transformed into a greedy one without breaking anything. If the greedy solution fails, no solution could have succeeded.",
    examples: [
      { in: "bills = [5, 5, 5, 10, 20]", out: "true" },
      { in: "bills = [5, 5, 10, 10, 20]", out: "false" },
      { in: "bills = [5, 5, 5, 5, 10, 20, 10]", out: "true" }
    ],
    constraints: [
      "bills contains only 5, 10, and 20; the line has between 1 and 10^4 customers.",
      "You start with zero cash. You can only make change from bills collected from earlier customers.",
      "Aim for O(n) time and O(1) extra space — two counters, one pass."
    ],
    whyItMatters: "This puzzle is the gentlest introduction to the most important habit in greedy problem-solving: when you have a choice, prefer the option that preserves flexibility. The $10 bill is less versatile than the $5 (it only helps with $20 customers), so spending it first is always safe and sometimes necessary. That same instinct — 'which resource is more reusable, and should I hoard it?' — governs greedy algorithms everywhere, from activity selection (earliest finish time preserves the most room) to cache eviction (discard the least useful entry) to knapsack approximations.\n\nThe deeper lesson is the exchange argument: the proof technique that turns 'greedy seems to work' into 'greedy is optimal.' You show that any solution violating the greedy choice can be patched to honor it without making anything worse — a swap that never hurts and sometimes helps. That same swap proves the optimality of activity selection, Huffman coding, and Dijkstra's shortest path. Once you internalize the pattern — 'assume a better solution, find the swap that converts it to greedy, show the swap is harmless' — you can prove greedy correct in a few lines instead of trusting intuition.",
    hint: "Track two integers: fives and tens. For a $5, just collect it. For a $10, give back a $5 (return false if none). For a $20, prefer giving $10+$5 (the greedy choice), because $10s are less versatile — they can only help future $20 customers, while $5s are needed for $10 customers too. If you don't have both, try three $5s. If neither works, return false. One pass, two counters, one decision per customer.",
    solution: {
      lang: "javascript",
      code: "function lemonadeChange(bills) {\n  let fives = 0, tens = 0;\n  for (const bill of bills) {\n    if (bill === 5) {\n      fives++;\n    } else if (bill === 10) {\n      if (fives === 0) return false;\n      fives--;\n      tens++;\n    } else { // bill === 20\n      if (tens > 0 && fives > 0) {\n        tens--;\n        fives--;       // prefer $10 + $5 — saves $5s for future $10 customers\n      } else if (fives >= 3) {\n        fives -= 3;\n      } else {\n        return false;\n      }\n    }\n  }\n  return true;\n}",
      notes: "Two counters, one pass, one branch per bill. fives and tens are the only state — you never need to track $20s because a $20 bill can never be given as change (no customer needs $20 back). The greedy choice for a $20 is tens-- && fives-- (spend the less-versatile $10 first), falling back to fives -= 3 only when no $10 is available.\n\nTrace example 1: [5, 5, 5, 10, 20].\n• bill=5: fives=1.\n• bill=5: fives=2.\n• bill=5: fives=3.\n• bill=10: fives>0 → fives=2, tens=1. (Gave $5 change.)\n• bill=20: tens>0 && fives>0 → tens=0, fives=1. (Gave $10+$5 change.)\n• return true. ✓\n\nTrace example 2: [5, 5, 10, 10, 20].\n• bill=5: fives=1.\n• bill=5: fives=2.\n• bill=10: fives=1, tens=1.\n• bill=10: fives=0, tens=2. (Gave the last $5 as change.)\n• bill=20: tens>0 && fives>0? fives=0 → NO. fives>=3? NO. return false. ✓\nBoth $5s were spent on $10 customers. When the $20 arrives, there's no $5 for change, and $10+$10=$20 isn't $15. No way to make change.\n\nTrace example 3: [5, 5, 5, 5, 10, 20, 10].\n• bill=5: fives=1.\n• bill=5: fives=2.\n• bill=5: fives=3.\n• bill=5: fives=4.\n• bill=10: fives=3, tens=1. (Gave $5 change.)\n• bill=20: tens>0 && fives>0 → tens=0, fives=2. (Greedy: $10+$5.)\n• bill=10: fives>0 → fives=1, tens=1. (Gave $5 change — possible because we saved a $5!)\n• return true. ✓\n\nThis is the example that proves greedy matters. At the $20, we had fives=3 and tens=1. Both $10+$5 and $5+$5+$5 were available. Greedy chose $10+$5, leaving fives=2. The non-greedy choice ($5+$5+$5) would have left fives=0 — and the next customer paid with a $10, which requires exactly one $5 in change. With fives=0, we'd return false. The greedy choice saved the $5 that made the last customer possible.\n\nWhy greedy is optimal (exchange argument): suppose there's a valid solution that, for some $20 customer, chose $5+$5+$5 instead of $10+$5. At that moment, a $10 was available (the non-greedy choice left it in the drawer). Now consider the first time the non-greedy solution later fails to serve a customer that the greedy solution could. The only difference is the drawer's contents. Swapping $5+$5+$5 for $10+$5 at the earlier $20 frees a $5 and uses a $10, which can only help future $10 customers (who need $5s) and never hurts future $20 customers (the $10 was already there). So the swap converts the non-greedy solution to the greedy one without introducing any failure. If greedy fails, every solution fails.\n\nTime O(n) — one pass. Space O(1) — two integer counters."
    }
  },
  {
    id: "the-quietest-heist",
    date: "2026-08-30",
    title: "The Quietest Heist",
    blurb: "A street of houses, each stuffed with cash. Rob two neighbors and the alarm screams. What's the most you can steal without setting it off?",
    difficulty: "Medium",
    minutes: 12,
    tags: ["dynamic-programming", "arrays"],
    prompt: "You're a thief casing a street. Each house has some cash — nums[i] dollars in house i. Adjacent houses have linked alarms: rob two neighbors and the whole block lights up. You can rob any subset of houses, as long as no two robbed houses sit next to each other. Return the maximum total you can walk away with.\n\nThe reflex is to try every combination of houses — the power set — and keep the one with the most money and no neighbors. That's correct, and for four houses it's fine, but 2^n grows fast: thirty houses is a billion subsets. The reflex also misses the structure, because the constraint is local — 'don't rob adjacent' — and a local constraint means the answer builds up one house at a time.\n\nThe click is to stop asking 'which houses do I rob?' and start asking 'what's the most I can have in my bag by the time I reach house i?' Walk the street left to right. At each house, you either rob it or you don't. If you rob it, you get its cash plus whatever you had two houses ago — you can't touch the neighbor. If you skip it, you keep whatever you had at the previous house. The better of those two is your answer for this position. That's a recurrence, and like all recurrences on a linear structure, you only need the last two values to climb your way to the end.\n\nThe deeper click is that you never actually decide 'rob or skip' — the max does it for you. rob(i) = max(rob(i-1), rob(i-2) + nums[i]). If the house's cash plus the best-from-two-back beats the best-from-one-back, the max picks 'rob'; otherwise it picks 'skip.' You track a running maximum, not a sequence of choices, and the choices sort themselves out.",
    examples: [
      { in: "nums = [1, 2, 3, 1]", out: "4" },
      { in: "nums = [2, 7, 9, 3, 1]", out: "12" },
      { in: "nums = [2, 1, 1, 2]", out: "4" }
    ],
    constraints: [
      "nums[i] is a non-negative integer (zero means an empty house — no cash, but you can still 'rob' it).",
      "The street has at least one house and at most 100; each house has at most 400 dollars.",
      "Aim for O(n) time and O(1) extra space — you only need the last two values."
    ],
    whyItMatters: "This is the gateway drug to dynamic programming. Every DP problem in the world is the same shape: describe the answer in terms of smaller answers, then compute bottom-up so each subproblem is solved exactly once. The move that unlocks this one — stop asking 'which items do I pick?' and start asking 'what's the best I can do by the time I reach position i?' — is the same move that unlocks knapsack, edit distance, and shortest paths. The local constraint ('don't rob adjacent') is what makes the recurrence local, and a local recurrence is what makes the bottom-up pass work: you only look back two steps, never forward, never at the whole array at once.\n\nThe subtler lesson is about the max. You never branch on 'rob or skip' — you take the max of both and let the arithmetic choose. That's the heart of DP: optimal substructure means the best answer at each step is the best of a few local choices, and the recurrence threads them together without ever materializing the full decision tree. The max collapses the exponential search into a linear scan because it's enough to know the best answer at each prefix — the choices that got you there are irrelevant once the number is settled. That same instinct — 'I don't need the path, I need the score' — is what turns shortest-path, string matching, and inventory optimization from intractable searches into table lookups.",
    hint: "Walk left to right. Keep two values: the best you can do ending at the previous house (prev1) and the best ending two houses back (prev2). At each new house i, the best is max(prev1, prev2 + nums[i]) — either skip this house (keep prev1) or rob it (add its cash to prev2, since you can't rob the neighbor). Roll the window forward: prev2 becomes the old prev1, prev1 becomes the new best. Two variables, one pass, no backtracking.",
    solution: {
      lang: "javascript",
      code: "function rob(nums) {\n  if (nums.length === 0) return 0;\n  if (nums.length === 1) return nums[0];\n  let prev2 = nums[0];\n  let prev1 = Math.max(nums[0], nums[1]);\n  for (let i = 2; i < nums.length; i++) {\n    const curr = Math.max(prev1, prev2 + nums[i]);\n    prev2 = prev1;\n    prev1 = curr;\n  }\n  return prev1;\n}",
      notes: "Two variables, one pass, one max per step. prev2 is the best you can do ending at house i-2; prev1 is the best ending at house i-1. At each house, the best you can do is either skip it (prev1, no change) or rob it (prev2 + nums[i], since robbing means you can't have robbed the neighbor). The max picks the better option, and you roll the window forward.\n\nTrace example 1: [1, 2, 3, 1].\n• prev2 = 1 (just house 0), prev1 = max(1, 2) = 2 (house 1 alone is better).\n• i=2: curr = max(2, 1 + 3) = max(2, 4) = 4. prev2=2, prev1=4. (Rob houses 0 and 2: 1+3=4 beats skipping to keep 2.)\n• i=3: curr = max(4, 2 + 1) = max(4, 3) = 4. prev2=4, prev1=4. (Skipping house 3 keeps 4; robbing it would give 2+1=3, worse.)\n• return 4. ✓ Rob houses 0 and 2: 1 + 3 = 4.\n\nTrace example 2: [2, 7, 9, 3, 1].\n• prev2 = 2, prev1 = max(2, 7) = 7. (House 1 alone beats house 0 alone.)\n• i=2: curr = max(7, 2 + 9) = max(7, 11) = 11. prev2=7, prev1=11. (Houses 0+2 = 11 beats house 1 alone = 7.)\n• i=3: curr = max(11, 7 + 3) = max(11, 10) = 11. prev2=11, prev1=11. (Keeping 11 beats robbing 3 on top of house 1's 7.)\n• i=4: curr = max(11, 11 + 1) = max(11, 12) = 12. prev2=11, prev1=12. (Robbing house 4 on top of the best-through-2 (11) gives 12 — the winning move.)\n• return 12. ✓ Rob houses 0, 2, and 4: 2 + 9 + 1 = 12.\n\nTrace example 3: [2, 1, 1, 2].\n• prev2 = 2, prev1 = max(2, 1) = 2. (House 0 alone beats house 1 alone.)\n• i=2: curr = max(2, 2 + 1) = max(2, 3) = 3. prev2=2, prev1=3. (Houses 0+2 = 3 beats house 0 alone = 2.)\n• i=3: curr = max(3, 2 + 2) = max(3, 4) = 4. prev2=3, prev1=4. (Houses 0+3 = 4 — skipping house 2 to reach back to house 0's 2, then adding house 3's 2. The max sees that robbing 2 then 3 (1+2=3) is worse than robbing 0 then 3 (2+2=4).)\n• return 4. ✓ Rob houses 0 and 3: 2 + 2 = 4.\n\nWhy the recurrence is correct: at house i, you either rob it or you don't. If you rob it, you can't have robbed house i-1, so your best is nums[i] plus the best through house i-2. If you skip it, your best is whatever you had through house i-1 — skipping adds nothing. The max of those two is provably optimal, because every valid plan either includes house i or doesn't, and each case is captured exactly. Time O(n), space O(1) — the rolling window replaces the entire DP table with two scalars, the same trick that turns the Fibonacci recurrence into two variables."
    }
  },
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
