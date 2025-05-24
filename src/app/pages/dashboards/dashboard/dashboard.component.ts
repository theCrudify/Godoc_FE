import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, catchError, of } from 'rxjs';
import { Router } from '@angular/router';
import { AppService } from 'src/app/shared/service/app.service';

// Interface for chart type
interface ChartType {
  series?: any;
  chart?: any;
  dataLabels?: any;
  plotOptions?: any;
  yaxis?: any;
  xaxis?: any;
  fill?: any;
  tooltip?: any;
  stroke?: any;
  legend?: any;
  labels?: any;
  markers?: any;
  colors?: any;
  grid?: any;
  title?: any;
  subtitle?: any;
  responsive?: any;
}

// Interface for summary data
interface StatData {
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: string;
  color: string;
  growth?: number;
  subText: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})

/**
 * Dashboard Component
 */
export class DashboardComponent implements OnInit {

  // bread crumb items
  breadCrumbItems: Array<{}> = [
    { label: 'Home', active: false },
    { label: 'Dashboard', active: true }
  ];

  // Chart data
  lineCodeChart!: ChartType;
  workflowChart!: ChartType;
  documentTrendChart!: ChartType;
  lineCodeFlowChart!: ChartType;
  
  // Date range
  currentDate: any;
  selectedPeriod: string = 'monthly';
  selectedDepartmentId: number | null = null;
  
  // Statistics data
  statData: StatData[] = [];
  documentStatusData: any;
  departmentData: any[] = [];
  topSubmitters: any[] = [];
  topApprovers: any[] = [];
  lineCodeData: any[] = [];
  filteredLineCodeData: any[] = [];
  lineCodeSearchTerm: string = '';
  
  // Loading flags
  isLoading = true;
  isDocumentTrendLoading = true;
  isLineCodeLoading = true;
  isTopPerformersLoading = true;
  isDepartmentLoading = true;

  // Error flags
  hasError = false;
  errorMessage = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalLineCodeItems: number = 0;
  totalPages: number = 1;
  paginationStart: number = 1;
  paginationEnd: number = 5;

  // Department list for filters
  departments: any[] = [];

  // Math reference for use in template
  Math = Math;

  constructor(
    private http: HttpClient,
    private service: AppService,
    private router: Router
  ) {
    // Set initial date range (last 6 months)
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    this.currentDate = { from: sixMonthsAgo, to: today };
  }

  ngOnInit(): void {
    // Load list of departments for filters
    this.loadDepartments();
    
    // Initialize dashboard data
    this.loadDashboardData();
  }

  /**
   * Load list of departments for filter dropdowns
   */
  loadDepartments(): void {
    this.service.get('/departments').pipe(
      catchError(err => {
        console.error('Error loading departments:', err);
        return of({ data: [] });
      })
    ).subscribe(response => {
      if (response && response.data) {
        this.departments = response.data;
      }
    });
  }

  /**
   * Load all dashboard data
   */
  loadDashboardData(): void {
    this.isLoading = true;
    this.hasError = false;
    
    // Build query parameters
    const departmentParam = this.selectedDepartmentId ? `department_id=${this.selectedDepartmentId}` : '';
    const fromDate = this.formatDate(this.currentDate.from);
    const toDate = this.formatDate(this.currentDate.to);
    const dateParams = `date_from=${fromDate}&date_to=${toDate}`;
    
    // Load all data in parallel using forkJoin
    forkJoin({
      documentMapping: this.service.get('/documentmapping'),
      departmentInvolvement: this.service.get('/dashboarddepartments'),
      trends: this.service.get(`/docstatistics/trends?${departmentParam}`),
      timeStats: this.service.get(`/docstatistics/time?period=${this.selectedPeriod}&start_date=${fromDate}&end_date=${toDate}&${departmentParam}`),
      lineCodes: this.service.get(`/line-codes?${departmentParam}`),
      lineCodesFlow: this.service.get(`/line-codes/flow?${departmentParam}`),
      topSubmitters: this.service.get(`/top-performers/submitters?limit=5&${dateParams}&${departmentParam}`),
      topApprovers: this.service.get(`/top-performers/approvers?limit=5&${dateParams}&${departmentParam}`)
    }).subscribe({
      next: (response) => {
        // Process document statuses
        this.processDocumentStatus(response.documentMapping);
        
        // Process department involvement
        this.processDepartmentData(response.departmentInvolvement.data);
        
        // Process document trend data
        this.processDocumentTrends(response.trends);
        
        // Process time statistics
        this.processTimeStatistics(response.timeStats);
        
        // Process line code data
        this.processLineCodeData(response.lineCodes, response.lineCodesFlow);
        
        // Process top performers
        this.processTopPerformers(response.topSubmitters.data, response.topApprovers.data);
        
        // Create stat cards data
        this.createStatCards(response);
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = 'Failed to load dashboard data. Please try again later.';
        // Show toast message would go here if we had a toast service
      }
    });
  }

