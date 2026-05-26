'use client'
import { useState } from 'react'
import { X, Trash2, Copy } from 'lucide-react'
import { cn, formatTime } from '@/lib/utils'
import { StatusDot, statusLabel } from '@/components/ui/StatusDot'
import {
  updateEvent, deleteEvent, setEventTeams, createEventWithTeams,
} from '@/app/trips/[tripId]/week/actions'
import { useToast } from '@/components/ui/Toast'
import type { Team } from '@/lib/supabase/types'
import type { CalendarEvent } from './WeekView'
import { minutesToTime } from '@/lib/utils'

interface Props {
  event: CalendarEvent | null
  newEventDefaults: { date: string; startMins: number; teamId: string } | null
  tripId: string
  teams: Team[]
  onClose: () => void
  onUpdate: (ev: CalendarEvent) => void
  onCreate: (ev: CalendarEvent) => void
  onDelete: (id: string) => void
}

const STATUS_OPTIONS = ['needed', 'in_progress', 'booked', 'na']

export function EventSlideOver({ event, newEventDefaults, tripId, teams, onClose, onUpdate, onCreate, onDelete }: Props) {
  const { toast } = useToast()
  const isNew = !event

  const defaultStart = newEventDefaults ? minutesToTime(newEventDefaults.startMins) : ''
  const defaultEnd = newEventDefaults ? minutesToTime(newEventDefaults.startMins + 60) : ''

  const [title, setTitle] = useState(event?.title ?? '')
  const [date, setDate] = useState(event?.date ?? newEventDefaults?.date ?? '')
  const [startTime, setStartTime] = useState(event?.start_time?.slice(0, 5) ?? defaultStart.slice(0, 5))
  const [endTime, setEndTime] = useState(event?.end_time?.slice(0, 5) ?? defaultEnd.slice(0, 5))
  const [isFuzzy, setIsFuzzy] = useState(event?.is_fuzzy_time ?? false)
  const [appliesToAll, setAppliesToAll] = useState(event?.applies_to_all_teams ?? false)
  const [status, setStatus] = useState(event?.booking_status ?? 'needed')
  const [venue, setVenue] = useState(event?.venue ?? '')
  const [headcount, setHeadcount] = useState(String(event?.headcount ?? ''))
  const [notes, setNotes] = useState(event?.notes ?? '')
  const [teamIds, setTeamIds] = useState<string[]>(
    event?.teamIds ?? (newEventDefaults?.teamId ? [newEventDefaults.teamId] : [])
  )
  const [saving, setSaving] = useState(false)
  const [copying, setCopying] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function toggleTeam(id: string) {
    setTeamIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  async function handleSave() {
    setSaving(true)
    const fields = {
      title: title.trim() || 'Untitled',
      date,
      start_time: startTime ? startTime + ':00' : null,
      end_time: endTime ? endTime + ':00' : null,
      is_fuzzy_time: isFuzzy,
      applies_to_all_teams: appliesToAll,
      booking_status: status,
      venue: venue || null,
      headcount: headcount ? Number(headcount) : null,
      notes: notes || null,
    }
    try {
      if (isNew) {
        const created = await createEventWithTeams(tripId, fields, appliesToAll ? teams.map(t => t.id) : teamIds)
        const newEv: CalendarEvent = { ...(created as unknown as CalendarEvent), teamIds: appliesToAll ? teams.map(t => t.id) : teamIds }
        onCreate(newEv)
        toast('Event created')
      } else {
        await updateEvent(event!.id, fields)
        await setEventTeams(event!.id, appliesToAll ? teams.map(t => t.id) : teamIds)
        const updated: CalendarEvent = {
          ...event!,
          ...fields,
          teamIds: appliesToAll ? teams.map(t => t.id) : teamIds,
        }
        onUpdate(updated)
        toast('Saved')
      }
      onClose()
    } catch {
      toast('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!event) return
    try {
      await deleteEvent(event.trip_id, event.id)
      onDelete(event.id)
      toast('Event deleted')
    } catch { toast('Failed to delete', 'error') }
  }

  async function handleCopy() {
    if (!event) return
    setCopying(true)
    const fields = {
      title: title.trim() || 'Untitled',
      date,
      start_time: startTime ? startTime + ':00' : null,
      end_time: endTime ? endTime + ':00' : null,
      is_fuzzy_time: isFuzzy,
      applies_to_all_teams: appliesToAll,
      booking_status: status,
      venue: venue || null,
      headcount: headcount ? Number(headcount) : null,
      notes: notes || null,
    }
    try {
      const effectiveTeamIds = appliesToAll ? teams.map(t => t.id) : teamIds
      const created = await createEventWithTeams(tripId, fields, effectiveTeamIds)
      const newEv: CalendarEvent = { ...(created as unknown as CalendarEvent), teamIds: effectiveTeamIds }
      onCreate(newEv)
      toast('Event copied')
      onClose()
    } catch {
      toast('Failed to copy', 'error')
    } finally {
      setCopying(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-30 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <aside className="fixed right-0 top-0 bottom-0 z-40 w-[380px] bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-semibold text-gray-900">{isNew ? 'New event' : 'Edit event'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Event title"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Start time</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} disabled={isFuzzy}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-40" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">End time</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} disabled={isFuzzy}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-40" />
            </div>
          </div>

          {/* Fuzzy toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isFuzzy} onChange={e => setIsFuzzy(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-400" />
            <span className="text-sm text-gray-700">Unscheduled / fuzzy time</span>
          </label>

          {/* Teams */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Teams</label>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input type="checkbox" checked={appliesToAll} onChange={e => setAppliesToAll(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-400" />
              <span className="text-sm text-gray-700">Applies to all teams</span>
            </label>
            {!appliesToAll && (
              <div className="flex flex-wrap gap-2">
                {teams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => toggleTeam(team.id)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                      teamIds.includes(team.id)
                        ? 'text-white border-transparent'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300',
                    )}
                    style={teamIds.includes(team.id) ? { backgroundColor: team.color, borderColor: team.color } : undefined}
                  >
                    {team.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Booking status */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Booking status</label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                    status === s ? 'border-gray-400 bg-gray-100 text-gray-800' : 'border-gray-200 text-gray-400 hover:border-gray-300',
                  )}
                >
                  <StatusDot status={s} />
                  {statusLabel(s)}
                </button>
              ))}
            </div>
          </div>

          {/* Venue */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Venue</label>
            <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Venue name or address"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>

          {/* Headcount */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Headcount</label>
            <input type="number" min={0} value={headcount} onChange={e => setHeadcount(e.target.value)} placeholder="0"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any additional notes…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-4 flex items-center gap-2 shrink-0">
          {!isNew && (
            confirmDelete ? (
              <div className="flex items-center gap-2 mr-auto">
                <span className="text-xs text-red-600">Delete this event?</span>
                <button onClick={handleDelete} className="text-xs text-red-600 font-medium hover:underline">Yes, delete</button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-500 hover:underline">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-3 mr-auto">
                <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-500">
                  <Trash2 size={14} /> Delete
                </button>
                <button onClick={handleCopy} disabled={copying} className="flex items-center gap-1 text-sm text-gray-400 hover:text-indigo-600 disabled:opacity-60">
                  <Copy size={14} /> {copying ? 'Copying…' : 'Copy'}
                </button>
              </div>
            )
          )}
          <button onClick={onClose} className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 ml-auto">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : isNew ? 'Create' : 'Save'}
          </button>
        </div>
      </aside>
    </>
  )
}
