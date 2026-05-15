'use client'
import { useDraggable } from '@dnd-kit/core'
import { cn, formatTime, timeToMinutes, hexWithAlpha } from '@/lib/utils'
import { StatusDot } from '@/components/ui/StatusDot'
import { PX_PER_HOUR, GRID_START } from './WeekView'
import type { Team } from '@/lib/supabase/types'
import type { CalendarEvent } from './WeekView'

const MEAL_TITLES = ['breakfast', 'lunch', 'dinner', 'happy hour']
const MIN_HEIGHT = 24

interface Props {
  event: CalendarEvent
  team: Team
  isDragging: boolean
  onClick: () => void
}

export function EventBlock({ event, team, isDragging, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging: activeDragging } = useDraggable({
    id: event.id,
    data: { event },
  })

  const startMins = event.start_time ? timeToMinutes(event.start_time) : null
  const endMins = event.end_time ? timeToMinutes(event.end_time) : null

  if (startMins === null) return null

  const topPx = (startMins - GRID_START * 60) / 60 * PX_PER_HOUR
  const durationMins = endMins ? endMins - startMins : 60
  const heightPx = Math.max(MIN_HEIGHT, durationMins / 60 * PX_PER_HOUR - 2)

  const isMeal = MEAL_TITLES.some(m => event.title.toLowerCase().includes(m))
  const bgColor = hexWithAlpha(team.color, isMeal ? 0.12 : 0.18)
  const borderColor = hexWithAlpha(team.color, isMeal ? 0.3 : 0.7)
  const textColor = team.color

  const style = {
    top: topPx + 1,
    height: heightPx,
    backgroundColor: bgColor,
    borderLeft: `3px solid ${borderColor}`,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={e => { e.stopPropagation(); onClick() }}
      className={cn(
        'absolute left-0.5 right-0.5 rounded-sm px-1.5 py-0.5 cursor-grab active:cursor-grabbing select-none overflow-hidden',
        'transition-opacity hover:shadow-sm',
        activeDragging && 'opacity-0',
        isDragging && 'z-10',
        isMeal && 'opacity-75 italic',
      )}
      style={style}
    >
      <div className="flex items-start gap-1">
        <StatusDot status={event.booking_status} className="mt-1 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-semibold leading-tight truncate" style={{ color: textColor }}>
            {event.title}
          </p>
          {heightPx >= 36 && (
            <p className="text-xs opacity-70 leading-tight" style={{ color: textColor }}>
              {formatTime(event.start_time!)}
              {event.end_time ? ` – ${formatTime(event.end_time)}` : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
