type ICSEvent = {
  id: string
  title: string
  date: string
  start_time: string | null
  end_time: string | null
  venue: string | null
  notes: string | null
  teamNames?: string
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toICSDate(date: string, time: string | null): string {
  if (!time) return `${date.replace(/-/g, '')}`
  const [h, m, s] = time.split(':')
  return `${date.replace(/-/g, '')}T${pad(Number(h))}${pad(Number(m))}${pad(Number(s ?? 0))}`
}

function nextDay(date: string): string {
  const d = new Date(date + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
}

function addOneHour(date: string, time: string): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + 60
  return `${date.replace(/-/g, '')}T${pad(Math.floor(total / 60) % 24)}${pad(total % 60)}00`
}

function escapeICS(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function buildICS(tripName: string, events: ICSEvent[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Trip Ops//Trip Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICS(tripName)}`,
    'X-WR-TIMEZONE:America/New_York',
  ]

  for (const ev of events) {
    const isAllDay = !ev.start_time
    let dtstart: string
    let dtend: string
    let startProp: string
    let endProp: string

    if (isAllDay) {
      dtstart = toICSDate(ev.date, null)
      dtend = nextDay(ev.date)
      startProp = `DTSTART;VALUE=DATE:${dtstart}`
      endProp = `DTEND;VALUE=DATE:${dtend}`
    } else {
      dtstart = toICSDate(ev.date, ev.start_time)
      dtend = ev.end_time
        ? toICSDate(ev.date, ev.end_time)
        : addOneHour(ev.date, ev.start_time!)
      startProp = `DTSTART:${dtstart}`
      endProp = `DTEND:${dtend}`
    }

    const descParts: string[] = []
    if (ev.teamNames) descParts.push(`Teams: ${ev.teamNames}`)
    if (ev.notes) descParts.push(ev.notes)

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${ev.id}@tripops`)
    lines.push(startProp)
    lines.push(endProp)
    lines.push(`SUMMARY:${escapeICS(ev.title)}`)
    if (ev.venue) lines.push(`LOCATION:${escapeICS(ev.venue)}`)
    if (descParts.length) lines.push(`DESCRIPTION:${escapeICS(descParts.join('\n'))}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
