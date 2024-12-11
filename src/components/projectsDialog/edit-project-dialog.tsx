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
import { on } from 'events'

interface EditProjectDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  projectName: string
  originalProjectName: string; // 新增原始项目名称
  projectDescription: string
  projectLanguageCode: string
  ispublic: boolean
  onIsPublicChange: (value: boolean) => void
  languages: string[]
  onProjectNameChange: (value: string) => void
  onProjectDescriptionChange: (value: string) => void
  onProjectLanguageCodeChange: (value: string) => void
  onSave: () => void
}

export function EditProjectDialog({
  isOpen,
  onOpenChange,
  projectName,
  originalProjectName, // 接收原始项目名称
  projectDescription,
  projectLanguageCode,
  ispublic,
  onIsPublicChange,
  languages,
  onProjectNameChange,
  onProjectDescriptionChange,
  onProjectLanguageCodeChange,
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

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_public" className="text-right">
                visibility
              </Label>
              <Select
                value={ispublic.toString()}
                onValueChange={(value) => onIsPublicChange(value === 'true')}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Target Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-6">
              <CollaboratorList
                type="managers"
                projectName={originalProjectName}
              />

              <CollaboratorList
                type="translators"
                projectName={originalProjectName}
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

