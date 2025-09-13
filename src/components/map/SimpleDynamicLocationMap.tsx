'use client'
import dynamic from 'next/dynamic'
import React from 'react'
import { SimpleLocationMapProps } from './SimpleLocationMap'

const SimpleLocationMap = dynamic(() => import('./SimpleLocationMap'), {
  ssr: false,
  loading: () => <div className="h-[420px] bg-gray-100 rounded animate-pulse" />
})

export default function SimpleDynamicLocationMap(props: SimpleLocationMapProps) {
  return <SimpleLocationMap {...props} />
}

