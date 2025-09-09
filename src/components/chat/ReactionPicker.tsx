'use client'

import React, { useMemo, useState } from 'react'

interface ReactionPickerProps {
  onPickEmoji: (emoji: string) => void
  onPickSticker: (sticker: { fileUrl: string; fileType: string; fileName: string; fileSize: number }) => void
}

const DEFAULT_EMOJIS = [
  '😀','😁','😂','🤣','😊','😍','😘','😎','🤩','🥳','😭','😅','🙏','👍','👎','👏','🙌','💪','🔥','✨','❤️','💙','💚','💛','💜','🧡','🤍','🤎','⭐','🌟','☀️','🌈','⚡','🎉','🎊','🎁','🍕','🍔','🍟','🍰','🍩','☕','🍵','🍺','⚽','🏀','🎮','🎵','🚀','✈️','🏝️'
]

async function fetchStickers(): Promise<Array<{ url: string; name: string; type: string }>> {
  try {
    const res = await fetch('/api/chat/stickers', { cache: 'no-store' })
    const data = await res.json()
    return data.stickers || []
  } catch { return [] }
}

export default function ReactionPicker({ onPickEmoji, onPickSticker }: ReactionPickerProps) {
  const [tab, setTab] = useState<'emoji' | 'sticker'>('emoji')
  const [query, setQuery] = useState('')
  const [stickers, setStickers] = useState<Array<{ url: string; name: string; type: string }>>([])
  const emojis = useMemo(() => {
    const q = query.trim()
    if (!q) return DEFAULT_EMOJIS
    return DEFAULT_EMOJIS
  }, [query])

  return (
    <div className="w-72 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-xl overflow-hidden">
      <div className="flex border-b border-gray-100 dark:border-neutral-700">
        <button onClick={() => setTab('emoji')} className={`flex-1 px-3 py-2 text-sm ${tab==='emoji' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 dark:text-neutral-400'}`}>Emoji</button>
        <button onClick={() => setTab('sticker')} className={`flex-1 px-3 py-2 text-sm ${tab==='sticker' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 dark:text-neutral-400'}`}>Sticker</button>
      </div>
      {tab === 'emoji' ? (
        <div>
          <div className="p-2 border-b border-gray-100 dark:border-neutral-700">
            <input className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-neutral-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-400" placeholder="Cari emoji..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="p-2 grid grid-cols-8 gap-1 max-h-56 overflow-y-auto">
            {emojis.map((e) => (
              <button key={e} className="text-xl hover:bg-gray-100 dark:hover:bg-neutral-700 rounded" onClick={() => onPickEmoji(e)}>
                {e}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3 grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
          {stickers.length === 0 && (
            <button onClick={async () => setStickers(await fetchStickers())} className="col-span-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline">Muat stiker</button>
          )}
          {stickers.map((s) => (
            <button key={s.url} type="button" onClick={() => onPickSticker({ fileUrl: s.url, fileType: s.type, fileName: s.name, fileSize: 0 })} className="w-20 h-20 bg-gray-50 dark:bg-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded-lg flex items-center justify-center" title={s.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.url} alt={s.name} className="max-w-[64px] max-h-[64px]" />
            </button>
          ))}
          <form
            className="col-span-3 mt-2 flex items-center justify-between gap-2"
            onSubmit={async (e) => {
              e.preventDefault()
              const input = (e.currentTarget as any).file as HTMLInputElement
              if (!input?.files?.[0]) return
              const form = new FormData()
              form.append('file', input.files[0])
              const res = await fetch('/api/chat/stickers', { method: 'POST', body: form })
              const data = await res.json()
              if (res.ok && data.sticker) setStickers((prev) => [{ url: data.sticker.url, name: data.sticker.name, type: data.sticker.type }, ...prev])
              input.value = ''
            }}
          >
            <input name="file" type="file" accept="image/webp,image/png,image/jpeg,image/svg+xml" className="text-xs" />
            <button type="submit" className="px-2 py-1 text-xs bg-blue-600 text-white rounded">Tambah</button>
          </form>
        </div>
      )}
    </div>
  )
}


