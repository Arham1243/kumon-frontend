/** @type {import('@/layout/menuTypes').MenuItem[]} */
export default [
    {
        key: 'administration',
        label: 'Administration',
        to: null,
        icon: 'pi pi-cog',
        order: 90,
        permissions: [
            'administration.company.view',
            'administration.users.view',
            'administration.user-roles.view',
            'administration.email-templates.view'
        ],
        items: [
            {
                key: 'company',
                label: 'My Company',
                to: '/company',
                icon: 'pi pi-fw pi-building',
                permissions: ['administration.company.view']
            },
            {
                key: 'admins',
                label: 'User Management',
                to: '/users',
                icon: 'pi pi-fw pi-users',
                permissions: ['administration.users.view']
            },
            {
                key: 'roles',
                label: 'User Roles',
                to: '/roles',
                icon: 'pi pi-fw pi-shield',
                permissions: ['administration.user-roles.view']
            },
            {
                key: 'email-templates',
                label: 'Email Templates',
                to: '/email-templates',
                icon: 'pi pi-fw pi-envelope',
                permissions: ['administration.email-templates.view']
            }
        ]
    }
];
