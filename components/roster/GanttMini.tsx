'use client'
import { useMemo } from 'react'
import { tripDays, hexWithAlpha } from '@/lib/utils'
import type { Trip, Team } from '@/lib/supabase/types'

type Guest = {
  id: string; name: string; team_id: string | null; team: Team | null
  arrival_date: string | null; arrival_time: string | null
  departure_date: string | null; departure_time: string | null
}

const COL_W = 36
const ROW_H = 20
const LABEL_W = 140

interface Props { guests: Guest[]; teams: Team[]; trip: Trip }

export function GanttMini({ guests, teams, trip }: Props) {
  const days = useMemo(() => tripDays(trip.start_date, trip.end_date), [trip])

  if (guests.length === 0) return null

  function guestBar(guest: Guest) {
    if (!guest.arrival_date && !guest.departure_date) return null
    const start = guest.arrival_date ?? trip.start_date
    const end = guest.departure_date ?? trip.end_date

    const startIdx = days.indexOf(start)
    const endIdx = days.indexOf(end)
    if (startIdx === -1 && endIdx === -1) return null

    const si = Math.max(0, startIdx === -1 ? 0 : startIdx)
    const ei = Math.min(days.length - 1, endIdx === -1 ? days.length - 1 : endIdx)

    const partialStart = guest.arrival_time && parseInt(guest.arrival_time) >= 12
    const partialEnd = guest.departure_time && parseInt(guest.departure_time) < 12

    const color = guest.team?.color ?? '#9ca3af'
    const x = LABEL_W + si * COL_W
    const width = (ei - si + 1) * COL_W

    return { x, width, color, partialStart, partialEnd }
  }

  const totalW = LABEL_W + days.length * COL_W
  const totalH = ROW_H * guests.length + 28 // 28 = header row

  return (
    <div className="bg-white border-b border-gray-200 overflow-x-auto shrink-0">
      <div className="px-6 pt-4 pb-0">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Nights in-house</h2>
      </div>
      <div className="overflow-x-auto px-6 pb-4">
        <svg width={totalW} height={totalH} className="block">
          {/* Day headers */}
          {days.map((d, i) => {
            const label = new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
            return (
              <text key={d} x={LABEL_W + i * COL_W + COL_W / 2} y={14} textAnchor="middle"
                fontSize={10} fill="#9ca3af" fontFamily="inherit">
                {label}
              </text>
            )
          })}

          {/* Grid lines */}
          {days.map((_, i) => (
            <line key={i} x1={LABEL_W + i * COL_W} y1={20} x2={LABEL_W + i * COL_W} y2={totalH} stroke="#f1f5f9" strokeWidth={1} />
          ))}
          <line x1={LABEL_W + days.length * COL_W} y1={20} x2={LABEL_W + days.length * COL_W} y2={totalH} stroke="#f1f5f9" strokeWidth={1} />

          {/* Guest rows */}
          {guests.map((guest, rowIdx) => {
            const y = 28 + rowIdx * ROW_H
            const bar = guestBar(guest)
            return (
              <g key={guest.id}>
                {/* Name label */}
                <text x={0} y={y + ROW_H / 2 + 4} fontSize={11} fill="#374151" fontFamily="inherit">
                  {guest.name.length > 18 ? guest.name.slice(0, 17) + '…' : guest.name}
                </text>
                {/* Row bg */}
                <rect x={LABEL_W} y={y + 2} width={days.length * COL_W} height={ROW_H - 4} fill="#f8fafc" rx={2} />
                {/* Bar */}
                {bar && (
                  <rect
                    x={bar.x + 1}
                    y={y + 3}
                    width={Math.max(2, bar.width - 2)}
                    height={ROW_H - 6}
                    fill={hexWithAlpha(bar.color, bar.partialStart || bar.partialEnd ? 0.5 : 0.85)}
                    rx={3}
                  />
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
