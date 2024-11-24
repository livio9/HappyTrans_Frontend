"use client";

import { useAuth } from "@/context/AuthContext";
import { useProject } from "@/context/ProjectContext";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Globe, Home, ChevronDown, MoreVertical, Plus, Search, Settings } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Project {
  name: string;
  description: string;
  source_language: string;
  language_code: string;
  po_file?: File;
}

// 辅助函数：从Cookie中获取CSRF token
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

export default function Projects() {
  const { user, token, logout } = useAuth();
  const { setCurrentProject, fetchProjectInfo } = useProject();
  const router = useRouter();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectSourceLanguage, setNewProjectSourceLanguage] = useState("en");
  const [newProjectLanguageCode, setNewProjectLanguageCode] = useState("");
  const [newProjectFile, setNewProjectFile] = useState<File | null>(null);

  const isAdmin = user?.role === "admin";

  // 获取项目列表
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        console.error("Failed to fetch projects");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const languages = ["English (en)", "Chinese (zh_CN)", "Spanish (es)", "French (fr)", "German (de)"];

  // 删除项目
  const deleteProject = async (projectName: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/delete-project?project_name=${projectName}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
      });

      if (response.ok) {
        setProjects((prevProjects) => prevProjects.filter(project => project.name !== projectName));
      } else {
        throw new Error('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };

  // 创建项目
  const createProject = async (name: string, description: string) => {
    if (!newProjectFile) {
      alert("Please select a file before submitting.");
      return;
    }
    try {
      console.log("start to create.")
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('language_code', newProjectLanguageCode);
      formData.append('source_language', newProjectSourceLanguage);
      formData.append('po_file', newProjectFile);

      const csrfToken = getCookie('csrftoken');

      console.log("before use create")

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/create-project`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'X-CSRFToken': csrfToken || '',
        },
        credentials: 'include',
        body: formData,
        mode: 'cors',
      });
      console.log("after use create")
      if (response.ok) {
        const newProject = await response.json(); // 直接解析 JSON
        setProjects((prevProjects) => [...prevProjects, newProject]);
        setIsCreateDialogOpen(false);
        // 重置表单
        setNewProjectName("");
        setNewProjectDescription("");
        setNewProjectSourceLanguage("en");
        setNewProjectLanguageCode("");
        setNewProjectFile(null);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.message || 'Failed to create project';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert(error instanceof Error ? error.message : 'Failed to create project');
    }
  };

  // 第一次点击删除项目
  const handleDeleteClick = (projectId: string) => {
    setProjectToDelete(projectId);
    setIsDeleteDialogOpen(true);
  };

  // 最终确认删除项目
  const handleDeleteConfirm = async () => {
    if (projectToDelete) {
      try {
        await deleteProject(projectToDelete);
        setIsDeleteDialogOpen(false);
        setProjectToDelete(null);
      } catch (error) {
        console.error('Error during project deletion:', error);
      }
    }
  };

  // 最终确认创建项目
  const handleCreateProject = async () => {
    if (!newProjectName) {
      alert("Project name is required");
      return;
    }
    try {
      await createProject(newProjectName, newProjectDescription);
      // 重新获取项目列表以确保数据一致性
      await fetchProjects();
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  const handleStartTranslating = async (projectName: string, targetLanguage: string) => {
    if (!targetLanguage) {
      alert("Please select a target language.");
      return;
    }
    try {
      await fetchProjectInfo(projectName);
      setCurrentProject({ name: projectName });
      router.push("/translation-interface");
    } catch (error) {
      console.error("Failed to start translating:", error);
    }
  };

  const handleLogout = async () => {
    try {
      logout();
      window.location.href = "/signin";
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  interface LanguageSelectProps {
    selectedLanguage: string;
    setSelectedLanguage: (language: string) => void;
    languages: string[];
  }

  const LanguageSelect: React.FC<LanguageSelectProps> = ({ selectedLanguage, setSelectedLanguage, languages }) => (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="language-select" className="text-right">
        Target Language
      </Label>
      <select
        id="language-select"
        value={selectedLanguage}
        onChange={(e) => setSelectedLanguage(e.target.value)}
        className="col-span-3 border rounded-md p-2"
      >
        <option value="">Select Language</option>
        {languages.map((language) => (
          <option key={language} value={language}>
            {language}
          </option>
        ))}
      </select>
    </div>
  );

  const ProjectCard = ({ project }: { project: Project }) => {
    const [isLanguageDialogOpen, setIsLanguageDialogOpen] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState("");

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{project.name}</CardTitle>
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => console.log(`Manage Project ${project.name}`)}>
                  Manage Project
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleDeleteClick(project.name)} className="text-red-600">
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>
        <CardContent>
          <CardDescription>{project.description}</CardDescription>
          <Button className="mt-4" onClick={() => setIsLanguageDialogOpen(true)}>
            Start Translating
          </Button>
        </CardContent>
        <Dialog open={isLanguageDialogOpen} onOpenChange={setIsLanguageDialogOpen}>
          <DialogContent className="bg-white shadow-lg z-50">
            <DialogHeader>
              <DialogTitle>Select Target Language</DialogTitle>
              <DialogDescription>
                Please select a language for translating {project.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <LanguageSelect
                selectedLanguage={selectedLanguage}
                setSelectedLanguage={setSelectedLanguage}
                languages={languages}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsLanguageDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleStartTranslating(project.name, selectedLanguage).catch(console.error);
                  setIsLanguageDialogOpen(false);
                }}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-800">TranslateOS</h1>
        </div>
        <nav className="mt-3">
          <Link href="/dashboard" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <Home className="mr-3 h-5 w-5" />
            Dashboard
          </Link>
          <Link href="/projects" className="flex items-center px-4 py-2 text-gray-700 bg-gray-200">
            <Globe className="mr-3 h-5 w-5" />
            Projects
          </Link>
          <Link href="/settings" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-8 py-4">
            <h2 className="text-2xl font-semibold text-gray-800">Projects</h2>
            <div className="flex items-center relative">
              <Avatar className="ml-4">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <Button variant="ghost" className="ml-2" onClick={toggleDropdown}>
                {user?.name || "John Doe"}
                <ChevronDown className="ml-2 h-4 w-4 z-20" />
              </Button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md z-10">
                  <ul className="space-y-2 p-2">
                    <li className="hover:bg-gray-200 rounded-md">
                      <Button
                        variant="ghost"
                        className="w-full text-left"
                        onClick={handleLogout}
                      >
                        Logout
                      </Button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Projects Content */}
        <div className="p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input type="text" placeholder="Search projects..." className="pl-8 pr-4 w-64" />
            </div>
            {isAdmin && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create Project
              </Button>
            )}
          </div>

          {loading ? (
            <p>Loading projects...</p>
          ) : (
            <Tabs defaultValue="to-translate">
              <TabsList>
                <TabsTrigger value="to-translate">To Translate</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              </TabsList>
              <TabsContent value="to-translate">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {projects.map((project) => (
                    <ProjectCard key={project.name} project={project} />
                  ))}
                </div>
              </TabsContent>
              {/* 可以在此添加其他 TabsContent */}
            </Tabs>
          )}
        </div>
      </main>

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new translation project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project-name" className="text-right">
                Name
              </Label>
              <Input
                id="project-name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="col-span-3"
                placeholder="Enter project name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="project-description"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                className="col-span-3"
                placeholder="Enter project description"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="source-language" className="text-right">
                Source Language
              </Label>
              <Input
                id="source-language"
                value={newProjectSourceLanguage}
                onChange={(e) => setNewProjectSourceLanguage(e.target.value)}
                className="col-span-3"
                placeholder="e.g., en"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="language-code" className="text-right">
                Target Language
              </Label>
              <Input
                id="language-code"
                value={newProjectLanguageCode}
                onChange={(e) => setNewProjectLanguageCode(e.target.value)}
                className="col-span-3"
                placeholder="e.g., zh_CN"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="po-file" className="text-right">
                PO File
              </Label>
              <Input
                id="po-file"
                type="file"
                accept=".po"
                onChange={(e) => setNewProjectFile(e.target.files?.[0] || null)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete Project {projectToDelete}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