  /**
   * Format date as YYYY-MM-DD
   */
  formatDate(date: Date): string {
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  /**
   * Process document status mapping data
   */
  processDocumentStatus(data: any): void {
    if (!data) return;
    
    this.documentStatusData = {
      totalDocuments: data.totalDocuments || 0,
      stages: [
        {
          name: 'Proposed Changes',
          count: data.documentsByStage?.proposedChanges || 0,
          percentage: this.calculatePercentage(data.documentsByStage?.proposedChanges, data.totalDocuments),
          icon: 'file-text',
          color: 'primary'
        },
        {
          name: 'Authorization',
          count: data.documentsByStage?.authorization || 0,
          percentage: this.calculatePercentage(data.documentsByStage?.authorization, data.totalDocuments),
          icon: 'check-square',
          color: 'warning'
        },
        {
          name: 'Handover',
          count: data.documentsByStage?.handover || 0,
          percentage: this.calculatePercentage(data.documentsByStage?.handover, data.totalDocuments),
          icon: 'upload',
          color: 'info'
        },
        {
          name: 'Completed',
          count: data.documentsByStage?.completed || 0,
          percentage: this.calculatePercentage(data.documentsByStage?.completed, data.totalDocuments),
          icon: 'check-circle',
          color: 'success'
        }
      ]
    };
  }

  /**
   * Process department involvement data
   */
processDepartmentData(data: any[]): void {
  this.isDepartmentLoading = true;

  if (!data || data.length === 0) {
    this.departmentData = [];
    this.filteredLineCodeData = [];
    this.totalLineCodeItems = 0;
    this.totalPages = 1;
    this.currentPage = 1;
    this.isDepartmentLoading = false;
    return;
  }

  // Map all data first (without slicing to top 10)
  this.departmentData = data.map(dept => ({
    id: dept.department_id,
    name: dept.department_name,
    code: dept.department_code,
    plant: dept.plant_name,
    totalDocuments: dept.total_dokumen,
    proposedChanges: dept.status_dokumen.tahap_proposed_changes,
    authorization: dept.status_dokumen.tahap_authorization,
    handover: dept.status_dokumen.tahap_handover,
    completed: dept.status_dokumen.sudah_selesai,
    completionRate: this.calculatePercentage(dept.status_dokumen.sudah_selesai, dept.total_dokumen)
  }));

  this.totalLineCodeItems = this.departmentData.length;
  this.totalPages = Math.ceil(this.totalLineCodeItems / this.itemsPerPage);
  this.currentPage = 1;
  this.updateDepartmentPagination();
  this.isDepartmentLoading = false;
}

updateDepartmentPagination(): void {
  const startIndex = (this.currentPage - 1) * this.itemsPerPage;
  const endIndex = startIndex + this.itemsPerPage;
  this.filteredLineCodeData = this.departmentData.slice(startIndex, endIndex);
}


  /**
   * Process document trends data
   */
  processDocumentTrends(data: any): void {
    this.isDocumentTrendLoading = true;
    
    if (!data || !data.data || data.data.length === 0) {
      this.isDocumentTrendLoading = false;
      return;
    }
    
    const labels = data.data.map((item: any) => item.month);
    const proposedChanges = data.data.map((item: any) => item.proposed_changes);
    const authorization = data.data.map((item: any) => item.authorization_docs);
    const handovers = data.data.map((item: any) => item.handovers);
    const completed = data.data.map((item: any) => item.completed);
    
    this.documentTrendChart = {
      series: [
        {
          name: 'Proposed Changes',
          type: 'column',
          data: proposedChanges
        },
        {
          name: 'Authorization',
          type: 'column',
          data: authorization
        },
        {
          name: 'Handover',
          type: 'column',
          data: handovers
        },
        {
          name: 'Completed',
          type: 'line',
          data: completed
        }
      ],
      chart: {
        height: 350,
        type: 'line',
        stacked: false,
        toolbar: {
          show: true
        }
      },
      stroke: {
        width: [0, 0, 0, 3],
        curve: 'smooth'
      },
      plotOptions: {
        bar: {
          columnWidth: '50%'
        }
      },
      fill: {
        opacity: [0.85, 0.85, 0.85, 1],
        gradient: {
          inverseColors: false,
          shade: 'light',
          type: 'vertical',
          opacityFrom: 0.85,
          opacityTo: 0.55
        }
      },
      labels: labels,
      markers: {
        size: 0
      },
      colors: ['#3b82f6', '#f59e0b', '#06b6d4', '#10b981'],
      xaxis: {
        type: 'category'
      },
      yaxis: {
        title: {
          text: 'Document Count'
        }
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: function (y: any) {
            if (typeof y !== "undefined") {
              return y.toFixed(0) + " documents";
            }
            return y;
          }
        }
      },
      legend: {
        position: 'top'
      }
    };
    
    this.isDocumentTrendLoading = false;
  }

