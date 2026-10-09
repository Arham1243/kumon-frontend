export default [
    {
        path: 'reports/email-logs',
        name: 'EmailLogs',
        component: () => import('@/modules/reports/views/email-log/index.vue'),
        meta: {
            breadcrumb: [{ label: 'Reports' }, { label: 'Email Logs' }],
            permission: 'reports.email-logs.view'
        }
    },
    {
        path: 'reports/scheduled-jobs',
        name: 'ScheduledJobs',
        component: () =>
            import('@/modules/reports/views/scheduled-job/index.vue'),
        meta: {
            breadcrumb: [{ label: 'Reports' }, { label: 'Scheduled Jobs' }],
            permission: 'reports.scheduled-jobs.view'
        }
    },
    {
        path: 'reports/audit-logs',
        name: 'AuditLogs',
        component: () => import('@/modules/reports/views/audit-log/index.vue'),
        meta: {
            breadcrumb: [{ label: 'Reports' }, { label: 'Audit Log' }],
            permission: 'reports.audit-log.view'
        }
    },
    {
        path: 'email-logs',
        redirect: { name: 'EmailLogs' }
    },
    {
        path: 'scheduled-jobs',
        redirect: { name: 'ScheduledJobs' }
    },
    {
        path: 'audit-logs',
        redirect: { name: 'AuditLogs' }
    }
];
