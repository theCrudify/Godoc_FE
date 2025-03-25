import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    id: 131,
    label: 'MENUITEMS.DASHBOARD.TEXT',
    icon: 'ri-dashboard-line',
    link: '/'
  },
  {
    id: 132,
    label: 'Master Data',
    icon: 'ri-database-line',
    subItems: [
      {
        id: 133,
        label: 'Company',
        icon: 'ri-building-line',
        subItems: [
          { id: 134, label: 'Master Authorization', icon: 'ri-apps-2-line', link: '/master-data/authorization' },
          { id: 135, label: 'Master Department', icon: 'ri-building-line', link: '/master-data/department' },
          { id: 136, label: 'Master Section Dept', icon: 'ri-layout-grid-line', link: '/master-data/section-department' },
          { id: 137, label: 'Master Line', icon: 'ri-line-chart-line', link: '/master-data/line' },
          { id: 138, label: 'Master Area', icon: 'ri-map-pin-line', link: '/master-data/master-area' },
          { id: 139, label: 'Section Head', icon: 'ri-user-star-line', link: '/master-data/head-section' },
          { id: 140, label: 'Department Head', icon: 'ri-user-line', link: '/master-data/head-department' }
        ]
      },
      {
        id: 141,
        label: 'Document',
        icon: 'ri-folder-line',
        subItems: [
          { id: 142, label: 'Support Documents', icon: 'ri-file-list-line', link: '/master-data/master-support-doc' },
          { id: 143, label: 'Sub Documents', icon: 'ri-file-paper-line', link: '/master-data/master-subdoc' },
          { id: 144, label: 'Development Doc', icon: 'ri-code-box-line', link: '/master-data/master-development' },
          { id: 145, label: 'Type Doc', icon: 'ri-file-text-line', link: '/master-data/master-doctype' },
          { id: 146, label: 'Doc Categories', icon: 'ri-bookmark-line', link: '/master-data/master-doccategories' }
        ]
      }
    ]
  }
];
