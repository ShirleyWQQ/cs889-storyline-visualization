function _1(md){return(
md`# Story timeline Visualization v2 (Inception)`
)}

function _d3(require){return(
require("d3@7")
)}

function _sourceData(FileAttachment){return(
FileAttachment("Inception dataset.json").json()
)}

function _chapterData(sourceData){return(
sourceData
)}

function _storyData(sourceData){return(
sourceData
)}

function _data(chapterData){return(
chapterData
)}

function _maxChapter(d3,data){return(
d3.max(data, d => d.chapter)
)}

function _chapters(chapterData){return(
Array.from(new Set(chapterData.map(d => d.chapter))).sort((a, b) => a - b)
)}

function _charactersList(chapterData,storyData,d3){return(
Array.from(
  new Set([
    ...chapterData.flatMap(d => d.characters || []),
    ...storyData.flatMap(d => d.characters || [])
  ])
).sort(d3.ascending)
)}

function _characterLaneOrder(){return(
[
  "Yusuf",
  "Arthur",
  "Ariadne",
  "Eames",
  "Fischer",
  "Saito",
  "Cobb",
  "Mal"
]
)}

function _laneScore(characterLaneOrder){return(
new Map(characterLaneOrder.map((c, i) => [c, i]))
)}

function _preferredTrackY(d3,yScale,laneScore){return(
(ch, c, prevY) =>
  d3.mean([
    prevY.get(c) ?? yScale(c),
    yScale(c),
    (laneScore.get(c) ?? 999) * 0.001
  ])
)}

function _chapterSceneMetaBySessionKey(chapterData)
{
  const m = new Map();
  for (const s of chapterData) {
    const gid = s.session_group ?? s.concurrency_group ?? s.scene_id;
    m.set(`${s.chapter}|${s.scene_id}|${gid}`, s);
  }
  return m;
}


function _chapterSceneMetaBySceneKey(chapterData)
{
  const m = new Map();
  for (const s of chapterData) {
    m.set(`${s.chapter}|${s.scene_id}`, s);
  }
  return m;
}


function _storySceneMetaBySessionKey(storyData)
{
  const m = new Map();
  for (const s of storyData) {
    const gid = s.session_group ?? s.concurrency_group ?? s.scene_id;
    m.set(`${s.chapter}|${s.scene_id}|${gid}`, s);
  }
  return m;
}


function _storySceneMetaBySceneKey(storyData)
{
  const m = new Map();
  for (const s of storyData) {
    m.set(`${s.chapter}|${s.scene_id}`, s);
  }
  return m;
}


function _emptySceneMeta(){return(
{
  location: "",
  event_summary: "",
  session_desc: "",
  narrative_note: "",
  characters: [],
  motivations: {},
  relationship_edges: [],
  annotation_tags: [],
  tags: [],
  pov_candidates: [],
  story_time_iso: "",
  story_date: "",
  story_time_note: "",
  session_title: "",
  beat_label: "",
  date_key: "",
  book_name: "",
  book: "",
  book_chapter_ref: "",
  chapter_in_book: null
}
)}

function _finished(){return(
true
)}

function _timelineWanted(){return(
"chapter"
)}

function _timelineMode(){return(
"chapter"
)}

function _sceneMeta(timelineMode,storySceneMetaBySessionKey,chapterSceneMetaBySessionKey,storySceneMetaBySceneKey,chapterSceneMetaBySceneKey,emptySceneMeta){return(
(globalChapter, sceneId, sessionGroup = null) => {
  const sceneKey = `${globalChapter}|${sceneId}`;
  const sessionKey =
    sessionGroup == null ? null : `${globalChapter}|${sceneId}|${sessionGroup}`;

  const primarySession =
    timelineMode === "story"
      ? (sessionKey ? storySceneMetaBySessionKey.get(sessionKey) : null)
      : (sessionKey ? chapterSceneMetaBySessionKey.get(sessionKey) : null);

  const primaryScene =
    timelineMode === "story"
      ? storySceneMetaBySceneKey.get(sceneKey)
      : chapterSceneMetaBySceneKey.get(sceneKey);

  const secondarySession =
    timelineMode === "story"
      ? null
      : (sessionKey ? storySceneMetaBySessionKey.get(sessionKey) : null);

  const secondaryScene =
    timelineMode === "story"
      ? null
      : storySceneMetaBySceneKey.get(sceneKey);

  return {
    ...emptySceneMeta,
    ...(secondaryScene ?? {}),
    ...(secondarySession ?? {}),
    ...(primaryScene ?? {}),
    ...(primarySession ?? {})
  };
}
)}

function _detailText(){return(
(v, fallback = "—") => {
  const s = String(v ?? "").trim();
  return s ? s : fallback;
}
)}

function _formatDetailDate(){return(
(meta) =>
  meta?.story_time_label ||
  meta?.story_date ||
  meta?.story_time_iso ||
  ""
)}

function _stripLocationPrefix(){return(
(desc = "") => {
  const s = String(desc ?? "").trim();
  if (!s) return "";

  for (const sep of [" — ", " – ", " - "]) {
    const idx = s.indexOf(sep);
    if (idx > 0) return s.slice(idx + sep.length).trim();
  }
  return s;
}
)}

function _formatRelationshipEvidence(){return(
(edges = []) => {
  if (!edges.length) return "";
  return edges
    .slice(0, 3)
    .map(e => {
      const pair = [e.source, e.target].filter(Boolean).join(" ↔ ");
      const rel = e.type ?? "relationship";
      return pair ? `${pair} (${rel})` : rel;
    })
    .join(" • ");
}
)}

function _buildSceneDetail(sceneMeta,timelineMode,formatStoryDateLabel,formatDetailDate,stripLocationPrefix,formatRelationshipEvidence){return(
({ globalChapter, sceneId, sessionGroup = null, focusCharacter = null } = {}) => {
  const meta = sceneMeta(globalChapter, sceneId, sessionGroup);

  const isStory = timelineMode === "story";

  const dateText = isStory
    ? formatStoryDateLabel(meta.date_key || meta.story_time_iso || meta.story_date)
    : formatDetailDate(meta);

  const locationText = meta.location || "";

  let title = "";
  let metaLine = "";

  if (isStory) {
    const eventText =
      (meta.session_title || meta.beat_label || `Scene ${sceneId}`).trim();

    title = [dateText, eventText].filter(Boolean).join(" - ");
    metaLine = locationText;
  } else {
    const chapterRef =
      meta.book_chapter_ref ??
      `Ch ${meta.chapter_in_book ?? globalChapter}`;

    const titleLeft =
      [meta.book_name ?? meta.book, chapterRef].filter(Boolean).join(" · ");

    const titleRight =
      meta.session_title || meta.beat_label || `Scene ${sceneId}`;

    title =
      [titleLeft, titleRight].filter(Boolean).join(" — ");

    metaLine = [dateText, locationText].filter(Boolean).join(" • ");
  }

  const characters = Array.isArray(meta.characters) ? meta.characters : [];

  const eventSummary = String(meta.event_summary ?? "").trim();
  const sessionSummary = stripLocationPrefix(meta.session_desc ?? "");

  const summary =
    isStory
      ? (meta.session_desc || meta.event_summary || "(no summary provided)")
      : (eventSummary || sessionSummary || "(no summary provided)");

  const note = "";

  const characterText = focusCharacter
    ? String(meta.motivations?.[focusCharacter] ?? "").trim()
    : "";

  const relationshipText =
    !isStory && !characterText
      ? formatRelationshipEvidence(meta.relationship_edges)
      : "";

  return {
    title,
    metaLine,
    characters,
    summary,
    note,
    evidenceLabel: characterText
      ? focusCharacter
      : (relationshipText ? "Relationships" : ""),
    evidence: characterText || relationshipText || "",
    tags: meta.annotation_tags || meta.tags || []
  };
}
)}

function _windowSize(Inputs){return(
Inputs.range([1, 12], {
  step: 1,
  value: 3,
  label: "Trailing window (chapters)"
})
)}

function _width(){return(
1700
)}

function _rowHeight(){return(
40
)}

function _topMargin(){return(
40
)}

function _bottomMargin(){return(
40
)}

function _leftMargin(){return(
170
)}

function _rightMargin(){return(
850
)}

function _height(){return(
700
)}

function _sceneJitter(){return(
10
)}

function _sceneBend(){return(
18
)}

function _sceneMaxChars(){return(
10
)}

function _transitionMs(){return(
650
)}

function _xScale(d3,maxChapter,leftMargin,width,rightMargin){return(
d3.scaleLinear()
  .domain([1, maxChapter])
  .range([leftMargin, width - rightMargin])
)}

function _yScale(d3,charactersList,topMargin,height,bottomMargin){return(
d3.scalePoint()
  .domain(charactersList)
  .range([topMargin, height - bottomMargin])
  .padding(0.5)
)}

function _characterBaseColor(d3,charactersList){return(
d3.scaleOrdinal()
  .domain(charactersList)
  .range(d3.schemeTableau10)
)}

function _groupColorMap(){return(
new Map([
  ["extractor-team", "#56B4E9"],
  ["leader", "#0072B2"],
  ["point-man", "#009E73"],
  ["architect", "#CC79A7"],
  ["forger", "#E69F00"],
  ["chemist", "#D55E00"],
  ["client", "#8C564B"],
  ["ally", "#7E57C2"],
  ["target", "#F0E442"],
  ["mark", "#F0E442"],
  ["limbo-echo", "#999999"],
  ["projection", "#DC322F"]
])
)}

function _groupPalette(d3,groupColorMap){return(
d3.scaleOrdinal()
  .domain(Array.from(groupColorMap.keys()))
  .range(Array.from(groupColorMap.values()))
)}

function _groupAlias(){return(
new Map()
)}

function _displayGroupPriority(){return(
[
  "leader",
  "point-man",
  "architect",
  "forger",
  "chemist",
  "extractor-team",
  "client",
  "ally",
  "target",
  "mark",
  "limbo-echo",
  "projection"
]
)}

function _normalizeGroup(groupAlias){return(
(g) => groupAlias.get(g) ?? g
)}

function _pickDisplayGroup(normalizeGroup,displayGroupPriority,groupColorMap){return(
(groups) => {
  const normalized = Array.from(
    new Set((groups ?? []).map(normalizeGroup).filter(Boolean))
  );

  if (!normalized.length) return null;

  for (const g of displayGroupPriority) {
    if (normalized.includes(g)) return g;
  }

  const mapped = normalized.find((g) => groupColorMap.has(g));
  return mapped ?? normalized[0];
}
)}

function _groupForSceneChar(sceneMeta,pickDisplayGroup){return(
(globalChapter, sceneId, character) => {
  const meta = sceneMeta(globalChapter, sceneId);
  return pickDisplayGroup(meta.character_groups?.[character] ?? []);
}
)}

function _colorForSceneChar(groupForSceneChar,groupColorMap,groupPalette){return(
(globalChapter, sceneId, character) => {
  const g = groupForSceneChar(globalChapter, sceneId, character);
  return g && groupColorMap.has(g) ? groupPalette(g) : "#999999";
}
)}

