import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    id: 1,
    label: 'MENUITEMS.DASHBOARD.TEXT',
    icon: 'ri-dashboard-line',
    link: '/'
  },
  {
    id: 2,
    label: 'Master Data',
    icon: 'ri-database-line',
    subItems: [
      {
        id: 3,
        label: 'Company',
        icon: 'ri-building-line',
        subItems: [
          { id: 4, label: 'Master Authorization', icon: 'ri-apps-2-line', link: '/master-data/authorization' },
          { id: 5, label: 'Master Department', icon: 'ri-building-line', link: '/master-data/department' },
          { id: 6, label: 'Master Section Dept', icon: 'ri-layout-grid-line', link: '/master-data/section-department' },
          { id: 7, label: 'Master Line', icon: 'ri-line-chart-line', link: '/master-data/line' },
          { id: 8, label: 'Master Area', icon: 'ri-map-pin-line', link: '/master-data/master-area' },
          { id: 9, label: 'Section Head', icon: 'ri-user-star-line', link: '/master-data/head-section' },
          { id: 10, label: 'Department Head', icon: 'ri-user-line', link: '/master-data/head-department' }
        ]
      },
      {
        id: 11,
        label: 'Document',
        icon: 'ri-folder-line',
        subItems: [
          { id: 12, label: 'Support Documents', icon: 'ri-file-list-line', link: '/master-data/master-support-doc' },
          { id: 13, label: 'Sub Documents', icon: 'ri-file-paper-line', link: '/master-data/master-subdoc' },
          { id: 14, label: 'Development Documents', icon: 'ri-code-box-line', link: '/master-data/master-development' },
          { id: 15, label: 'Document Types', icon: 'ri-file-text-line', link: '/master-data/master-doctype' },
          { id: 16, label: 'Document Categories', icon: 'ri-bookmark-line', link: '/master-data/master-doccategories' }
        ]
      }
    ]
  },
  {
    id: 17,
    label: 'Activity',
    icon: 'ri-pulse-line',
    subItems: [
      { id: 18, label: 'Generate Document Number', icon: 'ri-file-line', link: '/activity-page/document-number' },
      { id: 19, label: 'Proposed Changes List', icon: 'ri-draft-line', link: '/activity-page/proposedchanges-list' },
      { id: 20, label: 'Authorization Documents', icon: 'ri-shield-line', link: '/activity-page/authorization-list' },
      { id: 21, label: 'Handover Documents', icon: 'ri-exchange-line', link: '/activity-page/handover-list' }
    ]
  },
  {
    id: 22,
    label: 'Approval',
    icon: 'ri-check-double-line',
    subItems: [
      { id: 23, label: 'Approve Proposed Changes', icon: 'ri-draft-line', link: '/activity-page/list-approval-pc' },
      { id: 24, label: 'Approve Authorization', icon: 'ri-shield-line', link: '/activity-page/authorization-list-approver' },
      { id: 25, label: 'Approve Handover', icon: 'ri-exchange-line', link: '/activity-page/handover-list-approver' }
    ]
  },
  {
    id: 26,
    label: 'Desk',
    icon: 'ri-briefcase-line',
    subItems: [
      { id: 27, label: 'Document Completion', icon: 'ri-check-line', link: '/activity-page/completion-list' },
      { id: 28, label: 'Document Collection', icon: 'ri-archive-line', link: '/activity-page/authorization-list-approver' },
      { id: 29, label: 'Rating & Feedback', icon: 'ri-star-line', link: '/activity-page/rating-list' }
    ]
  },
  {
    id: 30, // Perbaikan ID duplikat
    label: 'Admin Area',
    icon: 'ri-briefcase-line',
    subItems: [
      { id: 31, label: 'Document Completion', icon: 'ri-check-line', link: '/activity-page/admin-completion' },
    ]
  }
];