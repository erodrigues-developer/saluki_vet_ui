export interface DashboardChartItem {
  id?: number
  date?: string
  label: string
  value: number
}

export interface DashboardOverview {
  generatedAt: string
  timezone: string
  clinic: {
    status: 'OPEN' | 'CLOSED' | 'UNCONFIGURED'
    closesAt: string | null
    team: { veterinarians: number; receptionists: number }
  }
  today: {
    appointments: {
      total: number
      comparisonPercentage: number | null
      byType: DashboardChartItem[]
    }
    sales: {
      sold: number
      received: number
      averageTicket: number
      comparisonPercentage: number | null
      trend: DashboardChartItem[]
    }
    vaccines: {
      today: number
      overdue: number
      upcoming: number
      items: Array<{
        id: number
        petName: string
        vaccineName: string
        dueDate: string
      }>
    }
  }
  finance: {
    payables: {
      totalPending: number
      totalPaid: number
      totalOverdue: number
      expectedTotal: number
    }
    expenseCategories: Array<{ name: string; value: number }>
    paymentForecast: Array<{
      date: string
      paid: number
      pending: number
      overdue: number
    }>
    revenueByDay: DashboardChartItem[]
    openSales: {
      count: number
      totalPending: number
      items: Array<{ id: number; amount: number; saleDate: string }>
    }
  }
  operation: {
    consultationsLast14Days: DashboardChartItem[]
    attendanceLast7Days: Array<{
      date: string
      attended: number
      canceled: number
      missed: number
    }>
    procedureMix: DashboardChartItem[]
  }
  stock: {
    criticalCount: number
    items: Array<Record<string, any>>
  }
}
