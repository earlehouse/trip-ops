type GuestRow = {
  name: string
  phone_number: string | null
  arrival_date: string | null
  arrival_time: string | null
  departure_date: string | null
  departure_time: string | null
  hotel_confirmation: string | null
  marriott_loyalty: string | null
  hilton_loyalty: string | null
}

const HEADER_MAP: Record<string, keyof GuestRow> = {
  'name': 'name',
  'phone': 'phone_number',
  'phone number': 'phone_number',
  'arrival date': 'arrival_date',
  'arrival time': 'arrival_time',
  'departure date': 'departure_date',
  'departure time': 'departure_time',
  'hotel conf': 'hotel_confirmation',
  'hotel confirmation': 'hotel_confirmation',
  'marriott #': 'marriott_loyalty',
  'marriott loyalty': 'marriott_loyalty',
  'bonvoy #': 'marriott_loyalty',
  'hilton #': 'hilton_loyalty',
  'hilton honors': 'hilton_loyalty',
  'hilton loyalty': 'hilton_loyalty',
}

function parseDate(raw: string, fallbackYear: number): string | null {
  const s = raw.trim()
  if (!s) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2,'0')}-${mdy[2].padStart(2,'0')}`

  const months: Record<string, string> = {
    jan:'01', feb:'02', mar:'03', apr:'04', may:'05', jun:'06',
    jul:'07', aug:'08', sep:'09', oct:'10', nov:'11', dec:'12',
  }
  const named = s.match(/^([A-Za-z]+)\.?\s+(\d{1,2}),?\s*(\d{4})?$/)
  if (named) {
    const mon = months[named[1].toLowerCase().slice(0,3)]
    if (mon) {
      const year = named[3] ?? String(fallbackYear)
      return `${year}-${mon}-${named[2].padStart(2,'0')}`
    }
  }
  return null
}

function parseTime(raw: string): string | null {
  const s = raw.trim()
  if (!s) return null
  if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s

  const hm = s.match(/^(\d{1,2}):(\d{2})$/)
  if (hm) return `${hm[1].padStart(2,'0')}:${hm[2]}:00`

  const ampm = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i)
  if (ampm) {
    let h = parseInt(ampm[1])
    const m = ampm[2]
    const period = ampm[3].toLowerCase()
    if (period === 'pm' && h !== 12) h += 12
    if (period === 'am' && h === 12) h = 0
    return `${String(h).padStart(2,'0')}:${m}:00`
  }
  return null
}

function clean(s: string): string {
  return s.replace(/ /g, ' ').trim()
}

export function parseCanvasText(text: string, tripYear: number): GuestRow[] {
  const lines = text.split(/\r?\n/).map(l => l.split('\t').map(clean))

  let headerIdx = -1
  let colMap: Array<keyof GuestRow | null> = []

  for (let i = 0; i < lines.length; i++) {
    const cells = lines[i].map(c => c.toLowerCase())
    if (cells.some(c => c === 'name')) {
      headerIdx = i
      colMap = cells.map(c => HEADER_MAP[c] ?? null)
      break
    }
  }

  if (headerIdx === -1) return []

  const rows: GuestRow[] = []

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cells = lines[i]
    if (cells.every(c => !c)) continue

    const row: Partial<GuestRow> = {}
    colMap.forEach((field, ci) => {
      if (!field) return
      const val = cells[ci] ?? ''
      if (!val) return

      if (field === 'arrival_date' || field === 'departure_date') {
        row[field] = parseDate(val, tripYear)
      } else if (field === 'arrival_time' || field === 'departure_time') {
        row[field] = parseTime(val)
      } else {
        row[field] = val || undefined
      }
    })

    if (!row.name) continue
    rows.push({
      name: row.name,
      phone_number: row.phone_number ?? null,
      arrival_date: row.arrival_date ?? null,
      arrival_time: row.arrival_time ?? null,
      departure_date: row.departure_date ?? null,
      departure_time: row.departure_time ?? null,
      hotel_confirmation: row.hotel_confirmation ?? null,
      marriott_loyalty: row.marriott_loyalty ?? null,
      hilton_loyalty: row.hilton_loyalty ?? null,
    })
  }

  return rows
}
