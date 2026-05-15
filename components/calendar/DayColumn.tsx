'use client'
import { useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { cn, hexWithAlpha } from '@/lib/utils'
import { EventBlock } from './EventBlock'
import { UnscheduledLane } from './UnscheduledLane'
import { PX_PER_HOUR, GRID_START, GRID_END } from './WeekView'
import type { Team } from '@/lib/supabase/types'
import type { CalendarEvent } from './WeekView'

interface Props {
  day: string
  teams: Team[]
  events: CalendarEvent[]
  draggedId: string | null
  onEventClick: (ev: CalendarEvent) => void
  onSlotClick: (date: string, startMins: number, teamId: string) => void
}

export function DayColumn({ day, teams, events, draggedId, onEventClick, onSlotClick }: Props) {
  const label = new Date(day + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  })

  const fuzzy = events.filter(e => e.is_fuzzy_time)
  const scheduled = events.filter(e => !e.is_fuzzy_time)

  const gridHeight = (GRID_END - GRID_START) * PX_PER_HOUR

  return (
    <div className="flex flex-col flex-1 min-w-[220px] border-r border-gray-200 last:border-r-0">
      {/* Day header */}
      <div className="px-3 py-2 bg-white border-b border-gray-200 text-sm font-semibold text-gray-700 shrink-0">
        {label}
      </div>

      {/* Unscheduled lane */}
      <UnscheduledLane day={day} events={fuzzy} teams={teams} onEventClick={onEventClick} />

      {/* Team columns header */}
      <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
        {teams.map(team => (
          <div
            key={team.id}
            className="flex-1 px-2 py-1.5 text-xs font-semibold truncate"
            style={{ color: team.color }}
          >
            {team.name} · {team.headcount}
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex flex-1 relative" style={{ height: gridHeight }}>
        {/* Hour lines */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: GRID_END - GRID_START }, (_, i) => (
            <div key={i} className="absolute w-full border-b border-gray-100" style={{ top: i * PX_PER_HOUR }} />
          ))}
          {/* Half-hour lines */}
          {Array.from({ length: GRID_END - GRID_START }, (_, i) => (
            <div key={`h${i}`} className="absolute w-full border-b border-gray-50 border-dashed" style={{ top: i * PX_PER_HOUR + PX_PER_HOUR / 2 }} />
          ))}
        </div>

        {/* Team sub-columns */}
        {teams.map(team => {
          const teamEvents = scheduled.filter(e =>
            e.teamIds.includes(team.id) || (e.applies_to_all_teams)
          )
          return (
            <TeamSubColumn
              key={team.id}
              team={team}
              day={day}
              events={teamEvents}
              draggedId={draggedId}
              gridHeight={gridHeight}
              onEventClick={onEventClick}
              onSlotClick={onSlotClick}
            />
          )
        })}
      </div>
    </div>
  )
}

function TeamSubColumn({ team, day, events, draggedId, gridHeight, onEventClick, onSlotClick }: {
  team: Team; day: string; events: CalendarEvent[]; draggedId: string | null
  gridHeight: number; onEventClick: (ev: CalendarEvent) => void
  onSlotClick: (date: string, startMins: number, teamId: string) => void
}) {
  const gridRef = useRef<HTMLDivElement>(null)

  const { setNodeRef, isOver } = useDroppable({
    id: `drop:${day}:${team.id}:0`,
    data: { day, teamId: team.id },
  })

  function handleClick(e: React.MouseEvent) {
    if (!gridRef.current) return
    const rect = gridRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    const minsFromGridStart = Math.round(y / PX_PER_HOUR * 60)
    onSlotClick(day, minsFromGridStart, team.id)
  }

  return (
    <div
      ref={node => { setNodeRef(node); (gridRef as React.MutableRefObject<HTMLDivElement | null>).current = node }}
      className={cn(
        'flex-1 relative border-r border-gray-100 last:border-r-0 transition-colors',
        isOver && 'bg-indigo-50',
      )}
      style={{ height: gridHeight }}
      onClick={handleClick}
    >
      {events.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          <Plus size={16} className="text-gray-300" />
        </div>
      )}

      {events.map(ev => (
        <EventBlock
          key={ev.id}
          event={ev}
          team={team}
          isDragging={draggedId === ev.id}
          onClick={() => onEventClick(ev)}
        />
      ))}
    </div>
  )
}
