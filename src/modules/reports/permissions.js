export const hiddenMatrixActions = {
    'reports.email-logs': ['create', 'edit', 'delete'],
    'reports.audit-log': ['create', 'edit', 'delete'],
    'reports.student-cards': ['create', 'edit', 'delete']
};

export const labelOverrides = {
    'reports.email-logs': 'Email Logs',
    'reports.audit-log': 'Audit Log',
    'reports.student-cards': 'Student Cards'
};

export const sectionPresetKeys = {
    Reports: 'reports'
};

export const matrixSections = [
    {
        title: 'Reports',
        entities: ['reports.email-logs', 'reports.audit-log', 'reports.student-cards'],
        childIndent: true,
        order: 30,
        presetKey: 'reports'
    }
];
