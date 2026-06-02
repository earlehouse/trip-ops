'use client'
import { useState } from 'react'
import { ClipboardCopy, CalendarPlus, CalendarDays } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import { buildGCalUrl } from '@/lib/gcal'
import { StatusPill } from './StatusPill'
import { updateEventStatus } from '@/app/trips/[tripId]/bookings/actions'
import { updateEvent } from '@/app/trips/[tripId]/week/actions'
import { useToast } from '@/components/ui/Toast'
import type { Team } from '@/lib/supabase/types'

type TrackerEvent = {
  id: string; trip_id: string; title: string; date: string
  start_time: string | null; end_time: string | null
  booking_status: string; venue: string | null; headcount: number | null; notes: string | null
  teamIds: string[]
}

interface Props { tripId: string; initialEvents: TrackerEvent[]; teams: Team[] }

type EditingCell = { id: string; field: 'title' | 'venue' | 'notes' | 'time' }

const INPUT_CLASS = 'w-full bg-transparent border-b border-indigo-400 outline-none text-sm py-0.5'

export function BookingTracker({ tripId, initialEvents, teams }: Props) {
  const { toast } = useToast()
  const [events, setEvents] = useState(initialEvents)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterTeam, setFilterTeam] = useState<string>('all')
  const [filterDay, setFilterDay] = useState<string>('all')
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)

  const allDays = [...new Set(events.map(e => e.date))].sort()

  async function cycleStatus(ev: TrackerEvent, nextSt: string) {
    if (ev.booking_status === 'na') return
    setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, booking_status: nextSt } : e))
    try {
      await updateEventStatus(tripId, ev.id, nextSt)
    } catch {
      toast('Failed to save', 'error')
      setEvents(initialEvents)
    }
  }

  async function saveField(ev: TrackerEvent, field: 'title' | 'venue' | 'notes', value: string) {
    setEditingCell(null)
    const trimmed = value.trim()
    const newValue = field === 'title' ? (trimmed || 'Untitled') : (trimmed || null)
    const current = (ev[field] ?? null) as string | null
    if (newValue === current) return
    setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, [field]: newValue } : e))
    try {
      await updateEvent(ev.id, { [field]: newValue }, ev.trip_id)
    } catch {
      toast('Failed to save', 'error')
      setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, [field]: current } : e))
    }
  }

  async function saveTime(ev: TrackerEvent, startTime: string, endTime: string) {
    setEditingCell(null)
    const start = startTime ? startTime + ':00' : null
    const end = endTime ? endTime + ':00' : null
    if (start === ev.start_time && end === ev.end_time) return
    setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, start_time: start, end_time: end } : e))
    try {
      await updateEvent(ev.id, { start_time: start, end_time: end }, ev.trip_id)
    } catch {
      toast('Failed to save', 'error')
      setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, start_time: ev.start_time, end_time: ev.end_time } : e))
    }
  }

  const filtered = events.filter(ev => {
    if (filterStatus !== 'all' && ev.booking_status !== filterStatus) return false
    if (filterTeam !== 'all' && !ev.teamIds.includes(filterTeam)) return false
    if (filterDay !== 'all' && ev.date !== filterDay) return false
    return true
  })

  const counts = {
    needed: events.filter(e => e.booking_status === 'needed').length,
    in_progress: events.filter(e => e.booking_status === 'in_progress').length,
    booked: events.filter(e => e.booking_status === 'booked').length,
  }

  const grouped: Record<string, TrackerEvent[]> = {}
  for (const ev of filtered) {
    if (!grouped[ev.date]) grouped[ev.date] = []
    grouped[ev.date].push(ev)
  }

  function dayLabel(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    })
  }

  function getTeamNamesForEvent(ev: TrackerEvent) {
    return ev.teamIds.map(id => teams.find(t => t.id === id)?.name ?? '').filter(Boolean).join(', ')
  }

  function addAllToGCal() {
    const sorted = [...events].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return (a.start_time ?? '').localeCompare(b.start_time ?? '')
    })
    for (const ev of sorted) {
      window.open(buildGCalUrl({ ...ev, teamNames: getTeamNamesForEvent(ev) }), '_blank')
    }
  }

  function copyAgenda() {
    const sorted = [...events].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      if (!a.start_time && b.start_time) return 1
      if (a.start_time && !b.start_time) return -1
      return (a.start_time ?? '').localeCompare(b.start_time ?? '')
    })

    const byDay: Record<string, TrackerEvent[]> = {}
    for (const ev of sorted) {
      if (!byDay[ev.date]) byDay[ev.date] = []
      byDay[ev.date].push(ev)
    }

    const statusText = (s: string) => {
      if (s === 'booked') return '✓ Confirmed'
      if (s === 'in_progress') return 'In progress'
      if (s === 'na') return 'N/A'
      return 'TBD'
    }

    const lines: string[] = []
    for (const [date, dayEvents] of Object.entries(byDay)) {
      lines.push(`📅 ${dayLabel(date)}`)
      lines.push('')
      lines.push('| Time | Event | Venue | Pax | Status |')
      lines.push('| --- | --- | --- | --- | --- |')
      for (const ev of dayEvents) {
        const time = ev.start_time
          ? formatTime(ev.start_time) + (ev.end_time ? ` – ${formatTime(ev.end_time)}` : '')
          : '—'
        const venue = ev.venue ?? '—'
        const pax = ev.headcount ? String(ev.headcount) : '—'
        const status = statusText(ev.booking_status)
        const title = ev.notes ? `${ev.title} *(${ev.notes})*` : ev.title
        lines.push(`| ${time} | ${title} | ${venue} | ${pax} | ${status} |`)
      }
      lines.push('')
    }

    navigator.clipboard.writeText(lines.join('\n').trim())
    toast('Agenda copied to clipboard')
  }

  const isEditing = (id: string, field: EditingCell['field']) =>
    editingCell?.id === id && editingCell.field === field

  return (
    <div className="flex flex-col h-full">
      {/* Summary bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6 shrink-0">
        <h1 className="text-base font-semibold text-gray-900 mr-auto">Bookings</h1>
        <button
          onClick={addAllToGCal}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 rounded-lg px-3 py-1.5 transition-colors"
        >
          <CalendarPlus size={14} /> Add all to Google Calendar
        </button>
        <button
          onClick={copyAgenda}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 rounded-lg px-3 py-1.5 transition-colors"
        >
          <ClipboardCopy size={14} /> Copy agenda
        </button>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-gray-600">{counts.needed} needed</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-gray-600">{counts.in_progress} in progress</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-gray-600">{counts.booked} booked</span>
          </span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-2 flex items-center gap-3 text-sm shrink-0">
        <span className="text-gray-400 text-xs font-medium uppercase tracking-wide mr-1">Filter:</span>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="all">All statuses</option>
          <option value="needed">Needed</option>
          <option value="in_progress">In progress</option>
          <option value="booked">Booked</option>
          <option value="na">N/A</option>
        </select>
        <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)}
          className="border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="all">All teams</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={filterDay} onChange={e => setFilterDay(e.target.value)}
          className="border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="all">All days</option>
          {allDays.map(d => <option key={d} value={d}>{dayLabel(d)}</option>)}
        </select>
        {(filterStatus !== 'all' || filterTeam !== 'all' || filterDay !== 'all') && (
          <button onClick={() => { setFilterStatus('all'); setFilterTeam('all'); setFilterDay('all') }}
            className="text-indigo-600 hover:underline text-xs">Clear filters</button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No events match your filters</div>
        ) : (
          Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([day, dayEvents]) => (
            <div key={day}>
              <div className="sticky top-0 z-10 bg-gray-50 border-y border-gray-200 px-6 py-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{dayLabel(day)}</span>
              </div>
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-36" />
                  <col className="w-[28%]" />
                  <col className="w-[18%]" />
                  <col className="w-20" />
                  <col className="w-32" />
                  <col className="w-[18%]" />
                  <col className="w-[14%]" />
                  <col className="w-10" />
                </colgroup>
                <tbody className="divide-y divide-gray-50">
                  {dayEvents.map(ev => (
                    <tr key={ev.id} className="hover:bg-gray-50/60 transition-colors">

                      {/* Time — click to edit */}
                      <td
                        className="px-6 py-3 text-sm text-gray-500 cursor-pointer hover:bg-indigo-50/50"
                        onClick={() => !isEditing(ev.id, 'time') && setEditingCell({ id: ev.id, field: 'time' })}
                      >
                        {isEditing(ev.id, 'time') ? (
                          <TimeEditor ev={ev} onSave={(s, e) => saveTime(ev, s, e)} onCancel={() => setEditingCell(null)} />
                        ) : (
                          <span className="whitespace-nowrap">
                            {ev.start_time ? formatTime(ev.start_time) : <span className="text-gray-300">—</span>}
                            {ev.end_time ? ` – ${formatTime(ev.end_time)}` : ''}
                          </span>
                        )}
                      </td>

                      {/* Title — click to edit */}
                      <td
                        className="px-3 py-3 font-medium text-gray-900 text-sm cursor-pointer hover:bg-indigo-50/50"
                        onClick={() => !isEditing(ev.id, 'title') && setEditingCell({ id: ev.id, field: 'title' })}
                      >
                        {isEditing(ev.id, 'title') ? (
                          <input
                            autoFocus
                            className={`${INPUT_CLASS} font-medium text-gray-900`}
                            defaultValue={ev.title}
                            onBlur={e => saveField(ev, 'title', e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') e.currentTarget.blur()
                              if (e.key === 'Escape') setEditingCell(null)
                            }}
                          />
                        ) : ev.title}
                      </td>

                      {/* Teams — read-only */}
                      <td className="px-3 py-3 text-sm text-gray-500 break-words">
                        {getTeamNamesForEvent(ev) || 'All teams'}
                      </td>

                      {/* Headcount — read-only */}
                      <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {ev.headcount ? `${ev.headcount} pax` : '—'}
                      </td>

                      {/* Status — already interactive */}
                      <td className="px-3 py-3">
                        <StatusPill status={ev.booking_status} onCycle={next => cycleStatus(ev, next)} />
                      </td>

                      {/* Venue — click to edit */}
                      <td
                        className="px-3 py-3 text-sm text-gray-500 break-words cursor-pointer hover:bg-indigo-50/50"
                        onClick={() => !isEditing(ev.id, 'venue') && setEditingCell({ id: ev.id, field: 'venue' })}
                      >
                        {isEditing(ev.id, 'venue') ? (
                          <input
                            autoFocus
                            className={`${INPUT_CLASS} text-gray-500`}
                            defaultValue={ev.venue ?? ''}
                            placeholder="Venue"
                            onBlur={e => saveField(ev, 'venue', e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') e.currentTarget.blur()
                              if (e.key === 'Escape') setEditingCell(null)
                            }}
                          />
                        ) : (
                          ev.venue ?? <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Notes — click to edit */}
                      <td
                        className="px-3 py-3 text-sm text-gray-400 break-words cursor-pointer hover:bg-indigo-50/50"
                        onClick={() => !isEditing(ev.id, 'notes') && setEditingCell({ id: ev.id, field: 'notes' })}
                      >
                        {isEditing(ev.id, 'notes') ? (
                          <input
                            autoFocus
                            className={`${INPUT_CLASS} text-gray-400`}
                            defaultValue={ev.notes ?? ''}
                            placeholder="Notes"
                            onBlur={e => saveField(ev, 'notes', e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') e.currentTarget.blur()
                              if (e.key === 'Escape') setEditingCell(null)
                            }}
                          />
                        ) : (
                          ev.notes ?? <span className="text-gray-200">—</span>
                        )}
                      </td>

                      {/* GCal per-event */}
                      <td className="px-2 py-3 text-center">
                        <a
                          href={buildGCalUrl({ ...ev, teamNames: getTeamNamesForEvent(ev) })}
                          target="_blank"
                          rel="noreferrer"
                          title="Add to Google Calendar"
                          className="inline-flex items-center justify-center text-gray-300 hover:text-indigo-500 transition-colors"
                        >
                          <CalendarDays size={15} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function TimeEditor({
  ev,
  onSave,
  onCancel,
}: {
  ev: TrackerEvent
  onSave: (start: string, end: string) => void
  onCancel: () => void
}) {
  const [start, setStart] = useState(ev.start_time?.slice(0, 5) ?? '')
  const [end, setEnd] = useState(ev.end_time?.slice(0, 5) ?? '')

  function handleContainerBlur(e: React.FocusEvent<HTMLDivElement>) {
    // Only save if focus is leaving the container entirely
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    onSave(start, end)
  }

  return (
    <div className="flex items-center gap-1" onBlur={handleContainerBlur}>
      <input
        autoFocus
        type="time"
        value={start}
        onChange={e => setStart(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Escape') onCancel()
          if (e.key === 'Enter') onSave(start, end)
        }}
        className="w-[4.5rem] border-b border-indigo-400 outline-none text-sm text-gray-700 bg-transparent"
      />
      <span className="text-gray-300 text-xs select-none">–</span>
      <input
        type="time"
        value={end}
        onChange={e => setEnd(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Escape') onCancel()
          if (e.key === 'Enter') onSave(start, end)
        }}
        className="w-[4.5rem] border-b border-indigo-400 outline-none text-sm text-gray-700 bg-transparent"
      />
    </div>
  )
}
