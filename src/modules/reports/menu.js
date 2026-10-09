/** @type {import('@/layout/menuTypes').MenuItem[]} */
export default [
    {
        key: 'reports',
        label: 'Reports',
        to: null,
        icon: 'pi pi-chart-line',
        order: 80,
        permissions: [
            'reports.email-logs.view',
            'reports.scheduled-jobs.view',
            'reports.audit-log.view'
        ],
        items: [
            {
                key: 'reports.email-logs',
                label: 'Email Logs',
                to: '/reports/email-logs',
                icon: 'pi pi-fw pi-inbox',
                permissions: ['reports.email-logs.view']
            },
            {
                key: 'reports.scheduled-jobs',
                label: 'Scheduled Jobs',
                to: '/reports/scheduled-jobs',
                icon: 'pi pi-fw pi-clock',
                permissions: ['reports.scheduled-jobs.view']
            },
            {
                key: 'reports.audit-logs',
                label: 'Audit Log',
                to: '/reports/audit-logs',
                icon: 'pi pi-fw pi-history',
                permissions: ['reports.audit-log.view']
            }
        ]
    }
];
