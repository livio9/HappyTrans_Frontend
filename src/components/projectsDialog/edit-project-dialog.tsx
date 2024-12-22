import React, { useState, useEffect } from 'react'
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
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CollaboratorList } from "./collaborator-list"

interface EditProjectDialogProps {
  isadmin: boolean
  ismanager: boolean
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  projectName: string
  originalProjectName: string
  projectDescription: string
  projectLanguageCodes: string[]
  originalLanguageCodes: string[]
  ispublic: boolean
  onIsPublicChange: (value: boolean) => void
  languages: string[]
  onProjectNameChange: (value: string) => void
  onProjectDescriptionChange: (value: string) => void
  onProjectLanguageCodesChange: (value: string[]) => void
  onSave: (selectedLanguages: string[], poFile: File | null) => void
}

export function EditProjectDialog({
  isadmin,
  ismanager,
  isOpen,
  onOpenChange,
  projectName,
  originalProjectName,
  projectDescription,
  projectLanguageCodes,
  originalLanguageCodes,
  ispublic,
  onIsPublicChange,
  languages,
  onProjectNameChange,
  onProjectDescriptionChange,
  onProjectLanguageCodesChange,
  onSave,
}: EditProjectDialogProps) {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(projectLanguageCodes)
  const [poFile, setPoFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setSelectedLanguages(projectLanguageCodes)
  }, [projectLanguageCodes])

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(languageCode)
        ? prev.filter((code) => code !== languageCode)
        : [...prev, languageCode]
    )
  }

  const handlePoFileChange = (file: File | null) => {
    setPoFile(file)
  }

  // 计算需要添加的语言
  const languagesToAdd = selectedLanguages.filter(lang => !originalLanguageCodes.includes(lang))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    onProjectLanguageCodesChange(selectedLanguages)
    
    // 如果有新增语言但未上传 .po 文件，提示用户
    if (languagesToAdd.length > 0 && !poFile) {
      alert("请上传 .po 文件以添加新的语言。")
      return
    }
    
    setIsSubmitting(true)
    onSave(selectedLanguages, languagesToAdd.length > 0 ? poFile : null)
    setIsSubmitting(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[80%] h-[100%] sm:max-w-[700px] sm:max-h-[80%] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Modify the project details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* 项目名称 */}
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

            {/* 项目描述 */}
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

            {/* 目标语言 */}
            {isadmin && (<div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right">Target Languages</Label>
              <div className="col-span-3 flex flex-col space-y-2">
                {languages.map((lang: string) => {
                  const [name, codeWithParen] = lang.split(" (")
                  const cleanCode = codeWithParen.replace(")", "")
                  return (
                    <div key={cleanCode} className="flex items-center">
                      <Checkbox
                        id={`lang-${cleanCode}`}
                        checked={selectedLanguages.includes(cleanCode)}
                        onCheckedChange={() => handleLanguageChange(cleanCode)}
                      />
                      <Label htmlFor={`lang-${cleanCode}`} className="ml-2">
                        {name} ({cleanCode})
                      </Label>
                    </div>
                  )
                })}
              </div>
            </div>)}

            {/* 仅在有新增语言时展示 .po 文件上传 */}
            {languagesToAdd.length > 0 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="po-file" className="text-right">
                  Upload .po File
                </Label>
                <Input
                  type="file"
                  id="po-file"
                  accept=".po"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handlePoFileChange(e.target.files[0])
                    } else {
                      handlePoFileChange(null)
                    }
                  }}
                  className="col-span-3"
                  required={languagesToAdd.length > 0}
                />
              </div>
            )}

            {/* 可见性 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_public" className="text-right">
                Visibility
              </Label>
              <Select
                value={ispublic.toString()}
                onValueChange={(value) => onIsPublicChange(value === 'true')}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Public</SelectItem>
                  <SelectItem value="false">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 合作者列表 */}
            <div className="space-y-6">
              <CollaboratorList
                isadmin={isadmin}
                ismanager={ismanager}
                type="managers"
                projectName={originalProjectName}
              />

              <CollaboratorList
                isadmin={isadmin}
                ismanager={ismanager}
                type="translators"
                projectName={originalProjectName}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}