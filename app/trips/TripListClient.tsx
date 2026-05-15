'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Plus, MapPin, Users, AlertCircle, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { NewTripModal } from './NewTripModal'
import { Sidebar } from '@/components/ui/Sidebar'
import type { Trip, Team } from '@/lib/supabase/types'

interface TripRow extends Trip {
  teams: Team[]
  guestCount: number
  unresolvedBookings: number
}

export function TripListClient({ trips }: { trips: TripRow[] }) {
  const [showModal, setShowModal] = useState(false)

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
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> New trip
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Calendar size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-base font-medium">No trips yet</p>
          <p className="text-sm mt-1">Create your first trip to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            <Plus size={14} /> Create trip
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map(trip => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}

      {showModal && <NewTripModal onClose={() => setShowModal(false)} />}
    </div>
      </main>
    </div>
  )
}

function TripCard({ trip }: { trip: TripRow }) {
  return (
    <Link
      href={`/trips/${trip.id}/week`}
      className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all group"
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
        <div className="shrink-0 text-right space-y-1">
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
        </div>
      </div>
    </Link>
  )
}
