/** Matches backend App\Enums\ActivityLogName values stored in activity_log.log_name */
export const auditLogResources = [
    { id: 'User', name: 'User' },
    { id: 'Role', name: 'Role' },
    { id: 'Scheduled Job', name: 'Scheduled Job' },
    { id: 'Email Template', name: 'Email Template' }
];

export const auditLogEvents = [
    { id: 'created', name: 'Created' },
    { id: 'updated', name: 'Updated' },
    { id: 'deleted', name: 'Deleted' },
    { id: 'manual_run', name: 'Manual Run' }
];
