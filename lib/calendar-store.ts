import fs from 'fs'
import path from 'path'

export type StoredInviteMeta = {
  uid: string
  dtstart: string
  dtend: string
  sequence: number
  organizerLine: string
}

const STORE_DIR = path.resolve(process.cwd(), 'data')
const STORE_PATH = path.join(STORE_DIR, 'calendar-store.json')

function ensureStore() {
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true })
  if (!fs.existsSync(STORE_PATH)) fs.writeFileSync(STORE_PATH, JSON.stringify({}), 'utf8')
}

export function readStore(): Record<string, StoredInviteMeta> {
  ensureStore()
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function writeStore(data: Record<string, StoredInviteMeta>): void {
  ensureStore()
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8')
}

export function saveInviteMeta(meta: StoredInviteMeta): void {
  const store = readStore()
  store[meta.uid] = meta
  writeStore(store)
}

export function getInviteMeta(uid: string): StoredInviteMeta | undefined {
  const store = readStore()
  return store[uid]
}

export function extractMetaFromICS(icsContent: string): StoredInviteMeta | null {
  // Ensure CRLF for consistent regex across lines
  const ics = icsContent.replace(/\r?\n/g, '\r\n')
  const get = (key: string) => {
    const m = ics.match(new RegExp(`^${key}:(.*)$`, 'm'))
    return m ? m[1].trim() : null
  }
  const getLine = (key: string) => {
    const m = ics.match(new RegExp(`^${key}[^\r\n]*$`, 'm'))
    return m ? m[0].trim() : null
  }
  const uid = get('UID')
  const dtstart = get('DTSTART')
  const dtend = get('DTEND')
  const seqStr = get('SEQUENCE')
  const organizerLine = getLine('ORGANIZER')
  if (!uid || !dtstart || !dtend || !organizerLine) return null
  const sequence = seqStr ? parseInt(seqStr, 10) : 0
  return { uid, dtstart, dtend, sequence, organizerLine }
}