  /**
   * Process time statistics data
   */
  processTimeStatistics(data: any): void {
    if (!data || !data.data) return;
    
    // Process time-based statistics if needed
    // This would be for more detailed time-based visualizations
  }

// In your processLineCodeData method, update the lineCodeChart configuration:

processLineCodeData(lineCodesData: any, flowData: any): void {
  this.isLineCodeLoading = true;
  
  if (!lineCodesData || !flowData) {
    this.isLineCodeLoading = false;
    return;
  }
  
  // Process line code distribution chart
  if (lineCodesData.chart_data) {
    this.lineCodeChart = {
      series: lineCodesData.chart_data.datasets[0].data,
      chart: {
        type: 'donut',
        height: 400, // Increased height
        width: '100%' // Ensure full width
      },
      labels: lineCodesData.chart_data.labels,
      colors: lineCodesData.chart_data.datasets[0].backgroundColor,
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '14px',
        itemMargin: {
          horizontal: 10,
          vertical: 5
        }
      },
      plotOptions: {
        pie: {
          donut: {
            size: '80%', // Adjust donut size
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '16px',
                fontWeight: 600,
                color: undefined,
                offsetY: -10
              },
              value: {
                show: true,
                fontSize: '14px',
                fontWeight: 400,
                color: undefined,
                offsetY: 16,
                formatter: function (val: string) {
                  return val + '%'
                }
              },
              total: {
                show: true,
                showAlways: false,
                label: 'Total',
                fontSize: '22px',
                fontWeight: 600,
                color: '#373d3f'
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: true,
        dropShadow: {
          enabled: false
        },
        style: {
          fontSize: '12px',
          fontWeight: 'bold'
        }
      },
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            height: 300
          },
          legend: {
            position: 'bottom'
          }
        }
      }]
    };
  }
  
  // Rest of your flow chart code remains the same...
  if (flowData.chart_data) {
    const chartData = flowData.chart_data;
    this.lineCodeFlowChart = {
      series: chartData.datasets.map((dataset: any) => ({
        name: dataset.label,
        data: dataset.data
      })),
      chart: {
        type: 'bar',
        height: 350,
        stacked: true,
        toolbar: {
          show: true
        }
      },
      plotOptions: {
        bar: {
          horizontal: false
        }
      },
      stroke: {
        width: 1,
        colors: ['#fff']
      },
      xaxis: {
        categories: chartData.labels
      },
      yaxis: {
        title: {
          text: 'Document Count'
        }
      },
      fill: {
        opacity: 1
      },
      colors: ['#3b82f6', '#f59e0b', '#f97316', '#10b981'],
      legend: {
        position: 'top'
      }
    };
  }
  
  // Process line code data for table display
  if (lineCodesData.data) {
    this.lineCodeData = lineCodesData.data.map((item: any) => ({
      lineCode: item.line_code,
      totalDocuments: item.total_documents,
      percentage: item.percentage,
      statusBreakdown: item.status_breakdown,
      recentDocuments: item.recent_documents
    }));
    
    this.filteredLineCodeData = [...this.lineCodeData];
    this.totalLineCodeItems = this.filteredLineCodeData.length;
    this.totalPages = Math.ceil(this.totalLineCodeItems / this.itemsPerPage);
    this.updatePageRange();
  }
  
  this.isLineCodeLoading = false;
}
  
  /**
   * Get status badge class for a status
   */
  getStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved':
      case 'done':
        return 'bg-success';
      case 'in_progress':
      case 'pending':
      case 'ongoing':
        return 'bg-warning text-dark';
      case 'rejected':
      case 'cancelled':
      case 'failed':
        return 'bg-danger';
      case 'draft':
      case 'new':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  }

  /**
   * Get page numbers for pagination
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = this.paginationStart; i <= this.paginationEnd; i++) {
      if (i <= this.totalPages) {
        pages.push(i);
      }
    }
    return pages;
  }

  /**
   * Export dashboard data to Excel or PDF
   */
  exportDashboard(format: 'excel' | 'pdf'): void {
    console.log(`Exporting dashboard to ${format.toUpperCase()}...`);
    // Implementation for export would go here
  }

  /**
   * Refresh dashboard data
   */
  refreshDashboard(): void {
    this.loadDashboardData();
    console.log('Dashboard refreshed successfully');
  }

  /**
   * Process top performers data
   */
  processTopPerformers(submitters: any[], approvers: any[]): void {
    this.isTopPerformersLoading = true;
    
    if (submitters && submitters.length > 0) {
      this.topSubmitters = submitters.map(item => ({
        rank: item.rank,
        employeeName: item.user.employee_name,
        employeeCode: item.user.employee_code,
        department: item.user.department?.department_name || 'N/A',
        totalHandovers: item.stats.total_handovers,
        averageRating: item.stats.average_rating,
        bestRating: item.stats.best_rating,
        worstRating: item.stats.worst_rating
      }));
    } else {
      this.topSubmitters = [];
    }
    
    if (approvers && approvers.length > 0) {
      this.topApprovers = approvers.map(item => ({
        rank: item.rank,
        employeeName: item.user.employee_name,
        employeeCode: item.user.employee_code,
        department: item.user.department?.department_name || 'N/A',
        totalApprovals: item.stats.total_approvals,
        averageRating: item.stats.average_rating,
        highestRating: item.stats.highest_rating,
        lowestRating: item.stats.lowest_rating
      }));
    } else {
      this.topApprovers = [];
    }
    
    this.isTopPerformersLoading = false;
  }

  /**
   * Create summary stat cards
   */
  createStatCards(data: any): void {
    // Summary statistics
    const documentMapping = data.documentMapping;
    const trendData = data.trends;
    const lineCodeData = data.lineCodes;
    
    this.statData = [
      {
        title: 'Total Documents',
        value: documentMapping.totalDocuments || 0,
        icon: 'file-text',
        color: 'primary',
        growth: this.calculateGrowth(trendData),
        subText: 'vs previous period'
      },
      {
        title: 'Completion Rate',
        value: this.calculateCompletionRate(documentMapping),
        suffix: '%',
        icon: 'check-circle',
        color: 'success',
        subText: 'documents completed'
      },
      {
        title: 'Active Line Codes',
        value: lineCodeData.summary?.total_line_codes || 0,
        icon: 'code',
        color: 'info',
        subText: 'across all documents'
      },
      {
        title: 'Completed This Month',
        value: this.calculateCompletedThisMonth(data.timeStats),
        icon: 'calendar-check',
        color: 'warning',
        subText: 'documents this month'
      }
    ];
  }

  /**
   * Calculate percentage
   */
  calculatePercentage(value: number, total: number): number {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  /**
   * Calculate growth rate from trend data
   */
  calculateGrowth(trendData: any): number {
    if (!trendData || !trendData.data || trendData.data.length < 2) return 0;
    
    const data = trendData.data;
    const currentMonth = data[data.length - 1];
    const previousMonth = data[data.length - 2];
    
    const currentTotal = currentMonth.proposed_changes + currentMonth.authorization_docs + 
                         currentMonth.handovers;
    const previousTotal = previousMonth.proposed_changes + previousMonth.authorization_docs + 
                          previousMonth.handovers;
    
    if (previousTotal === 0) return 100; // If previous was 0, show 100% growth
    
    return Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
  }

  /**
   * Calculate overall completion rate
   */
  calculateCompletionRate(documentMapping: any): number {
    if (!documentMapping || !documentMapping.totalDocuments || documentMapping.totalDocuments === 0) return 0;
    
    const completed = documentMapping.documentsByStage?.completed || 0;
    return Math.round((completed / documentMapping.totalDocuments) * 100);
  }

  /**
   * Calculate completed documents in current month
   */
  calculateCompletedThisMonth(timeStats: any): number {
    if (!timeStats || !timeStats.data) return 0;
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const currentPeriodKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    
    const currentMonthData = timeStats.data.find((item: any) => 
      item.period_key.startsWith(currentPeriodKey)
    );
    
    return currentMonthData ? currentMonthData.handovers.completed : 0;
  }

  /**
   * Handle date range changes
   */
  onDateRangeChange(): void {
    this.loadDashboardData();
  }

  /**
   * Handle period changes (monthly, weekly, daily)
   */
  onPeriodChange(period: string): void {
    this.selectedPeriod = period;
    this.loadDashboardData();
  }

  /**
   * Handle department filter changes
   */
  onDepartmentChange(departmentId: number | null): void {
    this.selectedDepartmentId = departmentId;
    this.loadDashboardData();
  }

  /**
   * Search line codes
   */
  searchLineCodes(): void {
    if (!this.lineCodeSearchTerm) {
      this.filteredLineCodeData = [...this.lineCodeData];
    } else {
      const term = this.lineCodeSearchTerm.toLowerCase();
      this.filteredLineCodeData = this.lineCodeData.filter(item =>
        item.lineCode.toLowerCase().includes(term)
      );
    }
    
    this.totalLineCodeItems = this.filteredLineCodeData.length;
    this.totalPages = Math.ceil(this.totalLineCodeItems / this.itemsPerPage);
    this.currentPage = 1;
    this.updatePageRange();
  }

  /**
   * Clear line code search
   */
  clearSearch(): void {
    this.lineCodeSearchTerm = '';
    this.searchLineCodes();
  }

  /**
   * Navigate to department detail
   */
  viewDepartmentDetail(departmentId: number): void {
    this.router.navigate(['/documents/department', departmentId]);
  }

  /**
   * Get current page data for pagination
   */
  getCurrentPageData(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredLineCodeData.slice(startIndex, endIndex);
  }

  /**
   * Change page
   */
  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePageRange();
  }

  /**
   * Update pagination range
   */
  updatePageRange(): void {
    const totalPageButtons = 5; // Max number of page buttons to show
    
    if (this.totalPages <= totalPageButtons) {
      // If we have fewer pages than buttons, show all pages
      this.paginationStart = 1;
      this.paginationEnd = this.totalPages;
    } else {
      // Calculate the start and end of the pagination range
      const halfWay = Math.ceil(totalPageButtons / 2);
      
      if (this.currentPage <= halfWay) {
        this.paginationStart = 1;
        this.paginationEnd = totalPageButtons;
      } else if (this.currentPage > this.totalPages - halfWay) {
        this.paginationStart = this.totalPages - totalPageButtons + 1;
        this.paginationEnd = this.totalPages;
      } else {
        this.paginationStart = this.currentPage - halfWay + 1;
        this.paginationEnd = this.currentPage + halfWay - 1;
      }
    }
  }

  /**
   * Get status keys for a line code
   */
  getStatusKeys(statusBreakdown: Record<string, number>): string[] {
    if (!statusBreakdown) return [];
    return Object.keys(statusBreakdown);
  }

  
}