export const hiddenMatrixActions = {
    'administration.email-templates': ['create', 'delete'],
    'administration.company': ['create', 'delete']
};

export const labelOverrides = {
    'administration.company': 'My Company',
    'administration.user-roles': 'User Roles',
    'administration.users': 'User Management',
    'administration.email-templates': 'Email Templates'
};

export const matrixSections = [
    {
        title: 'Administration',
        entities: [
            'administration.company',
            'administration.users',
            'administration.user-roles',
            'administration.email-templates'
        ],
        childIndent: true,
        order: 40
    }
];