function _dominantGroupByCharacter(chapterData,groupForSceneChar)
{
  const counts = new Map();

  for (const s of chapterData) {
    for (const c of (s.characters || [])) {
      const g = groupForSceneChar(s.chapter, s.scene_id, c);
      if (!g) continue;
      const key = `${c}|${g}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  const best = new Map();
  for (const [key, n] of counts) {
    const [c, g] = key.split("|");
    const prev = best.get(c);
    if (!prev || n > prev.n) best.set(c, { g, n });
  }
  return best;
}


function _lineColorForCharacter(dominantGroupByCharacter,groupColorMap,groupPalette){return(
(character) => {
  const g = dominantGroupByCharacter.get(character)?.g;
  return g && groupColorMap.has(g) ? groupPalette(g) : "#999999";
}
)}

function _relationshipStroke(){return(
{
  family: "",
  alliance: "",
  trust: "",
  mentor: "6,2",
  care: "2,2",
  "romantic-ambiguous": "8,3",
  "romantic-performance": "8,2,2,2",
  conflict: "4,3",
  mistrust: "3,2",
  oppression: "1,3",
  "authority-ritual": "1,2"
}
)}

function _relationshipLegendItems(relationshipStyle){return(
Object.entries(relationshipStyle).map(([key, v]) => ({
  key,
  label: v.label,
  dash: v.dash,
  stroke: v.stroke
}))
)}

function _visibleScenesForLegend(currentChapter,windowSize,data,d3,sceneStep)
{
  const start = Math.max(1, currentChapter - windowSize + 1);

  const priorAll = data
    .filter(d => d.chapter >= start && d.chapter < currentChapter);

  const currentAll = data
    .filter(d => d.chapter === currentChapter)
    .slice()
    .sort((a, b) => d3.ascending(a.scene_id, b.scene_id));

  return priorAll.concat(currentAll.slice(0, sceneStep));
}


function _visibleLegendMeta(visibleScenesForLegend,timelineMode,storyOrder,groupForSceneChar,groupColorMap,sceneMeta,relationshipFamily,d3)
{
  const groups = new Set();
  const relationships = new Set();

  for (const s of visibleScenesForLegend) {
    const globalCh =
      timelineMode === "story"
        ? (storyOrder.chapterByRank.get(s.chapter) ?? s.chapter)
        : s.chapter;

    for (const c of (s.characters || [])) {
      const g = groupForSceneChar(globalCh, s.scene_id, c);
      if (g && groupColorMap.has(g)) groups.add(g);
    }

    for (const r of (sceneMeta(globalCh, s.scene_id).relationship_edges ?? [])) {
      if (r.type) relationships.add(relationshipFamily[r.type] ?? "supportive");
    }
  }

  return {
    groups: Array.from(groups).sort(d3.ascending),
    relationships: Array.from(relationships).sort(d3.ascending)
  };
}


function _relationshipFamily(){return(
{
  family: "supportive",
  alliance: "supportive",
  trust: "supportive",

  mentor: "protective",
  care: "protective",

  "romantic-ambiguous": "intimate",
  "romantic-performance": "intimate",

  conflict: "conflict",
  mistrust: "conflict",

  oppression: "institutional",
  "authority-ritual": "institutional"
}
)}

function _relationshipStyle(){return(
{
  none:          { label: "no special relationship", dash: "",    stroke: "rgba(255,255,255,0.72)" },
  supportive:    { label: "family / alliance / trust", dash: "",    stroke: "#d6d6d6" },
  protective:    { label: "mentor / care",             dash: "2,2", stroke: "#56B4E9" },
  intimate:      { label: "romantic / performative",   dash: "",    stroke: "#CC79A7" },
  conflict:      { label: "conflict / mistrust",       dash: "5,3", stroke: "#F87171" },
  institutional: { label: "institutional / ritual",    dash: "1,3", stroke: "#93C5FD" }
}
)}

function _dominantSessionRelationshipFamily(sceneMeta,d3,relationshipFamily){return(
(globalChapter, sceneId, sessionGroup = null) => {
  const edges = sceneMeta(globalChapter, sceneId, sessionGroup).relationship_edges ?? [];
  if (!edges.length) return "none";

  const counts = d3.rollup(
    edges,
    v => v.length,
    d => relationshipFamily[d.type] ?? "none"
  );

  return Array.from(counts.entries())
    .sort((a, b) => d3.descending(a[1], b[1]))[0][0] ?? "none";
}
)}

function _motivationBySceneChar(chapterData,storyData)
{
  const m = new Map();

  for (const source of [chapterData, storyData]) {
    for (const s of source) {
      const motivations = s.motivations || {};
      for (const c of (s.characters || [])) {
        const text = motivations[c];
        if (text != null && text !== "") {
          m.set(`${s.chapter}|${s.scene_id}|${c}`, text);
        }
      }
    }
  }

  return m;
}


function _maxStoryUnit(maxChapter){return(
maxChapter
)}

function _spoilerMaxUnit(){return(
Infinity
)}

function _maxAllowedUnit(maxChapter){return(
maxChapter
)}

function _currentUnit(){return(
1
)}

function _currentChapter(Inputs,maxAllowedUnit,$0,timelineMode){return(
Inputs.range([1, maxAllowedUnit], {
  step: 1,
  value: Math.min($0.value, maxAllowedUnit),
  label: timelineMode === "story" ? "In-story position" : "Chapter"
})
)}

function _currentUnitSync($0,currentChapter,maxAllowedUnit)
{
  $0.value = Math.min(currentChapter, maxAllowedUnit);
  return $0.value;
}


function _dataForStep(timelineMode,storyData,storyOrder,chapterData){return(
timelineMode === "story"
    ? storyData.map(d => ({
        ...d,
        chapter: storyOrder.rankByChapter.get(d.chapter) ?? d.chapter
      }))
    : chapterData
)}

function _sceneStep(dataForStep,currentChapter,d3,Inputs)
{
  const scenes = dataForStep
    .filter(d => d.chapter === currentChapter)
    .slice()
    .sort((a, b) => d3.ascending(a.scene_id, b.scene_id))

  return Inputs.range([0, scenes.length], {
    step: 1,
    value: scenes.length,
    label: "Scenes revealed in current chapter"
  })
}


function _chapterMeta(d3,data){return(
d3.rollup(
  data,
  v => ({
    book: v[0].book_name ?? v[0].book,
    chapter_in_book: v[0].chapter_in_book,
    beat_label: v[0].beat_label,
    story_time_iso: v[0].story_time_iso,
    story_date: v[0].story_date
  }),
  d => d.chapter
)
)}

function _chapterIndex(d3,data,maxChapter)
{
  // pick the first scene (lowest scene_id) as the chapter representative
  const repByChapter = d3.rollup(
    data,
    v => v.reduce((best, r) => (r.scene_id < best.scene_id ? r : best), v[0]),
    d => d.chapter
  );

  // return sorted reps (1..maxChapter)
  return d3.range(1, maxChapter + 1)
    .map(ch => repByChapter.get(ch))
    .filter(Boolean);
}


function _monthName(){return(
(m) =>
  ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m-1] || ""
)}

function _formatStoryDateLabel(monthName){return(
(isoLike) => {
  if (!isoLike) return "";
  const s = String(isoLike).split("T")[0]; // strip time if present

  // BDD-xx support
  const bdd = /^BDD-(\d+)$/.exec(s);
  if (bdd) return `Before Dark Days (${bdd[0]})`;

  // YYYY-MM-DD
  const m1 = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m1) {
    const y = +m1[1], mo = +m1[2], d = +m1[3];
    return `${y} ADD · ${monthName(mo)} ${d}`;
  }

  // YYYY-MM
  const m2 = /^(\d{4})-(\d{2})$/.exec(s);
  if (m2) {
    const y = +m2[1], mo = +m2[2];
    return `${y} ADD · ${monthName(mo)}`;
  }

  // YYYY
  const m3 = /^(\d{4})$/.exec(s);
  if (m3) return `${+m3[1]} ADD`;

  return s; // fallback
}
)}

function _chapterJumpOptions(d3,chapterData){return(
Array.from(
  d3.rollup(
    chapterData,
    v => ({
      chapter: v[0].chapter,
      chapter_in_book: v[0].chapter_in_book,
      book_name: v[0].book_name,
      book_chapter_ref: v[0].book_chapter_ref,
      beat_label: v[0].beat_label
    }),
    d => d.chapter
  ).values()
).sort((a, b) => d3.ascending(a.chapter, b.chapter))
)}

function _jumpToChapter(Inputs,chapterJumpOptions){return(
Inputs.select(chapterJumpOptions, {
  label: "Jump to beat",
  format: (d) => {
    const left = `${d.book_name} · ${d.book_chapter_ref ?? `Beat ${d.chapter_in_book ?? d.chapter}`}`;
    const title = (d.beat_label ?? "").trim();
    return title ? `${left} — ${title}` : left;
  }
})
)}

function _currentBeatIndex(chapterJumpOptions,currentChapter){return(
chapterJumpOptions.findIndex(d => d.chapter === currentChapter)
)}

function _prevBeat(currentBeatIndex,chapterJumpOptions){return(
currentBeatIndex > 0 ? chapterJumpOptions[currentBeatIndex - 1] : null
)}

function _nextBeat(currentBeatIndex,chapterJumpOptions){return(
currentBeatIndex >= 0 && currentBeatIndex < chapterJumpOptions.length - 1
    ? chapterJumpOptions[currentBeatIndex + 1]
    : null
)}

function _goToBeat($0,Event){return(
(target) => {
  if (!target) return null;

  const slider = $0;
  if (+slider.value !== +target.chapter) {
    slider.value = target.chapter;
    slider.dispatchEvent(new Event("input", { bubbles: true }));
  }
  return target.chapter;
}
)}

function _makeBeatNavButton(html,goToBeat){return(
(label, target) => {
  const btn = html`<button type="button" class="sb889-navbtn">${label}</button>`;
  btn.disabled = !target;
  btn.onclick = () => goToBeat(target);
  return btn;
}
)}

function _chapterJumpReset($0,jumpToChapter)
{
  $0.value = null;
  return jumpToChapter?.chapter ?? null;
}


function _lastHandledChapterJump(){return(
null
)}

function _jumpToChapterEffect(timelineMode,jumpToChapter,$0,$1,Event)
{
  if (timelineMode !== "chapter") return null;
  if (!jumpToChapter) return null;

  const target = jumpToChapter.chapter;
  if (target == null) return null;

  if ($0.value === target) return null;
  $0.value = target;

  const slider = $1;
  if (+slider.value !== +target) {
    slider.value = target;
    slider.dispatchEvent(new Event("input", { bubbles: true }));
  }

  return target;
}


function _povEnabled(timelineMode){return(
timelineMode === "chapter"
)}

function _pendingPovStep(){return(
null
)}

function _goToPovStop(povEnabled,$0,$1,Event,$2){return(
(target) => {
  if (!povEnabled || !target) return null;

  $0.value = target.chapterStep;

  const chapterSlider = $1;

  if (+chapterSlider.value !== +target.globalChapter) {
    chapterSlider.value = target.globalChapter;
    chapterSlider.dispatchEvent(new Event("input", { bubbles: true }));
  } else {
    // same chapter: set sceneStep immediately
    const stepSlider = $2;
    if (+stepSlider.value !== +target.chapterStep) {
      stepSlider.value = target.chapterStep;
      stepSlider.dispatchEvent(new Event("input", { bubbles: true }));
    }
    $0.value = null;
  }

  return target;
}
)}

function _lastHandledPovJump(){return(
null
)}

function _jumpToPovEffect(povEnabled,jumpToPov,$0,goToPovStop)
{
  if (!povEnabled || !jumpToPov) return null;

  const key = `${jumpToPov.globalChapter}|${jumpToPov.chapterStep}|${jumpToPov.character ?? ""}`;
  if ($0.value === key) return null;
  $0.value = key;

  return goToPovStop(jumpToPov);
}


function _debugPovChapterState(Inputs,povCharacter,jumpToPov,timelineMode,currentChapter,sceneStep){return(
Inputs.table([{
  povCharacter,
  selectedGlobalChapter: jumpToPov?.globalChapter ?? null,
  selectedStoryUnit: jumpToPov?.storyUnit ?? null,
  timelineMode,
  currentChapter,
  sceneStep
}])
)}

function _debugGoToPov(Inputs,currentChapter,sceneStep,jumpToPov){return(
Inputs.table([{
  currentChapter,
  sceneStep,
  selectedPovChapter: jumpToPov?.globalChapter ?? null,
  selectedPovStep: jumpToPov?.chapterStep ?? null
}])
)}

function _povCounts(chapterData,sceneMeta)
{
  const counts = new Map();

  for (const s of chapterData) {
    const povs = Array.from(
      new Set(sceneMeta(s.chapter, s.scene_id).pov_candidates ?? [])
    );

    for (const c of povs) {
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
  }

  return counts;
}


function _majorPovCharacters(povCounts,d3){return(
Array.from(povCounts.entries())
  .sort((a, b) =>
    d3.descending(a[1], b[1]) || d3.ascending(a[0], b[0])
  )
  .slice(0, 5)
  .map(([name]) => name)
)}

function _sceneOrderWithinChapter(d3,chapterData)
{
  const byChapter = d3.group(
    chapterData
      .slice()
      .sort((a, b) => d3.ascending(a.scene_id, b.scene_id)),
    d => d.chapter
  );

  return new Map(
    Array.from(byChapter, ([ch, rows]) => [
      ch,
      new Map(rows.map((d, i) => [d.scene_id, i + 1]))
    ])
  );
}


function _povStopsAll(chapterData,sceneMeta,sceneOrderWithinChapter,storyOrder,d3)
{
  const rows = [];

  for (const s of chapterData) {
    const povs = Array.from(
      new Set(sceneMeta(s.chapter, s.scene_id).pov_candidates ?? [])
    );

    const chapterStep =
      sceneOrderWithinChapter.get(s.chapter)?.get(s.scene_id) ?? 1;

    for (const character of povs) {
      rows.push({
        character,
        globalChapter: s.chapter,
        storyUnit: storyOrder.rankByChapter.get(s.chapter) ?? s.chapter,
        scene_id: s.scene_id,
        chapterStep,
        book_name: s.book_name ?? s.book,
        chapter_in_book: s.chapter_in_book,
        beat_label: s.beat_label ?? "",
        session_title: s.session_title ?? ""
      });
    }
  }

  return rows.sort((a, b) =>
    d3.ascending(a.globalChapter, b.globalChapter) ||
    d3.ascending(a.scene_id, b.scene_id) ||
    d3.ascending(a.character, b.character)
  );
}


function _selectedSceneDetail(){return(
null
)}

function _selectedSceneDetailRender(selectedSceneDetail,setSideInfo)
{
  const detail = selectedSceneDetail;

  if (!detail) {
    setSideInfo({
      title: "Click a session, dot, or character",
      metaLine: "",
      characters: [],
      summary: "Select a scene to view its summary, characters, location, date, and supporting notes.",
      note: "",
      evidence: "",
      tags: []
    });
    return null;
  }

  setSideInfo(detail);
  return detail;
}


function _spoilerMaxChapter(){return(
Infinity
)}

function _storyOrder(chapterData,d3)
{
  const sorted = Array.from(new Set(chapterData.map(d => d.chapter)))
    .sort((a, b) => d3.ascending(a, b));

  return {
    rankByChapter: new Map(sorted.map(ch => [ch, ch])),
    chapterByRank: new Map(sorted.map(ch => [ch, ch]))
  };
}


function _tickLabelByBeat(){return(
new Map([
  [1, "Beat 1 · Sedation"],
  [2, "Beat 2 · Layers open"],
  [3, "Beat 3 · Rain / Hotel / Fortress"],
  [4, "Beat 4 · Kick timing"],
  [5, "Beat 5 · Vault / Limbo / Kick"],
  [6, "Beat 6 · Wake-up"]
])
)}

function _chart(d3,width,height,storyOrder,data,tickLabelByBeat,leftMargin,bottomMargin,topMargin,rightMargin,motivationBySceneChar,windowSize,yScale,charactersList,laneScore,transitionMs,formatStoryDateLabel,sceneMaxChars,colorForSceneChar,sceneBend,dominantSessionRelationshipFamily,relationshipStroke,relationshipStyle,$0,buildSceneDetail)
{
  // ----------------------------
  // Persistent chart scaffolding
  // ----------------------------
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#111")
    .style("font-family", "system-ui, sans-serif");

  let currentMode = "chapter";
  const unitOfGlobal = (globalCh) =>
    currentMode === "story"
      ? storyOrder.rankByChapter.get(globalCh) ?? globalCh
      : globalCh;
  const globalOfUnit = (unitCh) =>
    currentMode === "story"
      ? storyOrder.chapterByRank.get(unitCh) ?? unitCh
      : unitCh;

  const chapterRefText = (m) => {
    if (!m) return "?";
    return m.book_chapter_ref ?? `Beat ${m.chapter_in_book ?? "?"}`;
  };

  const storyDateText = (m, fallback = "") =>
    m?.story_time_iso ?? m?.story_date ?? fallback;

  // Build chapter/event meta lookup from new JSON (beat_short, beat_label, book)
  const chapterMeta = d3.rollup(
    data,
    (v) => ({
      book: v[0].book_name ?? v[0].book,
      chapter_in_book: v[0].chapter_in_book,
      book_chapter_ref: v[0].book_chapter_ref,
      beat_label: v[0].beat_label,
      story_time_iso: v[0].story_time_iso,
      story_date: v[0].story_date ?? v[0].story_time
    }),
    (d) => d.chapter
  );

  // Tick label: "Mockingjay · MJ-12"
  /*const formatTick = (globalCh) => {
    const m = chapterMeta.get(globalCh);
    if (!m) return `Ch ${globalCh}`;
    if (currentMode === "story") return storyDateText(m, `T${globalCh}`);
    return `${m.book} · ${chapterRefText(m)}`;
  };*/

  const formatTick = (globalCh) => {
    const m = chapterMeta.get(globalCh);
    if (!m) return `Beat ${globalCh}`;
    if (currentMode === "story") return storyDateText(m, `T${globalCh}`);
    return (
      tickLabelByBeat.get(globalCh) ??
      `${m.book_chapter_ref ?? `Beat ${m.chapter_in_book ?? globalCh}`}`
    );
  };

  // Header label (used for dot hover / motivations)
  const formatHeader = (globalCh) => {
    const m = chapterMeta.get(globalCh);
    if (!m) return `Chapter ${globalCh}`;
    const base = `${m.book} · ${chapterRefText(m)}`;
    if (currentMode === "story") {
      const when = storyDateText(m, "");
      return `${when}  •  ${base}${m.beat_label ? ` — ${m.beat_label}` : ""}`;
    }
    return `${base}${m.beat_label ? ` — ${m.beat_label}` : ""}`;
  };

  // A “clean” session title without repeating book, used for session hover
  // e.g. "HG-03 — Goodbyes & departure"
  const inferSessionTitle = (globalCh) => {
    const m = chapterMeta.get(globalCh);
    if (!m) return `Chapter ${globalCh}`;
    return `${m.book} · ${chapterRefText(m)}${
      m.beat_label ? ` — ${m.beat_label}` : ""
    }`;
  };

  const chapterPrefix = (globalCh) => {
    const m = chapterMeta.get(globalCh);
    if (!m) return `Chapter ${globalCh}`;
    return `${m.book} · Ch ${m.chapter_in_book ?? "?"}`;
  };

  // Title
  svg
    .append("text")
    .attr("class", "title")
    .attr("x", leftMargin)
    .attr("y", 22)
    .attr("fill", "#fff")
    .attr("font-size", 16)
    .text("Storyline Visualization (Inception – final-act prototype)");

  // Axis group (UPDATED each time to zoom to window)
  const gAxis = svg
    .append("g")
    .attr("class", "xAxis")
    .attr("transform", `translate(0, ${height - bottomMargin})`);

  // Cursor line
  svg
    .append("line")
    .attr("class", "cursor")
    .attr("x1", leftMargin)
    .attr("x2", leftMargin)
    .attr("y1", topMargin - 10)
    .attr("y2", height - bottomMargin)
    .attr("stroke", "#888")
    .attr("stroke-width", 1)
    .attr("opacity", 0.6);

  // Layers (ordering matters for hover priority)
  const gLinks = svg.append("g").attr("class", "sceneLinks"); // behind
  const gSessions = svg.append("g").attr("class", "sessionBands"); // visible bands (non-interactive)
  const gSessionHits = svg.append("g").attr("class", "sessionHits"); // invisible band hit targets
  const gChars = svg.append("g").attr("class", "characters"); // visible lines (non-interactive)
  const gCharHits = svg.append("g").attr("class", "characterHits"); // invisible line hit targets
  const gDots = svg.append("g").attr("class", "sceneDots"); // visible dots (non-interactive)
  const gDotHits = svg.append("g").attr("class", "dotHits"); // invisible dot hit targets (topmost)

  // Labels (text + leader lines)
  const gLabelLeaders = svg
    .append("g")
    .attr("class", "labelLeaders")
    .attr("pointer-events", "none");

  const gLabels = svg
    .append("g")
    .attr("class", "yLabels")
    .attr("pointer-events", "none");

  // ----------------------------
  // Bottom hover info bar
  // ----------------------------
  const infoH = 64;
  const infoY = height - bottomMargin - infoH - 6;

  const gInfo = svg
    .append("g")
    .attr("class", "infoBar")
    .style("pointer-events", "none")
    .style("display", "none");

  gInfo
    .append("rect")
    .attr("class", "info-bg")
    .attr("x", leftMargin)
    .attr("y", infoY)
    .attr("width", width - leftMargin - rightMargin)
    .attr("height", infoH)
    .attr("rx", 10)
    .attr("fill", "rgba(20,20,20,0.92)")
    .attr("stroke", "rgba(255,255,255,0.18)")
    .attr("stroke-width", 1);

  const infoText = gInfo
    .append("text")
    .attr("class", "info-text")
    .attr("x", leftMargin + 14)
    .attr("y", infoY + 18)
    .attr("fill", "#eee")
    .attr("font-family", "system-ui, sans-serif");

  function clearInfoLines() {
    infoText.selectAll("tspan").remove();
  }

  function wrapTspan(tspan, maxWidth, maxLines = 4) {
    const full = tspan.text();
    const words = full.split(/\s+/).filter(Boolean);
    if (words.length <= 1) return { truncated: false };

    tspan.text("");

    let line = [];
    let lineNumber = 0;
    let cur = tspan;

    function newLine() {
      lineNumber += 1;
      cur = infoText
        .append("tspan")
        .attr("x", leftMargin + 14)
        .attr("dy", "1.25em")
        .attr("fill", "#ddd")
        .style("font-size", "14px");
      return cur;
    }

    for (let i = 0; i < words.length; i++) {
      line.push(words[i]);
      cur.text(line.join(" "));

      if (cur.node().getComputedTextLength() > maxWidth && line.length > 1) {
        // roll back last word
        line.pop();
        cur.text(line.join(" "));

        // if we are at the last allowed line, truncate with ellipsis
        if (lineNumber >= maxLines - 1) {
          let remaining = [words[i], ...words.slice(i + 1)].join(" ");
          let candidate = remaining;

          cur.text(candidate + "…");
          while (cur.node().getComputedTextLength() > maxWidth) {
            const parts = candidate.split(/\s+/);
            if (parts.length <= 1) break;
            parts.pop();
            candidate = parts.join(" ");
            cur.text(candidate + "…");
          }
          return { truncated: true };
        }

        // start a new line with the word that overflowed
        line = [words[i]];
        newLine().text(line.join(" "));
      }
    }

    return { truncated: false };
  }

  function layoutInfoBar() {
    // compute required height from rendered tspans
    const bb = infoText.node().getBBox();
    const padY = 10;
    const h = Math.max(64, bb.height + 2 * padY);

    const y = height - bottomMargin - h - 6;

    gInfo.select("rect.info-bg").attr("y", y).attr("height", h);

    // move the text block to match the new rect
    infoText.attr("y", y + 18);

    // keep all tspans aligned to the same x
    infoText.selectAll("tspan").attr("x", leftMargin + 14);
  }

  function hideInfo() {
    gInfo.style("display", "none");
  }

  function showInfoMotivation({ character, scene_id, chapter }) {
    clearInfoLines();

    const l1 = infoText
      .append("tspan")
      .attr("x", leftMargin + 14)
      .attr("dy", 0)
      .attr("fill", "#fff")
      .style("font-size", "15px")
      .style("font-weight", 600);

    const l2 = infoText
      .append("tspan")
      .attr("x", leftMargin + 14)
      .attr("dy", "1.5em")
      .attr("fill", "#ddd")
      .style("font-size", "14px");

    const globalCh = globalOfUnit(chapter);
    const m = chapterMeta.get(globalCh);
    const eventName =
      m?.beat_label ?? inferSessionTitle(globalCh) ?? `Chapter ${globalCh}`;

    const motivation =
      motivationBySceneChar.get(`${globalCh}|${scene_id}|${character}`) ??
      motivationBySceneChar.get(`${scene_id}|${character}`) ??
      "(no motivation provided)";

    l1.text(`${eventName} • ${character}`);
    l2.text(motivation);

    wrapTspan(l2, width - leftMargin - rightMargin - 28);
    layoutInfoBar();
    gInfo.style("display", null);
  }

  // parse "Location — rest of description" from session_desc
  function splitLocationAndDesc(desc) {
    if (!desc) return { location: "", detail: "" };
    const seps = [" — ", " – ", " - "];
    for (const sep of seps) {
      const idx = desc.indexOf(sep);
      if (idx > 0) {
        return {
          location: desc.slice(0, idx).trim(),
          detail: desc.slice(idx + sep.length).trim()
        };
      }
    }
    return { location: "", detail: desc.trim() };
  }

  // session hover header format: "Book · Event — Location"
  function showInfoSession({ when, eventTitle, desc }) {
    clearInfoLines();

    const l1 = infoText
      .append("tspan")
      .attr("x", leftMargin + 14)
      .attr("dy", 0)
      .attr("fill", "#fff")
      .style("font-size", "15px")
      .style("font-weight", 750);

    const l2 = infoText
      .append("tspan")
      .attr("x", leftMargin + 14)
      .attr("dy", "1.5em")
      .attr("fill", "#ddd")
      .style("font-size", "14px");

    const { location, detail } = splitLocationAndDesc(desc || "");
    const left = [when, eventTitle].filter(Boolean).join(" · ");
    const header = location ? `${left} — ${location}` : left;

    l1.text(header || "Interaction session");
    l2.text(detail || "(no session description provided)");

    wrapTspan(l2, width - leftMargin - rightMargin - 28);
    layoutInfoBar();
    gInfo.style("display", null);
  }

  // ----------------------------
  // Styling knobs
  // ----------------------------
  const linkIdleOpacity = 0.0;
  const linkHoverOpacity = 0.35;

  const lineActiveOpacity = 0.85;
  const lineDimOpacity = 0.05;

  // MORE PROMINENT SESSION BAND (visual)
  const BAND_FILL_IDLE = "rgba(255,255,255,0.16)";
  const BAND_FILL_HOVER = "rgba(255,255,255,0.28)";
  const BAND_STROKE_IDLE = "rgba(255,255,255,0.72)";
  const BAND_STROKE_HOVER = "rgba(255,255,255,0.98)";

  // band geometry: also acts as “visual hover affordance”
  const BAND_MIN_W = 33; // minimum visible width (wider = easier to see)
  const BAND_PAD_X = 12; // extra visible padding around session’s scene span
  const BAND_PAD_Y = 10;
  const BAND_MIN_H = 48;
  const HIT_BAND_MIN_H = 72;

  // hover usability knobs (hit targets)
  const HIT_LINE_W = 22; // makes line hover easy
  const HIT_DOT_R = 12; // makes dot hover easy
  const HIT_BAND_PAD_X = 30; // bigger hover area than before
  const HIT_BAND_PAD_Y = 26;

  // Labels
  const labelMode = "active";
  const labelFont = 13;
  const labelGap = 16;
  const labelPad = 10;
  const labelMinX = leftMargin - 10;

  // ----------------------------
  // Helpers
  // ----------------------------
  function computeVisibleScenes(state, base) {
    const start = Math.max(1, state.currentChapter - windowSize + 1);

    const priorAll = base.filter(
      (d) => d.chapter >= start && d.chapter < state.currentChapter
    );

    const currentAll = base
      .filter((d) => d.chapter === state.currentChapter)
      .slice()
      .sort((a, b) => d3.ascending(a.scene_id, b.scene_id));

    const revealedCurrent = currentAll.slice(0, state.sceneStep);

    return {
      startChapter: start,
      scenesForX: priorAll.concat(currentAll),
      scenesRaw: priorAll.concat(revealedCurrent)
    };
  }

  function sessionsForChapter(ch, scenesInCh, prevY, yScale) {
    const groups = d3.groups(
      scenesInCh,
      (d) => d.session_group ?? d.concurrency_group ?? d.scene_id
    );

    const sessions = groups.map(([gid, rows]) => {
      const chars = Array.from(
        new Set(rows.flatMap((r) => r.characters || []))
      ).filter((c) => yScale(c) != null);

      const order = d3.min(rows, (r) => r.scene_id);
      const bary = d3.mean(chars, (c) => prevY.get(c) ?? yScale(c));
      return { key: `${ch}|${gid}`, gid, chapter: ch, order, bary, chars };
    });

    sessions.sort((a, b) => a.order - b.order);
    sessions.sort((a, b) => d3.ascending(a.bary, b.bary));
    sessions.forEach((s) => {
      s.chars.sort(
        (a, b) => (prevY.get(a) ?? yScale(a)) - (prevY.get(b) ?? yScale(b))
      );
    });

    return sessions;
  }

  function preferredTrackY(ch, c, prevY) {
    const base = prevY.get(c) ?? yScale(c);

    // gentle downward bias for Yusuf in later beats
    if (c === "Yusuf" && ch >= 4) {
      return base + 12;
    }

    return base;
  }

  // ----------------------------
  // stable dynamic Y with controllable spacing
  // ----------------------------
  function computeDynamicY(scenesRaw, chaptersInWindow) {
    const byChapter = d3.group(scenesRaw, (d) => d.chapter);
    let prevY = new Map(charactersList.map((c) => [c, yScale(c)]));

    const yByKey = new Map();
    const sessionsIndex = new Map();

    const avail = height - bottomMargin - topMargin;

    const INTRA_STEP_PX = 38;
    const MIN_INTRA_STEP_PX = 14;
    const INTER_SESSION_GAP_PX = 34;

    for (const ch of chaptersInWindow) {
      const scenesInCh = (byChapter.get(ch) || [])
        .slice()
        .sort((a, b) => d3.ascending(a.scene_id, b.scene_id));

      const groups = d3.groups(
        scenesInCh,
        (d) => d.session_group ?? d.concurrency_group ?? d.scene_id
      );

      const sessions = groups.map(([gid, rows]) => {
        const chars = Array.from(
          new Set(rows.flatMap((r) => r.characters || []))
        ).filter((c) => yScale(c) != null);

        const order = d3.min(rows, (r) => r.scene_id);
        const bary = d3.mean(chars, (c) => preferredTrackY(ch, c, prevY));

        chars.sort(
          (a, b) =>
            d3.ascending(laneScore.get(a) ?? 999, laneScore.get(b) ?? 999) ||
            d3.ascending(
              preferredTrackY(ch, a, prevY),
              preferredTrackY(ch, b, prevY)
            )
        );

        const key = `${ch}|${gid}`;
        return { key, gid, chapter: ch, order, bary, chars };
      });

      sessions.forEach((s) => {
        s.anchor = d3.mean(s.chars, (c) => laneScore.get(c) ?? 999);
      });

      sessions.sort(
        (a, b) =>
          d3.ascending(a.anchor, b.anchor) ||
          d3.ascending(a.order, b.order) ||
          d3.ascending(a.bary, b.bary)
      );

      for (const s of sessions) {
        sessionsIndex.set(s.key, {
          key: s.key,
          gid: s.gid,
          chapter: s.chapter,
          chars: s.chars.slice(),
          y0: null,
          y1: null
        });
      }

      const segments = [];
      const seen = new Set();

      for (const s of sessions) {
        const fresh = s.chars.filter((c) => !seen.has(c));
        if (fresh.length) {
          fresh.forEach((c) => seen.add(c));
          segments.push(fresh);
        }
      }

      const totalChars = d3.sum(segments, (seg) => seg.length);
      if (!totalChars) continue;

      const totalGaps = Math.max(0, segments.length - 1);

      const baseUsed =
        (totalChars - 1) * INTRA_STEP_PX + totalGaps * INTER_SESSION_GAP_PX;

      let step = INTRA_STEP_PX;
      let gap = INTER_SESSION_GAP_PX;

      if (baseUsed > avail) {
        const scale = avail / baseUsed;
        step = Math.max(MIN_INTRA_STEP_PX, INTRA_STEP_PX * scale);
        gap = INTER_SESSION_GAP_PX * scale;
      }

      const used = (totalChars - 1) * step + totalGaps * gap;
      const offsetY = topMargin + (avail - used) / 2;

      let placed = 0;
      let y = offsetY;

      for (let si = 0; si < segments.length; si++) {
        const seg = segments[si];
        for (const c of seg) {
          yByKey.set(`${ch}|${c}`, y);
          prevY.set(c, y);

          placed += 1;
          if (placed < totalChars) y += step;
        }
        if (si < segments.length - 1) y += gap;
      }

      for (const s of sessions) {
        const ys = s.chars
          .map((c) => yByKey.get(`${ch}|${c}`))
          .filter((v) => v != null);

        const rec = sessionsIndex.get(s.key);
        if (!rec || !ys.length) continue;

        rec.y0 = d3.min(ys);
        rec.y1 = d3.max(ys);
      }
    }

    function yAt(ch, c) {
      return yByKey.get(`${ch}|${c}`) ?? yScale(c);
    }

    return { yAt, sessionsIndex };
  }

  function resolveLabelCollisions(items, minGap, yMin, yMax) {
    items.sort((a, b) => a.yLabel - b.yLabel);
    for (let i = 1; i < items.length; i++) {
      const prev = items[i - 1];
      const cur = items[i];
      if (cur.yLabel < prev.yLabel + minGap) cur.yLabel = prev.yLabel + minGap;
    }
    if (items.length) {
      const last = items[items.length - 1];
      const overflow = last.yLabel - yMax;
      if (overflow > 0) for (const it of items) it.yLabel -= overflow;
    }
    for (let i = items.length - 2; i >= 0; i--) {
      const next = items[i + 1];
      const cur = items[i];
      if (cur.yLabel > next.yLabel - minGap) cur.yLabel = next.yLabel - minGap;
    }
    if (items.length) {
      const first = items[0];
      const under = yMin - first.yLabel;
      if (under > 0) for (const it of items) it.yLabel += under;
    }
    return items;
  }

  // ----------------------------
  // UPDATE
  // ----------------------------
  function update(state, { duration = transitionMs } = {}) {
    const mode = state.timelineMode ?? "chapter";
    currentMode = mode;

    const spoilerMax = state.spoilerMaxChapter;

    // If not finished, we force chapter mode and filter data at the cutoff
    const rawView =
      spoilerMax != null && spoilerMax !== Infinity
        ? data.filter((d) => d.chapter <= spoilerMax) // spoilerMax is GLOBAL chapter
        : data;

    // Build a unit-chapter view used by the rest of the chart
    const dataView = rawView.map((d) => ({
      ...d,
      _global_chapter: d.chapter,
      chapter: unitOfGlobal(d.chapter) // <— IMPORTANT: overwrite chapter with UNIT
    }));

    // Optional: if your JSON has story_time, you can later use it:
    const unitOf = (d) =>
      mode === "story" ? d.story_time ?? d.chapter : d.chapter;

    svg.interrupt();
    const t = svg.transition().duration(duration).ease(d3.easeCubicInOut);

    const { startChapter, scenesForX, scenesRaw } = computeVisibleScenes(
      state,
      dataView
    );

    // ---------------------------------------------------------
    // X layout = scenes laid out sequentially within each beat
    // ---------------------------------------------------------
    const orderedForX = scenesForX
      .slice()
      .sort((a, b) => a.chapter - b.chapter || a.scene_id - b.scene_id);

    const sceneKey = (s) => `${s.chapter}|${s.scene_id}`;

    // one anchor per unique chapter+scene, so concurrent sessions share x
    const sceneAnchors = Array.from(
      d3.group(orderedForX, sceneKey),
      ([, rows]) => rows[0]
    );

    const idxBySceneKey = new Map(sceneAnchors.map((s, i) => [sceneKey(s), i]));
    const n = sceneAnchors.length;

    const xScale = d3
      .scaleLinear()
      .domain([0, Math.max(1, n - 1)])
      .range([leftMargin, width - rightMargin]);

    function xForScene(s) {
      return xScale(idxBySceneKey.get(sceneKey(s)));
    }

    const xAtScene = (ch, scene_id) => {
      const i = idxBySceneKey.get(`${ch}|${scene_id}`);
      return xScale(i ?? 0);
    };

    const sessionXRangeAll = new Map();

    // IMPORTANT: iterate orderedForX, not sceneAnchors.
    // That way every concurrent session_group gets its own x-range,
    // while still sharing the same x anchor through xAtScene().
    for (const s of orderedForX) {
      const gid = s.session_group ?? s.concurrency_group ?? s.scene_id;
      const key = `${s.chapter}|${gid}`;
      const x = xAtScene(s.chapter, s.scene_id);

      const cur = sessionXRangeAll.get(key);
      if (!cur) {
        sessionXRangeAll.set(key, { x0: x, x1: x });
      } else {
        sessionXRangeAll.set(key, {
          x0: Math.min(cur.x0, x),
          x1: Math.max(cur.x1, x)
        });
      }
    }

    // Beat centers for ticks
    const chaptersInX = Array.from(
      new Set(sceneAnchors.map((d) => d.chapter))
    ).sort((a, b) => a - b);

    const chapterSpan = new Map();
    for (const ch of chaptersInX) {
      const idxs = sceneAnchors
        .map((s, i) => (s.chapter === ch ? i : null))
        .filter((v) => v != null);

      if (!idxs.length) continue;

      const i0 = d3.min(idxs);
      const i1 = d3.max(idxs);
      const start = i0;
      const center = (i0 + i1) / 2;
      chapterSpan.set(ch, { i0, i1, start, center });
    }

    const MONTHS_FULL = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ];

    // Accepts: "0074-12", "0075-03-01", "0070-01", or "0074-07-18T08:00:00"
    // Returns: "74 ADD, December" / "75 ADD, March 1" / "70 ADD, January"
    function formatADD(isoLike) {
      if (isoLike == null) return "";
      const s0 = String(isoLike).split("T")[0].trim(); // drop time like "T08:00:00"

      // If you already pass a pretty label, don’t reformat
      if (s0.includes("ADD")) return s0;

      const parts = s0.split("-");
      const yearNum = parseInt(parts[0], 10);
      if (!Number.isFinite(yearNum)) return s0;

      const y = `${yearNum} ADD`;

      if (parts.length === 1) return y;

      const mNum = parseInt(parts[1], 10);
      const mName = MONTHS_FULL[mNum - 1] ?? parts[1];

      if (parts.length === 2 || !parts[2]) return `${y}, ${mName}`;

      const dNum = parseInt(parts[2], 10);
      return Number.isFinite(dNum)
        ? `${y}, ${mName} ${dNum}`
        : `${y}, ${mName}`;
    }

    // downsample tick chapters if too many
    const maxTicks = 8;
    const stepTicks = Math.max(1, Math.ceil(chaptersInX.length / maxTicks));
    const tickChapters = chaptersInX.filter(
      (d, i) => i % stepTicks === 0 || d === state.currentChapter
    );

    const tickValues = tickChapters
      .map((ch) => chapterSpan.get(ch)?.start) // use start
      .filter((v) => v != null);

    const chapterForTick = new Map(
      tickChapters
        .map((ch) => [chapterSpan.get(ch)?.start, ch]) // use start
        .filter(([v]) => v != null)
    );

    gAxis
      .transition(t)
      .call(
        d3
          .axisBottom(xScale)
          .tickValues(tickValues)
          .tickFormat((centerIdx) => {
            const ch = chapterForTick.get(centerIdx);
            const unit = globalOfUnit(ch ?? state.currentChapter);

            const raw = formatTick(unit); // currently returns e.g. "0074-12" in story mode
            return state.timelineMode === "story" ? formatADD(raw) : raw;
          })
      )
      .call((g) => g.selectAll("text").attr("fill", "#ddd"))
      .call((g) => g.selectAll("line,path").attr("stroke", "#555"));

    // optional: rotate ticks so "book · beat" fits
    gAxis
      .selectAll("text")
      .attr("text-anchor", "middle")
      .attr("transform", null)
      .attr("dx", 0)
      .attr("dy", "1.2em");

    // Cursor line at last revealed scene in current chapter (fallback to beat center)
    const curScenesRevealed = scenesRaw
      .filter((d) => d.chapter === state.currentChapter)
      .slice()
      .sort((a, b) => d3.ascending(a.scene_id, b.scene_id));

    const cursorX = curScenesRevealed.length
      ? xAtScene(
          state.currentChapter,
          curScenesRevealed[curScenesRevealed.length - 1].scene_id
        )
      : xScale(chapterSpan.get(state.currentChapter)?.center ?? 0);

    svg.select(".cursor").transition(t).attr("x1", cursorX).attr("x2", cursorX);

    // active characters in current chapter (revealed only)
    const activeNow = new Set(
      scenesRaw
        .filter((s) => s.chapter === state.currentChapter)
        .flatMap((s) => s.characters || [])
        .filter((c) => yScale(c) != null)
    );

    const chaptersInWindow = Array.from(
      new Set(scenesRaw.map((d) => d.chapter))
    ).sort((a, b) => a - b);

    const { yAt, sessionsIndex } = computeDynamicY(scenesRaw, chaptersInWindow);

    // session info lookup (choose lowest scene_id row for that session in that chapter)
    const sessionInfo = new Map();
    for (const s of scenesRaw) {
      const gid = s.session_group ?? s.concurrency_group ?? s.scene_id;
      const key = `${s.chapter}|${gid}`;

      const prev = sessionInfo.get(key);
      if (!prev || s.scene_id < prev.scene_id) {
        const globalCh = globalOfUnit(s.chapter);
        const meta = chapterMeta.get(globalCh);

        const rawWhen =
          storyDateText(meta, s.story_time_iso ?? s.story_date ?? "") || "";

        const when =
          formatStoryDateLabel(rawWhen) || s.book_name || s.book || "";

        sessionInfo.set(key, {
          scene_id: s.scene_id,
          session_group: gid,
          when,
          eventTitle: s.session_title ?? s.beat_label ?? s.beat_short ?? "",
          desc: s.session_desc ?? ""
        });
      }
    }

    // ---------------------------------------------------------
    // Build scene layout (x per scene)
    // ---------------------------------------------------------
    const scenesWithLayout = scenesRaw
      .slice()
      .sort((a, b) => a.chapter - b.chapter || a.scene_id - b.scene_id)
      .map((s) => {
        const x = xAtScene(s.chapter, s.scene_id);
        const chars = (s.characters || [])
          .filter((c) => yScale(c) != null)
          .slice(0, sceneMaxChars);
        const hubY = d3.mean(chars, (c) => yAt(s.chapter, c));
        return { ...s, x, chars, hubY };
      });

    const activeCharacters = new Set(scenesWithLayout.flatMap((s) => s.chars));

    // ---------------------------------------------------------
    // Character paths now follow each scene occurrence (not just per beat)
    // ---------------------------------------------------------
    function buildCharPaths(scenesWithLayout) {
      const occ = scenesWithLayout.flatMap((s) =>
        (s.characters || []).map((c) => ({
          character: c,
          chapter: s.chapter,
          scene_id: s.scene_id,
          x: s.x
        }))
      );

      const grouped = d3.group(occ, (d) => d.character);

      return Array.from(grouped, ([name, arr]) => {
        arr.sort((a, b) => a.chapter - b.chapter || a.scene_id - b.scene_id);
        const points = arr.map((a) => ({
          character: name,
          chapter: a.chapter,
          scene_id: a.scene_id,
          x: a.x
        }));
        return { name, points };
      }).filter((d) => d.points.length >= 2);
    }

    const charPaths = buildCharPaths(scenesWithLayout);

    function buildCharSegments(charPaths) {
      return charPaths.flatMap(({ name, points }) =>
        d3.pairs(points, (p0, p1) => ({
          key: `${name}|${p0.chapter}|${p0.scene_id}|${p1.chapter}|${p1.scene_id}`,
          name,
          p0,
          p1
        }))
      );
    }

    const charSegments = buildCharSegments(charPaths);

    const relaxedLine = d3
      .line()
      .x((p) => p.x)
      .y((p) => yAt(p.chapter, p.character))
      .curve(d3.curveMonotoneX);

    // visible character lines (non-interactive)
    const charsVisSel = gChars
      .selectAll("path.characterSeg")
      .data(charSegments, (d) => d.key)
      .join(
        (enter) =>
          enter
            .append("path")
            .attr("class", "characterSeg")
            .attr("fill", "none")
            .attr("stroke-width", 2.2)
            .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round")
            .attr("opacity", 0)
            .attr("pointer-events", "none")
            .attr("stroke", (d) => {
              const globalCh = globalOfUnit(d.p1.chapter);
              return colorForSceneChar(globalCh, d.p1.scene_id, d.name);
            })
            .attr("d", (d) => relaxedLine([d.p0, d.p1]))
            .call((e) => e.transition(t).attr("opacity", lineActiveOpacity)),

        (updateSel) =>
          updateSel
            .transition(t)
            .attr("stroke", (d) => {
              const globalCh = globalOfUnit(d.p1.chapter);
              return colorForSceneChar(globalCh, d.p1.scene_id, d.name);
            })
            .attr("opacity", (d) =>
              activeCharacters.has(d.name) ? lineActiveOpacity : lineDimOpacity
            )
            .attr("d", (d) => relaxedLine([d.p0, d.p1])),

        (exit) => exit.transition(t).attr("opacity", 0).remove()
      );

    // fat invisible hit lines
    const charsHitSel = gCharHits
      .selectAll("path.characterHit")
      .data(charPaths, (d) => d.name)
      .join(
        (enter) =>
          enter
            .append("path")
            .attr("class", "characterHit")
            .attr("fill", "none")
            .attr("stroke", "transparent")
            .attr("stroke-width", HIT_LINE_W)
            .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round")
            .attr("pointer-events", "stroke")
            .style("cursor", "pointer")
            .attr("d", (d) => relaxedLine(d.points)),
        (updateSel) =>
          updateSel.transition(t).attr("d", (d) => relaxedLine(d.points)),
        (exit) => exit.remove()
      );

    // ---------------------------------------------------------
    // Links (hidden until dot hover)
    // ---------------------------------------------------------
    const links = scenesWithLayout.flatMap((s) => {
      const gid = s.session_group ?? s.concurrency_group ?? s.scene_id;
      const sessionKey = `${s.chapter}|${gid}`;
      return (s.chars || []).map((c, idx) => ({
        key: `${s.chapter}|${s.scene_id}|${c}`,
        scene_id: s.scene_id,
        chapter: s.chapter,
        x: s.x,
        hubY: s.hubY,
        character: c,
        y0: yAt(s.chapter, c),
        idx,
        sessionKey
      }));
    });

    const linksSel = gLinks
      .selectAll("path.link")
      .data(links, (d) => d.key)
      .join(
        (enter) =>
          enter
            .append("path")
            .attr("class", "link")
            .attr("fill", "none")
            .attr("stroke", "#bbb")
            .attr("stroke-width", 1)
            .attr("pointer-events", "none")
            .attr("opacity", 0)
            .attr("d", (d) => {
              const bend = sceneBend * (d.idx % 2 === 0 ? 1 : -1);
              const cx = d.x + bend;
              const cy = (d.y0 + d.hubY) / 2;
              return `M${d.x},${d.y0} Q${cx},${cy} ${d.x},${d.hubY}`;
            })
            .call((e) => e.transition(t).attr("opacity", linkIdleOpacity)),
        (updateSel) =>
          updateSel
            .transition(t)
            .attr("opacity", linkIdleOpacity)
            .attr("d", (d) => {
              const y0v = yAt(d.chapter, d.character);
              const bend = sceneBend * (d.idx % 2 === 0 ? 1 : -1);
              const cx = d.x + bend;
              const cy = (y0v + d.hubY) / 2;
              return `M${d.x},${y0v} Q${cx},${cy} ${d.x},${d.hubY}`;
            }),
        (exit) => exit.transition(t).attr("opacity", 0).remove()
      );

    // ---------------------------------------------------------
    // Dots (x per scene) + big hit dots
    // ---------------------------------------------------------
    const dots = scenesWithLayout.flatMap((s) => {
      const gid = s.session_group ?? s.concurrency_group ?? s.scene_id;
      const sessionKey = `${s.chapter}|${gid}`;

      return (s.characters || [])
        .filter((c) => yScale(c) != null)
        .map((c) => ({
          key: `${c}|${s.chapter}|${s.scene_id}|${gid}`,
          character: c,
          chapter: s.chapter,
          scene_id: s.scene_id,
          gid,
          session_group: gid,
          sessionKey,
          x: s.x
        }));
    });

    const dotsVisSel = gDots
      .selectAll("circle.dot")
      .data(dots, (d) => d.key)
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr("class", "dot")
            .attr("r", 3)
            .attr("fill", (d) => {
              const globalCh = globalOfUnit(d.chapter);
              return colorForSceneChar(globalCh, d.scene_id, d.character);
            })
            .attr("opacity", 0)
            .attr("pointer-events", "none")
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => yAt(d.chapter, d.character))
            .call((e) => e.transition(t).attr("opacity", 1)),
        (updateSel) =>
          updateSel
            .transition(t)
            .attr("opacity", (d) =>
              activeCharacters.has(d.character) ? 1 : 0.05
            )
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => yAt(d.chapter, d.character)),
        (exit) => exit.transition(t).attr("opacity", 0).remove()
      );

    const dotsHitSel = gDotHits
      .selectAll("circle.dotHit")
      .data(dots, (d) => d.key)
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr("class", "dotHit")
            .attr("r", HIT_DOT_R)
            .attr("fill", "transparent")
            .attr("pointer-events", "all")
            .style("cursor", "pointer")
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => yAt(d.chapter, d.character)),
        (updateSel) =>
          updateSel
            .transition(t)
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => yAt(d.chapter, d.character)),
        (exit) => exit.remove()
      );

    // ---------------------------------------------------------
    // Session bands: now span across the session's scene range
    // ---------------------------------------------------------
    // Build x-ranges per sessionKey using revealed scenes only (no spoilers)
    const sessionXRange = new Map(); // sessionKey -> {x0,x1}
    for (const s of scenesWithLayout) {
      const gid = s.session_group ?? s.concurrency_group ?? s.scene_id;
      const key = `${s.chapter}|${gid}`;
      const cur = sessionXRange.get(key);
      if (!cur) sessionXRange.set(key, { x0: s.x, x1: s.x });
      else
        sessionXRange.set(key, {
          x0: Math.min(cur.x0, s.x),
          x1: Math.max(cur.x1, s.x)
        });
    }

    const bands = Array.from(sessionsIndex.values()).map((s) => {
      const xr = sessionXRangeAll.get(s.key) || {
        x0: xScale(0),
        x1: xScale(0)
      };

      const x0 = xr.x0;
      const x1 = xr.x1;

      const isSingleAnchor = Math.abs(x1 - x0) < 1e-6;

      // Narrower width for a session that occupies only one x-position.
      // This keeps concurrent bands from visually swallowing each other.
      const w = isSingleAnchor
        ? Math.max(20, 2 * BAND_PAD_X + 10)
        : Math.max(BAND_MIN_W, x1 - x0 + 2 * BAND_PAD_X);

      const x = (x0 + x1) / 2 - w / 2;

      const rawH = Math.max(0, (s.y1 ?? 0) - (s.y0 ?? 0) + 2 * BAND_PAD_Y);
      const h = Math.max(BAND_MIN_H, rawH);
      const yCenter = ((s.y0 ?? 0) + (s.y1 ?? 0)) / 2;
      const y = yCenter - h / 2;

      return {
        key: s.key, // `${ch}|${gid}`
        chapter: s.chapter,
        gid: s.gid,
        x,
        w,
        y,
        h,
        chars: s.chars
      };
    });

    const bandDash = (d) => {
      const info = sessionInfo.get(d.key);
      if (!info) return "";
      const globalCh = globalOfUnit(d.chapter);
      //const fam = dominantSessionRelationshipFamily(globalCh, info.scene_id);

      const fam = dominantSessionRelationshipFamily(
        globalCh,
        info.scene_id,
        info.session_group
      );
      return relationshipStroke[fam] ?? "";
    };

    const bandFamily = (d) => {
      const info = sessionInfo.get(d.key);
      if (!info) return "none";
      const globalCh = globalOfUnit(d.chapter);
      return dominantSessionRelationshipFamily(globalCh, info.scene_id);
    };

    const bandBaseStroke = (d) =>
      relationshipStyle[bandFamily(d)]?.stroke ?? BAND_STROKE_IDLE;
    const bandBaseDash = (d) => relationshipStyle[bandFamily(d)]?.dash ?? "";
    const bandBaseFill = (d) =>
      bandFamily(d) === "none"
        ? "rgba(255,255,255,0.12)"
        : "rgba(255,255,255,0.16)";

    // Visible bands (more prominent)
    const bandsVisSel = gSessions
      .selectAll("rect.band")
      .data(bands, (d) => d.key)
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("class", "band")
            .attr("pointer-events", "none")
            .attr("x", (d) => d.x)
            .attr("width", (d) => d.w)
            .attr("y", (d) => d.y)
            .attr("height", (d) => d.h)
            .attr("rx", 12)
            .attr("fill", bandBaseFill)
            .attr("stroke", bandBaseStroke)
            .attr("stroke-width", 2.2)
            .attr("stroke-dasharray", bandBaseDash)
            .attr("opacity", 0)
            .call((e) => e.transition(t).attr("opacity", 1)),

        (updateSel) =>
          updateSel
            .transition(t)
            .attr("x", (d) => d.x)
            .attr("width", (d) => d.w)
            .attr("y", (d) => d.y)
            .attr("height", (d) => d.h)
            .attr("fill", bandBaseFill)
            .attr("stroke", bandBaseStroke)
            .attr("stroke-width", 2.2)
            .attr("stroke-dasharray", bandBaseDash)
            .attr("opacity", 1),

        (exit) => exit.transition(t).attr("opacity", 0).remove()
      );

    // Invisible hit targets (even larger)
    // Invisible hit targets (even larger)
    const bandsHitSel = gSessionHits
      .selectAll("rect.bandHit")
      .data(bands, (d) => d.key)
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("class", "bandHit")
            .attr("fill", "transparent")
            .attr("pointer-events", "all")
            .style("cursor", "default")
            .attr("x", (d) => d.x - HIT_BAND_PAD_X)
            .attr("width", (d) => d.w + 2 * HIT_BAND_PAD_X)
            .attr("y", (d) => {
              const hh = Math.max(HIT_BAND_MIN_H, d.h + 2 * HIT_BAND_PAD_Y);
              return d.y + d.h / 2 - hh / 2;
            })
            .attr("height", (d) => {
              const hh = Math.max(HIT_BAND_MIN_H, d.h + 2 * HIT_BAND_PAD_Y);
              return hh;
            })
            .attr("rx", 14),
        (updateSel) =>
          updateSel
            .transition(t)
            .attr("x", (d) => d.x - HIT_BAND_PAD_X)
            .attr("width", (d) => d.w + 2 * HIT_BAND_PAD_X)
            .attr("y", (d) => {
              const hh = Math.max(HIT_BAND_MIN_H, d.h + 2 * HIT_BAND_PAD_Y);
              return d.y + d.h / 2 - hh / 2;
            })
            .attr("height", (d) => {
              const hh = Math.max(HIT_BAND_MIN_H, d.h + 2 * HIT_BAND_PAD_Y);
              return hh;
            }),
        (exit) => exit.remove()
      );

    // ---------------------------------------------------------
    // Labels (same logic; first appearance per character in revealed window)
    // ---------------------------------------------------------
    const firstOcc = new Map();
    for (const s of scenesWithLayout) {
      for (const c of s.characters || []) {
        if (yScale(c) == null) continue;
        const prev = firstOcc.get(c);
        if (!prev) firstOcc.set(c, s);
      }
    }

    const labelChars =
      labelMode === "active"
        ? Array.from(activeNow)
        : Array.from(firstOcc.keys());

    let labelItems = labelChars
      .map((c) => {
        const s0 = firstOcc.get(c);
        if (!s0) return null;
        const xPoint = s0.x;
        const yPoint = yAt(s0.chapter, c);
        return {
          key: c,
          character: c,
          xPoint,
          yPoint,
          xLabel: Math.max(labelMinX, xPoint - labelPad),
          yLabel: yPoint
        };
      })
      .filter(Boolean);

    labelItems = resolveLabelCollisions(
      labelItems,
      labelGap,
      topMargin + 8,
      height - bottomMargin - 8
    );

    gLabelLeaders
      .selectAll("path.leader")
      .data(labelItems, (d) => d.key)
      .join(
        (enter) =>
          enter
            .append("path")
            .attr("class", "leader")
            .attr("fill", "none")
            .attr("stroke", "#666")
            .attr("stroke-width", 1)
            .attr("opacity", 0)
            .attr(
              "d",
              (d) => `M${d.xLabel + 2},${d.yLabel} L${d.xPoint - 4},${d.yPoint}`
            )
            .call((e) => e.transition(t).attr("opacity", 0.8)),
        (updateSel) =>
          updateSel
            .transition(t)
            .attr("opacity", 0.8)
            .attr(
              "d",
              (d) => `M${d.xLabel + 2},${d.yLabel} L${d.xPoint - 4},${d.yPoint}`
            ),
        (exit) => exit.transition(t).attr("opacity", 0).remove()
      );

    gLabels
      .selectAll("text.yLabel")
      .data(labelItems, (d) => d.key)
      .join(
        (enter) =>
          enter
            .append("text")
            .attr("class", "yLabel")
            .attr("x", (d) => d.xLabel)
            .attr("y", (d) => d.yLabel)
            .attr("text-anchor", "end")
            .attr("dy", "0.35em")
            .style("font-size", `${labelFont}px`)
            .style("paint-order", "stroke")
            .style("stroke", "#111")
            .style("stroke-width", 4)
            .style("stroke-linejoin", "round")
            .attr("fill", "#eee")
            .attr("opacity", 0)
            .text((d) => d.character)
            .call((e) => e.transition(t).attr("opacity", 0.95)),
        (updateSel) =>
          updateSel
            .transition(t)
            .attr("x", (d) => d.xLabel)
            .attr("y", (d) => d.yLabel)
            .attr("opacity", 0.95),
        (exit) => exit.transition(t).attr("opacity", 0).remove()
      );

    // ---------------------------------------------------------
    // Shared hover helpers
    // ---------------------------------------------------------
    function resetHighlight() {
      hideInfo();
      linksSel.interrupt().attr("opacity", linkIdleOpacity);

      bandsVisSel
        .interrupt()
        .attr("fill", bandBaseFill)
        .attr("stroke", bandBaseStroke)
        .attr("stroke-width", 2.2)
        .attr("stroke-dasharray", bandBaseDash);

      charsVisSel
        .interrupt()
        .attr("opacity", (p) =>
          activeCharacters.has(p.name) ? lineActiveOpacity : lineDimOpacity
        );
    }

    // ---------------------------------------------------------
    // Hover: SESSION BANDS
    // ---------------------------------------------------------
    bandsHitSel
      .style("cursor", "pointer")
      .on("mouseenter", (event, b) => {
        const info = sessionInfo.get(b.key) || {};
        showInfoSession({
          when: info.when,
          eventTitle: info.eventTitle,
          desc: info.desc
        });

        // emphasize this band
        bandsVisSel
          .interrupt()
          .attr("fill", (x) =>
            x.key === b.key ? BAND_FILL_HOVER : bandBaseFill(x)
          )
          .attr("stroke", (x) =>
            x.key === b.key ? "#ffffff" : bandBaseStroke(x)
          )
          .attr("stroke-width", (x) => (x.key === b.key ? 3.0 : 2.2))
          .attr("stroke-dasharray", (x) => bandBaseDash(x));

        // emphasize session characters
        const sessionChars = new Set(sessionsIndex.get(b.key)?.chars || []);
        charsVisSel
          .interrupt()
          .attr("opacity", (p) =>
            sessionChars.has(p.name) ? 1.0 : lineDimOpacity
          );
      })
      .on("mouseleave", resetHighlight)
      .on("click", (event, b) => {
        event.stopPropagation();

        const scene = scenesWithLayout.find((s) => {
          const gid = s.session_group ?? s.concurrency_group ?? s.scene_id;
          return `${s.chapter}|${gid}` === b.key;
        });

        if (!scene) return;

        const globalCh = globalOfUnit(scene.chapter);

        $0.value = buildSceneDetail({
          globalChapter: globalCh,
          sceneId: scene.scene_id,
          sessionGroup:
            scene.session_group ?? scene.concurrency_group ?? scene.scene_id
        });
      });

    // ---------------------------------------------------------
    // Hover: DOTS
    // ---------------------------------------------------------
    dotsHitSel
      .style("cursor", "pointer")
      .on("mouseenter", (event, d) => {
        showInfoMotivation(d);

        const sid = d.scene_id;
        const sk = d.sessionKey;
        const sessionChars = new Set(sessionsIndex.get(sk)?.chars || []);

        linksSel
          .interrupt()
          .attr("opacity", (l) =>
            l.scene_id === sid ? linkHoverOpacity : linkIdleOpacity
          );

        bandsVisSel
          .interrupt()
          .attr("fill", (b) =>
            b.key === sk ? BAND_FILL_HOVER : bandBaseFill(b)
          )
          .attr("stroke", (b) => (b.key === sk ? "#ffffff" : bandBaseStroke(b)))
          .attr("stroke-width", (b) => (b.key === sk ? 3.0 : 2.2))
          .attr("stroke-dasharray", (b) => bandBaseDash(b));

        charsVisSel
          .interrupt()
          .attr("opacity", (p) =>
            sessionChars.has(p.name) ? 1.0 : lineDimOpacity
          );
      })
      .on("mouseleave", resetHighlight)
      .on("click", (event, d) => {
        event.stopPropagation();

        const globalCh = globalOfUnit(d.chapter);

        $0.value = buildSceneDetail({
          globalChapter: globalCh,
          sceneId: d.scene_id,
          sessionGroup: d.session_group,
          focusCharacter: d.character
        });
      });

    // ---------------------------------------------------------
    // Hover: LINES
    // ---------------------------------------------------------
    function pickSceneForCharacter(name) {
      // prefer current chapter revealed scenes
      const inCurrent = scenesWithLayout
        .filter(
          (s) =>
            s.chapter === state.currentChapter &&
            (s.characters || []).includes(name)
        )
        .sort((a, b) => d3.ascending(a.scene_id, b.scene_id));

      if (inCurrent.length) return inCurrent[0];

      // otherwise, last seen in window
      for (let i = scenesWithLayout.length - 1; i >= 0; i--) {
        const s = scenesWithLayout[i];
        if ((s.characters || []).includes(name)) return s;
      }
      return null;
    }

    charsHitSel
      .style("cursor", "pointer")
      .on("mouseenter", (event, p) => {
        const s = pickSceneForCharacter(p.name);

        if (s) {
          showInfoMotivation({
            character: p.name,
            scene_id: s.scene_id,
            chapter: s.chapter
          });
        }

        charsVisSel
          .interrupt()
          .attr("opacity", (q) => (q.name === p.name ? 1.0 : lineDimOpacity));
      })
      .on("mouseleave", resetHighlight)
      .on("click", (event, p) => {
        event.stopPropagation();

        const s = pickSceneForCharacter(p.name);
        if (!s) return;

        const globalCh = globalOfUnit(s.chapter);

        $0.value = buildSceneDetail({
          globalChapter: globalCh,
          sceneId: s.scene_id,
          sessionGroup: s.session_group ?? s.concurrency_group ?? s.scene_id,
          focusCharacter: p.name
        });
      });
  }

  return Object.assign(svg.node(), { update });
}


function _render(chart,currentChapter,sceneStep,timelineMode,spoilerMaxChapter,transitionMs)
{
  chart.update(
    { currentChapter, sceneStep, timelineMode, spoilerMaxChapter },
    { duration: transitionMs }
  )
  return chart
}


function _currentChapterLabel(d3,chapterData,currentChapter)
{
  const row = d3.rollup(chapterData, v => v[0], d => d.chapter).get(currentChapter);
  if (!row) return `Beat ${currentChapter}`;

  const left = `${row.book_name ?? row.book} · ${row.book_chapter_ref ?? `Beat ${row.chapter_in_book ?? currentChapter}`}`;
  const right = (row.session_title || row.beat_label || "").trim();

  return right ? `${left} — ${right}` : left;
}


function _povCharacter(Inputs,majorPovCharacters){return(
Inputs.select(majorPovCharacters, {
  label: "POV character"
})
)}

function _povCharacterReset($0,povCharacter)
{
  $0.value = null;
  return povCharacter;
}


function _povStopsVisible(povEnabled,povStopsAll,povCharacter,finished,spoilerMaxChapter){return(
povEnabled
  ? povStopsAll
      .filter(d => d.character === povCharacter)
      .filter(d => finished || d.globalChapter <= spoilerMaxChapter)
  : []
)}

function _formatPovStop(){return(
(d) => {
  if (!d) return "— select POV stop —";

  const chNo = String(d.chapter_in_book ?? "").padStart(2, "0");
  const title = (d.session_title || d.beat_label || "").trim();
  const left = `${d.book_name} · Ch ${chNo} · scene ${d.chapterStep}`;

  return title ? `${left} — ${title}` : left;
}
)}

function _jumpToPov(Inputs,povStopsVisible,formatPovStop){return(
Inputs.select([null, ...povStopsVisible], {
  label: "Jump to POV scene",
  value: null,
  format: formatPovStop
})
)}

function _prevPovStop(povEnabled,povStopsVisible,currentChapter,sceneStep)
{
  if (!povEnabled) return null;

  let prev = null;
  for (const d of povStopsVisible) {
    const isBefore =
      d.globalChapter < currentChapter ||
      (d.globalChapter === currentChapter && d.chapterStep < sceneStep);

    if (isBefore) prev = d;
  }
  return prev;
}


function _nextPovStop(povEnabled,povStopsVisible,currentChapter,sceneStep)
{
  if (!povEnabled) return null;

  return (
    povStopsVisible.find(d =>
      d.globalChapter > currentChapter ||
      (d.globalChapter === currentChapter && d.chapterStep > sceneStep)
    ) ?? null
  );
}


function _makePovNavButton(html,povEnabled,goToPovStop){return(
(label, target) => {
  const btn = html`<button type="button" class="sb889-navbtn">${label}</button>`;
  btn.disabled = !povEnabled || !target;
  btn.onclick = () => goToPovStop(target);
  return btn;
}
)}

function _109(Inputs,currentChapter,$0,jumpToChapter,jumpToPov,$1,$2,prevPovStop,nextPovStop){return(
Inputs.table([{
  currentChapter,
  currentUnit: $0.value,
  jumpToChapter: jumpToChapter?.chapter ?? null,
  jumpToPovChapter: jumpToPov?.globalChapter ?? null,
  jumpToPovStep: jumpToPov?.chapterStep ?? null,
  lastHandledChapterJump: $1.value,
  lastHandledPovJump: $2.value,
  prevGlobalChapter: prevPovStop?.globalChapter ?? null,
  nextGlobalChapter: nextPovStop?.globalChapter ?? null
}])
)}

function _debugSelectedSceneDetail(Inputs,selectedSceneDetail){return(
Inputs.table([selectedSceneDetail ?? {}])
)}

function _controlsBar(html,$0,makeBeatNavButton,prevBeat,nextBeat){return(
html`
<style>
  .sb889-wrap{
    width: 100%;
    max-width: 100%;
    min-width: 0;
    display: grid;
    gap: 10px;
    align-items: start;
    box-sizing: border-box;
  }

  .sb889-bottomgrid{
    display: grid;
    grid-template-columns: minmax(320px, 1fr) minmax(320px, 1fr);
    gap: 12px;
    align-items: start;
  }

  .sb889-card{
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 10px 12px;
    overflow: hidden;
  }

  .sb889-card h4{
    margin: 0 0 6px 0;
    font-size: 12px;
    color: #888;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .sb889-help{
    margin-top: 6px;
    font-size: 12px;
    color: #8fa1a1;
    line-height: 1.3;
  }

  .sb889-short{
    width: 100%;
    max-width: 100%;
  }

  @media (max-width: 980px){
    .sb889-bottomgrid{
      grid-template-columns: 1fr;
    }
  }
</style>

<div class="sb889-wrap">
  <div class="sb889-bottomgrid">
    <div class="sb889-card">
      <h4>Navigation</h4>
      <div class="sb889-short">${$0}</div>
<div class="sb889-btnrow">
  ${makeBeatNavButton("Previous beat", prevBeat)}
  ${makeBeatNavButton("Next beat", nextBeat)}
</div>
      <div class="sb889-help">
        Jump to a beat. All scenes in that beat are shown automatically.
      </div>
    </div>

    <div class="sb889-card">
      <h4>Prototype scope</h4>
      <div class="sb889-help">
        This mini-demo shows the final-act layered dream structure, with multiple concurrent interaction sessions.
      </div>
    </div>
  </div>
</div>
`
)}

function _legendPanel(visibleLegendMeta,relationshipLegendItems,html,groupColorMap)
{
  const visibleGroups = visibleLegendMeta.groups;
  const visibleRelItems = relationshipLegendItems.filter((item) =>
    visibleLegendMeta.relationships.includes(item.key)
  );

  return html`
  <style>
    .sb889-legend-overlay-card{
      background: rgba(15, 23, 42, 0.88);
      border: 1px solid rgba(148, 163, 184, 0.28);
      border-radius: 12px;
      padding: 12px 14px;
      color: #e5e7eb;
      box-sizing: border-box;
      box-shadow: 0 8px 24px rgba(0,0,0,0.30);
      backdrop-filter: blur(2px);
    }

    .sb889-legend-overlay-title{
      margin: 0 0 10px 0;
      font-size: 14px;
      font-weight: 700;
      color: #f8fafc;
      letter-spacing: 0.02em;
    }

    .sb889-legend-overlay-sub{
      margin: 10px 0 6px 0;
      font-size: 12px;
      font-weight: 700;
      color: #cbd5e1;
    }

    .sb889-group-item,
    .sb889-rel-item{
      display:flex;
      align-items:center;
      gap:8px;
      min-width:0;
      font-size:12px;
      color:#e5e7eb;
      line-height:1.25;
    }

    .sb889-legend-empty{
      font-size:12px;
      color:#94a3b8;
    }

    .sb889-group-grid,
    .sb889-rel-list{
      display:grid;
      gap:6px;
    }

    .sb889-group-swatch{
      display:inline-block;
      width:12px;
      height:12px;
      min-width:12px;
      border-radius:3px;
      border:1px solid rgba(255,255,255,0.22);
      flex:0 0 auto;
    }
  </style>

  <div class="sb889-legend-overlay-card">
    <div class="sb889-legend-overlay-title">Legend</div>

    <div class="sb889-legend-overlay-sub">Groups / factions</div>
    ${
      visibleGroups.length
        ? html`<div class="sb889-group-grid">
            ${visibleGroups.map(
              (g) => html`
                <div class="sb889-group-item">
                  <span
                    class="sb889-group-swatch"
                    style="background:${groupColorMap.get(g) ?? "#999"};">
                  </span>
                  <span>${g}</span>
                </div>
              `
            )}
          </div>`
        : html`<div class="sb889-legend-empty">No group metadata visible in this window.</div>`
    }

    <div class="sb889-legend-overlay-sub">Relationship styles</div>
    ${
      visibleRelItems.length
        ? html`<div class="sb889-rel-list">
            ${visibleRelItems.map(
              (item) => html`
                <div class="sb889-rel-item">
                  <svg width="36" height="10" aria-hidden="true">
                    <line
                      x1="0" x2="34" y1="5" y2="5"
                      stroke="${item.stroke}"
                      stroke-width="2.4"
                      stroke-dasharray="${item.dash}">
                    </line>
                  </svg>
                  <span>${item.label}</span>
                </div>
              `
            )}
          </div>`
        : html`<div class="sb889-legend-empty">No relationship metadata visible in this window.</div>`
    }
  </div>
  `;
}


function _infoPanelNode(html){return(
html`
<div class="sb889-legend-card sb889-detail-card">
  <div class="sb889-legend-title">Scene details</div>

  <div class="sb889-info-head"
       style="font-size:18px; font-weight:700; color:#1f2937; line-height:1.3;">
    Click a session, dot, or character
  </div>

  <div class="sb889-info-meta"
       style="margin-top:8px; font-size:13px; color:#475569; line-height:1.4;"></div>

  <div class="sb889-info-chars"
       style="margin-top:8px; font-size:13px; color:#334155; line-height:1.45;"></div>

  <div class="sb889-info-summary"
       style="margin-top:12px; font-size:14px; line-height:1.55; color:#111827; white-space:pre-wrap;"></div>

  <div class="sb889-info-note"
       style="margin-top:10px; font-size:13px; line-height:1.5; color:#1d4ed8; white-space:pre-wrap;"></div>

  <div class="sb889-info-evidence"
       style="margin-top:10px; font-size:13px; line-height:1.5; color:#374151; white-space:pre-wrap;"></div>

  <div class="sb889-info-tags"
       style="margin-top:12px; display:flex; flex-wrap:wrap; gap:6px;"></div>
</div>
`
)}

function _instructionsPanel(html){return(
html`
<style>
  .sb889-instructions{
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    background: #f8fafc;
    border: 1px solid #dbe4ee;
    border-radius: 12px;
    padding: 10px 14px;
    color: #1f2937;
    line-height: 1.5;
  }

  .sb889-instructions summary{
    cursor: pointer;
    font-weight: 700;
    color: #111827;
    outline: none;
  }

  .sb889-instructions summary::-webkit-details-marker{
    margin-right: 6px;
  }

  .sb889-instructions-body{
    margin-top: 10px;
    font-size: 14px;
    color: #334155;
  }

  .sb889-instructions-body h5{
    margin: 12px 0 6px 0;
    font-size: 13px;
    color: #111827;
  }

  .sb889-instructions-body p{
    margin: 6px 0;
  }

  .sb889-instructions-body ul{
    margin: 6px 0 10px 20px;
    padding: 0;
  }

  .sb889-instructions-body li{
    margin: 4px 0;
  }

  .sb889-kbd{
    display: inline-block;
    padding: 1px 7px;
    border-radius: 999px;
    border: 1px solid #cbd5e1;
    background: #e2e8f0;
    color: #0f172a;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }
</style>

<details class="sb889-instructions" open>
  <summary>How to use this visualization</summary>

  <div class="sb889-instructions-body">
    <h5>Navigation</h5>
    <ul>
      <li>Use <span class="sb889-kbd">Jump to beat</span> to move directly to a major story beat.</li>
      <li>Use <span class="sb889-kbd">Previous beat</span> and <span class="sb889-kbd">Next beat</span> to step through the movie sequence.</li>
    </ul>

    <h5>Main visual encodings</h5>
    <ul>
      <li><strong>Colored lines</strong> represent characters across beats.</li>
      <li><strong>Rounded vertical bands</strong> represent interaction sessions.</li>
      <li><strong>Multiple bands aligned at the same x-position</strong> indicate concurrent interactions happening at the same story moment.</li>
      <li>The <strong>Legend</strong> explains group/faction colors and relationship line styles.</li>
    </ul>

    <h5>Interaction</h5>
    <ul>
      <li>Click a <strong>band</strong> to see the session title, summary, characters, and other details.</li>
      <li>Click a <strong>dot</strong> or a <strong>character line</strong> to inspect that character’s role in the selected scene.</li>
      <li>Use the <strong>Scene details</strong> panel below the chart to read the current selection.</li>
    </ul>

    <h5>What this prototype is showing</h5>
    <p>
      This version focuses on the final-act structure of <em>Inception</em>, especially layered and concurrent interactions across dream levels.
    </p>
  </div>
</details>
`
)}

function _setSideInfo(infoPanelNode){return(
({
  title = "",
  metaLine = "",
  characters = [],
  summary = "",
  note = "",
  evidenceLabel = "",
  evidence = "",
  tags = []
} = {}) => {
  infoPanelNode.querySelector(".sb889-info-head").textContent =
    title || "Scene details";

  infoPanelNode.querySelector(".sb889-info-meta").textContent =
    metaLine || "";

  infoPanelNode.querySelector(".sb889-info-chars").textContent =
    characters.length ? `Characters present: ${characters.join(", ")}` : "";

  infoPanelNode.querySelector(".sb889-info-summary").textContent =
    summary || "";

  infoPanelNode.querySelector(".sb889-info-note").textContent =
    note ? `Note: ${note}` : "";

  infoPanelNode.querySelector(".sb889-info-evidence").textContent =
    evidence
      ? `${evidenceLabel || "Evidence"}: ${evidence}`
      : "";

  const tagsEl = infoPanelNode.querySelector(".sb889-info-tags");
  tagsEl.innerHTML = "";
  for (const tag of tags) {
    const chip = document.createElement("span");
    chip.textContent = tag;
    chip.style.cssText = `
      font-size:11px;
      padding:2px 8px;
      border-radius:999px;
      background:#eef2f7;
      color:#4b5563;
      border:1px solid #d7dee8;
    `;
    tagsEl.appendChild(chip);
  }
}
)}

function _sidePanel(legendPanel){return(
legendPanel
)}

function _dashboard(width,rightMargin,html,controlsBar,instructionsPanel,currentChapterLabel,render,legendPanel,infoPanelNode)
{
  const plotRight = width - rightMargin;
  const legendGap = 28;
  const legendOverlayWidth = 230;
  const legendLeft = Math.min(
    plotRight + legendGap,
    width - legendOverlayWidth - 16
  );

  return html`
  <style>
    .sb889-dashboard{
      display:grid;
      gap:12px;
      width:100%;
      max-width:100%;
      min-width:0;
    }

    .sb889-controls-wrap{
      width:min(100%, 980px);
      max-width:100%;
      min-width:0;
    }

    .sb889-chart-wrap{
      min-width:0;
      max-width:100%;
      overflow-x:auto;
      overflow-y:visible;
    }

    .sb889-chart-stage{
      position:relative;
      width:${width}px;
      min-width:${width}px;
    }

    .sb889-chart-stage svg{
      display:block;
    }

    .sb889-legend-overlay{
      position:absolute;
      top:20px;
      left:${legendLeft}px;
      width:${legendOverlayWidth}px;
      max-width:${legendOverlayWidth}px;
      z-index:8;
      pointer-events:auto;
    }

    .sb889-detail-wrap{
      width:min(100%, ${width}px);
      max-width:100%;
    }

    @media (max-width: 1100px){
      .sb889-legend-overlay{
        position:static;
        width:auto;
        max-width:none;
        margin-top:12px;
      }

      .sb889-chart-stage{
        width:max-content;
        min-width:100%;
      }
    }
  </style>

  <div class="sb889-dashboard">
    <div class="sb889-controls-wrap">
      ${controlsBar}
    </div>

<div>
    ${instructionsPanel}
  </div>

    <div>${currentChapterLabel}</div>

    <div class="sb889-chart-wrap">
      <div class="sb889-chart-stage">
        ${render}
        <div class="sb889-legend-overlay">
          ${legendPanel}
        </div>
      </div>
    </div>

    <div class="sb889-detail-wrap">
      ${infoPanelNode}
    </div>
  </div>
  `;
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["Inception dataset.json", {url: new URL("./files/98d2d4f18ae0207e87dcca1270cf7016c70006a5913e49cc9be3cec10a87142a230eedf13c03c91adcbefe3e0f90694eec2612cfe177feaa4fa60ee73edbd3c2.json", import.meta.url), mimeType: "application/json", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("sourceData")).define("sourceData", ["FileAttachment"], _sourceData);
  main.variable(observer("chapterData")).define("chapterData", ["sourceData"], _chapterData);
  main.variable(observer("storyData")).define("storyData", ["sourceData"], _storyData);
  main.variable(observer("data")).define("data", ["chapterData"], _data);
  main.variable(observer("maxChapter")).define("maxChapter", ["d3","data"], _maxChapter);
  main.variable(observer("chapters")).define("chapters", ["chapterData"], _chapters);
  main.variable(observer("charactersList")).define("charactersList", ["chapterData","storyData","d3"], _charactersList);
  main.variable(observer("characterLaneOrder")).define("characterLaneOrder", _characterLaneOrder);
  main.variable(observer("laneScore")).define("laneScore", ["characterLaneOrder"], _laneScore);
  main.variable(observer("preferredTrackY")).define("preferredTrackY", ["d3","yScale","laneScore"], _preferredTrackY);
  main.variable(observer("chapterSceneMetaBySessionKey")).define("chapterSceneMetaBySessionKey", ["chapterData"], _chapterSceneMetaBySessionKey);
  main.variable(observer("chapterSceneMetaBySceneKey")).define("chapterSceneMetaBySceneKey", ["chapterData"], _chapterSceneMetaBySceneKey);
  main.variable(observer("storySceneMetaBySessionKey")).define("storySceneMetaBySessionKey", ["storyData"], _storySceneMetaBySessionKey);
  main.variable(observer("storySceneMetaBySceneKey")).define("storySceneMetaBySceneKey", ["storyData"], _storySceneMetaBySceneKey);
  main.variable(observer("emptySceneMeta")).define("emptySceneMeta", _emptySceneMeta);
  main.variable(observer("finished")).define("finished", _finished);
  main.variable(observer("timelineWanted")).define("timelineWanted", _timelineWanted);
  main.variable(observer("timelineMode")).define("timelineMode", _timelineMode);
  main.variable(observer("sceneMeta")).define("sceneMeta", ["timelineMode","storySceneMetaBySessionKey","chapterSceneMetaBySessionKey","storySceneMetaBySceneKey","chapterSceneMetaBySceneKey","emptySceneMeta"], _sceneMeta);
  main.variable(observer("detailText")).define("detailText", _detailText);
  main.variable(observer("formatDetailDate")).define("formatDetailDate", _formatDetailDate);
  main.variable(observer("stripLocationPrefix")).define("stripLocationPrefix", _stripLocationPrefix);
  main.variable(observer("formatRelationshipEvidence")).define("formatRelationshipEvidence", _formatRelationshipEvidence);
  main.variable(observer("buildSceneDetail")).define("buildSceneDetail", ["sceneMeta","timelineMode","formatStoryDateLabel","formatDetailDate","stripLocationPrefix","formatRelationshipEvidence"], _buildSceneDetail);
  main.variable(observer("viewof windowSize")).define("viewof windowSize", ["Inputs"], _windowSize);
  main.variable(observer("windowSize")).define("windowSize", ["Generators", "viewof windowSize"], (G, _) => G.input(_));
  main.variable(observer("width")).define("width", _width);
  main.variable(observer("rowHeight")).define("rowHeight", _rowHeight);
  main.variable(observer("topMargin")).define("topMargin", _topMargin);
  main.variable(observer("bottomMargin")).define("bottomMargin", _bottomMargin);
  main.variable(observer("leftMargin")).define("leftMargin", _leftMargin);
  main.variable(observer("rightMargin")).define("rightMargin", _rightMargin);
  main.variable(observer("height")).define("height", _height);
  main.variable(observer("sceneJitter")).define("sceneJitter", _sceneJitter);
  main.variable(observer("sceneBend")).define("sceneBend", _sceneBend);
  main.variable(observer("sceneMaxChars")).define("sceneMaxChars", _sceneMaxChars);
  main.variable(observer("transitionMs")).define("transitionMs", _transitionMs);
  main.variable(observer("xScale")).define("xScale", ["d3","maxChapter","leftMargin","width","rightMargin"], _xScale);
  main.variable(observer("yScale")).define("yScale", ["d3","charactersList","topMargin","height","bottomMargin"], _yScale);
  main.variable(observer("characterBaseColor")).define("characterBaseColor", ["d3","charactersList"], _characterBaseColor);
  main.variable(observer("groupColorMap")).define("groupColorMap", _groupColorMap);
  main.variable(observer("groupPalette")).define("groupPalette", ["d3","groupColorMap"], _groupPalette);
  main.variable(observer("groupAlias")).define("groupAlias", _groupAlias);
  main.variable(observer("displayGroupPriority")).define("displayGroupPriority", _displayGroupPriority);
  main.variable(observer("normalizeGroup")).define("normalizeGroup", ["groupAlias"], _normalizeGroup);
  main.variable(observer("pickDisplayGroup")).define("pickDisplayGroup", ["normalizeGroup","displayGroupPriority","groupColorMap"], _pickDisplayGroup);
  main.variable(observer("groupForSceneChar")).define("groupForSceneChar", ["sceneMeta","pickDisplayGroup"], _groupForSceneChar);
  main.variable(observer("colorForSceneChar")).define("colorForSceneChar", ["groupForSceneChar","groupColorMap","groupPalette"], _colorForSceneChar);
  main.variable(observer("dominantGroupByCharacter")).define("dominantGroupByCharacter", ["chapterData","groupForSceneChar"], _dominantGroupByCharacter);
  main.variable(observer("lineColorForCharacter")).define("lineColorForCharacter", ["dominantGroupByCharacter","groupColorMap","groupPalette"], _lineColorForCharacter);
  main.variable(observer("relationshipStroke")).define("relationshipStroke", _relationshipStroke);
  main.variable(observer("relationshipLegendItems")).define("relationshipLegendItems", ["relationshipStyle"], _relationshipLegendItems);
  main.variable(observer("visibleScenesForLegend")).define("visibleScenesForLegend", ["currentChapter","windowSize","data","d3","sceneStep"], _visibleScenesForLegend);
  main.variable(observer("visibleLegendMeta")).define("visibleLegendMeta", ["visibleScenesForLegend","timelineMode","storyOrder","groupForSceneChar","groupColorMap","sceneMeta","relationshipFamily","d3"], _visibleLegendMeta);
  main.variable(observer("relationshipFamily")).define("relationshipFamily", _relationshipFamily);
  main.variable(observer("relationshipStyle")).define("relationshipStyle", _relationshipStyle);
  main.variable(observer("dominantSessionRelationshipFamily")).define("dominantSessionRelationshipFamily", ["sceneMeta","d3","relationshipFamily"], _dominantSessionRelationshipFamily);
  main.variable(observer("motivationBySceneChar")).define("motivationBySceneChar", ["chapterData","storyData"], _motivationBySceneChar);
  main.variable(observer("maxStoryUnit")).define("maxStoryUnit", ["maxChapter"], _maxStoryUnit);
  main.variable(observer("spoilerMaxUnit")).define("spoilerMaxUnit", _spoilerMaxUnit);
  main.variable(observer("maxAllowedUnit")).define("maxAllowedUnit", ["maxChapter"], _maxAllowedUnit);
  main.define("initial currentUnit", _currentUnit);
  main.variable(observer("mutable currentUnit")).define("mutable currentUnit", ["Mutable", "initial currentUnit"], (M, _) => new M(_));
  main.variable(observer("currentUnit")).define("currentUnit", ["mutable currentUnit"], _ => _.generator);
  main.variable(observer("viewof currentChapter")).define("viewof currentChapter", ["Inputs","maxAllowedUnit","mutable currentUnit","timelineMode"], _currentChapter);
  main.variable(observer("currentChapter")).define("currentChapter", ["Generators", "viewof currentChapter"], (G, _) => G.input(_));
  main.variable(observer("currentUnitSync")).define("currentUnitSync", ["mutable currentUnit","currentChapter","maxAllowedUnit"], _currentUnitSync);
  main.variable(observer("dataForStep")).define("dataForStep", ["timelineMode","storyData","storyOrder","chapterData"], _dataForStep);
  main.variable(observer("viewof sceneStep")).define("viewof sceneStep", ["dataForStep","currentChapter","d3","Inputs"], _sceneStep);
  main.variable(observer("sceneStep")).define("sceneStep", ["Generators", "viewof sceneStep"], (G, _) => G.input(_));
  main.variable(observer("chapterMeta")).define("chapterMeta", ["d3","data"], _chapterMeta);
  main.variable(observer("chapterIndex")).define("chapterIndex", ["d3","data","maxChapter"], _chapterIndex);
  main.variable(observer("monthName")).define("monthName", _monthName);
  main.variable(observer("formatStoryDateLabel")).define("formatStoryDateLabel", ["monthName"], _formatStoryDateLabel);
  main.variable(observer("chapterJumpOptions")).define("chapterJumpOptions", ["d3","chapterData"], _chapterJumpOptions);
  main.variable(observer("viewof jumpToChapter")).define("viewof jumpToChapter", ["Inputs","chapterJumpOptions"], _jumpToChapter);
  main.variable(observer("jumpToChapter")).define("jumpToChapter", ["Generators", "viewof jumpToChapter"], (G, _) => G.input(_));
  main.variable(observer("currentBeatIndex")).define("currentBeatIndex", ["chapterJumpOptions","currentChapter"], _currentBeatIndex);
  main.variable(observer("prevBeat")).define("prevBeat", ["currentBeatIndex","chapterJumpOptions"], _prevBeat);
  main.variable(observer("nextBeat")).define("nextBeat", ["currentBeatIndex","chapterJumpOptions"], _nextBeat);
  main.variable(observer("goToBeat")).define("goToBeat", ["viewof currentChapter","Event"], _goToBeat);
  main.variable(observer("makeBeatNavButton")).define("makeBeatNavButton", ["html","goToBeat"], _makeBeatNavButton);
  main.variable(observer("chapterJumpReset")).define("chapterJumpReset", ["mutable lastHandledChapterJump","jumpToChapter"], _chapterJumpReset);
  main.define("initial lastHandledChapterJump", _lastHandledChapterJump);
  main.variable(observer("mutable lastHandledChapterJump")).define("mutable lastHandledChapterJump", ["Mutable", "initial lastHandledChapterJump"], (M, _) => new M(_));
  main.variable(observer("lastHandledChapterJump")).define("lastHandledChapterJump", ["mutable lastHandledChapterJump"], _ => _.generator);
  main.variable(observer("jumpToChapterEffect")).define("jumpToChapterEffect", ["timelineMode","jumpToChapter","mutable lastHandledChapterJump","viewof currentChapter","Event"], _jumpToChapterEffect);
  main.variable(observer("povEnabled")).define("povEnabled", ["timelineMode"], _povEnabled);
  main.define("initial pendingPovStep", _pendingPovStep);
  main.variable(observer("mutable pendingPovStep")).define("mutable pendingPovStep", ["Mutable", "initial pendingPovStep"], (M, _) => new M(_));
  main.variable(observer("pendingPovStep")).define("pendingPovStep", ["mutable pendingPovStep"], _ => _.generator);
  main.variable(observer("goToPovStop")).define("goToPovStop", ["povEnabled","mutable pendingPovStep","viewof currentChapter","Event","viewof sceneStep"], _goToPovStop);
  main.define("initial lastHandledPovJump", _lastHandledPovJump);
  main.variable(observer("mutable lastHandledPovJump")).define("mutable lastHandledPovJump", ["Mutable", "initial lastHandledPovJump"], (M, _) => new M(_));
  main.variable(observer("lastHandledPovJump")).define("lastHandledPovJump", ["mutable lastHandledPovJump"], _ => _.generator);
  main.variable(observer("jumpToPovEffect")).define("jumpToPovEffect", ["povEnabled","jumpToPov","mutable lastHandledPovJump","goToPovStop"], _jumpToPovEffect);
  main.variable(observer("debugPovChapterState")).define("debugPovChapterState", ["Inputs","povCharacter","jumpToPov","timelineMode","currentChapter","sceneStep"], _debugPovChapterState);
  main.variable(observer("debugGoToPov")).define("debugGoToPov", ["Inputs","currentChapter","sceneStep","jumpToPov"], _debugGoToPov);
  main.variable(observer("povCounts")).define("povCounts", ["chapterData","sceneMeta"], _povCounts);
  main.variable(observer("majorPovCharacters")).define("majorPovCharacters", ["povCounts","d3"], _majorPovCharacters);
  main.variable(observer("sceneOrderWithinChapter")).define("sceneOrderWithinChapter", ["d3","chapterData"], _sceneOrderWithinChapter);
  main.variable(observer("povStopsAll")).define("povStopsAll", ["chapterData","sceneMeta","sceneOrderWithinChapter","storyOrder","d3"], _povStopsAll);
  main.define("initial selectedSceneDetail", _selectedSceneDetail);
  main.variable(observer("mutable selectedSceneDetail")).define("mutable selectedSceneDetail", ["Mutable", "initial selectedSceneDetail"], (M, _) => new M(_));
  main.variable(observer("selectedSceneDetail")).define("selectedSceneDetail", ["mutable selectedSceneDetail"], _ => _.generator);
  main.variable(observer("selectedSceneDetailRender")).define("selectedSceneDetailRender", ["selectedSceneDetail","setSideInfo"], _selectedSceneDetailRender);
  main.variable(observer("spoilerMaxChapter")).define("spoilerMaxChapter", _spoilerMaxChapter);
  main.variable(observer("storyOrder")).define("storyOrder", ["chapterData","d3"], _storyOrder);
  main.variable(observer("tickLabelByBeat")).define("tickLabelByBeat", _tickLabelByBeat);
  main.variable(observer("chart")).define("chart", ["d3","width","height","storyOrder","data","tickLabelByBeat","leftMargin","bottomMargin","topMargin","rightMargin","motivationBySceneChar","windowSize","yScale","charactersList","laneScore","transitionMs","formatStoryDateLabel","sceneMaxChars","colorForSceneChar","sceneBend","dominantSessionRelationshipFamily","relationshipStroke","relationshipStyle","mutable selectedSceneDetail","buildSceneDetail"], _chart);
  main.variable(observer("render")).define("render", ["chart","currentChapter","sceneStep","timelineMode","spoilerMaxChapter","transitionMs"], _render);
  main.variable(observer("currentChapterLabel")).define("currentChapterLabel", ["d3","chapterData","currentChapter"], _currentChapterLabel);
  main.variable(observer("viewof povCharacter")).define("viewof povCharacter", ["Inputs","majorPovCharacters"], _povCharacter);
  main.variable(observer("povCharacter")).define("povCharacter", ["Generators", "viewof povCharacter"], (G, _) => G.input(_));
  main.variable(observer("povCharacterReset")).define("povCharacterReset", ["mutable lastHandledPovJump","povCharacter"], _povCharacterReset);
  main.variable(observer("povStopsVisible")).define("povStopsVisible", ["povEnabled","povStopsAll","povCharacter","finished","spoilerMaxChapter"], _povStopsVisible);
  main.variable(observer("formatPovStop")).define("formatPovStop", _formatPovStop);
  main.variable(observer("viewof jumpToPov")).define("viewof jumpToPov", ["Inputs","povStopsVisible","formatPovStop"], _jumpToPov);
  main.variable(observer("jumpToPov")).define("jumpToPov", ["Generators", "viewof jumpToPov"], (G, _) => G.input(_));
  main.variable(observer("prevPovStop")).define("prevPovStop", ["povEnabled","povStopsVisible","currentChapter","sceneStep"], _prevPovStop);
  main.variable(observer("nextPovStop")).define("nextPovStop", ["povEnabled","povStopsVisible","currentChapter","sceneStep"], _nextPovStop);
  main.variable(observer("makePovNavButton")).define("makePovNavButton", ["html","povEnabled","goToPovStop"], _makePovNavButton);
  main.variable(observer()).define(["Inputs","currentChapter","mutable currentUnit","jumpToChapter","jumpToPov","mutable lastHandledChapterJump","mutable lastHandledPovJump","prevPovStop","nextPovStop"], _109);
  main.variable(observer("debugSelectedSceneDetail")).define("debugSelectedSceneDetail", ["Inputs","selectedSceneDetail"], _debugSelectedSceneDetail);
  main.variable(observer("controlsBar")).define("controlsBar", ["html","viewof jumpToChapter","makeBeatNavButton","prevBeat","nextBeat"], _controlsBar);
  main.variable(observer("legendPanel")).define("legendPanel", ["visibleLegendMeta","relationshipLegendItems","html","groupColorMap"], _legendPanel);
  main.variable(observer("infoPanelNode")).define("infoPanelNode", ["html"], _infoPanelNode);
  main.variable(observer("instructionsPanel")).define("instructionsPanel", ["html"], _instructionsPanel);
  main.variable(observer("setSideInfo")).define("setSideInfo", ["infoPanelNode"], _setSideInfo);
  main.variable(observer("sidePanel")).define("sidePanel", ["legendPanel"], _sidePanel);
  main.variable(observer("dashboard")).define("dashboard", ["width","rightMargin","html","controlsBar","instructionsPanel","currentChapterLabel","render","legendPanel","infoPanelNode"], _dashboard);
  return main;
}
