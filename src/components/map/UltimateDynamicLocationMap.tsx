'use client'
import dynamic from 'next/dynamic'
import React from 'react'
import { UltimateLocationMapProps } from './UltimateLocationMap'

const UltimateLocationMap = dynamic(() => import('./UltimateLocationMap'), {
  ssr: false,
  loading: () => <div className="h-[420px] bg-gray-100 rounded animate-pulse" />
})

export default function UltimateDynamicLocationMap(props: UltimateLocationMapProps) {
  return <UltimateLocationMap {...props} />
}