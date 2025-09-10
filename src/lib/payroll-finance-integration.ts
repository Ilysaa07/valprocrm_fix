import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface PayrollFinanceData {
  payrollId: string
  employeeName: string
  period: string
  netSalary: number
  paymentMethod: 'BANK' | 'EWALLET' | 'BOTH'
  bankAccount?: string
  ewalletNumber?: string
  createdById: string
}

export interface FinanceIntegrationResult {
  success: boolean
  transactionId?: string
  error?: string
}

/**
 * Service untuk integrasi otomatis antara Payroll dan Finance
 * Mencatat transaksi pengeluaran gaji secara otomatis saat slip gaji dibuat
 */
export class PayrollFinanceIntegration {
  
  /**
   * Membuat transaksi keuangan otomatis untuk slip gaji
   * @param payrollData Data slip gaji yang akan dicatat
   * @returns Hasil integrasi dengan transaction ID atau error
   */
  static async createPayrollTransaction(payrollData: PayrollFinanceData): Promise<FinanceIntegrationResult> {
    try {
      // Validasi data
      if (!payrollData.payrollId || !payrollData.employeeName || !payrollData.period || !payrollData.netSalary) {
        return {
          success: false,
          error: 'Data payroll tidak lengkap untuk integrasi keuangan'
        }
      }

      // Buat deskripsi transaksi
      const description = this.generateTransactionDescription(payrollData)
      
      // Tentukan kategori berdasarkan metode pembayaran
      const category = this.getTransactionCategory(payrollData.paymentMethod)

      // Buat transaksi keuangan
      const transaction = await prisma.transaction.create({
        data: {
          type: 'EXPENSE',
          category: category,
          amount: payrollData.netSalary,
          description: description,
          date: new Date(),
          createdById: payrollData.createdById,
          payrollId: payrollData.payrollId
        }
      })

      return {
        success: true,
        transactionId: transaction.id
      }

    } catch (error) {
      console.error('Error creating payroll transaction:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Terjadi kesalahan saat mencatat transaksi keuangan'
      }
    }
  }

  /**
   * Update transaksi keuangan saat slip gaji diubah
   * @param payrollId ID slip gaji
   * @param newData Data baru untuk update
   * @returns Hasil update
   */
  static async updatePayrollTransaction(payrollId: string, newData: Partial<PayrollFinanceData>): Promise<FinanceIntegrationResult> {
    try {
      // Cari transaksi yang terkait dengan payroll ini
      const existingTransaction = await prisma.transaction.findFirst({
        where: { payrollId: payrollId }
      })

      if (!existingTransaction) {
        return {
          success: false,
          error: 'Transaksi keuangan tidak ditemukan untuk payroll ini'
        }
      }

      // Update transaksi jika ada perubahan
      const updateData: Prisma.TransactionUpdateInput = {}

      if (newData.netSalary !== undefined) {
        updateData.amount = newData.netSalary
      }

      if (newData.employeeName || newData.period || newData.paymentMethod) {
        const currentData = {
          employeeName: newData.employeeName || '',
          period: newData.period || '',
          paymentMethod: newData.paymentMethod || 'BANK',
          bankAccount: newData.bankAccount,
          ewalletNumber: newData.ewalletNumber
        }
        updateData.description = this.generateTransactionDescription(currentData as PayrollFinanceData)
      }

      if (newData.paymentMethod) {
        updateData.category = this.getTransactionCategory(newData.paymentMethod)
      }

      // Update transaksi
      const updatedTransaction = await prisma.transaction.update({
        where: { id: existingTransaction.id },
        data: updateData
      })

      return {
        success: true,
        transactionId: updatedTransaction.id
      }

    } catch (error) {
      console.error('Error updating payroll transaction:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengupdate transaksi keuangan'
      }
    }
  }

  /**
   * Hapus transaksi keuangan saat slip gaji dibatalkan
   * @param payrollId ID slip gaji
   * @returns Hasil penghapusan
   */
  static async deletePayrollTransaction(payrollId: string): Promise<FinanceIntegrationResult> {
    try {
      // Cari dan hapus transaksi yang terkait
      const deletedTransaction = await prisma.transaction.deleteMany({
        where: { payrollId: payrollId }
      })

      if (deletedTransaction.count === 0) {
        return {
          success: false,
          error: 'Transaksi keuangan tidak ditemukan untuk payroll ini'
        }
      }

      return {
        success: true
      }

    } catch (error) {
      console.error('Error deleting payroll transaction:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Terjadi kesalahan saat menghapus transaksi keuangan'
      }
    }
  }

  /**
   * Generate deskripsi transaksi berdasarkan data payroll
   */
  private static generateTransactionDescription(data: PayrollFinanceData): string {
    const paymentInfo = this.getPaymentMethodInfo(data)
    return `Pembayaran Gaji - ${data.employeeName} (${data.period}) - ${paymentInfo}`
  }

  /**
   * Tentukan kategori transaksi berdasarkan metode pembayaran
   */
  private static getTransactionCategory(paymentMethod: 'BANK' | 'EWALLET' | 'BOTH'): Prisma.TransactionCategory {
    // Semua pembayaran gaji menggunakan kategori PAYROLL_EXPENSE
    return 'PAYROLL_EXPENSE'
  }

  /**
   * Generate informasi metode pembayaran untuk deskripsi
   */
  private static getPaymentMethodInfo(data: PayrollFinanceData): string {
    if (data.paymentMethod === 'BOTH') {
      return `Bank: ${data.bankAccount || 'N/A'}, E-wallet: ${data.ewalletNumber || 'N/A'}`
    } else if (data.paymentMethod === 'BANK') {
      return `Bank: ${data.bankAccount || 'N/A'}`
    } else if (data.paymentMethod === 'EWALLET') {
      return `E-wallet: ${data.ewalletNumber || 'N/A'}`
    }
    return 'Metode pembayaran tidak diketahui'
  }

  /**
   * Validasi apakah payroll sudah memiliki transaksi keuangan
   * @param payrollId ID slip gaji
   * @returns True jika sudah ada transaksi
   */
  static async hasExistingTransaction(payrollId: string): Promise<boolean> {
    try {
      const transaction = await prisma.transaction.findFirst({
        where: { payrollId: payrollId }
      })
      return !!transaction
    } catch (error) {
      console.error('Error checking existing transaction:', error)
      return false
    }
  }

  /**
   * Dapatkan transaksi keuangan yang terkait dengan payroll
   * @param payrollId ID slip gaji
   * @returns Data transaksi atau null
   */
  static async getPayrollTransaction(payrollId: string) {
    try {
      return await prisma.transaction.findFirst({
        where: { payrollId: payrollId },
        include: {
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      })
    } catch (error) {
      console.error('Error getting payroll transaction:', error)
      return null
    }
  }
}
