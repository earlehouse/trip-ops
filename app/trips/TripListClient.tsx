'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, MapPin, Users, AlertCircle, Calendar, Layers, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { NewTripModal } from './NewTripModal'
import { NewGroupModal } from './groups/NewGroupModal'
import { Sidebar } from '@/components/ui/Sidebar'
import { deleteTrip } from './actions'
import { deleteGroup } from './groups/[groupId]/actions'
import type { Trip, Team, TripGroup } from '@/lib/supabase/types'

interface TripRow extends Trip {
  teams: Team[]
  guestCount: number
  unresolvedBookings: number
}

interface GroupOption { id: string; name: string }

interface Props {
  standaloneTrips: TripRow[]
  groups: TripGroup[]
  subTripsByGroup: Record<string, TripRow[]>
  allGroups: GroupOption[]
}

export function TripListClient({ standaloneTrips, groups, subTripsByGroup, allGroups }: Props) {
  const [showTripModal, setShowTripModal] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)

  const hasContent = standaloneTrips.length > 0 || groups.length > 0

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trips</h1>
              <p className="text-sm text-gray-500 mt-0.5">All offsites in one place</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGroupModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
              >
                <Layers size={16} /> New group
              </button>
              <button
                onClick={() => setShowTripModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus size={16} /> New trip
              </button>
            </div>
          </div>

          {!hasContent ? (
            <div className="text-center py-20 text-gray-400">
              <Calendar size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-base font-medium">No trips yet</p>
              <p className="text-sm mt-1">Create your first trip or group to get started</p>
              <button
                onClick={() => setShowTripModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                <Plus size={14} /> Create trip
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Groups section */}
              {groups.length > 0 && (
                <div className="space-y-3">
                  {groups.map(group => {
                    const subs = subTripsByGroup[group.id] ?? []
                    const totalGuests = subs.reduce((sum, t) => sum + t.guestCount, 0)
                    return (
                      <GroupCard
                        key={group.id}
                        group={group}
                        subTrips={subs}
                        totalGuests={totalGuests}
                      />
                    )
                  })}
                </div>
              )}

              {/* Standalone trips */}
              {standaloneTrips.length > 0 && (
                <div className="space-y-3">
                  {groups.length > 0 && (
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Standalone trips</p>
                  )}
                  {standaloneTrips.map(trip => (
                    <TripCard key={trip.id} trip={trip} />
                  ))}
                </div>
              )}
            </div>
          )}

          {showTripModal && (
            <NewTripModal onClose={() => setShowTripModal(false)} groups={allGroups} />
          )}
          {showGroupModal && (
            <NewGroupModal onClose={() => setShowGroupModal(false)} />
          )}
        </div>
      </main>
    </div>
  )
}

function GroupCard({
  group,
  subTrips,
  totalGuests,
}: {
  group: TripGroup
  subTrips: TripRow[]
  totalGuests: number
}) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteGroup(group.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white border-2 border-indigo-100 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all group">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
              <Layers size={10} /> Group
            </span>
          </div>
          <Link
            href={`/trips/groups/${group.id}`}
            className="font-semibold text-gray-900 hover:text-indigo-700 transition-colors"
          >
            {group.name}
          </Link>
          <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
            <Calendar size={13} />
            {formatDate(group.start_date)} – {formatDate(group.end_date)}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {confirming ? (
            <>
              <span className="text-xs text-gray-500">Delete group?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Yes'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              {totalGuests > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Users size={14} />
                  <span>{totalGuests} guests</span>
                </div>
              )}
              <button
                onClick={() => setConfirming(true)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sub-trip pills */}
      {subTrips.length > 0 ? (
        <div className="flex flex-wrap gap-2 mt-2">
          {subTrips.map(sub => (
            <Link
              key={sub.id}
              href={`/trips/${sub.id}/overview`}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-100"
            >
              {sub.name}
              {sub.guestCount > 0 && (
                <span className="text-indigo-400">· {sub.guestCount}</span>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 mt-1">No sub-trips yet</p>
      )}
    </div>
  )
}

function TripCard({ trip }: { trip: TripRow }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    setDeleting(true)
    try {
      await deleteTrip(trip.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      onClick={() => !confirming && router.push(`/trips/${trip.id}/week`)}
      className="cursor-pointer bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors truncate">
            {trip.name}
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar size={13} />
              {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
            </span>
            {trip.office_location && (
              <span className="flex items-center gap-1">
                <MapPin size={13} /> {trip.office_location}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {trip.teams.map(team => (
              <span
                key={team.id}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: team.color }}
              >
                {team.name} · {team.headcount}
              </span>
            ))}
          </div>
        </div>
        <div className="shrink-0 text-right space-y-1" onClick={e => e.stopPropagation()}>
          {confirming ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Delete trip?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Yes'}
              </button>
              <button
                onClick={e => { e.stopPropagation(); setConfirming(false) }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Users size={14} />
                <span>{trip.guestCount} guests</span>
              </div>
              {trip.unresolvedBookings > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-amber-600">
                  <AlertCircle size={14} />
                  <span>{trip.unresolvedBookings} open</span>
                </div>
              )}
              <button
                onClick={e => { e.stopPropagation(); setConfirming(true) }}
                className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-all mt-1"
              >
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
