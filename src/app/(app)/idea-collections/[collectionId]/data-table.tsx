"use client"

import {Button} from "@/components/ui/button"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {
    useTable,
    type ColumnDef,
    type ColumnFiltersState,
    type RowData,
    type SortingState,

} from "@tanstack/react-table"
import {type DataTableFeatures, features} from "@/app/(app)/idea-collections/[collectionId]/data-table-features";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import React from "react";

type DataTableProps<TData extends RowData> = {
    columns: Array<ColumnDef<DataTableFeatures, TData>>
    data: Array<TData>
}

export function DataTable<TData extends RowData>
({
     columns,
     data,
 }: DataTableProps<TData>) {

    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [sorting, setSorting] = React.useState<SortingState>([{id: "id", desc: true}])

    const table = useTable({
        features,
        data,
        columns,
        initialState: {
            columnVisibility: {id: false},
        },
        onColumnFiltersChange: setColumnFilters,
        onSortingChange: setSorting,
        state: {
            columnFilters,
            sorting
        },
    })

    // Undefined when the table is sorted by another column, such as Title.
    const chronologicalSort = sorting.find((sort) => sort.id === "id")

    return (
        <div>
            <div className="flex items-center gap-2 py-4">
                <div className="relative w-full max-w-sm">
                    <Input
                        placeholder="Search by Title..."
                        value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("title")?.setFilterValue(event.target.value)
                        }
                        className="pr-9"
                    />
                    <SearchIcon
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="shrink-0">
                            {chronologicalSort
                                ? chronologicalSort.desc ? "Newer First" : "Oldest First"
                                : "Sort by date"}
                            <ChevronDownIcon/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuCheckboxItem
                            checked={chronologicalSort?.desc === false}
                            onCheckedChange={() => setSorting([{id: "id", desc: false}])}
                        >
                            Oldest First
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={chronologicalSort?.desc === true}
                            onCheckedChange={() => setSorting([{id: "id", desc: true}])}
                        >
                            Newer First
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
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
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </Button>
            </div>
        </div>
    )
}