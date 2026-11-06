export default [
    {
        path: 'students',
        name: 'Students',
        component: () => import('@/modules/core/views/student/index.vue'),
        meta: {
            breadcrumb: [{ label: 'Students' }],
            permission: 'core.students.view'
        }
    },
    {
        path: 'students/:uuid',
        redirect: (to) => ({
            name: 'EditStudent',
            params: { uuid: to.params.uuid }
        })
    },
    {
        path: 'students/:uuid/edit',
        name: 'EditStudent',
        component: () => import('@/modules/core/views/student/edit.vue'),
        meta: {
            breadcrumb: [
                { label: 'Students', route: '/students' },
                { label: 'Edit Student' }
            ],
            permission: 'core.students.edit'
        }
    },
    {
        path: 'attendance',
        name: 'Attendance',
        component: () => import('@/modules/core/views/attendance/index.vue'),
        meta: {
            breadcrumb: [{ label: 'Attendance' }],
            permission: 'core.attendance.view'
        }
    }
];
