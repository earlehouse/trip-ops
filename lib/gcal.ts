type GCalEvent = {
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

function toGCalDate(date: string, time: string | null): string {
  if (!time) return date.replace(/-/g, '')
  const [h, m] = time.split(':')
  return `${date.replace(/-/g, '')}T${pad(Number(h))}${pad(Number(m))}00`
}

export function buildGCalUrl(ev: GCalEvent): string {
  const isAllDay = !ev.start_time

  let start: string
  let end: string

  if (isAllDay) {
    start = toGCalDate(ev.date, null)
    // Google all-day end is exclusive — next day
    const d = new Date(ev.date + 'T00:00:00')
    d.setDate(d.getDate() + 1)
    end = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
  } else {
    start = toGCalDate(ev.date, ev.start_time)
    if (ev.end_time) {
      end = toGCalDate(ev.date, ev.end_time)
    } else {
      // Default: 1 hour after start
      const [h, m] = ev.start_time!.split(':').map(Number)
      const totalMin = h * 60 + m + 60
      const endH = Math.floor(totalMin / 60) % 24
      const endM = totalMin % 60
      end = `${ev.date.replace(/-/g, '')}T${pad(endH)}${pad(endM)}00`
    }
  }

  const params = new URLSearchParams({
    text: ev.title,
    dates: `${start}/${end}`,
  })

  if (ev.venue) params.set('location', ev.venue)

  const descParts: string[] = []
  if (ev.teamNames) descParts.push(`Teams: ${ev.teamNames}`)
  if (ev.notes) descParts.push(ev.notes)
  if (descParts.length) params.set('details', descParts.join('\n'))

  return `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`
}
