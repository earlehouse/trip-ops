'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, CalendarRange } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildMonthGrid, layoutWeekSegments, toISODate, type CalendarTripInput } from '@/lib/calendarLayout'

interface Props {
  trips: CalendarTripInput[]
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarClient({ trips }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const todayStr = toISODate(now)
  const weeks = useMemo(() => buildMonthGrid(year, month), [year, month])
  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  function goToday() {
    setYear(now.getFullYear())
    setMonth(now.getMonth())
  }
  function goPrev() {
    const d = new Date(year, month - 1, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }
  function goNext() {
    const d = new Date(year, month + 1, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarRange size={22} className="text-indigo-500" /> Calendar
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">All upcoming trips in one view</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:border-indigo-300 hover:text-indigo-700 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center border border-gray-200 rounded-lg">
            <button onClick={goPrev} className="p-1.5 text-gray-500 hover:text-indigo-700 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 text-sm font-semibold text-gray-800 min-w-[140px] text-center">{monthLabel}</span>
            <button onClick={goNext} className="p-1.5 text-gray-500 hover:text-indigo-700 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {WEEKDAY_LABELS.map(label => (
            <div key={label} className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">
              {label}
            </div>
          ))}
        </div>

        {weeks.map((week, wi) => {
          const { segments, maxLanes } = layoutWeekSegments(week, trips)
          return (
            <div
              key={wi}
              className={cn('grid grid-cols-7', wi > 0 && 'border-t border-gray-100')}
              style={{ gridTemplateRows: `26px repeat(${Math.max(maxLanes, 1)}, 22px)` }}
            >
              {week.map((day, di) => (
                <div
                  key={day.date}
                  style={{ gridColumn: di + 1, gridRow: '1 / -1' }}
                  className={cn(
                    'border-l border-gray-100 px-1 pt-1 pb-1',
                    di === 0 && 'border-l-0',
                    !day.inMonth && 'bg-gray-50/70',
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs',
                      day.date === todayStr
                        ? 'bg-indigo-600 text-white font-semibold'
                        : day.inMonth ? 'text-gray-700' : 'text-gray-300',
                    )}
                  >
                    {day.dayNum}
                  </span>
                </div>
              ))}

              {segments.map(seg => (
                <Link
                  key={seg.tripId + wi}
                  href={`/trips/${seg.tripId}/overview`}
                  style={{ gridColumn: `${seg.startCol + 1} / ${seg.endCol + 2}`, gridRow: seg.lane + 2 }}
                  title={`${seg.name} · ${seg.guestCount} attendee${seg.guestCount === 1 ? '' : 's'}`}
                  className={cn(
                    'mx-0.5 mb-0.5 flex items-center gap-1 overflow-hidden bg-indigo-600 px-1.5 text-[11px] font-medium text-white hover:bg-indigo-700 transition-colors',
                    seg.isStart && 'rounded-l',
                    seg.isEnd && 'rounded-r',
                  )}
                >
                  <span className="truncate">{seg.name}</span>
                  <span className="opacity-80 shrink-0">· {seg.guestCount}</span>
                </Link>
              ))}
            </div>
          )
        })}
      </div>

      {trips.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-10">No upcoming trips to show</p>
      )}
    </div>
  )
}
