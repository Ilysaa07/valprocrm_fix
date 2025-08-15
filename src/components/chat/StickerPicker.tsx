'use client'

import React from 'react'

interface StickerPickerProps {
  onPick: (sticker: { fileUrl: string; fileType: string; fileName: string; fileSize: number }) => void
}

// Simple built-in sticker set using local public assets
// You can extend this list or load dynamically from an API later
const STICKERS: Array<{ url: string; name: string; type: string }> = [
  { url: '/valprologo.webp', name: 'valprologo.webp', type: 'image/webp' },
  { url: '/globe.svg', name: 'globe.svg', type: 'image/svg+xml' },
  { url: '/window.svg', name: 'window.svg', type: 'image/svg+xml' },
  { url: '/next.svg', name: 'next.svg', type: 'image/svg+xml' },
  { url: '/vercel.svg', name: 'vercel.svg', type: 'image/svg+xml' },
]

export default function StickerPicker({ onPick }: StickerPickerProps) {
  return (
    <div className="w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-lg grid grid-cols-3 gap-2">
      {STICKERS.map((s) => (
        <button
          key={s.url}
          type="button"
          onClick={() => onPick({ fileUrl: s.url, fileType: s.type, fileName: s.name, fileSize: 0 })}
          className="w-18 h-18 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-center"
          title={s.name}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.url} alt={s.name} className="max-w-[64px] max-h-[64px]" />
        </button>
      ))}
    </div>
  )
}


