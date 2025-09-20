# WFH Integration Wireframes

## Admin Attendance Dashboard - Enhanced Layout

### Main Navigation Tabs
```
┌─────────────────────────────────────────────────────────────────┐
│ [Ringkasan] [Detail Karyawan] [Kalender] [Validasi & Permintaan] [Pengaturan Lokasi] │
└─────────────────────────────────────────────────────────────────┘
```

### Validasi & Permintaan Tab - Desktop View
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Validasi & Permintaan (5)                                    [🔄 Refresh]          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│ ┌─────────────────────────────┐  ┌─────────────────────────────┐                    │
│ │ 👤 John Doe                 │  │ 👤 Jane Smith               │                    │
│ │ john@company.com            │  │ jane@company.com            │                    │
│ │ [WFH]                       │  │ [WFH]                       │                    │
│ │                             │  │                             │                    │
│ │ Working on project tasks    │  │ Client meeting preparation  │                    │
│ │                             │  │                             │                    │
│ │ 📅 Log: 15 Jan 2024, 09:30  │  │ 📅 Log: 15 Jan 2024, 10:15  │                    │
│ │                             │  │                             │                    │
│ │ [📷 Screenshot] [📍 Location] │  │ [📷 Screenshot] [📍 Location] │                    │
│ │                             │  │                             │                    │
│ │ [👁️ Tampilkan Detail]       │  │ [👁️ Tampilkan Detail]       │                    │
│ │                             │  │                             │                    │
│ │ ┌─────────────────────────┐ │  │ ┌─────────────────────────┐ │                    │
│ │ │ 📍 Location Map         │ │  │ │ 📍 Location Map         │ │                    │
│ │ │ [Interactive Map]       │ │  │ │ [Interactive Map]       │ │                    │
│ │ └─────────────────────────┘ │  │ └─────────────────────────┘ │                    │
│ │                             │  │                             │                    │
│ │ ┌─────────────────────────┐ │  │ ┌─────────────────────────┐ │                    │
│ │ │ Catatan Admin:          │ │  │ │ Catatan Admin:          │ │                    │
│ │ │ [Text Area]             │ │  │ │ [Text Area]             │ │                    │
│ │ └─────────────────────────┘ │  │ └─────────────────────────┘ │                    │
│ │                             │  │                             │                    │
│ │ [✅ Setujui] [❌ Tolak]     │  │ [✅ Setujui] [❌ Tolak]     │                    │
│ └─────────────────────────────┘  └─────────────────────────────┘                    │
│                                                                                     │
│ ┌─────────────────────────────┐  ┌─────────────────────────────┐                    │
│ │ 👤 Mike Johnson             │  │ 👤 Sarah Wilson             │                    │
│ │ mike@company.com            │  │ sarah@company.com           │                    │
│ │ [WFH]                       │  │ [WFH]                       │                    │
│ │                             │  │                             │                    │
│ │ Code review and testing     │  │ Documentation updates       │                    │
│ │                             │  │                             │                    │
│ │ 📅 Log: 15 Jan 2024, 11:00  │  │ 📅 Log: 15 Jan 2024, 14:30  │                    │
│ │                             │  │                             │                    │
│ │ [📷 Screenshot] [📍 Location] │  │ [📷 Screenshot] [📍 Location] │                    │
│ │                             │  │                             │                    │
│ │ [👁️ Tampilkan Detail]       │  │ [👁️ Tampilkan Detail]       │                    │
│ │                             │  │                             │                    │
│ │ [✅ Setujui] [❌ Tolak]     │  │ [✅ Setujui] [❌ Tolak]     │                    │
│ └─────────────────────────────┘  └─────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile View - Single Column
```
┌─────────────────────────────────────┐
│ Validasi & Permintaan (5)           │
│                           [🔄]      │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 👤 John Doe                     │ │
│ │ john@company.com                │ │
│ │ [WFH]                           │ │
│ │                                 │ │
│ │ Working on project tasks        │ │
│ │                                 │ │
│ │ 📅 15 Jan 2024, 09:30          │ │
│ │                                 │ │
│ │ [📷 Screenshot] [📍 Location]   │ │
│ │                                 │ │
│ │ [👁️ Tampilkan Detail]           │ │
│ │                                 │ │
│ │ [✅ Setujui] [❌ Tolak]         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 👤 Jane Smith                   │ │
│ │ jane@company.com                │ │
│ │ [WFH]                           │ │
│ │                                 │ │
│ │ Client meeting preparation      │ │
│ │                                 │ │
│ │ 📅 15 Jan 2024, 10:15          │ │
│ │                                 │ │
│ │ [📷 Screenshot] [📍 Location]   │ │
│ │                                 │ │
│ │ [👁️ Tampilkan Detail]           │ │
│ │                                 │ │
│ │ [✅ Setujui] [❌ Tolak]         │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Expanded Detail View
```
┌─────────────────────────────────────────────────────────────────┐
│ 👤 John Doe                                    [WFH]            │
│ john@company.com                                                │
│                                                                 │
│ Working on project tasks                                        │
│                                                                 │
│ 📅 Log time: 15 Jan 2024, 09:30                                │
│                                                                 │
│ [📷 Lihat Screenshot] [📍 Koordinat: -6.2000, 106.8000]        │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📍 Lokasi WFH                                              │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │                                                         │ │ │
│ │ │              [Interactive Map]                          │ │ │
│ │ │                                                         │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Catatan Admin (opsional)                                   │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ Tulis catatan untuk karyawan...                        │ │ │
│ │ │                                                         │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [✅ Setujui] [❌ Tolak]                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Dark Mode Styling

