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
        label: 'Master Authorization',
        icon: 'ri-apps-2-line',
        link: '/master-data/authorization'
      },
      {
        id: 134,
        label: 'Master Language',
        icon: 'ri-flag-line',
        link: '/master-data/language'
      },
      {
        id: 135,
        label: 'Master Product',
        icon: 'ri-shopping-bag-line',
        link: '/master-data/product'
      },
      {
        id: 135,
        label: 'Master Site',
        icon: 'ri-shopping-bag-line',
        link: '/master-data/site'
      },
      
     
    ]
  },
  {
    id: 138,
    label: 'Activity',
    icon: 'ri-calendar-line',
    subItems: [
      {
        id: 139,
        label: 'List Document',
        icon: 'ri-file-list-line',
        link: '/activity-page/document-list'
      },

      {
        id: 139,
        label: 'Create Document',
        icon: 'ri-file-list-line',
        link: '/activity-page/document-create'
      },
    
    ]
  },
  {
    id: 141,
    label: 'Approval',
    icon: 'ri-check-double-line',
    subItems: [
      {
        id: 142,
        label: 'Submitted Document',
        icon: 'ri-list-check',
        link: '/approval/list'
      },
      {
        id: 143,
        label: 'Approval Form',
        icon: 'ri-timer-line',
        link: '/approval/status'
      }
    ]
  }
];
