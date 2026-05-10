import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// =====================================================================
// THE GOOD LIFE SCALE (GLS-15)  — Oishi et al. (2019, 2024)
// All items use the stem: "My life has been ___."
// 7-point Likert, 1 = strongly disagree, 7 = strongly agree.
// Some items reverse-scored, marked with `r: true`.
// =====================================================================
const GLS = [
  // HAPPY
  { id: "h1", dim: "happy",      word: "happy" },
  { id: "h2", dim: "happy",      word: "enjoyable" },
  { id: "h3", dim: "happy",      word: "comfortable" },
  { id: "h4", dim: "happy",      word: "unstable",     r: true },
  { id: "h5", dim: "happy",      word: "sad",          r: true },
  // MEANINGFUL
  { id: "m1", dim: "meaningful", word: "meaningful" },
  { id: "m2", dim: "meaningful", word: "fulfilling" },
  { id: "m3", dim: "meaningful", word: "purposeful" },
  { id: "m4", dim: "meaningful", word: "meaningless",  r: true },
  { id: "m5", dim: "meaningful", word: "disorganized", r: true },
  // RICH
  { id: "r1", dim: "rich",       word: "interesting" },
  { id: "r2", dim: "rich",       word: "dramatic" },
  { id: "r3", dim: "rich",       word: "psychologically rich" },
  { id: "r4", dim: "rich",       word: "uneventful",   r: true },
  { id: "r5", dim: "rich",       word: "monotonous",   r: true },
];

// =====================================================================
// Country preference data — Oishi & Westgate (2022), 9 countries.
// Numbers are % of respondents who chose each life as their first
// preference.  Source: the chart you shared.
// =====================================================================
const COUNTRIES = [
  { name: "USA",       happy: 62.2, meaningful: 24.7, rich: 13.2 },
  { name: "Germany",   happy: 49.7, meaningful: 33.5, rich: 16.8 },
  { name: "Norway",    happy: 50.8, meaningful: 33.9, rich: 15.3 },
  { name: "Portugal",  happy: 51.2, meaningful: 33.7, rich: 15.1 },
  { name: "Japan",     happy: 65.5, meaningful: 19.0, rich: 15.5 },
  { name: "Korea",     happy: 69.9, meaningful: 14.4, rich: 15.8 },
  { name: "Singapore", happy: 54.8, meaningful: 38.5, rich:  6.7 },
  { name: "India",     happy: 55.5, meaningful: 28.4, rich: 16.1 },
  { name: "Angola",    happy: 54.3, meaningful: 36.4, rich:  9.3 },
];

// =====================================================================
// Hyde Park (60637) places, with coords for the mini-map
// =====================================================================
const HYDE_PARK_PLACES = {
  rich: [
    { name: "Seminary Co-op Bookstore",   kind: "Bookstore",  lat: 41.7898, lon: -87.5996, note: "First nonprofit bookstore in the U.S." },
    { name: "Smart Museum of Art",        kind: "Museum",     lat: 41.7929, lon: -87.6005, note: "Free. Small. Always something unexpected." },
    { name: "Powell's Books",             kind: "Bookstore",  lat: 41.7920, lon: -87.5876, note: "Used books, narrow aisles, hours of accidental discovery." },
    { name: "Court Theatre",              kind: "Theatre",    lat: 41.7904, lon: -87.6004, note: "Classical drama, ambitious productions." },
    { name: "Robie House",                kind: "Architecture", lat: 41.7898, lon: -87.5961, note: "Frank Lloyd Wright's prairie masterpiece." },
  ],
  happy: [
    { name: "Valois Cafeteria",           kind: "Restaurant", lat: 41.7990, lon: -87.5847, note: "\"See your food.\" A diner since 1921." },
    { name: "Plein Air Cafe",             kind: "Cafe",       lat: 41.7906, lon: -87.5922, note: "Coffee, pastry, sun through the window." },
    { name: "Jackson Park Lagoons",       kind: "Park",       lat: 41.7806, lon: -87.5808, note: "Wooded Island. Birds, willows, no agenda." },
    { name: "Medici on 57th",             kind: "Restaurant", lat: 41.7917, lon: -87.5875, note: "Pizza in booths carved with three generations." },
    { name: "Promontory Point",           kind: "Place",      lat: 41.7942, lon: -87.5772, note: "Lake Michigan, kite season, long afternoons." },
  ],
  meaningful: [
    { name: "Rockefeller Memorial Chapel",kind: "Place",      lat: 41.7886, lon: -87.5965, note: "Whatever you believe. Sit in the quiet." },
    { name: "Greater Chicago Food Depository", kind: "Service", lat: 41.7989, lon: -87.6298, note: "Volunteer shifts welcome." },
    { name: "Hyde Park Historical Society",kind: "Community", lat: 41.7960, lon: -87.5840, note: "The neighborhood's own memory." },
    { name: "Oriental Institute (ISAC)",  kind: "Museum",     lat: 41.7895, lon: -87.5979, note: "Five thousand years of human striving." },
    { name: "Experimental Station",       kind: "Community",  lat: 41.7918, lon: -87.5862, note: "Bike repair, food access, neighborhood-built." },
  ],
};

// =====================================================================
// Books by dimension
// =====================================================================
const BOOKS = {
  happy: [
    { title: "The How of Happiness",       author: "Sonja Lyubomirsky" },
    { title: "Stumbling on Happiness",     author: "Daniel Gilbert" },
    { title: "A Walk in the Woods",        author: "Bill Bryson" },
  ],
  meaningful: [
    { title: "Man's Search for Meaning",   author: "Viktor Frankl" },
    { title: "The Second Mountain",        author: "David Brooks" },
    { title: "Tribes",                     author: "Sebastian Junger" },
  ],
  rich: [
    { title: "Life in Three Dimensions",   author: "Shigehiro Oishi" },
    { title: "A Field Guide to Getting Lost", author: "Rebecca Solnit" },
    { title: "The Odyssey",                author: "Homer (Wilson tr.)" },
  ],
};

