/** @type {import('@/layout/menuTypes').MenuItem[]} */
export default [
    {
        key: 'students',
        label: 'Students',
        to: '/students',
        icon: 'pi pi-users',
        order: 10,
        permissions: ['core.students.view']
    },
    {
        key: 'attendance',
        label: 'Attendance',
        to: '/attendance',
        icon: 'pi pi-calendar',
        order: 20,
        permissions: ['core.attendance.view']
    }
];
