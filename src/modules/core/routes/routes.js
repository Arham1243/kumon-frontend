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
        path: 'attendance',
        name: 'Attendance',
        component: () => import('@/modules/core/views/attendance/index.vue'),
        meta: {
            breadcrumb: [{ label: 'Attendance' }],
            permission: 'core.attendance.view'
        }
    }
];
