import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {PlusIcon, SaveIcon} from "lucide-react";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {contentTypeLabel} from "@/lib/format";
import {ContentType, CreateTemplateInput, type TemplateDefinition, UpdateTemplateInput} from "@/lib/api/types";
import {SchedulePicker} from "@/app/(app)/programs/schedule-picker";
import {Switch} from "@/components/ui/switch";
import Link from "next/link";
import {validateSchedule} from "@/lib/schedule";
import {FormEvent, useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {Textarea} from "@/components/ui/textarea";
import {api} from "@/lib/api/client";
import {toast} from "sonner";
import {ApiError} from "@/lib/api/errors";
import {JsonObject} from "@/lib/template/schema";
import {clearTemplateDraft} from "@/lib/template/draft-cache";
import {serverApi, settle} from "@/lib/api/server";
import {endpoints} from "@/lib/api/endpoints";

type SaveTemplateDialogProps = {
    dirty: boolean;
    templateid?: number;
    baseKey: string;
    definition: JsonObject;
    nameTemp: string;
    descriptionTemp: string | null;
}

const NAME_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;

export default function SaveTemplateDialog(
    {dirty, templateid, baseKey, definition, nameTemp, descriptionTemp}: SaveTemplateDialogProps
) {

    const [open, setOpen] = useState(false);
    const router = useRouter();

    const [name, setName] = useState(nameTemp || "");
    const [description, setDescription] = useState(descriptionTemp || "");

    const [saving, setSaving] = useState(false);

    async function handleSave(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const trimmedName = name.trim();
        const trimmedDescription = description.trim();
        if (!trimmedName || trimmedName.length > NAME_MAX_LENGTH) return;

        setSaving(true);
        if (templateid) {
            // Salvare template esistente

            try {
                const payload: UpdateTemplateInput = {
                    name: trimmedName,
                    description: trimmedDescription? trimmedDescription : null,
                    definition_json: definition
                }

                await api.updateTemplate(templateid, payload)
                // The edits are on the server now: the local draft is no longer needed.
                clearTemplateDraft(templateid);
                setSaving(false);
                toast.success("Template saved");
                setOpen(false);
                // Reload the saved template, so the editor is no longer "Unsaved".
                router.refresh();
            } catch (e) {
                toast.error(e instanceof ApiError ? e.message : "Could not save the template");
            }
        } else {
            // Salvare template nuovo
            try {

                const payload: CreateTemplateInput = {
                    name: trimmedName,
                    description: trimmedDescription? trimmedDescription : null,
                    base_template: baseKey,
                    definition_json: definition
                }

                const template = await api.createTemplate(payload)
                setSaving(false);
                toast.success("Template created");
                setOpen(false);
                router.push("/editor?template=" + template.id)
            } catch (e) {
                toast.error(e instanceof ApiError ? e.message : "Could not create the template");
            }
        }

    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" disabled={!dirty}>
                    <SaveIcon />
                    Save
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-serif text-3xl font-normal">{templateid ? 'Update template' : 'New template'}</DialogTitle>
                    <DialogDescription>
                        {templateid ? 'Update an existing template' : 'Create a new template'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSave} className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={NAME_MAX_LENGTH}
                            placeholder="e.g. Weekday carousels"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="description">Description</Label>
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {description.length}/{DESCRIPTION_MAX_LENGTH}
                            </span>
                        </div>
                        <Textarea
                            id="description"
                            name="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={DESCRIPTION_MAX_LENGTH}
                            placeholder="e.g. A template for displaying weekday carousels"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        {saving?
                            <Button type="submit" disabled>
                                Saving...
                            </Button>
                            : <Button type="submit">
                                Save
                            </Button>
                        }
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}