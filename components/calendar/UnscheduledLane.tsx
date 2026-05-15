'use client'
import { hexWithAlpha } from '@/lib/utils'
import { StatusDot } from '@/components/ui/StatusDot'
import type { Team } from '@/lib/supabase/types'
import type { CalendarEvent } from './WeekView'

interface Props {
  day: string
  events: CalendarEvent[]
  teams: Team[]
  onEventClick: (ev: CalendarEvent) => void
}

export function UnscheduledLane({ day, events, teams, onEventClick }: Props) {
  function getTeamColor(teamIds: string[]): string {
    const team = teams.find(t => teamIds.includes(t.id))
    return team?.color ?? '#9ca3af'
  }

  return (
    <div className="h-16 border-b border-gray-200 bg-gray-50 px-1 py-1 flex items-start gap-1 flex-wrap overflow-y-auto">
      {events.length === 0 && (
        <span className="text-xs text-gray-300 self-center px-1">Unscheduled</span>
      )}
      {events.map(ev => {
        const color = getTeamColor(ev.teamIds)
        return (
          <button
            key={ev.id}
            onClick={() => onEventClick(ev)}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium hover:opacity-80 transition-opacity truncate max-w-full"
            style={{
              backgroundColor: hexWithAlpha(color, 0.15),
              borderLeft: `2px solid ${color}`,
              color,
            }}
          >
            <StatusDot status={ev.booking_status} />
            <span className="truncate">{ev.title}</span>
          </button>
        )
      })}
    </div>
  )
}
