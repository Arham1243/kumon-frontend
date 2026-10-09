import { ref, watch } from 'vue';
import { debounce } from 'lodash-es';
import { AuthService } from '@/services';

export function mapVisibleColumns(savedFields, allColumns) {
    if (!Array.isArray(savedFields) || savedFields.length === 0) {
        return [];
    }
    const fieldSet = new Set(savedFields);

    return allColumns.filter((col) => fieldSet.has(col.field));
}

function orderColumnsLikeMenu(visible, allColumns) {
    const required = allColumns.filter((c) => c.disabled);
    const ordered = allColumns.filter(
        (col) =>
            required.includes(col) || visible.some((v) => v.field === col.field)
    );

    return ordered;
}

/**
 * @param {string} tableKey
 * @param {import('vue').Ref<object[]>} allColumnsRef
 * @param {{ defaultFields: string[], requiredFields?: string[] }} options
 */
export function useReportTableColumnPreferences(
    tableKey,
    allColumnsRef,
    { defaultFields, requiredFields = [] }
) {
    const visibleColumns = ref([]);
    const columnSelectionsRef = ref(null);
    let preferencesHydrated = false;

    async function loadTablePreferences() {
        try {
            const res = await AuthService.getTablePreferences({
                table_key: tableKey
            });
            const saved =
                res.data?.data?.visible_columns ??
                res.data?.visible_columns ??
                [];
            let mapped = mapVisibleColumns(saved, allColumnsRef.value);

            if (!mapped.length) {
                mapped = allColumnsRef.value.filter((c) =>
                    defaultFields.includes(c.field)
                );
            }

            for (const field of requiredFields) {
                const col = allColumnsRef.value.find((c) => c.field === field);
                if (col && !mapped.some((m) => m.field === col.field)) {
                    mapped.unshift(col);
                }
            }

            visibleColumns.value = orderColumnsLikeMenu(
                mapped,
                allColumnsRef.value
            );
        } catch (error) {
            console.error(error);
            visibleColumns.value = allColumnsRef.value.filter((c) =>
                defaultFields.includes(c.field)
            );
        } finally {
            preferencesHydrated = true;
        }
    }

    async function saveTablePreferences() {
        try {
            await AuthService.updateTablePreferences({
                table_key: tableKey,
                visible_columns: visibleColumns.value.map((c) => c.field)
            });
        } catch (error) {
            console.error('Failed to save table preferences', error);
        }
    }

    const debouncedSaveTablePreferences = debounce(saveTablePreferences, 500);

    watch(visibleColumns, (newVal) => {
        const ordered = orderColumnsLikeMenu(newVal, allColumnsRef.value);
        const changed =
            ordered.length !== newVal.length ||
            ordered.some((c, i) => c.field !== newVal[i]?.field);
        if (changed) {
            visibleColumns.value = ordered;
            return;
        }
        if (preferencesHydrated) {
            debouncedSaveTablePreferences();
        }
    });

    function toggleColumnSelections() {
        columnSelectionsRef.value?.show?.();
    }

    return {
        visibleColumns,
        columnSelectionsRef,
        loadTablePreferences,
        toggleColumnSelections
    };
}
