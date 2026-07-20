import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ycwccokhigpihpjpkhpo.supabase.co'
const SUPABASE_KEY = 'sb_publishable_zMtdkJcQQZZoHn4f3eqnJA_nKYva0dM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── ENTRIES ──────────────────────────────────────────────────────────────────
export async function getAllEntries() {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data.map(dbToEntry)
}

export async function getEntry(id) {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return dbToEntry(data)
}

export async function upsertEntry(entry) {
  const { error } = await supabase
    .from('entries')
    .upsert(entryToDb(entry), { onConflict: 'id' })
  if (error) throw error
}

export async function deleteEntry(id) {
  const { error } = await supabase.from('entries').delete().eq('id', id)
  if (error) throw error
}

// ── ADMINS ───────────────────────────────────────────────────────────────────
export async function getAdmins() {
  const { data, error } = await supabase.from('admins').select('*')
  if (error) return []
  return data
}

export async function addAdmin(email, passHash) {
  const { error } = await supabase.from('admins').insert({ email, pass_hash: passHash })
  if (error) throw error
}

export async function removeAdmin(email) {
  const { error } = await supabase.from('admins').delete().eq('email', email)
  if (error) throw error
}

export async function findAdmin(email, passHash) {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('pass_hash', passHash)
    .single()
  if (error) return null
  return data
}

// ── CONVERTERS ───────────────────────────────────────────────────────────────
function dbToEntry(row) {
  return {
    id: row.id,
    playerName: row.player_name,
    gamerId: row.gamer_id,
    allianceTag: row.alliance_tag,
    pinHash: row.pin_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    cycle1_firstBag: row.cycle1_first_bag,
    cycle1_firstAt: row.cycle1_first_at,
    cycle1_latestBag: row.cycle1_latest_bag,
    cycle1_latestAt: row.cycle1_latest_at,
    cycle1_finalLatestBag: row.cycle1_final_latest_bag,
    cycle1_finalLatestAt: row.cycle1_final_latest_at,
    cycle1_finalFirstAt: row.cycle1_final_first_at,
    latestScreenshot: row.latest_screenshot,
    cycle1_firstScreenshot: row.cycle1_first_screenshot,
  }
}

function entryToDb(e) {
  return {
    id: e.id,
    player_name: e.playerName,
    gamer_id: e.gamerId,
    alliance_tag: e.allianceTag,
    pin_hash: e.pinHash,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
    cycle1_first_bag: e.cycle1_firstBag || null,
    cycle1_first_at: e.cycle1_firstAt || null,
    cycle1_latest_bag: e.cycle1_latestBag || null,
    cycle1_latest_at: e.cycle1_latestAt || null,
    cycle1_final_latest_bag: e.cycle1_finalLatestBag || null,
    cycle1_final_latest_at: e.cycle1_finalLatestAt || null,
    cycle1_final_first_at: e.cycle1_finalFirstAt || null,
    latest_screenshot: e.latestScreenshot || null,
    cycle1_first_screenshot: e.cycle1_firstScreenshot || null,
  }
}

// ── SETTINGS (cycle dates) ───────────────────────────────────────────────────
export async function getSettings() {
  const { data, error } = await supabase.from('settings').select('*').eq('id', 'cycle_dates').single()
  if (error) return null
  return data.value
}

export async function saveSettings(value) {
  const { error } = await supabase.from('settings').upsert({ id: 'cycle_dates', value }, { onConflict: 'id' })
  if (error) throw error
}

// ── CYCLES ───────────────────────────────────────────────────────────────────
export async function getCycles() {
  const { data, error } = await supabase
    .from('cycles')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) return []
  return data
}

export async function upsertCycle(cycle) {
  const { error } = await supabase
    .from('cycles')
    .upsert(cycle, { onConflict: 'id' })
  if (error) throw error
}

export async function deleteCycle(id) {
  const { error } = await supabase.from('cycles').delete().eq('id', id)
  if (error) throw error
}

// ── SITE CONTENT ─────────────────────────────────────────────────────────────
export async function getSiteContent() {
  const { data, error } = await supabase.from('settings').select('*').eq('id', 'site_content').single()
  if (error) return null
  return data.value
}

export async function saveSiteContent(value) {
  const { error } = await supabase.from('settings').upsert({ id: 'site_content', value }, { onConflict: 'id' })
  if (error) throw error
}

// ── CYCLE ARCHIVE (past cycle results, snapshotted when a new cycle starts) ──
export async function archiveCycleResults(cycleLabel, entries) {
  const rows = entries
    .filter(e => e.cycle1_firstAt) // only archive players who actually participated
    .map(e => ({
      cycle_label: cycleLabel,
      entry_id: e.id,
      player_name: e.playerName,
      gamer_id: e.gamerId,
      alliance_tag: e.allianceTag,
      first_bag: e.cycle1_firstBag || null,
      first_at: e.cycle1_firstAt || null,
      latest_bag: e.cycle1_finalLatestBag || e.cycle1_latestBag || null,
      latest_at: e.cycle1_finalLatestAt || e.cycle1_latestAt || null,
      final_bag: e.cycle1_finalLatestBag || null,
      final_at: e.cycle1_finalLatestAt || null,
      screenshot: e.cycle1_firstScreenshot || null,
    }))
  if (rows.length === 0) return
  const { error } = await supabase.from('cycle_archive').insert(rows)
  if (error) throw error
}

export async function getCycleArchiveLabels() {
  const { data, error } = await supabase
    .from('cycle_archive')
    .select('cycle_label, archived_at')
    .order('archived_at', { ascending: false })
  if (error) return []
  const seen = new Set()
  const labels = []
  for (const row of data) {
    if (!seen.has(row.cycle_label)) { seen.add(row.cycle_label); labels.push(row) }
  }
  return labels
}

export async function getCycleArchiveResults(cycleLabel) {
  const { data, error } = await supabase
    .from('cycle_archive')
    .select('*')
    .eq('cycle_label', cycleLabel)
  if (error) return []
  return data
}

export async function resetEntryForNewCycle(entryId) {
  const { error } = await supabase
    .from('entries')
    .update({
      cycle1_first_bag: null,
      cycle1_first_at: null,
      cycle1_latest_bag: null,
      cycle1_latest_at: null,
      cycle1_final_latest_bag: null,
      cycle1_final_latest_at: null,
      cycle1_final_first_at: null,
      cycle1_first_screenshot: null,
      latest_screenshot: null,
    })
    .eq('id', entryId)
  if (error) throw error
}  
