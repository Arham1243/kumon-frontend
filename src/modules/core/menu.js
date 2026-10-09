/** @type {import('@/layout/menuTypes').MenuItem[]} */
export default [
    {
        key: 'home',
        label: 'Home',
        to: '/dashboard',
        icon: 'pi pi-home',
        order: 0
    },
    {
        key: 'students',
        label: 'Students',
        to: '/students',
        icon: 'pi pi-users',
        order: 10,
        permissions: ['core.students.view']
    }
];
