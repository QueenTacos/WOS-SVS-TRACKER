
// ─── CYCLE LOGIC ──────────────────────────────────────────────────────────────
// ── CYCLE DATES — dynamic, editable by admin ────────────────────────────────
export const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export const DEFAULT_DATES = {
  c1_baseline_start: "2026-06-20T00:00:00",
  c1_baseline_end:   "2026-07-09T23:59:59",
  c1_final_start:    "2026-07-10T00:00:00",
  c1_final_end:      "2026-07-12T23:50:00", 
  c1_prep_end:       "2026-07-17T23:59:59",
  c2_start:          "2026-07-18T00:00:00",
  c2_end:            "2026-08-09T23:59:59",
  c2_prep_end:       "2026-08-14T23:59:59",
};

export let CYCLE_DATES = {...DEFAULT_DATES};
export function setCycleDates(next){ CYCLE_DATES = next; }

export function getPhaseFromDates(d){
  const now = new Date();
  if(now > new Date(d.c2_end) && now <= new Date(d.c2_prep_end))         return {phase:"locked",    label:"Prep Week — Locked",       cycle:2, until:new Date(d.c2_prep_end)};
  if(now >= new Date(d.c2_start) && now <= new Date(d.c2_end))           return {phase:"c2_open",   label:"Cycle 2 Open",             cycle:2, until:new Date(d.c2_end)};
  if(now > new Date(d.c1_final_end) && now <= new Date(d.c1_prep_end))   return {phase:"locked",    label:"SVS Prep Week — Locked",   cycle:1, until:new Date(d.c1_prep_end)};
  if(now >= new Date(d.c1_final_start) && now <= new Date(d.c1_final_end)) return {phase:"c1_final",label:"Final Bag Window Open",    cycle:1, until:new Date(d.c1_final_end)};
  if(now >= new Date(d.c1_baseline_start) && now <= new Date(d.c1_baseline_end)) return {phase:"c1_open",label:"Bag Submissions Open",cycle:1, until:new Date(d.c1_baseline_end)};
  if(now < new Date(d.c1_baseline_start)) return {phase:"upcoming", label:`Opens ${new Date(d.c1_baseline_start).toLocaleDateString("en-US",{month:"short",day:"numeric"})}`, cycle:0, until:new Date(d.c1_baseline_start)};
  return {phase:"closed", label:"Season Complete", cycle:99};
}

export function getPhase(){ return getPhaseFromDates(CYCLE_DATES); }

// Per-player state within a phase
// Returns one of: "no_account" | "submit_initial" | "edit_initial" | "vanity" |
//                 "prompt_final" | "submit_final" | "edit_final" | "final_locked" | "locked"

export function getPlayerSubmitState(entry, phase){
  if(!entry) return (phase.phase==="c1_open"||phase.phase==="c1_final"||phase.phase==="c2_open") ? "submit_initial" : "locked";
  const now = Date.now();
  // Use cycle1_firstAt as the initial baseline timestamp (set in handleSubmit)
  const initialFirstAt = entry.cycle1_firstAt || entry.initialFirstAt;
  const initialLocked  = initialFirstAt && (now - initialFirstAt) >= THREE_DAYS_MS;
  const finalFirstAt   = entry.cycle1_finalFirstAt || entry.finalFirstAt;
  const finalLocked    = finalFirstAt && (now - finalFirstAt) >= THREE_DAYS_MS;

  if(phase.phase==="c1_open"){
    if(!initialFirstAt) return "submit_initial";
    if(!initialLocked)  return "edit_initial";
    return "vanity";
  }
  if(phase.phase==="c1_final"){
    if(!initialFirstAt) return "submit_initial";
    if(!finalFirstAt)   return "prompt_final";
    if(!finalLocked)    return "edit_final";
    return "final_locked";
  }
  if(phase.phase==="c2_open"){
    if(!entry.c2_firstAt) return "submit_initial";
    if((now - entry.c2_firstAt) < THREE_DAYS_MS) return "edit_initial";
    return "vanity";
  }
  return "locked";
}
