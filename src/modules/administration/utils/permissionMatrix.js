const permissionManifests = import.meta.glob('@/modules/*/permissions.js', {
    eager: true
});

function mergePermissionManifests() {
    const hiddenMatrixActions = {};
    const labelOverrides = {};
    const matrixSections = [];
    const sectionPresetKeys = {};

    Object.keys(permissionManifests)
        .sort()
        .forEach((path) => {
            const mod = permissionManifests[path];
            Object.assign(hiddenMatrixActions, mod.hiddenMatrixActions ?? {});
            Object.assign(labelOverrides, mod.labelOverrides ?? {});
            Object.assign(sectionPresetKeys, mod.sectionPresetKeys ?? {});
            if (Array.isArray(mod.matrixSections)) {
                matrixSections.push(...mod.matrixSections);
            }
        });

    matrixSections.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return {
        hiddenMatrixActions,
        labelOverrides,
        matrixSections,
        sectionPresetKeys
    };
}

const mergedManifests = mergePermissionManifests();

const SKIP_ENTITIES = new Set([]);

const ALL_ACTIONS = ['view', 'create', 'edit', 'delete'];

export const ENTITY_HIDDEN_MATRIX_ACTIONS = mergedManifests.hiddenMatrixActions;

const ACTIONS_IMPLYING_VIEW = ['create', 'edit', 'delete'];

export function applicableActionsFor(entity) {
    const hidden = ENTITY_HIDDEN_MATRIX_ACTIONS[entity] ?? [];
    return ALL_ACTIONS.filter((action) => !hidden.includes(action));
}

export function isApplicableAction(entity, action) {
    return applicableActionsFor(entity).includes(action);
}

function isEditableAdminAction(entity, action, actions) {
    if (!isApplicableAction(entity, action)) {
        return false;
    }
    return actions[action] !== null && actions[action] !== undefined;
}

export function applyPermissionDependencies(entity, actions) {
    if (!actions || typeof actions !== 'object') {
        return;
    }

    if (
        isEditableAdminAction(entity, 'view', actions) &&
        ACTIONS_IMPLYING_VIEW.some(
            (action) =>
                isEditableAdminAction(entity, action, actions) &&
                actions[action] === true
        )
    ) {
        actions.view = true;
    }

    if (
        isEditableAdminAction(entity, 'view', actions) &&
        actions.view === false
    ) {
        ACTIONS_IMPLYING_VIEW.forEach((action) => {
            if (isEditableAdminAction(entity, action, actions)) {
                actions[action] = false;
            }
        });
    }
}

export function isViewLockedByDependencies(entity, actions) {
    if (!actions || typeof actions !== 'object') {
        return false;
    }
    if (!isApplicableAction(entity, 'view')) {
        return false;
    }
    return ACTIONS_IMPLYING_VIEW.some(
        (action) =>
            isApplicableAction(entity, action) && actions[action] === true
    );
}

export function applyMatrixDependencies(perms) {
    if (!perms || typeof perms !== 'object') {
        return;
    }
    Object.keys(perms).forEach((entity) => {
        applyPermissionDependencies(entity, perms[entity]);
    });
}

export function normalizeAdminMatrixHiddenActions(perms) {
    if (!perms || typeof perms !== 'object') {
        return;
    }
    for (const [entity, hiddenActions] of Object.entries(
        ENTITY_HIDDEN_MATRIX_ACTIONS
    )) {
        const row = perms[entity];
        if (!row) {
            continue;
        }
        for (const action of hiddenActions) {
            if (Object.prototype.hasOwnProperty.call(row, action)) {
                row[action] = null;
            }
        }
    }
    Object.keys(perms).forEach((entity) => {
        const row = perms[entity];
        ALL_ACTIONS.forEach((action) => {
            if (!isApplicableAction(entity, action)) {
                row[action] = null;
            }
        });
    });
    applyMatrixDependencies(perms);
}

const ENTITY_LABEL_OVERRIDES = mergedManifests.labelOverrides;

export const SECTION_HEADER_PRESET_KEYS = mergedManifests.sectionPresetKeys;

export const PERMISSION_MATRIX_SECTIONS = mergedManifests.matrixSections.map(
    (section) => ({
        title: section.title ?? null,
        entities: section.entities,
        childIndent: section.childIndent ?? false,
        presetKey:
            section.presetKey ??
            mergedManifests.sectionPresetKeys[section.title ?? ''] ??
            null
    })
);

function entitiesForPreset(presetKey) {
    const entities = new Set();
    mergedManifests.matrixSections.forEach((section) => {
        if (section.presetKey === presetKey) {
            section.entities.forEach((entity) => entities.add(entity));
        }
    });
    return entities;
}

export function isReportsSectionEntity(entity) {
    return entitiesForPreset('reports').has(entity);
}

