"use client"

import { createColumnHelper } from "@tanstack/react-table"

import { type DataTableFeatures } from "./data-table-features"

import {Idea} from "@/lib/api/types"
import {IdeaActions} from "@/app/(app)/idea-collections/[collectionId]/idea-actions";
import { type Column, type RowData } from "@tanstack/react-table"
import { cn } from "cn"
import { ArrowUpDown, ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from "lucide-react"


import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, Idea>()

export const columns = columnHelper.columns([
    // Hidden: ideas have no creation date, so ids provide the chronological order.
    columnHelper.accessor("id", {
        header: "ID",
    }),
    columnHelper.accessor("title", {
        header: ({ column }) => (
            <SortDataHead column={column} title="Title" />
        ),
    }),
    columnHelper.accessor("description", {
        header: "Description",
        cell: (info) => (
            <div className="line-clamp-2 max-w-md whitespace-normal" title={info.getValue()}>
                {info.getValue()}
            </div>
        ),
    }),
    columnHelper.accessor("category", {
        header: ({ column }) => (
            <SortDataHead column={column} title="Category" />
        ),
        cell: (info) => info.getValue() ?? "—",
    }),
    columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({row}) => (
            <IdeaActions idea={row.original} />
        ),
    }),
])

interface DataTableColumnHeaderProps<TData extends RowData, TValue>
    extends React.HTMLAttributes<HTMLDivElement> {
    column: Column<DataTableFeatures, TData, TValue>
    title: string
}

export function DataTableColumnHeader<TData extends RowData, TValue>(
    {
        column,
        title,
        className,
    }: DataTableColumnHeaderProps<TData, TValue>) {

    if (!column.getCanSort()) {
        return <div className={cn(className)}>{title}</div>
    }

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 data-[state=open]:bg-accent"
                    >
                        <span>{title}</span>
                        {column.getIsSorted() === "desc" ? (
                            <ArrowDown />
                        ) : column.getIsSorted() === "asc" ? (
                            <ArrowUp />
                        ) : (
                            <ChevronsUpDown />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                        <ArrowUp />
                        Asc
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                        <ArrowDown />
                        Desc
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                        <EyeOff />
                        Hide
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

function SortDataHead<TData extends RowData, TValue>({
    column,
    title,
    className,
}: DataTableColumnHeaderProps<TData, TValue>) {
    return <Button
        className={cn(className)}
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
        {title}
        <ArrowUpDown
            className={cn(
                "ml-2 h-4 w-4 transition-transform duration-200",
                column.getIsSorted() === "asc" && "rotate-180",
            )}
        />
    </Button>
}