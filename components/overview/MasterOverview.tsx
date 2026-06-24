'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, AlertCircle, ChevronRight, Layers } from 'lucide-react'
import { cn, formatTime } from '@/lib/utils'
import { updateTripNotes } from '@/app/trips/[tripId]/overview/actions'
import { updateGroupNotes } from '@/app/trips/groups/[groupId]/actions'
import { useToast } from '@/components/ui/Toast'

type EventRow = { id: string; title: string; date: string; start_time: string | null; booking_status: string; trip_id?: string }

type OverviewRow = {
  trip: { id: string; name: string; start_date: string; end_date: string; notes?: string | null; group_id?: string | null }
  totalGuests: number
  confirmedCount: number
  missingGuests: string[]
  foodNeeded: EventRow[]
  foodInProgress: EventRow[]
  foodTotal: number
  agendaNeeded: EventRow[]
  agendaInProgress: EventRow[]
  agendaTotal: number
}

type TripGroup = { id: string; name: string; start_date: string; end_date: string; notes?: string | null }

interface Props {
  standaloneRows: OverviewRow[]
  groups: TripGroup[]
  rowsByGroup: Record<string, OverviewRow[]>
}

function dayLabel(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function dateRange(start: string, end: string) {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const sLabel = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const eLabel = e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${sLabel} – ${eLabel}`
}

type DisplayItem =
  | { type: 'group'; group: TripGroup }
  | { type: 'trip'; row: OverviewRow }

export function MasterOverview({ standaloneRows, groups, rowsByGroup }: Props) {
  const hasContent = standaloneRows.length > 0 || groups.length > 0

  const displayItems: DisplayItem[] = [
    ...groups.map(g => ({ type: 'group' as const, group: g })),
    ...standaloneRows.map(r => ({ type: 'trip' as const, row: r })),
  ].sort((a, b) => {
    const dateA = a.type === 'group' ? a.group.start_date : a.row.trip.start_date
    const dateB = b.type === 'group' ? b.group.start_date : b.row.trip.start_date
    return dateA.localeCompare(dateB)
  })

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-6 py-5 border-b border-gray-200 bg-white shrink-0">
        <h1 className="text-lg font-bold text-gray-900">Planning Overview</h1>
        <p className="text-sm text-gray-400 mt-0.5">All upcoming trips at a glance</p>
      </div>

      {!hasContent ? (
        <div className="flex items-center justify-center flex-1 text-gray-400 text-sm">No trips found</div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="min-w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-52">Trip</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-64">Hotels</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-72">Food</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-72">Agenda</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Misc Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {displayItems.map(item =>
                item.type === 'group' ? (
                  <React.Fragment key={`group-${item.group.id}`}>
                    <GroupHeaderRow group={item.group} />
                    {(rowsByGroup[item.group.id] ?? []).map(row => (
                      <TripRow key={row.trip.id} row={row} indented />
                    ))}
                  </React.Fragment>
                ) : (
                  <TripRow key={item.row.trip.id} row={item.row} />
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function GroupHeaderRow({ group }: { group: TripGroup }) {
  const { toast } = useToast()
  const [notes, setNotes] = useState(group.notes ?? '')
  const [saving, setSaving] = useState(false)

  async function saveNotes() {
    setSaving(true)
    try {
      await updateGroupNotes(group.id, notes || null)
      toast('Saved')
    } catch { toast('Failed to save', 'error') }
    finally { setSaving(false) }
  }

  return (
    <tr className="bg-indigo-50/60 border-t-2 border-indigo-100">
      <td colSpan={4} className="px-5 py-2.5">
        <Link
          href={`/trips/groups/${group.id}`}
          className="inline-flex items-center gap-2 group/link"
        >
          <Layers size={13} className="text-indigo-400 shrink-0" />
          <span className="text-sm font-semibold text-indigo-700 group-hover/link:text-indigo-900 transition-colors">
            {group.name}
          </span>
          <span className="text-xs text-indigo-400">{dateRange(group.start_date, group.end_date)}</span>
          <ChevronRight size={12} className="text-indigo-300 group-hover/link:text-indigo-500 transition-colors" />
        </Link>
      </td>
      <td className="px-4 py-2 min-w-[200px]">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={saveNotes}
          placeholder="Group notes…"
          rows={1}
          className="w-full text-xs text-indigo-700 placeholder-indigo-300 border border-transparent hover:border-indigo-200 focus:border-indigo-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none transition-colors bg-transparent hover:bg-white/70 focus:bg-white"
        />
      </td>
    </tr>
  )
}

function EventCell({ needed, inProgress, total }: {
  needed: EventRow[]; inProgress: EventRow[]; total: number
}) {
  if (total === 0) return <span className="text-xs text-gray-300">—</span>
  if (needed.length === 0 && inProgress.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600">
        <CheckCircle size={13} /> All confirmed
      </div>
    )
  }
  return (
    <div className="space-y-1">
      {[...needed, ...inProgress].map(ev => (
        <div key={ev.id} className="flex items-start gap-1.5 text-xs">
          <span className={cn('mt-1 w-1.5 h-1.5 rounded-full shrink-0', ev.booking_status === 'needed' ? 'bg-gray-400' : 'bg-amber-400')} />
          <span className="text-gray-700 leading-tight">
            {ev.title}
            <span className="text-gray-400 ml-1">{dayLabel(ev.date)}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

function TripRow({ row, indented }: { row: OverviewRow; indented?: boolean }) {
  const { toast } = useToast()
  const [notes, setNotes] = useState(row.trip.notes ?? '')
  const [saving, setSaving] = useState(false)
  const hotelPct = row.totalGuests > 0 ? Math.round((row.confirmedCount / row.totalGuests) * 100) : null

  async function saveNotes() {
    setSaving(true)
    try {
      await updateTripNotes(row.trip.id, notes || null)
      toast('Saved')
    } catch { toast('Failed to save', 'error') }
    finally { setSaving(false) }
  }

  return (
    <tr className="align-top hover:bg-gray-50/50 group">
      {/* Trip name */}
      <td className={cn('py-4 pr-5', indented ? 'pl-10' : 'pl-5')}>
        {indented && (
          <div className="w-px h-full absolute left-7 top-0 bg-indigo-100" aria-hidden />
        )}
        <Link
          href={`/trips/${row.trip.id}/overview`}
          className="flex items-start gap-1 group/link"
        >
          {indented && <span className="text-indigo-200 mr-0.5 shrink-0 mt-0.5">╴</span>}
          <div>
            <p className="font-semibold text-sm text-gray-900 group-hover/link:text-indigo-700 transition-colors leading-tight">
              {row.trip.name}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{dateRange(row.trip.start_date, row.trip.end_date)}</p>
            {row.totalGuests > 0 && (
              <p className="text-xs text-gray-400">{row.totalGuests} guests</p>
            )}
          </div>
          <ChevronRight size={13} className="text-gray-300 group-hover/link:text-indigo-400 mt-0.5 shrink-0 transition-colors" />
        </Link>
      </td>

      {/* Hotels */}
      <td className="px-4 py-4">
        {row.totalGuests === 0 ? (
          <span className="text-xs text-gray-300">No guests yet</span>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full', hotelPct === 100 ? 'bg-emerald-500' : 'bg-amber-400')}
                  style={{ width: `${hotelPct}%` }}
                />
              </div>
              <span className={cn('text-xs font-medium whitespace-nowrap', hotelPct === 100 ? 'text-emerald-600' : 'text-amber-600')}>
                {row.confirmedCount}/{row.totalGuests}
              </span>
            </div>
            {row.missingGuests.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {row.missingGuests.slice(0, 3).map(name => (
                  <span key={name} className="inline-flex items-center gap-0.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-1.5 py-0.5">
                    <AlertCircle size={9} /> {name.split(' ')[0]}
                  </span>
                ))}
                {row.missingGuests.length > 3 && (
                  <span className="text-xs text-gray-400">+{row.missingGuests.length - 3} more</span>
                )}
              </div>
            )}
          </div>
        )}
      </td>

      {/* Food */}
      <td className="px-4 py-4">
        <EventCell needed={row.foodNeeded} inProgress={row.foodInProgress} total={row.foodTotal} />
      </td>

      {/* Agenda */}
      <td className="px-4 py-4">
        <EventCell needed={row.agendaNeeded} inProgress={row.agendaInProgress} total={row.agendaTotal} />
      </td>

      {/* Misc notes */}
      <td className="px-4 py-4 min-w-[200px]">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={saveNotes}
          placeholder="Notes…"
          rows={2}
          className="w-full text-xs text-gray-700 placeholder-gray-300 border border-transparent hover:border-gray-200 focus:border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none transition-colors bg-transparent hover:bg-white focus:bg-white"
        />
      </td>
    </tr>
  )
}
