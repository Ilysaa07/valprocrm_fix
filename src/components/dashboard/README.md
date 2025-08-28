# Dashboard Components

Koleksi komponen React yang dapat digunakan kembali untuk membangun dashboard yang konsisten dan responsif.

## Komponen Utama

### 1. DashboardLayout
Komponen layout utama untuk dashboard dengan berbagai variasi layout.

```tsx
import { DashboardLayout, TwoColumnLayout } from '@/components/dashboard'

// Layout dua kolom
<TwoColumnLayout>
  <DashboardSection title="Statistik" className="col-span-1">
    <StatCard {...statConfig} />
  </DashboardSection>
  <DashboardSection title="Aktivitas" className="col-span-1">
    <ActivityFeed {...activityConfig} />
  </DashboardSection>
</TwoColumnLayout>
```

### 2. StatCard
Komponen untuk menampilkan statistik dengan ikon, nilai, dan deskripsi.

```tsx
import { StatCard, adminStatConfigs } from '@/components/dashboard'

// Menggunakan konfigurasi admin
const stats = adminStatConfigs(dashboardStats)
<StatCard {...stats.totalUsers} />
```

### 3. ProgressOverview
Komponen untuk menampilkan progress bar dari berbagai item.

```tsx
import { ProgressOverview, taskProgressConfig } from '@/components/dashboard'

const progressItems = taskProgressConfig(dashboardStats)
<ProgressOverview {...progressItems} />
```

### 4. QuickActions
Komponen untuk menampilkan aksi cepat dengan ikon dan deskripsi.

```tsx
import { QuickActions, adminQuickActions } from '@/components/dashboard'

<QuickActions {...adminQuickActions} />
```

### 5. OverviewCards
Komponen untuk menampilkan ringkasan dalam format card.

```tsx
import { OverviewCards, attendanceOverviewConfig } from '@/components/dashboard'

const overviewItems = attendanceOverviewConfig(dashboardStats)
<OverviewCards {...overviewItems} />
```

### 6. RecentTasks
Komponen untuk menampilkan daftar tugas terbaru.

```tsx
import { RecentTasks } from '@/components/dashboard'

<RecentTasks tasks={recentTasks} maxItems={5} />
```

### 7. NotificationsSummary
Komponen untuk menampilkan ringkasan notifikasi.

```tsx
import { NotificationsSummary } from '@/components/dashboard'

<NotificationsSummary notifications={notifications} />
```

### 8. AttendanceStatus
Komponen untuk menampilkan status kehadiran hari ini.

```tsx
import { AttendanceStatus } from '@/components/dashboard'

<AttendanceStatus attendanceData={attendanceData} />
```

### 9. WelcomeSection
Komponen untuk menampilkan pesan selamat datang yang dipersonalisasi.

```tsx
import { WelcomeSection, adminWelcomeConfig } from '@/components/dashboard'

const welcomeConfig = adminWelcomeConfig(user, currentTime)
<WelcomeSection {...welcomeConfig} />
```

### 10. SummaryCards
Komponen untuk menampilkan grid card ringkasan.

```tsx
import { SummaryCards, adminSummaryCards } from '@/components/dashboard'

const summaryCards = adminSummaryCards(dashboardStats)
<SummaryCards {...summaryCards} />
```

### 11. ActivityFeed
Komponen untuk menampilkan feed aktivitas terbaru.

```tsx
import { ActivityFeed, adminActivityFeed } from '@/components/dashboard'

const activities = adminActivityFeed(recentActivities)
<ActivityFeed {...activities} />
```

### 12. ChartSummary
Komponen untuk menampilkan chart dengan ringkasan data.

```tsx
import { ChartSummary, attendanceChartConfig } from '@/components/dashboard'

const chartConfig = attendanceChartConfig(attendanceData)
<ChartSummary {...chartConfig} />
```

### 13. QuickStats
Komponen untuk menampilkan statistik cepat dalam format compact.

```tsx
import { QuickStats, adminQuickStats } from '@/components/dashboard'

const quickStats = adminQuickStats(dashboardStats)
<QuickStats {...quickStats} />
```

## Komponen Tambahan

### 14. DashboardNotifications
Komponen untuk menampilkan notifikasi dengan kategori dan prioritas.

```tsx
import { DashboardNotifications, adminNotifications } from '@/components/dashboard'

const notifications = adminNotifications(dashboardStats)
<DashboardNotifications 
  notifications={notifications}
  showCategories={true}
  showPriority={true}
/>
```

### 15. DashboardCalendar
Komponen untuk menampilkan kalender dengan berbagai view (month, week, day).

```tsx
import { DashboardCalendar, attendanceCalendarConfig } from '@/components/dashboard'

<DashboardCalendar 
  events={calendarEvents}
  {...attendanceCalendarConfig}
/>
```

### 16. DashboardSearch
Komponen pencarian dengan filter dan saran pencarian.

```tsx
import { DashboardSearch, adminSearchConfig } from '@/components/dashboard'

<DashboardSearch 
  {...adminSearchConfig}
  onSearch={handleSearch}
  onResultClick={handleResultClick}
/>
```

