// CreateProjectDialog.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface CreateProjectDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateProject: (projectData: {
        name: string;
        description: string;
        language_code: string;
        targetLanguage: string;
        is_public: boolean;
        po_file: File | null;
    }) => void;
    languages: string[];
}

export function CreateProjectDialog({
    isOpen,
    onOpenChange,
    onCreateProject,
    languages,
}: CreateProjectDialogProps) {
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDescription, setNewProjectDescription] = useState('');
    const [newProjectSourceLanguage, setNewProjectSourceLanguage] =
        useState('en');
    const [newProjectLanguageCode, setNewProjectLanguageCode] = useState('');
    const [newIsPublic, setNewIsPublic] = useState(false);
    const [newProjectFile, setNewProjectFile] = useState<File | null>(null);

    // 新增一个 state 专门保存错误信息
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); // 每次提交前先清空错误

        // 1. 检查项目名称
        if (!newProjectName.trim()) {
            setError('Please enter a project name.');
            return;
        }

        // 2. 检查项目描述
        if (!newProjectDescription.trim()) {
            setError('Please enter a project description.');
            return;
        }

        // 3. 检查源语言是否已选（有些逻辑中，默认 `en` 可能就不需要再检查；这里假设一定要选）
        if (!newProjectSourceLanguage) {
            setError('Please select a source language.');
            return;
        }

        // 4. 检查目标语言是否已选
        if (!newProjectLanguageCode) {
            setError('Please select a target language.');
            return;
        }
        // 5. 检查源语言和目标语言是否相同
        if (newProjectSourceLanguage === newProjectLanguageCode) {
            setError('Source language and target language cannot be the same.');
            return;
        }

        // 6. 检查 PO 文件
        if (!newProjectFile) {
            setError('Please select a .po file to upload.');
            return;
        }

        // 如果所有字段都校验通过，就调用回调函数
        console.log('Submitting project data:', {
            name: newProjectName,
            description: newProjectDescription,
            sourceLanguage: newProjectSourceLanguage,
            targetLanguage: newProjectLanguageCode,
            isPublic: newIsPublic,
            poFile: newProjectFile,
        });

        onCreateProject({
            name: newProjectName,
            description: newProjectDescription,
            language_code: newProjectSourceLanguage,
            targetLanguage: newProjectLanguageCode,
            is_public: newIsPublic,
            po_file: newProjectFile,
        });

        // 重置表单字段
        setNewProjectName('');
        setNewProjectDescription('');
        setNewProjectSourceLanguage('en');
        setNewProjectLanguageCode('');
        setNewIsPublic(false);
        setNewProjectFile(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to create a new translation
                        project.
                    </DialogDescription>
                </DialogHeader>

                {/* 如果有错误信息就显示出来 */}
                {error && (
                    <p className="text-red-500 text-center mb-2">{error}</p>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Project Name */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                                htmlFor="project-name"
                                className="text-right"
                            >
                                Name
                            </Label>
                            <Input
                                id="project-name"
                                value={newProjectName}
                                onChange={(e) =>
                                    setNewProjectName(e.target.value)
                                }
                                className="col-span-3"
                                placeholder="Enter project name"
                            />
                        </div>

                        {/* Project Description */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                                htmlFor="project-description"
                                className="text-right"
                            >
                                Description
                            </Label>
                            <Textarea
                                id="project-description"
                                value={newProjectDescription}
                                onChange={(e) =>
                                    setNewProjectDescription(e.target.value)
                                }
                                className="col-span-3"
                                placeholder="Enter project description"
                            />
                        </div>

                        {/* Source Language */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                                htmlFor="source-language"
                                className="text-right"
                            >
                                Source Language
                            </Label>
                            <Select
                                value={newProjectSourceLanguage}
                                onValueChange={(value) =>
                                    setNewProjectSourceLanguage(value)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Source Language" />
                                </SelectTrigger>
                                <SelectContent>
                                    {languages.map((lang: string) => {
                                        const [name, code] = lang.split(' (');
                                        return (
                                            <SelectItem
                                                key={code}
                                                value={code.replace(')', '')}
                                            >
                                                {name}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Target Language */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                                htmlFor="language-code"
                                className="text-right"
                            >
                                Target Language
                            </Label>
                            <Select
                                value={newProjectLanguageCode}
                                onValueChange={(value) =>
                                    setNewProjectLanguageCode(value)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Target Language" />
                                </SelectTrigger>
                                <SelectContent>
                                    {languages.map((lang: string) => {
                                        const [name, code] = lang.split(' (');
                                        return (
                                            <SelectItem
                                                key={code}
                                                value={code.replace(')', '')}
                                            >
                                                {name}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Is Public */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="is-public" className="text-right">
                                Is Public
                            </Label>
                            <Select
                                value={newIsPublic.toString()}
                                onValueChange={(value) =>
                                    setNewIsPublic(value === 'true')
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Is Public" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="false">False</SelectItem>
                                    <SelectItem value="true">True</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* PO File */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="po-file" className="text-right">
                                PO File
                            </Label>
                            <Input
                                id="po-file"
                                type="file"
                                accept=".po"
                                onChange={(e) =>
                                    setNewProjectFile(
                                        e.target.files?.[0] || null
                                    )
                                }
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">Create</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