### Color Scheme
- **Background**: `bg-gray-900` (dark mode)
- **Cards**: `bg-gray-800` with `border-gray-700`
- **Text Primary**: `text-white`
- **Text Secondary**: `text-gray-300`
- **Text Muted**: `text-gray-400`
- **Accent Blue**: `text-blue-400` / `hover:text-blue-300`
- **Success Green**: `text-green-400`
- **Error Red**: `text-red-400`

### Interactive Elements
- **Buttons**: Rounded corners, hover effects, disabled states
- **Input Fields**: Focus rings, placeholder styling
- **Links**: Underline on hover, color transitions
- **Badges**: Rounded, colored backgrounds

## Responsive Breakpoints

### Mobile (< 768px)
- Single column layout
- Full-width cards
- Stacked action buttons
- Collapsed details by default
- Touch-optimized spacing

### Tablet (768px - 1024px)
- Two-column grid
- Medium-sized cards
- Side-by-side buttons
- Expandable details
- Balanced spacing

### Desktop (> 1024px)
- Multi-column grid (2-3 columns)
- Compact cards
- Full feature visibility
- Hover interactions
- Efficient use of space

## User Flow

### WFH Validation Process
1. **Admin opens attendance dashboard**
2. **Clicks "Validasi & Permintaan" tab**
3. **Views pending WFH logs in grid layout**
4. **Clicks "Tampilkan Detail" for specific log**
5. **Reviews employee info, description, screenshot**
6. **Checks location on interactive map**
7. **Adds admin notes (optional)**
8. **Clicks "Setujui" or "Tolak"**
9. **Confirms action in dialog**
10. **System processes and updates status**

### Error Handling
- **Loading states**: Spinner animations during processing
- **Success feedback**: Toast notifications for completed actions
- **Error messages**: Clear error descriptions with retry options
- **Validation**: Form validation before submission
- **Confirmation**: Dialog boxes for destructive actions

## Accessibility Features

### Keyboard Navigation
- **Tab order**: Logical flow through interactive elements
- **Focus indicators**: Clear visual focus states
- **Keyboard shortcuts**: Common actions accessible via keyboard
- **Skip links**: Quick navigation to main content

### Screen Reader Support
- **Semantic HTML**: Proper heading structure and landmarks
- **Alt text**: Descriptive text for images and icons
- **ARIA labels**: Additional context for complex interactions
- **Live regions**: Dynamic content updates announced

### Visual Accessibility
- **High contrast**: Sufficient color contrast ratios
- **Text sizing**: Scalable text without layout breaking
- **Focus indicators**: Clear visual focus states
- **Color independence**: Information not conveyed by color alone