### 17. DashboardHelp
Komponen pusat bantuan dengan artikel dan kategori.

```tsx
import { DashboardHelp, adminHelpConfig } from '@/components/dashboard'

<DashboardHelp 
  {...adminHelpConfig}
  onArticleClick={handleArticleClick}
/>
```

## Konfigurasi

Setiap komponen memiliki konfigurasi yang telah ditentukan untuk admin dan karyawan:

### Admin Configurations
- `adminStatConfigs` - Konfigurasi statistik untuk admin
- `adminQuickActions` - Aksi cepat untuk admin
- `adminSummaryCards` - Card ringkasan untuk admin
- `adminActivityFeed` - Feed aktivitas untuk admin
- `adminNotifications` - Notifikasi untuk admin
- `adminSearchConfig` - Konfigurasi pencarian untuk admin
- `adminHelpConfig` - Konfigurasi bantuan untuk admin

### Employee Configurations
- `employeeStatConfigs` - Konfigurasi statistik untuk karyawan
- `employeeQuickActions` - Aksi cepat untuk karyawan
- `employeeSummaryCards` - Card ringkasan untuk karyawan
- `employeeActivityFeed` - Feed aktivitas untuk karyawan
- `employeeNotifications` - Notifikasi untuk karyawan
- `employeeSearchConfig` - Konfigurasi pencarian untuk karyawan
- `employeeHelpConfig` - Konfigurasi bantuan untuk karyawan

## Penggunaan

### 1. Import Komponen
```tsx
import { 
  DashboardLayout, 
  StatCard, 
  adminStatConfigs 
} from '@/components/dashboard'
```

### 2. Gunakan Konfigurasi
```tsx
const stats = adminStatConfigs(dashboardStats)
```

### 3. Render Komponen
```tsx
<DashboardLayout>
  <StatCard {...stats.totalUsers} />
  <StatCard {...stats.pendingUsers} />
</DashboardLayout>
```

## Customization

Setiap komponen dapat dikustomisasi dengan props yang sesuai:

```tsx
<StatCard 
  title="Custom Title"
  value={customValue}
  description="Custom description"
  icon={CustomIcon}
  color="bg-custom-100 text-custom-800"
  className="custom-class"
/>
```

## Responsive Design

Semua komponen sudah responsive dan menggunakan Tailwind CSS untuk styling:

- Mobile-first approach
- Grid system yang fleksibel
- Breakpoint yang konsisten
- Dark mode support

## Accessibility

Komponen dashboard sudah mempertimbangkan accessibility:

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support
- Color contrast yang baik

## Performance

Komponen dioptimalkan untuk performa:

- Lazy loading untuk chart
- Memoization untuk data yang tidak berubah
- Efficient re-rendering
- Bundle splitting

## Dependencies

- React 18+
- TypeScript
- Tailwind CSS
- Lucide React (icons)
- Chart.js (untuk chart components)

## Contoh Implementasi Lengkap

```tsx
import { 
  DashboardLayout, 
  TwoColumnLayout,
  DashboardSection,
  StatCard,
  adminStatConfigs,
  QuickActions,
  adminQuickActions,
  ActivityFeed,
  adminActivityFeed
} from '@/components/dashboard'

export default function AdminDashboard({ dashboardStats, recentActivities }) {
  const stats = adminStatConfigs(dashboardStats)
  const quickActions = adminQuickActions
  const activities = adminActivityFeed(recentActivities)

  return (
    <DashboardLayout>
      <TwoColumnLayout>
        <DashboardSection title="Statistik" className="col-span-1">
          <div className="grid grid-cols-2 gap-4">
            <StatCard {...stats.totalUsers} />
            <StatCard {...stats.pendingUsers} />
            <StatCard {...stats.totalTasks} />
            <StatCard {...stats.completedTasks} />
          </div>
        </DashboardSection>
        
        <DashboardSection title="Aksi Cepat" className="col-span-1">
          <QuickActions {...quickActions} />
        </DashboardSection>
        
        <DashboardSection title="Aktivitas Terbaru" className="col-span-2">
          <ActivityFeed {...activities} />
        </DashboardSection>
      </TwoColumnLayout>
    </DashboardLayout>
  )
}
```

## Troubleshooting

### Common Issues

1. **TypeScript Errors**: Pastikan semua types diimport dengan benar
2. **Styling Issues**: Periksa konfigurasi Tailwind CSS
3. **Performance Issues**: Gunakan React DevTools untuk profiling
4. **Responsive Issues**: Test di berbagai ukuran layar

### Getting Help

- Periksa console untuk error messages
- Gunakan React DevTools untuk debugging
- Periksa network tab untuk API calls
- Test komponen secara terpisah

## Contributing

Untuk menambah komponen baru:

1. Buat file komponen di folder yang sesuai
2. Tambahkan types ke `types.ts`
3. Export dari `index.ts`
4. Update dokumentasi ini
5. Test di berbagai skenario

## License

Komponen ini adalah bagian dari project CRM dan mengikuti license yang sama.
