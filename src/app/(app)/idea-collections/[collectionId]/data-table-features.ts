import {
    columnVisibilityFeature,
    createSortedRowModel,
    rowSelectionFeature,
    rowSortingFeature,
    sortFn_alphanumeric,
    sortFn_text,
    tableFeatures,
} from "@tanstack/react-table";

// Search, filters and pagination happen on the server (see `@/components/data-list`):
// the table only gets one page of rows, and sorting reorders that page.
export const features = tableFeatures({
    columnVisibilityFeature,
    rowSelectionFeature,
    rowSortingFeature,
    sortedRowModel: createSortedRowModel(),
    sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
})

// Pass this as the first generic argument to `ColumnDef`, `Column`, `Table`,
// and `Row` so each type knows which feature APIs are available.
export type DataTableFeatures = typeof features