export function isEntityInPresetSection(presetKey, entity) {
    return entitiesForPreset(presetKey).has(entity);
}

function capitalizeWords(str) {
    return str
        .split(/[\s.]+/)
        .filter(Boolean)
        .map((w) =>
            w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''
        )
        .join(' ');
}

export function permissionLabel(entity) {
    if (ENTITY_LABEL_OVERRIDES[entity]) {
        return ENTITY_LABEL_OVERRIDES[entity];
    }
    return capitalizeWords(
        entity.replace(/\./g, ' ').replace(/-/g, ' ').replace(/_/g, ' ')
    );
}

export function permissionMatrixRowClass(data) {
    return data.isGroupHeader ? 'bg-surface-100 dark:bg-surface-800' : '';
}

export function computeSectionPresetSwitches(
    selectedPermissions,
    rolePermissions,
    entityFilter
) {
    let viewOnlyMatch = true;
    let fullMatch = true;
    let hasEditable = false;

    Object.keys(selectedPermissions || {}).forEach((entity) => {
        if (!entityFilter(entity)) {
            return;
        }
        const tmpl = rolePermissions[entity];
        const sel = selectedPermissions[entity];
        if (!tmpl || !sel) {
            return;
        }
        Object.keys(tmpl).forEach((action) => {
            if (!Object.prototype.hasOwnProperty.call(sel, action)) {
                return;
            }
            if (sel[action] === null) {
                return;
            }
            hasEditable = true;
            if (sel[action] !== true) {
                fullMatch = false;
            }
            const matchesViewOnlyCell =
                action === 'view'
                    ? sel[action] === true
                    : sel[action] === false;
            if (!matchesViewOnlyCell) {
                viewOnlyMatch = false;
            }
        });
    });

    if (!hasEditable) {
        return { viewOnly: false, fullAdmin: false };
    }
    if (fullMatch) {
        return { viewOnly: false, fullAdmin: true };
    }
    if (viewOnlyMatch) {
        return { viewOnly: true, fullAdmin: false };
    }
    return { viewOnly: false, fullAdmin: false };
}

export function applyPermissionSectionPreset(
    selectedPermissions,
    rolePermissions,
    entityFilter,
    preset
) {
    if (!selectedPermissions || !rolePermissions) {
        return;
    }
    Object.keys(selectedPermissions).forEach((entity) => {
        if (!entityFilter(entity)) {
            return;
        }
        const tmpl = rolePermissions[entity];
        const sel = selectedPermissions[entity];
        if (!tmpl || !sel) {
            return;
        }
        Object.keys(tmpl).forEach((action) => {
            if (!Object.prototype.hasOwnProperty.call(sel, action)) {
                return;
            }
            if (sel[action] === null) {
                return;
            }
            if (preset === 'view-only') {
                sel[action] = action === 'view';
            } else if (preset === 'full') {
                sel[action] = true;
            } else if (preset === 'clear') {
                sel[action] = false;
            }
        });
        applyPermissionDependencies(entity, sel);
    });
}

export function buildPermissionMatrixRows(
    rolePermissions,
    selectedPermissions
) {
    const matrix =
        rolePermissions && typeof rolePermissions === 'object'
            ? rolePermissions
            : {};
    const selected =
        selectedPermissions && typeof selectedPermissions === 'object'
            ? selectedPermissions
            : {};
    const used = new Set();
    const rows = [];

    const tryPushRow = (entity, indent) => {
        if (!matrix[entity] || SKIP_ENTITIES.has(entity)) {
            return;
        }
        used.add(entity);
        const perms = matrix[entity];
        const sel = selected[entity] || {};
        const row = {
            entity,
            isGroupHeader: false,
            indent,
            hiddenActions: ENTITY_HIDDEN_MATRIX_ACTIONS[entity] ?? []
        };
        ALL_ACTIONS.forEach((action) => {
            if (!isApplicableAction(entity, action)) {
                row[action] = null;
                return;
            }
            row[action] = Object.prototype.hasOwnProperty.call(sel, action)
                ? sel[action]
                : false;
        });
        row.viewLocked = isViewLockedByDependencies(entity, row);
        rows.push(row);
    };

    for (const section of PERMISSION_MATRIX_SECTIONS) {
        const hasAny = section.entities.some(
            (e) => matrix[e] && !SKIP_ENTITIES.has(e)
        );
        if (!hasAny) {
            continue;
        }
        if (section.title) {
            rows.push({
                isGroupHeader: true,
                groupTitle: section.title,
                presetSectionKey:
                    section.presetKey ??
                    SECTION_HEADER_PRESET_KEYS[section.title] ??
                    null
            });
        }
        for (const entity of section.entities) {
            tryPushRow(entity, section.childIndent);
        }
    }

    return rows;
}
