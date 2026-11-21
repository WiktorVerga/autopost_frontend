'use client';

import {Button} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {PlusIcon} from "lucide-react";
import type {TemplateBase, TemplateBaseDetail} from "@/lib/api/types";
import {ReactNode, Suspense, useState} from "react";
import {BasesGrid} from "@/app/(app)/templates/bases-grid";

export default function NewTemplateDialog({ children }: { children: ReactNode }) {

    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusIcon />
                    New Template
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-serif text-3xl font-normal">New Template</DialogTitle>
                    <DialogDescription>
                        Pick a type of post for your new template.
                    </DialogDescription>
                    { children }
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}


