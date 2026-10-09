export const hiddenMatrixActions = {
    'reports.scheduled-jobs': ['create', 'delete'],
    'reports.email-logs': ['create', 'edit', 'delete'],
    'reports.audit-log': ['create', 'edit', 'delete']
};

export const labelOverrides = {
    'reports.scheduled-jobs': 'Scheduled Jobs',
    'reports.email-logs': 'Email Logs',
    'reports.audit-log': 'Audit Log'
};

export const sectionPresetKeys = {
    Reports: 'reports'
};

export const matrixSections = [
    {
        title: 'Reports',
        entities: [
            'reports.email-logs',
            'reports.scheduled-jobs',
            'reports.audit-log'
        ],
        childIndent: true,
        order: 30,
        presetKey: 'reports'
    }
];
