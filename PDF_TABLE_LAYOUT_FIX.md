# Perbaikan Layout Tabel PDF - Kolom Pajak Terpotong

## Masalah yang Diperbaiki

### Issue
- Tulisan "Pajak" di header tabel terpotong karena posisi kolom terlalu dekat dengan tepi kanan halaman
- Kolom "Jumlah" dan "Pajak" saling tumpang tindih

### Root Cause
- Posisi kolom "Jumlah" menggunakan `pageWidth - 50`
- Posisi kolom "Pajak" menggunakan `pageWidth - 20`
- Jarak 30px antara kedua kolom tidak cukup untuk menampilkan teks dengan font size 9

## Solusi yang Diterapkan

### 1. Penyesuaian Posisi Kolom

#### Sebelum (Problematic)
```javascript
// Header
doc.text('Jumlah', pageWidth - 50, yPosition, { align: 'right' })
doc.text('Pajak', pageWidth - 20, yPosition, { align: 'center' })

// Table rows
doc.text(formatCurrency(component.amount), pageWidth - 50, yPosition, { align: 'right' })
doc.text(component.isTaxable ? 'Ya' : 'Tidak', pageWidth - 20, yPosition, { align: 'center' })
```

#### Sesudah (Fixed)
```javascript
// Header
doc.text('Jumlah', pageWidth - 60, yPosition, { align: 'right' })
doc.text('Pajak', pageWidth - 30, yPosition, { align: 'center' })

// Table rows
doc.text(formatCurrency(component.amount), pageWidth - 60, yPosition, { align: 'right' })
doc.text(component.isTaxable ? 'Ya' : 'Tidak', pageWidth - 30, yPosition, { align: 'center' })
```

### 2. Analisis Layout Tabel

#### Kolom Layout (A4 Page Width ≈ 210mm)
```
| No | Komponen | Jumlah | Pajak |
|----|----------|--------|-------|
| 25 | 35       | -60    | -30   |
```

#### Spacing Calculation
- **No**: Posisi 25 (margin kiri 20 + 5)
- **Komponen**: Posisi 35 (margin kiri 20 + 15)
- **Jumlah**: Posisi `pageWidth - 60` (margin kanan 60)
- **Pajak**: Posisi `pageWidth - 30` (margin kanan 30)

#### Jarak Antar Kolom
- **Komponen → Jumlah**: `(pageWidth - 60) - 35` = cukup untuk nama komponen
- **Jumlah → Pajak**: `(pageWidth - 30) - (pageWidth - 60)` = 30px (cukup untuk "Ya"/"Tidak")

### 3. Font Size Consideration

#### Current Font Size: 9
- **"Pajak"**: 5 karakter × ~2px = ~10px width
- **"Ya"**: 2 karakter × ~2px = ~4px width
- **"Tidak"**: 5 karakter × ~2px = ~10px width

#### Margin Requirements
- **Minimum margin**: 10px untuk readability
- **Current margin**: 30px (cukup untuk semua text)

### 4. Visual Impact

#### Before Fix
```
| No | Komponen | Jumlah | Paj |
|----|----------|--------|-----|
| 1  | Gaji Pokok | 5,000,000 | Ya |
```

#### After Fix
```
| No | Komponen | Jumlah | Pajak |
|----|----------|--------|-------|
| 1  | Gaji Pokok | 5,000,000 | Ya |
```

### 5. Testing Scenarios

#### Test Cases
1. ✅ **Short Component Names**: "Gaji Pokok", "Bonus"
2. ✅ **Long Component Names**: "Tunjangan Transportasi", "Potongan Pinjaman Karyawan"
3. ✅ **Currency Values**: "5,000,000", "1,500,000"
4. ✅ **Tax Status**: "Ya", "Tidak"

#### Validation
- ✅ Header "Pajak" tidak terpotong
- ✅ Values "Ya"/"Tidak" tidak terpotong
- ✅ Kolom "Jumlah" tetap aligned right
- ✅ Kolom "Pajak" tetap centered
- ✅ Alternating row colors tetap berfungsi

### 6. Layout Optimization

#### Table Width Utilization
- **Total table width**: `pageWidth - 40` (20px margin each side)
- **Column distribution**:
  - No: 10px
  - Komponen: Flexible (remaining space)
  - Jumlah: 60px (right-aligned)
  - Pajak: 30px (centered)

#### Responsive Design
- Layout tetap optimal untuk A4 size
- Tidak ada overflow ke halaman berikutnya
- Readability tetap terjaga

## Hasil Akhir

### Fixed Issues
1. ✅ **Header "Pajak"**: Tidak terpotong lagi
2. ✅ **Values "Ya"/"Tidak"**: Tidak terpotong lagi
3. ✅ **Column Alignment**: Tetap proper alignment
4. ✅ **Table Layout**: Lebih rapi dan professional

### Maintained Features
1. ✅ **Color Accent**: Tetap menggunakan #042d64
2. ✅ **Alternating Rows**: Tetap berfungsi
3. ✅ **Font Size**: Tetap 9px untuk readability
4. ✅ **A4 Optimization**: Tetap optimal untuk ukuran A4

### File yang Dimodifikasi
- `src/components/payroll/PayrollPDFGenerator.tsx`

### Dependencies
- Tidak ada dependency tambahan
- Perubahan hanya pada positioning values
