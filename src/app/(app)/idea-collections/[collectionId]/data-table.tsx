"use client"

import React from "react";
import {
    useTable,
    type ColumnDef,
    type RowData,
    type SortingState,
} from "@tanstack/react-table"

import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {type DataTableFeatures, features} from "@/app/(app)/idea-collections/[collectionId]/data-table-features";

type DataTableProps<TData extends RowData> = {
    columns: Array<ColumnDef<DataTableFeatures, TData>>
    /** One page of rows: search, filters and pagination are done by the server. */
    data: Array<TData>
}

export function DataTable<TData extends RowData>
({
     columns,
     data,
 }: DataTableProps<TData>) {

    // Empty = the server order (oldest first, the order programs pick ideas in).
    const [sorting, setSorting] = React.useState<SortingState>([])

    const table = useTable({
        features,
        data,
        columns,
        initialState: {
            columnVisibility: {id: false},
        },
        onSortingChange: setSorting,
        state: {
            sorting
        },
    })

    return (
        <div className="overflow-hidden rounded-md border">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="p-2">
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder ? null : (
                                        <table.FlexRender header={header} />
                                    )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} className="px-5 py-3">
                                    <table.FlexRender cell={cell} />
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
