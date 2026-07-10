export interface CalendarTripInput {
  id: string
  name: string
  start_date: string
  end_date: string
  guestCount: number
}

export interface WeekDay {
  date: string
  dayNum: number
  inMonth: boolean
}

export interface TripSegment {
  tripId: string
  name: string
  guestCount: number
  startCol: number
  endCol: number
  lane: number
  isStart: boolean
  isEnd: boolean
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// month is 0-indexed. Returns a Sunday-start grid of weeks covering the full month.
export function buildMonthGrid(year: number, month: number): WeekDay[][] {
  const firstOfMonth = new Date(year, month, 1)
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay())

  const lastOfMonth = new Date(year, month + 1, 0)
  const gridEnd = new Date(year, month, lastOfMonth.getDate() + (6 - lastOfMonth.getDay()))

  const weeks: WeekDay[][] = []
  const cur = new Date(gridStart)
  while (cur <= gridEnd) {
    const week: WeekDay[] = []
    for (let i = 0; i < 7; i++) {
      week.push({ date: toISODate(cur), dayNum: cur.getDate(), inMonth: cur.getMonth() === month })
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

// Greedy first-fit lane packing so overlapping trips within a week stack instead of collide.
export function layoutWeekSegments(
  week: WeekDay[],
  trips: CalendarTripInput[],
): { segments: TripSegment[]; maxLanes: number } {
  const weekStart = week[0].date
  const weekEnd = week[6].date

  const overlapping = trips
    .filter(t => t.end_date >= weekStart && t.start_date <= weekEnd)
    .sort((a, b) => a.start_date.localeCompare(b.start_date) || a.name.localeCompare(b.name))

  const laneEndCols: number[] = []
  const segments: TripSegment[] = []

  for (const t of overlapping) {
    const isStart = t.start_date >= weekStart
    const isEnd = t.end_date <= weekEnd
    const startCol = isStart ? week.findIndex(d => d.date === t.start_date) : 0
    const endCol = isEnd ? week.findIndex(d => d.date === t.end_date) : 6

    let lane = laneEndCols.findIndex(lastCol => lastCol < startCol)
    if (lane === -1) {
      lane = laneEndCols.length
      laneEndCols.push(endCol)
    } else {
      laneEndCols[lane] = endCol
    }

    segments.push({ tripId: t.id, name: t.name, guestCount: t.guestCount, startCol, endCol, lane, isStart, isEnd })
  }

  return { segments, maxLanes: laneEndCols.length }
}