// =====================================================================
// Definitions and trait portraits — all from Oishi & Westgate (2025),
// Trends in Cognitive Sciences.  Kept brief; the full notes are in the
// final References page if anyone wants more.
// =====================================================================
const LIFE = {
  happy: {
    title: "A happy life",
    desc:  "Stable, comfortable, safe, and pleasant.",
    def:   "Filled with comfortable and enjoyable experiences. Frequent positive emotion, infrequent negative.",
    features: "Stability · Security",
    outcome:  "Personal satisfaction",
    last:     "It was fun.",
    traits: [
      { k: "Personality",     v: "High extraversion, low neuroticism" },
      { k: "Personality",     v: "Conscientious; reaches the goals they set" },
      { k: "Politics",        v: "Modestly more conservative than average" },
      { k: "Daily life",      v: "Routines, stable social ties, fewer surprises" },
    ],
  },
  meaningful: {
    title: "A meaningful life",
    desc:  "Devoted to a cause, with a clear sense of purpose and contribution.",
    def:   "Filled with contributions to others and to society. Significant, coherent, guided by purpose.",
    features: "Purpose · Coherence",
    outcome:  "Societal contribution",
    last:     "I made a difference.",
    traits: [
      { k: "Personality",     v: "Conscientious and goal-directed" },
      { k: "Personality",     v: "Agreeable and warm; positive ties" },
      { k: "Politics",        v: "More conservative; often religious" },
      { k: "Daily life",      v: "Routines, dedicated practices, communal activity" },
    ],
  },
  rich: {
    title: "A psychologically rich life",
    desc:  "Eventful, interesting, varied, full of surprising experiences.",
    def:   "Filled with diverse, interesting, perspective-changing experiences. Curious and willing to be unsettled.",
    features: "Variety · Novelty",
    outcome:  "Wisdom",
    last:     "What a journey.",
    traits: [
      { k: "Personality",     v: "Openness to experience runs high (r ≈ .47)" },
      { k: "Personality",     v: "Extraversion follows close behind (r ≈ .44)" },
      { k: "Politics",        v: "Less politically conservative; values universalism" },
      { k: "Cognitive style", v: "Sees multiple causes; thinks holistically" },
      { k: "Daily life",      v: "Travels; reads literary fiction" },
    ],
  },
};

// =====================================================================
// DESIGN — dark, minimal
// =====================================================================
const C = {
  bg:      "#0A0A09",
  ink:     "#F2EBDD",     // ivory text on black
  inkSoft: "rgba(242,235,221,0.55)",
  faint:   "rgba(242,235,221,0.15)",
  rule:    "rgba(242,235,221,0.25)",
  happy:   "#C9A176",     // warm ochre / tan (matches the screenshot's brown)
  meaning: "#7FA89B",     // soft teal (matches the screenshot's green)
  rich:    "#D9A93A",     // mustard-gold (matches the screenshot's yellow)
};
const F_DISPLAY = "'Fraunces', Georgia, serif";
const F_BODY    = "'Source Serif Pro', Georgia, serif";
const F_MONO    = "'JetBrains Mono', 'Courier New', monospace";

// =====================================================================
export default function App() {
  const [page, setPage]    = useState("cover");
  const [aspiration, setA] = useState(null);   // happy | meaningful | rich
  const [answers, setAns]  = useState({});
  const [zip, setZip]      = useState("");

  const scores = useMemo(() => computeScores(answers), [answers]);
  const done   = Object.keys(answers).length === GLS.length;

  return (
    <div style={shell}>
      <FontLoader />
      <Nav page={page} go={setPage} hasAsp={!!aspiration} hasScores={done} />
      <AnimatePresence mode="wait">
        {page === "cover"      && <Cover      key="cover"      onStart={() => setPage("aspiration")} />}
        {page === "aspiration" && <Aspiration key="aspiration" choice={aspiration} setChoice={setA} onNext={() => setPage("portrait")} />}
        {page === "portrait"   && <Portrait   key="portrait"   choice={aspiration} onNext={() => setPage("survey")} />}
        {page === "survey"     && <Survey     key="survey"     answers={answers} setAns={setAns} onDone={() => setPage("results")} />}
        {page === "results"    && <Results    key="results"    scores={scores} aspiration={aspiration} onNext={() => setPage("countries")} />}
        {page === "countries"  && <Countries  key="countries"  aspiration={aspiration} onNext={() => setPage("zip")} />}
        {page === "zip"        && <ZipStep    key="zip"        zip={zip} setZip={setZip} onNext={() => setPage("recs")} />}
        {page === "recs"       && <Recs       key="recs"       scores={scores} aspiration={aspiration} zip={zip} onNext={() => setPage("notes")} />}
        {page === "notes"      && <Notes      key="notes" />}
      </AnimatePresence>
    </div>
  );
}

const shell = {
  minHeight: "100vh", background: C.bg, color: C.ink,
  fontFamily: F_BODY, paddingBottom: "5rem",
};

function Nav({ page, go, hasAsp, hasScores }) {
  const tabs = [
    { k: "aspiration", n: "i",   label: "Choose" },
    { k: "portrait",   n: "ii",  label: "Portrait", gated: !hasAsp },
    { k: "survey",     n: "iii", label: "Survey",   gated: !hasAsp },
    { k: "results",    n: "iv",  label: "Scores",   gated: !hasScores },
    { k: "countries",  n: "v",   label: "Countries",gated: !hasScores },
    { k: "zip",        n: "vi",  label: "Place",    gated: !hasScores },
    { k: "recs",       n: "vii", label: "Next",     gated: !hasScores },
  ];
  if (page === "cover") return null;
  return (
    <header style={{
      borderBottom: `1px solid ${C.faint}`,
      padding: "1.1rem 2.5rem",
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      flexWrap: "wrap", gap: "1.5rem",
    }}>
      <button onClick={() => go("cover")} style={{
        background: "none", border: "none", color: C.inkSoft, cursor: "pointer",
        fontFamily: F_DISPLAY, fontStyle: "italic", fontSize: "0.95rem", padding: 0,
      }}>
        Three Lives
      </button>
      <nav style={{ display: "flex", gap: "1.4rem", flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.k} disabled={t.gated} onClick={() => !t.gated && go(t.k)}
            style={{
              background: "none", border: "none", padding: 0,
              cursor: t.gated ? "not-allowed" : "pointer",
              fontFamily: F_DISPLAY, fontSize: "0.85rem",
              color: page === t.k ? C.ink : (t.gated ? "rgba(242,235,221,0.25)" : C.inkSoft),
              fontStyle: page === t.k ? "italic" : "normal",
            }}
          >
            <span style={{ fontFamily: F_MONO, fontSize: "0.58rem", letterSpacing: "0.1em", marginRight: "0.4rem", verticalAlign: "0.1em" }}>{t.n}.</span>
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

// =====================================================================
// PAGE — Cover
// =====================================================================
function Cover({ onStart }) {
  return (
    <motion.main
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <div style={{
        padding: "1.5rem 2.5rem",
        fontFamily: F_DISPLAY, fontStyle: "italic",
        fontSize: "0.95rem", color: C.inkSoft,
      }}>
        Three Lives
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 2.5rem", textAlign: "center" }}>
        <motion.h1
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          style={{
            fontFamily: F_DISPLAY, fontWeight: 200,
            fontSize: "clamp(2.4rem, 7vw, 5.5rem)",
            lineHeight: 1.05, letterSpacing: "-0.025em",
            margin: 0, maxWidth: 1100,
          }}
        >
          What kind of life
          <br />
          do you want <em style={{ fontStyle: "italic", fontWeight: 300 }}>to live?</em>
        </motion.h1>
      </div>

      <motion.button
        onClick={onStart}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6, duration: 0.8 }}
        style={{
          background: "none", border: "none", cursor: "pointer", color: C.inkSoft,
          padding: "2.5rem 0 1.5rem", fontFamily: F_MONO, fontSize: "0.7rem",
          letterSpacing: "0.2em", alignSelf: "center", textTransform: "uppercase",
        }}
      >
        begin
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} style={{ marginTop: "0.6rem" }}>
          ↓
        </motion.div>
      </motion.button>
    </motion.main>
  );
}

