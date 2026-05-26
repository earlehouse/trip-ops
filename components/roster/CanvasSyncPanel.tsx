'use client'
import { useState } from 'react'
import { X, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { syncGuestsFromCanvasText, type SyncResult } from '@/app/trips/[tripId]/roster/syncActions'
import { cn } from '@/lib/utils'

interface Props {
  tripId: string
  tripStartDate: string
  onClose: () => void
  onSynced: () => void
}

export function CanvasSyncPanel({ tripId, tripStartDate, onClose, onSynced }: Props) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)

  async function handleSync() {
    if (!text.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await syncGuestsFromCanvasText(tripId, tripStartDate, text)
      setResult(res)
      if (!res.error && (res.updated.length > 0 || res.created.length > 0)) {
        onSynced()
      }
    } finally {
      setLoading(false)
    }
  }

  const hasSuccess = result && !result.error
  const total = hasSuccess ? result.updated.length + result.created.length : 0

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/20" onClick={onClose} />
      <aside className="fixed right-0 top-0 bottom-0 z-40 w-[440px] bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900">Sync from Canvas</h2>
            <p className="text-xs text-gray-400 mt-0.5">Copy your Slack canvas table and paste it below</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {/* Instructions */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-xs text-gray-500 space-y-1">
            <p className="font-medium text-gray-700">Canvas column headers expected:</p>
            <p>Name · Phone Number · Arrival Date · Arrival Time · Departure Date · Departure Time · Hotel Conf · Loyalty #</p>
            <p className="mt-2">In Slack: select the whole table → Copy → paste here.</p>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-2">Paste canvas content</label>
            <textarea
              autoFocus
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={"Name\tPhone Number\tArrival Date\tArrival Time\t...\nBecca James\t\tJun 8\t2:05pm\t..."}
              className="w-full h-56 border border-gray-200 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none font-mono"
            />
          </div>

          {/* Result */}
          {result && (
            <div className={cn(
              'rounded-lg border p-4 text-sm',
              result.error ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
            )}>
              {result.error ? (
                <div className="flex items-start gap-2 text-red-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{result.error}</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-green-800 font-medium">
                    <CheckCircle size={16} />
                    {total} guest{total !== 1 ? 's' : ''} synced
                  </div>
                  {result.updated.length > 0 && (
                    <p className="text-green-700 text-xs"><span className="font-medium">Updated:</span> {result.updated.join(', ')}</p>
                  )}
                  {result.created.length > 0 && (
                    <p className="text-green-700 text-xs"><span className="font-medium">Added:</span> {result.created.join(', ')}</p>
                  )}
                  {result.skipped.length > 0 && (
                    <p className="text-amber-700 text-xs"><span className="font-medium">Skipped:</span> {result.skipped.join(', ')}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-4 flex gap-2 shrink-0">
          <button onClick={onClose} className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            {hasSuccess && total > 0 ? 'Done' : 'Cancel'}
          </button>
          <button
            onClick={handleSync}
            disabled={loading || !text.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Syncing…' : result ? 'Sync again' : 'Sync'}
          </button>
        </div>
      </aside>
    </>
  )
}
