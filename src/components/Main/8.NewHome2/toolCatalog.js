// ─────────────────────────────────────────────────────────
// File: src/data/toolCatalog.js
// Master list of every mini-app.  Edit here only.
// ─────────────────────────────────────────────────────────

// canonical stage names (used by NewHome2 for chips / tabs)
export const Stage = {
  Plan:      "Plan",
  Learn:     "Learn",
  Diagnose:  "Diagnose",
  Reinforce: "Reinforce",
  Test:      "Test",
  Sprint:    "Sprint",
};

const grad = (a, b) => `linear-gradient(135deg,${a} 0%,${b} 100%)`;

/* ─────────────────────────────────────────────────────────
   1.  PLANNING
   ──────────────────────────────────────────────────────── */
export const toolCatalog = [
   {
    id:        "e2e_planner",               // ⚠ must stay unique
    title:     "End-to-End Planner",
    emoji:     "🗺️",                        // big map-pin
    bg:        "linear-gradient(135deg,#f87171,#fca5a5)",
    categories:["Plan","Learn","Diagnose","Test","Sprint","Reinforce"],
    blurb:     "Auto-builds a day-by-day roadmap across all stages."
  },
  {
    id: "plan-wizard",
    emoji: "🗺️",
    title: "Plan Wizard",
    categories: [Stage.Plan],
    blurb:
      "3-step wizard: pick topics ► set start level ► time budget ► auto-schedule.",
    conceptUse:
      "Scans the concept graph for each chosen chapter to pull prerequisite chains and difficulty weights.",
    learnerUse:
      "Reads the learner-vector for current mastery & pace; writes a fresh day-by-day schedule back.",
    userFeel:
      "Feels like a counsellor who already knows my weak chapters and free days, then hands me a ready roadmap.",
    bg: grad("#fecaca", "#f87171"),
  },
  {
    id: "auto-gantt",
    emoji: "📅",
    title: "Auto-Gantt Planner",
    categories: [Stage.Plan],
    tags: ["Analytics"],
    blurb:
      "Backward Gantt with buffer days and a red-zone sprint inserted automatically.",
    conceptUse:
      "Uses critical-path lengths inside the concept graph to decide where buffers must live.",
    learnerUse:
      "Looks at historical slip-days in the learner model and widens tasks where I usually lag.",
    userFeel:
      "When I drag a bar, the whole chart reshapes into a still-doable plan all by itself.",
    bg: grad("#fda4af", "#fb7185"),
  },
  {
    id: "scope-picker",
    emoji: "🎯",
    title: "Study-Scope Picker",
    categories: [Stage.Plan],
    blurb:
      "Fetches official syllabus + past-paper weightings so you can tick exactly what matters.",
    conceptUse:
      "Queries concepts tagged with ‘high-yield’ frequencies and syllabus flags.",
    learnerUse:
      "Checks mastered nodes and greys them out so I don’t over-study known areas.",
    userFeel:
      "One click and I see the official topics plus traffic-light colours for importance.",
    bg: grad("#fcd34d", "#f97316"),
  },
  {
    id: "time-budget-sim",
    emoji: "⏱️",
    title: "Time-Budget Simulator",
    categories: [Stage.Plan],
    blurb:
      "Drag a daily-minutes slider and preview how long the plan will stretch.",
    conceptUse:
      "Sums estimated minutes for all concepts still ‘unmastered’.",
    learnerUse:
      "Multiplies by my personal reading-speed coefficient stored in the vector.",
    userFeel:
      "A single slider instantly shows a finish-date and warns me if it’s unrealistic.",
    bg: grad("#fde68a", "#f59e0b"),
  },

  /* ───────────────────────────────────────────────────────
     2.  LEARN  (explore / comprehend)
     ───────────────────────────────────────────────────── */
  {
    id: "concept-explorer",
    emoji: "🧭",
    title: "Concept Explorer",
    categories: [Stage.Learn],
    blurb:
      "Interactive graph of chapter ► sub-chapter ► concept with breadcrumb trail.",
    conceptUse:
      "Streams the neighbourhood nodes and edge types (prereq, example-of, etc.).",
    learnerUse:
      "Overlays mastery heat-map so weaker nodes glow red.",
    userFeel:
      "A zoomable mind-map that lights up as I conquer each idea.",
    bg: grad("#6ee7b7", "#3b82f6"),
  },
  {
    id: "smart-chat",
    emoji: "🤖",
    title: "Smart Chat",
    categories: [Stage.Learn],
    blurb:
      "Context-aware doubt solver that pulls your notes + past mistakes into the prompt.",
    conceptUse:
      "Runs semantic search over concept summaries & my own note snippets.",
    learnerUse:
      "Appends my misconceptions vector and writes a ‘clarified’ flag when resolved.",
    userFeel:
      "Feels like a tutor who remembers every silly mistake I ever made.",
    bg: grad("#a5b4fc", "#6366f1"),
  },
  {
    id: "eli5-toggle",
    emoji: "👶",
    title: "Explain-Like-I’m-5",
    categories: [Stage.Learn],
    blurb:
      "Toggle any paragraph between L5 / L10 / L15 depth for progressive reveal.",
    conceptUse:
      "Selects abstraction layers stored on each concept node.",
    learnerUse:
      "Logs which depth I settled on to gauge comfort level.",
    userFeel:
      "I click once—suddenly the text sounds like a kids’ book; click again, it’s exam depth.",
    bg: grad("#d8b4fe", "#818cf8"),
  },

  /* ───────────────────────────────────────────────────────
     3.  DIAGNOSE  (fast gap-finding)
     ───────────────────────────────────────────────────── */
  {
    id: "lightning-quiz",
    emoji: "⚡",
    title: "5-min Lightning Quiz",
    categories: [Stage.Diagnose],
    blurb:
      "Ten adaptive MCQs that map weak sub-chapters in under five minutes.",
    conceptUse:
      "Selects one representative item per high-weight concept.",
    learnerUse:
      "Updates mastery probabilities with each response (Bayesian).",
    userFeel:
      "In 30 questions it tells me exactly which two units to revisit tonight.",
    bg: grad("#bae6fd", "#3b82f6"),
  },
  {
    id: "confidence-ranker",
    emoji: "📶",
    title: "Confidence Ranker",
    categories: [Stage.Diagnose],
    blurb:
      "Swipe left / right on concept cards to self-label comfort level—feeds planner.",
    conceptUse:
      "Streams concept titles & short definitions onto cards.",
    learnerUse:
      "Writes self-reported confidence scores that weight future schedules.",
    userFeel:
      "A Tinder-like stack where I admit ‘I’m shaky on this’ with one flick.",
    bg: grad("#facc15", "#eab308"),
  },

  /* ───────────────────────────────────────────────────────
     4.  REINFORCE / REVIEW  (retain & deepen)
     ───────────────────────────────────────────────────── */
  {
    id: "cloze-maker",
    emoji: "🔍",
    title: "Auto-Cloze Builder",
    categories: [Stage.Reinforce],
    blurb:
      "Paste notes ➜ converts to spaced-repetition cloze cards automatically.",
    conceptUse:
      "Detects key nouns and links them to concept IDs for tagging.",
    learnerUse:
      "Schedules new cards using my forgetting-curve parameters.",
    userFeel:
      "My messy notes become Anki-style cards in two seconds.",
    bg: grad("#fef08a", "#f59e0b"),
  },
  {
    id: "memory-palace",
    emoji: "🏰",
    title: "Memory-Palace Mapper",
    categories: [Stage.Reinforce],
    blurb:
      "Assigns each concept to a 3-D room in a VR house to aid vivid recall.",
    conceptUse:
      "Groups sibling concepts into spatial clusters.",
    learnerUse:
      "Records which location cues led to faster recall.",
    userFeel:
      "I walk through a virtual house and facts pop into my head room-by-room.",
    bg: grad("#fbcfe8", "#ec4899"),
  },
  {
    id: "rapid-fire",
    emoji: "🚀",
    title: "Rapid-Fire Drill",
    categories: [Stage.Reinforce],
    blurb:
      "One-question-per-second stream that penalises hesitation—builds reflexes.",
    conceptUse:
      "Pings micro-facts linked to high-weight concepts.",
    learnerUse:
      "Logs reaction time & accuracy; boosts items with slow taps.",
    userFeel:
      "Feels like an arcade shooter but with formulas instead of aliens.",
    bg: grad("#fdba74", "#fb923c"),
  },

  /* ───────────────────────────────────────────────────────
     5.  TEST  (exam-style practice)
     ───────────────────────────────────────────────────── */
  {
    id: "mock-to-drill",
    emoji: "🧪",
    title: "Mock-to-Drill",
    categories: [Stage.Test],
    blurb:
      "Turn any past paper into a targeted drill list grouped by concept difficulty.",
    conceptUse:
      "Auto-tags every question with concept IDs and Bloom level.",
    learnerUse:
      "Sends every wrong answer into the rapid-fire queue and bumps mastery down.",
    userFeel:
      "My past paper instantly transforms into a backlog of exactly what I got wrong.",
    bg: grad("#818cf8", "#6366f1"),
  },
  {
    id: "past-paper-surface",
    emoji: "📊",
    title: "Past-Paper Surface",
    categories: [Stage.Test],
    tags: ["Analytics"],
    blurb:
      "Pie-charts of question types & topics across years—spot hot zones instantly.",
    conceptUse:
      "Aggregates concept frequency by year and difficulty.",
    learnerUse:
      "Compares my mastery heat-map to paper hot-zones to highlight unseen risks.",
    userFeel:
      "Shows me that ‘Electrochemistry’ is 18 % of the last 5 papers—yikes!",
    bg: grad("#fecdd3", "#fda4af"),
  },
  {
    id: "adaptive-mock",
    emoji: "🎯",
    title: "Adaptive Mock",
    categories: [Stage.Test],
    blurb:
      "Difficulty climbs every two correct answers; live percentile at the end.",
    conceptUse:
      "Pulls items by concept & calibrated difficulty logits.",
    learnerUse:
      "Updates an on-the-fly theta score to keep challenge perfect.",
    userFeel:
      "The test feels ‘just tough enough’ all the way through.",
    bg: grad("#6ee7b7", "#10b981"),
  },

  /* ───────────────────────────────────────────────────────
     6.  SPRINT  (final crunch)
     ───────────────────────────────────────────────────── */
  {
    id: "red-zone-sprint",
    emoji: "🏁",
    title: "Red-Zone Sprint",
    categories: [Stage.Sprint],
    blurb:
      "14-day finishing plan mixing hardest questions with speed drills.",
    conceptUse:
      "Ranks yet-unmastered high-weight concepts and packs them front-loaded.",
    learnerUse:
      "Pushes daily workload 20 % above normal tolerance tracked in the vector.",
    userFeel:
      "A brutal but doable two-week boot-camp appears with zero setup.",
    bg: grad("#f9a8d4", "#ec4899"),
  },
  {
    id: "speed-run",
    emoji: "⏩",
    title: "Full-Paper Speed Run",
    categories: [Stage.Sprint],
    blurb:
      "Timed, non-pausable paper to train pacing; heat-map shows time spent per Q.",
    conceptUse:
      "Logs concept per question to correlate with over-time spots.",
    learnerUse:
      "Flags pacing issues back to the planner for future mocks.",
    userFeel:
      "A video-game style timer yells if I linger on an easy thirty-second question.",
    bg: grad("#fde047", "#facc15"),
  },

  /* ───────────────────────────────────────────────────────
     7.  EXAM-SPECIFIC ADD-ON (TOEFL example)
     ───────────────────────────────────────────────────── */
  {
    id: "toefl-speaker",
    emoji: "🎤",
    title: "TOEFL Speaking Timer",
    categories: [Stage.Test],
    tags: ["TOEFL"],
    blurb:
      "Simulates the official prompt, records audio & highlights filler words.",
    conceptUse:
      "Uses rubric concepts (coherence, fluency, vocab) to grade the transcript.",
    learnerUse:
      "Tracks filler-word count trend and suggests targeted drills.",
    userFeel:
      "Feels like the real TOEFL mic—with instant feedback on my ‘uhh’.",
    bg: grad("#7dd3fc", "#3b82f6"),
  },
];