// =====================================================================
// PAGE — Aspiration
// =====================================================================
function Aspiration({ choice, setChoice, onNext }) {
  const opts = [
    { key: "happy",      label: "A happy life",                desc: "Stable, comfortable, safe, and pleasant." },
    { key: "meaningful", label: "A meaningful life",           desc: "Devoted to a cause, with a clear sense of purpose." },
    { key: "rich",       label: "A psychologically rich life", desc: "Eventful, interesting, varied, full of surprises." },
  ];
  return (
    <Page>
      <div style={{ maxWidth: 880, margin: "5rem auto 0", padding: "0 2.5rem" }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Kicker>i. Choose</Kicker>
          <H2>If you could pick your <em>first preference</em>, which would it be?</H2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "3rem" }}>
            {opts.map(o => {
              const sel = choice === o.key;
              const c = dimColor(o.key);
              return (
                <button key={o.key}
                  onClick={() => setChoice(o.key)}
                  style={{
                    textAlign: "left", padding: "1.5rem 1.7rem",
                    background: sel ? c : "transparent",
                    color:      sel ? C.bg : C.ink,
                    border: `1px solid ${sel ? c : C.rule}`,
                    cursor: "pointer", transition: "all 0.18s",
                    fontFamily: F_BODY,
                  }}
                  onMouseOver={e => { if (!sel) e.currentTarget.style.borderColor = c; }}
                  onMouseOut={e =>  { if (!sel) e.currentTarget.style.borderColor = C.rule; }}
                >
                  <div style={{ fontFamily: F_DISPLAY, fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.005em" }}>
                    {o.label}
                  </div>
                  <div style={{ marginTop: "0.4rem", fontFamily: F_DISPLAY, fontStyle: "italic", fontWeight: 300, fontSize: "1rem", lineHeight: 1.5, opacity: sel ? 0.85 : 0.7 }}>
                    {o.desc}
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: "2.5rem" }}>
            <PrimaryBtn disabled={!choice} onClick={onNext}>Continue →</PrimaryBtn>
          </div>
        </motion.div>
      </div>
    </Page>
  );
}

// =====================================================================
// PAGE — Portrait (concise, scannable)
// =====================================================================
function Portrait({ choice, onNext }) {
  if (!choice) return null;
  const L = LIFE[choice];
  const c = dimColor(choice);
  return (
    <Page>
      <div style={{ maxWidth: 920, margin: "3rem auto 0", padding: "0 2.5rem" }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          <Kicker>ii. Portrait</Kicker>
          <H2>You chose <em style={{ color: c }}>{L.title}</em>.</H2>

          {/* Definition */}
          <p style={{
            fontFamily: F_DISPLAY, fontStyle: "italic", fontWeight: 300,
            fontSize: "clamp(1.15rem, 2vw, 1.45rem)", lineHeight: 1.5,
            color: C.ink, opacity: 0.85, maxWidth: 720, marginTop: "2rem",
            borderLeft: `2px solid ${c}`, paddingLeft: "1.2rem",
          }}>
            {L.def}
          </p>

          {/* Features grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.5rem", marginTop: "2.5rem" }}>
            <Field label="Defining features" value={L.features} c={c} />
            <Field label="Common outcome"    value={L.outcome}  c={c} />
            <Field label="Last words"        value={`"${L.last}"`} c={c} italic />
          </div>

          {/* Traits — minimal table */}
          <div style={{ marginTop: "4rem", borderTop: `1px solid ${c}`, paddingTop: "1rem" }}>
            <Kicker>People who choose this life — on average</Kicker>
          </div>
          <div style={{ marginTop: "1.5rem" }}>
            {L.traits.map((t, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                style={{
                  display: "grid", gridTemplateColumns: "150px 1fr",
                  padding: "0.9rem 0", borderBottom: `1px solid ${C.faint}`,
                  alignItems: "baseline", gap: "1rem",
                }}
              >
                <div style={{ fontFamily: F_MONO, fontSize: "0.65rem", letterSpacing: "0.12em", color: C.inkSoft, textTransform: "uppercase" }}>
                  {t.k}
                </div>
                <div style={{ fontFamily: F_DISPLAY, fontSize: "1.05rem", fontWeight: 400, lineHeight: 1.4 }}>
                  {t.v}
                </div>
              </motion.div>
            ))}
          </div>

          <div style={{ marginTop: "2.5rem" }}>
            <p style={{ fontFamily: F_DISPLAY, fontStyle: "italic", fontWeight: 300, fontSize: "1rem", color: C.inkSoft, lineHeight: 1.55, maxWidth: 640 }}>
              Read these as <em>group averages</em>, not personal verdicts. Notice which feel true and which don&rsquo;t.
            </p>
          </div>

          <div style={{ marginTop: "2.5rem" }}>
            <PrimaryBtn onClick={onNext}>Take the survey →</PrimaryBtn>
          </div>
        </motion.div>
      </div>
    </Page>
  );
}

function Field({ label, value, c, italic }) {
  return (
    <div>
      <div style={{ fontFamily: F_MONO, fontSize: "0.6rem", letterSpacing: "0.14em", color: C.inkSoft, textTransform: "uppercase", marginBottom: "0.5rem" }}>
        {label}
      </div>
      <div style={{
        fontFamily: F_DISPLAY, fontWeight: 500, fontSize: "1.1rem",
        color: c, lineHeight: 1.4, fontStyle: italic ? "italic" : "normal",
      }}>
        {value}
      </div>
    </div>
  );
}

// =====================================================================
// PAGE — Survey (GLS-15)
// =====================================================================
function Survey({ answers, setAns, onDone }) {
  const [idx, setIdx] = useState(() => {
    const i = GLS.findIndex(q => !(q.id in answers));
    return i === -1 ? GLS.length - 1 : i;
  });
  const q = GLS[idx];
  const filled = Object.keys(answers).length;
  const progress = (filled / GLS.length) * 100;

  function pick(v) {
    const next = { ...answers, [q.id]: v };
    setAns(next);
    if (idx < GLS.length - 1) setTimeout(() => setIdx(idx + 1), 220);
    else if (Object.keys(next).length === GLS.length) setTimeout(onDone, 360);
  }

  return (
    <Page>
      <div style={{ maxWidth: 720, margin: "3rem auto 0", padding: "0 2.5rem" }}>
        <div style={{ height: 1, background: C.faint, marginBottom: "3rem", position: "relative" }}>
          <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} style={{ height: "100%", background: C.ink }} />
          <div style={{ position: "absolute", right: 0, top: "0.6rem", fontFamily: F_MONO, fontSize: "0.65rem", color: C.inkSoft, letterSpacing: "0.1em" }}>
            {String(filled).padStart(2,"0")} / {GLS.length}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={q.id}
            initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.28 }}
          >
            <div style={{ ...kickerStyle, color: dimColor(q.dim), marginBottom: "1.5rem" }}>
              GLS-15 · item {String(idx + 1).padStart(2, "0")}
            </div>

            <div style={{
              fontFamily: F_DISPLAY, fontWeight: 200,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              lineHeight: 1.15, letterSpacing: "-0.015em",
              margin: "0 0 3rem 0",
            }}>
              My life has been{" "}
              <em style={{ fontStyle: "italic", color: dimColor(q.dim), fontWeight: 300 }}>
                {q.word}
              </em>
              .
            </div>

            <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.6rem" }}>
              {[1,2,3,4,5,6,7].map(v => {
                const sel = answers[q.id] === v;
                return (
                  <button key={v} onClick={() => pick(v)}
                    style={{
                      flex: 1, padding: "1.1rem 0.4rem",
                      background: sel ? C.ink : "transparent",
                      color:      sel ? C.bg : C.ink,
                      border: `1px solid ${C.rule}`, cursor: "pointer",
                      fontFamily: F_MONO, fontSize: "0.85rem",
                      transition: "all 0.15s",
                    }}
                    onMouseOver={e => { if (!sel) e.currentTarget.style.background = "rgba(242,235,221,0.07)"; }}
                    onMouseOut={e =>  { if (!sel) e.currentTarget.style.background = "transparent"; }}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F_MONO, fontSize: "0.62rem", color: C.inkSoft, letterSpacing: "0.05em" }}>
              <span>strongly disagree</span>
              <span>neutral</span>
              <span>strongly agree</span>
            </div>

            <div style={{ marginTop: "2.5rem", display: "flex", justifyContent: "space-between" }}>
              <NavBtn disabled={idx === 0} onClick={() => setIdx(idx - 1)}>← previous</NavBtn>
              <NavBtn disabled={!answers[q.id] || idx === GLS.length - 1} onClick={() => setIdx(idx + 1)}>next →</NavBtn>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </Page>
  );
}

// =====================================================================
// PAGE — Results (scores)
// =====================================================================
function Results({ scores, aspiration, onNext }) {
  const order = ["happy","meaningful","rich"].sort((a,b) => scores[b] - scores[a]);
  const dom = order[0];
  const aligned = aspiration === dom;

  return (
    <Page>
      <div style={{ maxWidth: 920, margin: "3rem auto 0", padding: "0 2.5rem" }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          <Kicker>iv. Scores</Kicker>
          <H2>Your life leans <em style={{ color: dimColor(dom) }}>{labelOf(dom)}</em>.</H2>

          {/* Three big score rows */}
          <div style={{ marginTop: "3rem" }}>
            {(["happy","meaningful","rich"]).map((d, i) => (
              <ScoreRow key={d} dim={d} score={scores[d]} delay={i * 0.15} />
            ))}
          </div>

          {/* Aspiration vs actual */}
          {aspiration && (
            <div style={{
              marginTop: "3.5rem", padding: "1.6rem 1.8rem",
              border: `1px solid ${aligned ? dimColor(dom) : C.rule}`,
              background: aligned ? hexAlpha(dimColor(dom), 0.06) : "transparent",
            }}>
              <div style={{ ...kickerStyle, color: aligned ? dimColor(dom) : C.inkSoft, marginBottom: "0.7rem" }}>
                {aligned ? "alignment" : "a gap"}
              </div>
              <div style={{ fontFamily: F_DISPLAY, fontStyle: "italic", fontWeight: 300, fontSize: "1.15rem", lineHeight: 1.55, color: C.ink, opacity: 0.92 }}>
                {aligned
                  ? <>You wanted <em style={{ color: dimColor(aspiration) }}>{LIFE[aspiration].title.toLowerCase()}</em> — and that&rsquo;s the life you&rsquo;re living.</>
                  : <>You said you wanted <em style={{ color: dimColor(aspiration) }}>{LIFE[aspiration].title.toLowerCase()}</em>, but your scores point toward <em style={{ color: dimColor(dom) }}>{LIFE[dom].title.toLowerCase()}</em>.</>
                }
              </div>
            </div>
          )}

          <div style={{ marginTop: "3rem" }}>
            <PrimaryBtn onClick={onNext}>See how others answered →</PrimaryBtn>
          </div>
        </motion.div>
      </div>
    </Page>
  );
}

function ScoreRow({ dim, score, delay = 0 }) {
  // GLS subscale: 5 items × 1..7 = 5..35.  Convert to 0..1 for the bar.
  const min = 5, max = 35;
  const pct = ((score - min) / (max - min)) * 100;
  const c = dimColor(dim);
  return (
    <div style={{ marginBottom: "1.8rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.6rem" }}>
        <span style={{ fontFamily: F_DISPLAY, fontWeight: 400, fontSize: "1.4rem", color: c }}>
          {labelOf(dim)}
        </span>
        <span style={{ fontFamily: F_MONO, fontSize: "0.85rem", color: C.inkSoft, letterSpacing: "0.05em" }}>
          {score} <span style={{ opacity: 0.5 }}>/ {max}</span>
        </span>
      </div>
      <div style={{ height: 4, background: C.faint, position: "relative" }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 1.0, delay }}
          style={{ height: "100%", background: c }}
        />
      </div>
    </div>
  );
}

// =====================================================================
// PAGE — Countries (the bar chart from Oishi & Westgate 2022)
// =====================================================================
function Countries({ aspiration, onNext }) {
  const c = aspiration ? dimColor(aspiration) : null;
  const dimName = aspiration ? labelOf(aspiration).toLowerCase() : null;
  const yourCountry = "USA"; // demo default

  // Sort by chosen-dimension preference if aspiration is set, else USA-first
  const ranked = aspiration
    ? [...COUNTRIES].sort((a, b) => b[aspiration] - a[aspiration])
    : COUNTRIES;

  return (
    <Page>
      <div style={{ maxWidth: 1100, margin: "3rem auto 0", padding: "0 2.5rem" }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          <Kicker>v. Countries</Kicker>
          <H2>Most people, in most places, choose <em style={{ color: C.happy }}>happy</em>.</H2>
          <p style={{
            fontFamily: F_DISPLAY, fontStyle: "italic", fontWeight: 300,
            fontSize: "1.1rem", lineHeight: 1.55, color: C.inkSoft,
            marginTop: "1.5rem", maxWidth: 700,
          }}>
            Across nine countries (N = 3,269), a happy life was the most common first preference everywhere.
            But the runner-up varies: a meaningful life in some places, a psychologically rich life in others.
            {aspiration && (
              <> You chose <em style={{ color: c }}>{dimName}</em>.</>
            )}
          </p>

          <CountryChart data={ranked} highlight={aspiration} />

          {aspiration && (
            <div style={{
              marginTop: "2.5rem", padding: "1.4rem 1.6rem",
              border: `1px solid ${c}`, background: hexAlpha(c, 0.05),
            }}>
              <div style={{ ...kickerStyle, color: c, marginBottom: "0.7rem" }}>your kind of preference</div>
              <p style={{ margin: 0, fontFamily: F_DISPLAY, fontStyle: "italic", fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.55, color: C.ink, opacity: 0.92 }}>
                {countryNote(aspiration, yourCountry)}
              </p>
            </div>
          )}

          <div style={{ marginTop: "3rem" }}>
            <PrimaryBtn onClick={onNext}>Continue →</PrimaryBtn>
          </div>
        </motion.div>
      </div>
    </Page>
  );
}

function CountryChart({ data, highlight }) {
  // Grouped bar chart, three bars per country
  const W = 1000, H = 380;
  const padL = 30, padR = 20, padT = 30, padB = 50;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const groupW = innerW / data.length;
  const barW = (groupW - 14) / 3;
  const maxY = 75; // highest value ~70

  const yScale = v => padT + innerH - (v / maxY) * innerH;

  return (
    <div style={{ marginTop: "2.5rem", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: 640, display: "block" }}>
        {/* horizontal grid */}
        {[0, 25, 50, 75].map(v => (
          <g key={v}>
            <line x1={padL} x2={W - padR} y1={yScale(v)} y2={yScale(v)}
              stroke={C.faint} strokeWidth="0.5" strokeDasharray="2 4" />
            <text x={padL - 6} y={yScale(v) + 4}
              fontFamily={F_MONO} fontSize="9" fill={C.inkSoft} textAnchor="end">
              {v}%
            </text>
          </g>
        ))}

        {/* bars */}
        {data.map((d, i) => {
          const xBase = padL + i * groupW + 7;
          const dims = ["happy","meaningful","rich"];
          return (
            <g key={d.name}>
              {dims.map((dim, j) => {
                const x = xBase + j * barW;
                const y = yScale(d[dim]);
                const h = padT + innerH - y;
                const isHi = highlight === dim;
                return (
                  <g key={dim}>
                    <motion.rect
                      x={x} width={barW}
                      initial={{ y: padT + innerH, height: 0 }}
                      animate={{ y, height: h }}
                      transition={{ duration: 0.7, delay: 0.15 + i * 0.05 + j * 0.03 }}
                      fill={dimColor(dim)}
                      opacity={highlight && !isHi ? 0.35 : 1}
                      stroke={isHi ? C.ink : "none"}
                      strokeWidth={isHi ? 0.8 : 0}
                    />
                    {/* label on top of highlighted dim */}
                    {isHi && (
                      <text
                        x={x + barW / 2} y={y - 6}
                        fontFamily={F_MONO} fontSize="9.5"
                        fill={dimColor(dim)} textAnchor="middle"
                        fontWeight="600"
                      >
                        {d[dim].toFixed(1)}
                      </text>
                    )}
                  </g>
                );
              })}
              {/* country label */}
              <text
                x={xBase + (groupW - 14) / 2} y={H - padB + 18}
                fontFamily={F_DISPLAY} fontSize="13"
                fill={C.ink} textAnchor="middle"
                fontStyle={d.name === "USA" ? "italic" : "normal"}
              >
                {d.name}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${padL}, ${padT - 15})`}>
          {[
            { dim: "happy",      label: "Happy" },
            { dim: "meaningful", label: "Meaningful" },
            { dim: "rich",       label: "Rich" },
          ].map((it, i) => (
            <g key={it.dim} transform={`translate(${i * 120}, 0)`}>
              <rect x="0" y="-8" width="11" height="11" fill={dimColor(it.dim)}
                opacity={highlight && highlight !== it.dim ? 0.35 : 1} />
              <text x="17" y="2" fontFamily={F_DISPLAY} fontSize="11"
                fill={highlight === it.dim ? C.ink : C.inkSoft}
                fontStyle={highlight === it.dim ? "italic" : "normal"}>
                {it.label}
              </text>
            </g>
          ))}
        </g>
      </svg>

      <div style={{
        marginTop: "0.6rem", textAlign: "right",
        fontFamily: F_MONO, fontSize: "0.6rem", color: C.inkSoft, letterSpacing: "0.05em",
      }}>
        SOURCE: OISHI &amp; WESTGATE (2022), N = 3,269
      </div>
    </div>
  );
}

function countryNote(asp, country) {
  if (asp === "rich") {
    return "About 13% of Americans choose a rich life — making this an unusual choice. The countries where it's most common (Germany, India) still have it third behind happy and meaningful.";
  }
  if (asp === "meaningful") {
    return "Roughly 25% of Americans choose meaning. It tends to be more common in Singapore, Angola, and Norway than in East Asia or the U.S.";
  }
  return "About 62% of Americans choose a happy life — the most common preference everywhere we've measured. You're with the majority.";
}

// =====================================================================
// PAGE — ZIP step
// =====================================================================
function ZipStep({ zip, setZip, onNext }) {
  const [val, setVal] = useState(zip);
  const valid = /^\d{5}$/.test(val);
  return (
    <Page>
      <div style={{ maxWidth: 700, margin: "5rem auto 0", padding: "0 2.5rem" }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Kicker>vi. Place</Kicker>
          <H2>Where do you live?</H2>
          <p style={{
            fontFamily: F_DISPLAY, fontStyle: "italic", fontWeight: 300,
            fontSize: "1.1rem", lineHeight: 1.55, color: C.inkSoft,
            marginTop: "1.5rem", maxWidth: 600, marginBottom: "2.5rem",
          }}>
            We&rsquo;ll find a few specific places nearby. Five-digit U.S. ZIP code.
          </p>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <input
              value={val}
              onChange={e => setVal(e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder="60637"
              inputMode="numeric"
              style={{
                fontFamily: F_MONO, fontSize: "1.4rem", letterSpacing: "0.15em",
                padding: "0.9rem 1.1rem", border: `1px solid ${C.rule}`,
                background: "transparent", color: C.ink, width: 160, textAlign: "center",
                outline: "none",
              }}
              autoFocus
            />
            <PrimaryBtn disabled={!valid} onClick={() => { setZip(val); onNext(); }}>Continue →</PrimaryBtn>
            <NavBtn onClick={() => { setZip(""); onNext(); }}>skip</NavBtn>
          </div>
          <div style={{ marginTop: "1rem", fontFamily: F_MONO, fontSize: "0.65rem", color: C.inkSoft, letterSpacing: "0.05em" }}>
            <em style={{ fontFamily: F_DISPLAY, fontStyle: "italic" }}>Demo:</em> 60637 (Hyde Park) shows a real map.
          </div>
        </motion.div>
      </div>
    </Page>
  );
}

// =====================================================================
// PAGE — Recs (Hyde Park map + books)
// =====================================================================
function Recs({ scores, aspiration, zip, onNext }) {
  const order = ["happy","meaningful","rich"].sort((a,b) => scores[a] - scores[b]);
  const weak  = order[0];
  // Use aspiration as the focus — that's what the user wants to feed
  const focus = aspiration || weak;
  const isHP = zip === "60637";

  const allHP = isHP ? [
    ...HYDE_PARK_PLACES.happy.map(p => ({ ...p, dim: "happy" })),
    ...HYDE_PARK_PLACES.meaningful.map(p => ({ ...p, dim: "meaningful" })),
    ...HYDE_PARK_PLACES.rich.map(p => ({ ...p, dim: "rich" })),
  ] : [];

  return (
    <Page>
      <div style={{ maxWidth: 1100, margin: "3rem auto 0", padding: "0 2.5rem" }}>
        <Kicker>vii. Next</Kicker>
        <H2>For your <em style={{ color: dimColor(focus) }}>{labelOf(focus).toLowerCase()}</em> side.</H2>

        {isHP && <HydeParkMap places={allHP} focus={focus} />}

        {/* Featured (focus dim) places */}
        {isHP && (
          <PlacesList
            title={`Places near you · for ${labelOf(focus).toLowerCase()}`}
            items={HYDE_PARK_PLACES[focus]}
            color={dimColor(focus)}
          />
        )}

        {/* Other dims, smaller */}
        {isHP && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", marginTop: "3rem" }}>
            {(["happy","meaningful","rich"]).filter(d => d !== focus).map(d => (
              <SmallPlacesList
                key={d}
                title={`A taste of ${labelOf(d).toLowerCase()}`}
                items={HYDE_PARK_PLACES[d].slice(0, 2)}
                color={dimColor(d)}
              />
            ))}
          </div>
        )}

        {!isHP && zip && (
          <div style={{ marginTop: "2rem", fontFamily: F_DISPLAY, fontStyle: "italic", color: C.inkSoft, fontSize: "1.05rem", maxWidth: 600 }}>
            For ZIP {zip}, the production version queries Google Places live. The prototype only includes a detailed map for 60637 (Hyde Park). The book recommendations below still apply.
          </div>
        )}

        {/* Books */}
        <div style={{ marginTop: "3rem" }}>
          <BookList title="Reading" items={BOOKS[focus]} color={dimColor(focus)} />
        </div>

        <div style={{ marginTop: "3rem" }}>
          <NavBtn onClick={onNext}>Notes & references →</NavBtn>
        </div>
      </div>
    </Page>
  );
}

function PlacesList({ title, items, color }) {
  return (
    <section style={{ marginTop: "2.5rem" }}>
      <div style={{ borderTop: `1px solid ${color}`, paddingTop: "1rem", marginBottom: "1.5rem", fontFamily: F_DISPLAY, fontStyle: "italic", fontSize: "1.5rem", color: C.ink }}>
        {title}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.2rem" }}>
        {items.map((p, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            style={{ padding: "1.1rem 1.3rem", border: `1px solid ${C.faint}`, borderLeft: `2px solid ${color}` }}
          >
            <div style={{ fontFamily: F_MONO, fontSize: "0.6rem", color: C.inkSoft, letterSpacing: "0.12em", marginBottom: "0.3rem" }}>
              {p.kind.toUpperCase()}
            </div>
            <div style={{ fontFamily: F_DISPLAY, fontWeight: 500, fontSize: "1.1rem", marginBottom: "0.4rem" }}>
              {p.name}
            </div>
            <div style={{ fontFamily: F_DISPLAY, fontStyle: "italic", fontSize: "0.92rem", color: C.inkSoft, lineHeight: 1.5 }}>
              {p.note}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function SmallPlacesList({ title, items, color }) {
  return (
    <div>
      <div style={{ borderTop: `1px solid ${color}`, paddingTop: "0.7rem", marginBottom: "1rem", fontFamily: F_DISPLAY, fontStyle: "italic", fontSize: "1.2rem", color: C.ink }}>
        {title}
      </div>
      {items.map((it, i) => (
        <div key={i} style={{ padding: "0.7rem 0", borderBottom: i < items.length - 1 ? `1px solid ${C.faint}` : "none" }}>
          <div style={{ fontFamily: F_MONO, fontSize: "0.55rem", color: C.inkSoft, letterSpacing: "0.12em", marginBottom: "0.15rem" }}>
            {it.kind.toUpperCase()}
          </div>
          <div style={{ fontFamily: F_DISPLAY, fontWeight: 500, fontSize: "1rem" }}>{it.name}</div>
          <div style={{ fontFamily: F_DISPLAY, fontStyle: "italic", fontSize: "0.85rem", color: C.inkSoft, marginTop: "0.25rem", lineHeight: 1.5 }}>{it.note}</div>
        </div>
      ))}
    </div>
  );
}

function BookList({ title, items, color }) {
  return (
    <section>
      <div style={{ borderTop: `1px solid ${color}`, paddingTop: "1rem", marginBottom: "1.5rem", fontFamily: F_DISPLAY, fontStyle: "italic", fontSize: "1.5rem" }}>
        {title}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.2rem" }}>
        {items.map((b, i) => (
          <div key={i} style={{ padding: "1rem 1.2rem", border: `1px solid ${C.faint}`, borderLeft: `2px solid ${color}` }}>
            <div style={{ fontFamily: F_DISPLAY, fontWeight: 500, fontSize: "1.05rem" }}>{b.title}</div>
            <div style={{ fontFamily: F_BODY, fontStyle: "italic", fontSize: "0.85rem", color: C.inkSoft, marginTop: "0.2rem" }}>{b.author}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// =====================================================================
// HYDE PARK MAP
// =====================================================================
function HydeParkMap({ places, focus }) {
  const N = 41.810, S = 41.770, W = -87.620, E = -87.575;
  const Wpx = 760, Hpx = 460;
  const projX = lon => ((lon - W) / (E - W)) * Wpx;
  const projY = lat => Hpx - ((lat - S) / (N - S)) * Hpx;

  const eastWest = [
    { name: "47th",  lat: 41.8093 },
    { name: "51st",  lat: 41.8016 },
    { name: "53rd",  lat: 41.7993 },
    { name: "55th",  lat: 41.7956 },
    { name: "57th",  lat: 41.7920 },
    { name: "Midway", lat: 41.7886 },
    { name: "61st",  lat: 41.7849 },
  ];
  const northSouth = [
    { name: "Cottage Grove", lon: -87.6058 },
    { name: "Ellis",         lon: -87.6017 },
    { name: "University",    lon: -87.5979 },
    { name: "Woodlawn",      lon: -87.5946 },
    { name: "Kimbark",       lon: -87.5917 },
    { name: "Dorchester",    lon: -87.5862 },
    { name: "Stony Island",  lon: -87.5815 },
  ];
  const lakePath = `
    M ${projX(-87.582)} ${projY(N)}
    Q ${projX(-87.578)} ${projY(41.793)}, ${projX(-87.580)} ${projY(41.785)}
    T ${projX(-87.583)} ${projY(S)}
    L ${Wpx} ${Hpx} L ${Wpx} 0 Z
  `;
  const midwayPath = `
    M ${projX(-87.6058)} ${projY(41.7886)}
    L ${projX(-87.5862)} ${projY(41.7886)}
    L ${projX(-87.5862)} ${projY(41.7869)}
    L ${projX(-87.6058)} ${projY(41.7869)} Z
  `;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
      style={{
        marginTop: "2rem", marginBottom: "0.5rem",
        border: `1px solid ${C.rule}`, background: "rgba(242,235,221,0.04)",
        overflow: "hidden",
      }}
    >
      <div style={{
        padding: "0.9rem 1.2rem", borderBottom: `1px solid ${C.rule}`,
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        flexWrap: "wrap", gap: "0.5rem",
      }}>
        <div style={{ fontFamily: F_DISPLAY, fontStyle: "italic", fontSize: "1.2rem" }}>
          Hyde Park, Chicago · 60637
        </div>
        <div style={{ fontFamily: F_MONO, fontSize: "0.62rem", color: C.inkSoft, letterSpacing: "0.12em" }}>
          {places.length} PLACES · COLORED BY LIFE
        </div>
      </div>

      <svg viewBox={`0 0 ${Wpx} ${Hpx}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {/* Lake */}
        <path d={lakePath} fill="rgba(127,168,155,0.18)" />
        {/* Midway */}
        <path d={midwayPath} fill="rgba(242,235,221,0.06)" />

        {/* streets */}
        {eastWest.map(s => (
          <g key={s.name}>
            <line x1={0} x2={Wpx} y1={projY(s.lat)} y2={projY(s.lat)} stroke={C.faint} strokeWidth="0.5" />
            <text x={6} y={projY(s.lat) - 3} fontFamily={F_MONO} fontSize="9" fill={C.inkSoft}>{s.name}</text>
          </g>
        ))}
        {northSouth.map(s => (
          <g key={s.name}>
            <line x1={projX(s.lon)} x2={projX(s.lon)} y1={0} y2={Hpx} stroke={C.faint} strokeWidth="0.5" />
            <text x={projX(s.lon) + 3} y={Hpx - 6}
              fontFamily={F_MONO} fontSize="9" fill={C.inkSoft}
              transform={`rotate(-90 ${projX(s.lon) + 3} ${Hpx - 6})`}>
              {s.name}
            </text>
          </g>
        ))}
        <text x={projX(-87.578)} y={projY(41.797)} fontFamily={F_DISPLAY} fontStyle="italic" fontSize="13" fill={C.inkSoft}>
          Lake Michigan
        </text>

        {/* Pins — non-focus first, then focus on top */}
        {places.filter(p => p.dim !== focus).map((p, i) => (
          <Pin key={"a"+i} p={p} projX={projX} projY={projY} />
        ))}
        {places.filter(p => p.dim === focus).map((p, i) => (
          <Pin key={"b"+i} p={p} projX={projX} projY={projY} highlighted />
        ))}
      </svg>

      <div style={{
        padding: "0.8rem 1.2rem", borderTop: `1px solid ${C.rule}`,
        display: "flex", gap: "1.5rem", flexWrap: "wrap",
        fontFamily: F_MONO, fontSize: "0.65rem", color: C.inkSoft, letterSpacing: "0.05em",
      }}>
        {(["happy","meaningful","rich"]).map(d => (
          <div key={d} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{
              width: 11, height: 11, borderRadius: "50%",
              background: dimColor(d), opacity: d === focus ? 1 : 0.5,
              border: d === focus ? `1.5px solid ${C.ink}` : "none",
            }} />
            {labelOf(d)}{d === focus ? " ← featured" : ""}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function Pin({ p, projX, projY, highlighted }) {
  const c = dimColor(p.dim);
  const r = highlighted ? 7 : 4;
  return (
    <g>
      <title>{p.name} — {p.note}</title>
      <circle cx={projX(p.lon)} cy={projY(p.lat)} r={r}
        fill={c} stroke={C.bg} strokeWidth={highlighted ? 1.5 : 0.5}
        opacity={highlighted ? 1 : 0.55} />
      {highlighted && (
        <text x={projX(p.lon) + r + 4} y={projY(p.lat) + 3}
          fontFamily={F_DISPLAY} fontSize="11" fontWeight="500" fill={C.ink}>
          {p.name}
        </text>
      )}
    </g>
  );
}

// =====================================================================
// PAGE — Notes (final references)
// =====================================================================
function Notes() {
  return (
    <Page>
      <div style={{ maxWidth: 760, margin: "3rem auto 0", padding: "0 2.5rem" }}>
        <Kicker>References & notes</Kicker>
        <H2>Where this came from.</H2>

        <div style={{ marginTop: "2.5rem", fontFamily: F_BODY, fontSize: "1rem", lineHeight: 1.7, color: C.ink, opacity: 0.9 }}>
          <p>
            The three-life framework comes from Shigehiro Oishi (University of Chicago) and Erin
            Westgate (University of Florida). Their 2022 paper in <em>Psychological Review</em>
            introduced the third dimension — a psychologically rich life — as distinct from a happy
            or a meaningful one. Their 2025 review in <em>Trends in Cognitive Sciences</em>
            summarizes the personality, political, and cognitive correlates of each.
          </p>
          <p>
            The survey on this site is the <strong>Good Life Scale (GLS-15)</strong> — fifteen items,
            five for each dimension. All share the stem &ldquo;My life has been ___.&rdquo;
          </p>
          <p>
            Country preference data comes from a nine-country survey (N = 3,269) reported in Oishi &amp;
            Westgate (2022).
          </p>
          <p>
            Local recommendations are illustrative for the prototype. The production version queries
            the Google Places API near your ZIP code in real time.
          </p>
          <p style={{ marginTop: "2rem", fontStyle: "italic", color: C.inkSoft }}>
            Oishi, S., &amp; Westgate, E. C. (2022). A psychologically rich life: Beyond happiness and
            meaning. <em>Psychological Review, 129</em>(4), 790–811.
          </p>
          <p style={{ fontStyle: "italic", color: C.inkSoft }}>
            Oishi, S., &amp; Westgate, E. C. (2025). Psychological richness offers a third path to a
            good life. <em>Trends in Cognitive Sciences, 29</em>(11), 1023–1033.
          </p>
          <p style={{ fontStyle: "italic", color: C.inkSoft }}>
            Oishi, S. (2025). <em>Life in Three Dimensions: How Curiosity, Exploration, and Experience
            Make a Fuller, Better Life.</em> Doubleday.
          </p>
        </div>
      </div>
    </Page>
  );
}

// =====================================================================
// SHARED — small atomic components
// =====================================================================
function Page({ children }) {
  return (
    <motion.main
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ minHeight: "calc(100vh - 200px)" }}
    >
      {children}
    </motion.main>
  );
}

function Kicker({ children }) {
  return <div style={kickerStyle}>{children}</div>;
}
const kickerStyle = {
  fontFamily: F_MONO, fontSize: "0.65rem", letterSpacing: "0.18em",
  color: C.inkSoft, textTransform: "uppercase", marginBottom: "1.2rem",
};

function H2({ children }) {
  return (
    <h2 style={{
      fontFamily: F_DISPLAY, fontWeight: 200,
      fontSize: "clamp(2rem, 5vw, 3.4rem)",
      lineHeight: 1.05, letterSpacing: "-0.025em",
      margin: 0, maxWidth: 850,
    }}>
      {children}
    </h2>
  );
}

function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "0.85rem 1.5rem",
      background: disabled ? "transparent" : C.ink,
      color:      disabled ? C.inkSoft : C.bg,
      border: `1px solid ${disabled ? C.rule : C.ink}`,
      fontFamily: F_DISPLAY, fontStyle: "italic", fontSize: "1rem",
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all 0.15s",
      opacity: disabled ? 0.5 : 1,
    }}>
      {children}
    </button>
  );
}

function NavBtn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: "none", border: "none", padding: 0,
      fontFamily: F_DISPLAY, fontStyle: "italic", fontSize: "1rem",
      cursor: disabled ? "not-allowed" : "pointer",
      color: disabled ? "rgba(242,235,221,0.25)" : C.inkSoft,
    }}>
      {children}
    </button>
  );
}

function FontLoader() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,200..600;1,9..144,200..600&family=Source+Serif+Pro:ital,wght@0,300;0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; background: ${C.bg}; }
      ::selection { background: ${C.ink}; color: ${C.bg}; }
      input::placeholder { color: ${C.inkSoft}; }
    `}</style>
  );
}

// =====================================================================
// HELPERS
// =====================================================================
function dimColor(d) { return { happy: C.happy, meaningful: C.meaning, rich: C.rich }[d]; }
function labelOf(d)  { return { happy: "Happy", meaningful: "Meaningful", rich: "Rich" }[d]; }

function hexAlpha(hex, a) {
  // accept #RRGGBB
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function computeScores(answers) {
  const out = { happy: 0, meaningful: 0, rich: 0 };
  for (const q of GLS) {
    const raw = answers[q.id] ?? 4;
    const v = q.r ? (8 - raw) : raw;
    out[q.dim] += v;
  }
  return out;
}
