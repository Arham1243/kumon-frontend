export default [
    {
        path: 'students',
        name: 'Students',
        component: () => import('@/modules/core/views/student/index.vue'),
        meta: {
            breadcrumb: [{ label: 'Students' }],
            permission: 'core.students.view'
        }
    }
];
