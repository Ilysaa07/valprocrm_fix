// Dashboard Stats Types
export interface DashboardStats {
  totalUsers: number
  pendingUsers: number
  approvedUsers: number
  rejectedUsers: number
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  todayPresent: number
  todayAbsent: number
  todayWFH: number
  pendingLeaveRequests: number
  approvedLeaveRequests: number
  rejectedLeaveRequests: number
  pendingWFHLogs: number
  approvedWFHLogs: number
  rejectedWFHLogs: number
}

// Stat Card Types
export interface StatConfig {
  title: string
  value: number | string
  description: string
  icon: any
  color: string
  trend?: {
    value: number
    isPositive: boolean
    period: string
  }
  link?: string
}

// Progress Overview Types
export interface ProgressItem {
  label: string
  value: number
  total: number
  color: string
  icon?: any
}

// Quick Actions Types
export interface QuickAction {
  title: string
  description: string
  icon: any
  href: string
  color: string
  badge?: string
}

// Overview Cards Types
export interface OverviewItem {
  label: string
  value: string | number
  icon: any
  color: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

// Task Types
export interface Task {
  id: string
  title: string
  description: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  assignee: string
  dueDate: string
  progress: number
  tags?: string[]
}

// Notification Types
export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  category: 'system' | 'task' | 'attendance' | 'leave' | 'wfh' | 'user' | 'general'
  isRead: boolean
  createdAt: string
  actionUrl?: string
  actionText?: string
  priority: 'low' | 'medium' | 'high'
}

// Attendance Types
export interface AttendanceData {
  userId: string
  userName: string
  status: 'PRESENT' | 'ABSENT' | 'SICK' | 'LEAVE' | 'WFH'
  checkInTime?: string
  checkOutTime?: string
  location?: string
  notes?: string
}

// Welcome Section Types
export interface WelcomeConfig {
  title: string
  subtitle: string
  showDateTime: boolean
  showRole: boolean
  showQuickStats: boolean
}

// Summary Card Types
export interface SummaryCard {
  title: string
  value: string | number
  description: string
  icon: any
  color: string
  trend?: {
    value: number
    isPositive: boolean
    period: string
  }
  actions?: {
    label: string
    href: string
    icon: any
  }[]
}

// Activity Feed Types
export interface ActivityItem {
  id: string
  type: 'user' | 'task' | 'document' | 'attendance' | 'leave' | 'wfh'
  title: string
  description: string
  timestamp: string
  user: string
  icon: any
  color: string
  metadata?: {
    status?: string
    priority?: string
    department?: string
  }
}

// Chart Types
export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor: string[]
    borderColor: string[]
    borderWidth: number
  }[]
}

// Quick Stats Types
export interface QuickStatItem {
  label: string
  value: string | number
  icon: any
  color: string
  size?: 'sm' | 'md' | 'lg'
  trend?: {
    value: number
    isPositive: boolean
  }
}

// Calendar Event Types
export interface CalendarEvent {
  id: string
  title: string
  date: string
  type: 'attendance' | 'leave' | 'wfh' | 'task' | 'meeting' | 'holiday' | 'birthday'
  status?: 'present' | 'absent' | 'late' | 'approved' | 'pending' | 'rejected' | 'completed' | 'overdue'
  description?: string
  startTime?: string
  endTime?: string
  participants?: string[]
  location?: string
  priority?: 'low' | 'medium' | 'high'
}

// Search Result Types
export interface SearchResult {
  id: string
  title: string
  description: string
  type: 'user' | 'document' | 'task' | 'attendance' | 'leave' | 'wfh' | 'invoice' | 'folder'
  url: string
  metadata?: {
    status?: string
    date?: string
    author?: string
    location?: string
    priority?: string
    department?: string
    tags?: string[]
  }
  relevance: number
}

// Search Filter Types
export interface SearchFilter {
  type: string[]
  status: string[]
  dateRange: {
    start: string
    end: string
  }
  department: string[]
  priority: string[]
}

// Help Article Types
export interface HelpArticle {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  lastUpdated: string
  views: number
  helpful: number
  videoUrl?: string
  externalLinks?: string[]
}

// Help Category Types
export interface HelpCategory {
  id: string
  name: string
  description: string
  icon: any
  color: string
  articleCount: number
}

// Dashboard Layout Types
export interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

export interface DashboardSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  actions?: React.ReactNode
}

export interface DashboardGridProps {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export interface DashboardHeaderProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
  className?: string
}

export interface DashboardFooterProps {
  children: React.ReactNode
  className?: string
}

export interface DashboardEmptyStateProps {
  icon: any
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    icon?: any
  }
  className?: string
}

// Chart Configuration Types
export interface ChartConfig {
  title: string
  type: 'bar' | 'pie' | 'line' | 'doughnut'
  data: ChartData
  options?: any
  height?: number
  showLegend?: boolean
  showTooltip?: boolean
}

// Progress Configuration Types
export interface ProgressConfig {
  title: string
  items: ProgressItem[]
  showPercentage?: boolean
  showIcons?: boolean
  showTrends?: boolean
}

// Quick Actions Configuration Types
export interface QuickActionsConfig {
  title: string
  actions: QuickAction[]
  layout?: 'grid' | 'list'
  maxItems?: number
}

// Overview Configuration Types
export interface OverviewConfig {
  title: string
  items: OverviewItem[]
  layout?: 'grid' | 'list'
  showTrends?: boolean
  maxItems?: number
}

// Summary Cards Configuration Types
export interface SummaryCardsConfig {
  title: string
  cards: SummaryCard[]
  layout?: 'grid' | 'list'
  cols?: 1 | 2 | 3 | 4
  showTrends?: boolean
}

// Activity Feed Configuration Types
export interface ActivityFeedConfig {
  title: string
  activities: ActivityItem[]
  maxItems?: number
  showTimestamps?: boolean
  showUserAvatars?: boolean
  showCategories?: boolean
}

// Quick Stats Configuration Types
export interface QuickStatsConfig {
  title: string
  items: QuickStatItem[]
  layout?: 'grid' | 'list'
  cols?: 1 | 2 | 3 | 4 | 5 | 6
  showTrends?: boolean
  size?: 'sm' | 'md' | 'lg'
}

// Calendar Configuration Types
export interface CalendarConfig {
  title: string
  view: 'month' | 'week' | 'day'
  showEventDetails?: boolean
  showStatus?: boolean
  showTime?: boolean
  showParticipants?: boolean
}

// Search Configuration Types
export interface SearchConfig {
  title: string
  searchTypes: string[]
  showFilters?: boolean
  showRecentSearches?: boolean
  showSearchSuggestions?: boolean
  maxResults?: number
}

// Help Configuration Types
export interface HelpConfig {
  title: string
  showCategories?: boolean
  showSearch?: boolean
  showFavorites?: boolean
  showRecent?: boolean
  maxArticles?: number
}
