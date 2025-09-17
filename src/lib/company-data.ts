// Company data configuration
export const COMPANY_DATA = {
  name: 'PT. VALPRO INTER TECH',
  description: 'Business Entity Partner',
  address: 'JL. Raya Gading Tutuka No.1758, Soreang Kab.Bandung Jawa Barat Indonesia',
  phone: '+62 22 1234 5678',
  email: 'info@valprointertech.com',
  website: 'www.valprointertech.com',
  logo: '/logo_invoice.png',
  bankAccounts: [
    {
      id: 'bri',
      bankName: 'BRI',
      accountNumber: '2105 0100 0365 563',
      accountHolder: 'a.n PT Valpro Inter Tech',
      logo: '/BRI.png'
    },
    {
      id: 'bca',
      bankName: 'BCA',
      accountNumber: '4373249575',
      accountHolder: 'a.n PT Valpro Inter Tech',
      logo: '/BCA.png'
    }
  ]
}

export const INVOICE_DEFAULTS = {
  currency: 'IDR',
  taxRate: 11, // 11% PPN
  discountType: 'PERCENTAGE' as const,
  paymentTerms: 30, // 30 days
  status: 'UNPAID' as const
}
