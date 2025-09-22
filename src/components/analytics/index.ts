// Analytics Components Export
export { SmartMetricCard } from './SmartMetricCard'
export { SwipeableTabNavigation } from './SwipeableTabNavigation'
export { ResponsiveMetricsGrid } from './ResponsiveMetricsGrid'
export { AnalyticsHeader } from './AnalyticsHeader'
export { EnhancedChart } from './EnhancedChart'
export { default as EnhancedAnalyticsDashboard } from './EnhancedAnalyticsDashboard'

// Types
export interface Metric {
  title: string
  value: number | string
  change: number
  trend: 'up' | 'down' | 'stable'
  format: 'number' | 'currency' | 'percentage' | 'time'
  icon?: React.ComponentType<{ className?: string }>
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
  onClick?: () => void
  drillDown?: boolean
}

export interface ChartData {
  label: string
  value: number
  color?: string
}
