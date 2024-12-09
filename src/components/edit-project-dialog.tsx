import React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CollaboratorList } from "./collaborator-list"

interface EditProjectDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  projectName: string
  projectDescription: string
  projectLanguageCode: string
  languages: string[]
  onProjectNameChange: (value: string) => void
  onProjectDescriptionChange: (value: string) => void
  onProjectLanguageCodeChange: (value: string) => void
  onRemoveManager: (id: string) => void
  onRemoveTranslator: (id: string) => void
  onSave: () => void
}

export function EditProjectDialog({
  isOpen,
  onOpenChange,
  projectName,
  projectDescription,
  projectLanguageCode,
  languages,
  onProjectNameChange,
  onProjectDescriptionChange,
  onProjectLanguageCodeChange,
  onRemoveManager,
  onRemoveTranslator,
  onSave,
}: EditProjectDialogProps) {
  return (
    
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[80%] h-[100%] sm:max-w-[700px] sm:max-h-[80%] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Modify the project details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project-name" className="text-right">
                Name
              </Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => onProjectNameChange(e.target.value)}
                className="col-span-3"
                placeholder="Enter project name"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="project-description"
                value={projectDescription}
                onChange={(e) => onProjectDescriptionChange(e.target.value)}
                className="col-span-3"
                placeholder="Enter project description"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="language-code" className="text-right">
                Target Language
              </Label>
              <Select
                value={projectLanguageCode}
                onValueChange={onProjectLanguageCodeChange}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Target Language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang: string) => {
                    const [name, code] = lang.split(" (");
                    return (
                      <SelectItem key={code} value={code.replace(")", "")}>
                        {name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-6">
              <CollaboratorList
                type="managers"
                projectName={projectName}
                onRemove={onRemoveManager}
              />

              <CollaboratorList
                type="translators"
                projectName={projectName}
                onRemove={onRemoveTranslator}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

