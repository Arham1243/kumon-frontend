export default [
    {
        path: 'company',
        name: 'Company',
        component: () =>
            import('@/modules/administration/views/company/index.vue'),
        meta: {
            breadcrumb: [{ label: 'My Company' }],
            permission: 'administration.company.view'
        }
    },
    {
        path: 'roles',
        name: 'Roles',
        component: () =>
            import('@/modules/administration/views/role/index.vue'),
        meta: {
            breadcrumb: [{ label: 'User Roles' }],
            permission: 'administration.user-roles.view'
        }
    },
    {
        path: 'roles/:uuid/permissions',
        name: 'RolePermissions',
        component: () =>
            import('@/modules/administration/views/role/permissions.vue'),
        meta: {
            breadcrumb: [
                { label: 'User Roles', route: '/roles' },
                { label: 'Permissions' }
            ],
            permission: 'administration.user-roles.edit'
        }
    },
    {
        path: 'users',
        name: 'Users',
        component: () =>
            import('@/modules/administration/views/user/index.vue'),
        meta: {
            breadcrumb: [{ label: 'User Management' }],
            permission: 'administration.users.view'
        }
    },
    {
        path: 'users/create',
        name: 'CreateUser',
        component: () => import('@/modules/administration/views/user/add.vue'),
        meta: {
            breadcrumb: [
                { label: 'User Management', route: '/users' },
                { label: 'New User' }
            ],
            permission: 'administration.users.create'
        }
    },
    {
        path: 'users/:uuid/edit',
        name: 'EditUser',
        component: () => import('@/modules/administration/views/user/edit.vue'),
        meta: {
            breadcrumb: [
                { label: 'User Management', route: '/users' },
                { label: 'Edit User' }
            ],
            permission: 'administration.users.edit'
        }
    },
    { path: 'admin-users', redirect: { name: 'Users' } },
    { path: 'admin-users/create', redirect: { name: 'CreateUser' } },
    {
        path: 'admin-users/:uuid/edit',
        redirect: (to) => ({
            name: 'EditUser',
            params: { uuid: to.params.uuid }
        })
    },
    { path: 'admins', redirect: { name: 'Users' } },
    { path: 'admins/create', redirect: { name: 'CreateUser' } },
    {
        path: 'admins/:uuid/edit',
        redirect: (to) => ({
            name: 'EditUser',
            params: { uuid: to.params.uuid }
        })
    },
    {
        path: 'email-templates',
        name: 'EmailTemplates',
        component: () =>
            import('@/modules/administration/views/email-template/index.vue'),
        meta: {
            breadcrumb: [{ label: 'Email Templates' }],
            permission: 'administration.email-templates.view'
        }
    },
    {
        path: 'email-templates/:uuid/edit',
        name: 'EditEmailTemplate',
        component: () =>
            import('@/modules/administration/views/email-template/detail.vue'),
        meta: {
            breadcrumb: [
                { label: 'Email Templates', route: '/email-templates' },
                { label: 'Edit template' }
            ],
            permission: 'administration.email-templates.edit'
        }
    }
];
