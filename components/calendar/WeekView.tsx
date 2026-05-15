'use client'
import { useState, useCallback, useMemo, useRef } from 'react'
import {
  DndContext, DragEndEvent, DragStartEvent, DragOverlay,
  useSensor, useSensors, PointerSensor, DragOverEvent,
} from '@dnd-kit/core'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { tripDays, timeToMinutes, minutesToTime, snapToQuarter, formatTime } from '@/lib/utils'
import { DayColumn } from './DayColumn'
import { EventBlock } from './EventBlock'
import { EventSlideOver } from './EventSlideOver'
import { UnscheduledLane } from './UnscheduledLane'
import { updateEvent, setEventTeams } from '@/app/trips/[tripId]/week/actions'
import { useToast } from '@/components/ui/Toast'
import type { Trip, Team } from '@/lib/supabase/types'

export type CalendarEvent = {
  id: string; trip_id: string; title: string; date: string
  start_time: string | null; end_time: string | null
  is_fuzzy_time: boolean; applies_to_all_teams: boolean
  booking_status: string; venue: string | null; headcount: number | null; notes: string | null
  created_at: string; teamIds: string[]
}

// 1 hour = 60px
export const PX_PER_HOUR = 60
export const GRID_START = 7 // 7am
export const GRID_END = 23 // 11pm

interface Props { trip: Trip; teams: Team[]; initialEvents: CalendarEvent[] }

export function WeekView({ trip, teams, initialEvents }: Props) {
  const { toast } = useToast()
  const days = useMemo(() => tripDays(trip.start_date, trip.end_date), [trip])
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [slideOverEvent, setSlideOverEvent] = useState<CalendarEvent | null>(null)
  const [slideOverNew, setSlideOverNew] = useState<{ date: string; startMins: number; teamId: string } | null>(null)

  const visibleDays = selectedDay ? [selectedDay] : days

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    for (const d of days) map[d] = []
    for (const ev of events) {
      if (map[ev.date]) map[ev.date].push(ev)
    }
    return map
  }, [events, days])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  )

  function handleDragStart(e: DragStartEvent) {
    setDraggedId(String(e.active.id))
  }

  function handleDragEnd(e: DragEndEvent) {
    setDraggedId(null)
    const { active, over } = e
    if (!over) return

    const eventId = String(active.id)
    const overId = String(over.id)
    // over.id = "drop:{date}:{teamId}:{minutesFromTop}"
    const parts = overId.split(':')
    if (parts[0] !== 'drop' || parts.length < 4) return

    const [, date, teamId, minsStr] = parts
    const rawMins = parseInt(minsStr)
    const snapped = snapToQuarter(rawMins) + GRID_START * 60

    const ev = events.find(e => e.id === eventId)
    if (!ev) return

    const duration = ev.start_time && ev.end_time
      ? timeToMinutes(ev.end_time) - timeToMinutes(ev.start_time)
      : 60

    const newStart = minutesToTime(snapped)
    const newEnd = minutesToTime(snapped + duration)
    const newTeamIds = teamId === 'all' ? ev.teamIds : [teamId]

    // Optimistic update
    setEvents(prev => prev.map(e => e.id === eventId
      ? { ...e, date, start_time: newStart, end_time: newEnd, teamIds: newTeamIds }
      : e
    ))

    // Persist
    Promise.all([
      updateEvent(eventId, { date, start_time: newStart, end_time: newEnd }),
      teamId !== 'all' ? setEventTeams(eventId, newTeamIds) : Promise.resolve(),
    ]).catch(() => {
      toast('Failed to save event position', 'error')
      setEvents(initialEvents)
    })
  }

  function handleSlotClick(date: string, startMins: number, teamId: string) {
    setSlideOverNew({ date, startMins: snapToQuarter(startMins) + GRID_START * 60, teamId })
    setSlideOverEvent(null)
  }

  function handleEventClick(ev: CalendarEvent) {
    setSlideOverEvent(ev)
    setSlideOverNew(null)
  }

  function handleEventUpdate(updated: CalendarEvent) {
    setEvents(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  function handleEventCreate(created: CalendarEvent) {
    setEvents(prev => [...prev, created])
  }

  function handleEventDelete(id: string) {
    setEvents(prev => prev.filter(e => e.id !== id))
    setSlideOverEvent(null)
  }

  const draggedEvent = draggedId ? events.find(e => e.id === draggedId) : null

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full bg-gray-50">
        {/* Header bar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-200 bg-white shrink-0">
          <h1 className="text-base font-semibold text-gray-900 mr-auto">{trip.name}</h1>
          {/* Day selector pills */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedDay(null)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${selectedDay === null ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              Full week
            </button>
            {days.map(d => {
              const label = new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDay(selectedDay === d ? null : d)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${selectedDay === d ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {label}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => setSlideOverNew({ date: days[0], startMins: GRID_START * 60 + 9 * 60, teamId: teams[0]?.id ?? '' })}
            className="flex items-center gap-1.5 text-sm text-white bg-indigo-600 rounded-lg px-3 py-1.5 hover:bg-indigo-700"
          >
            <Plus size={14} /> Add event
          </button>
        </div>

        {/* Calendar grid */}
        <div className="flex-1 overflow-auto">
          <div className="flex min-h-full">
            {/* Time gutter */}
            <div className="w-14 shrink-0 border-r border-gray-200 bg-white relative">
              {/* Unscheduled lane spacer */}
              <div className="h-16 border-b border-gray-200" />
              {Array.from({ length: GRID_END - GRID_START }, (_, i) => i + GRID_START).map(hour => (
                <div
                  key={hour}
                  className="flex items-start justify-end pr-2 text-xs text-gray-400 border-b border-gray-100"
                  style={{ height: PX_PER_HOUR }}
                >
                  <span className="-mt-2">
                    {hour === 12 ? '12pm' : hour > 12 ? `${hour - 12}pm` : `${hour}am`}
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            <div className="flex flex-1 min-w-0">
              {visibleDays.map(day => (
                <DayColumn
                  key={day}
                  day={day}
                  teams={teams}
                  events={eventsByDay[day] ?? []}
                  draggedId={draggedId}
                  onEventClick={handleEventClick}
                  onSlotClick={handleSlotClick}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {draggedEvent && (
          <div className="opacity-80 pointer-events-none rounded-md shadow-lg px-2 py-1 text-xs font-medium text-white bg-indigo-500" style={{ width: 160 }}>
            {draggedEvent.title}
          </div>
        )}
      </DragOverlay>

      {/* Slide-over */}
      {(slideOverEvent || slideOverNew) && (
        <EventSlideOver
          event={slideOverEvent}
          newEventDefaults={slideOverNew}
          tripId={trip.id}
          teams={teams}
          onClose={() => { setSlideOverEvent(null); setSlideOverNew(null) }}
          onUpdate={handleEventUpdate}
          onCreate={handleEventCreate}
          onDelete={handleEventDelete}
        />
      )}
    </DndContext>
  )
}
