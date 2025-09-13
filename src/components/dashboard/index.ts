// Dashboard Components
export { 
  DashboardLayout, 
  DashboardSection, 
  DashboardGrid, 
  DashboardSidebar,
  DashboardMain,
  TwoColumnLayout,
  ThreeColumnLayout,
  FourColumnLayout,
  DashboardCard,
  DashboardStatCard,
  DashboardMetricCard
} from '../DashboardLayout'
export { DashboardSummary } from '../DashboardSummary'
export { DashboardInsights } from '../DashboardInsights'
export { DashboardAnalytics } from '../DashboardAnalytics'
export { StatCard, adminStatConfigs, employeeStatConfigs } from './StatCard'
export { ProgressOverview, taskProgressConfig, attendanceProgressConfig } from './ProgressOverview'
export { QuickActions, adminQuickActions, employeeQuickActions } from './QuickActions'
export { OverviewCards, attendanceOverviewConfig, leaveOverviewConfig, wfhOverviewConfig, taskOverviewConfig } from './OverviewCards'
export { RecentTasks } from './RecentTasks'
export { NotificationsSummary } from './NotificationsSummary'
export { AttendanceStatus } from './AttendanceStatus'
export { WelcomeSection, adminWelcomeConfig, employeeWelcomeConfig } from './WelcomeSection'
export { SummaryCards, adminSummaryCards, employeeSummaryCards } from './SummaryCards'
export { ActivityFeed, adminActivityFeed, employeeActivityFeed } from './ActivityFeed'
export { ChartSummary, attendanceChartConfig, taskProgressChartConfig, leaveStatusChartConfig } from './ChartSummary'
export { QuickStats, adminQuickStats, employeeQuickStats, attendanceQuickStats, taskQuickStats } from './QuickStats'

// Additional Dashboard Components
export { DashboardNotifications, adminNotifications, employeeNotifications } from '../DashboardNotifications'
export { DashboardSearch, adminSearchConfig, employeeSearchConfig, documentSearchConfig, userSearchConfig } from '../DashboardSearch'
export { DashboardHelp, adminHelpConfig, employeeHelpConfig, quickHelpConfig, comprehensiveHelpConfig } from '../DashboardHelp'

// Types
export type {
  DashboardStats,
  StatConfig,
  ProgressItem,
  QuickAction,
  OverviewItem,
  Task,
  Notification,
  AttendanceData,
  WelcomeConfig,
  SummaryCard,
  ActivityItem,
  ChartData,
  QuickStatItem,
  SearchResult,
  SearchFilter,
  HelpArticle,
  HelpCategory,
  DashboardLayoutProps,
  DashboardSectionProps,
  DashboardGridProps,
  ChartConfig,
  ProgressConfig,
  QuickActionsConfig,
  OverviewConfig,
  SummaryCardsConfig,
  ActivityFeedConfig,
  QuickStatsConfig,
  CalendarConfig,
  SearchConfig,
  HelpConfig
} from './types'
