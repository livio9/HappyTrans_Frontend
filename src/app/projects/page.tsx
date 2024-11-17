"use client";
import { useAuth } from "@/context/AuthContext";
import { useProject } from "@/context/ProjectContext";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useState } from "react";
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
  const { user, token } = useAuth(); // 获取用户信息，包括 role
  const { setCurrentProject, fetchProjectInfo } = useProject();// 获取 setCurrentProject 函数
  const router = useRouter(); // 定义 router
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false); // 删除
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLanguageDialogOpen, setIsLanguageDialogOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  // 切换下拉框显示状态
  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev); // 切换状态
  };

  const [newProjectName, setNewProjectName] = React.useState("");
  const [newProjectDescription, setNewProjectDescription] = React.useState("");
  const [projectToDelete, setProjectToDelete] = React.useState<string | null>(null); // 当前选择删除的项目名称
  const [projects, setProjects] = React.useState<Project[]>([]); // 存储从后端获取的项目列表
  const [loading, setLoading] = React.useState(true); // 加载状态
  const [newProjectSourceLanguage, setNewProjectSourceLanguage] = React.useState("en"); // 存储源语言
  const [newProjectLanguageCode, setNewProjectLanguageCode] = React.useState(""); // 存储目标语言
  const [newProjectFile, setNewProjectFile] = React.useState<File | null>(null); // 存储PO文件
  const { logout } = useAuth(); 
  
  
  type ProjectName = string; // 定义 ProjectName 类型

  // 检查当前用户是否为 admin
  const isAdmin = user?.role === "admin";

  // 获取项目列表
  React.useEffect(() => {
    let isMounted = true; // 用于标记组件是否挂载

    const fetchProjects = async () => {
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
          if (isMounted) setProjects(data); // 将项目列表存储在状态中
        } else {
          console.error("Failed to fetch projects");
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProjects();
    return () => {
    isMounted = false; // 清理操作，防止状态更新
  };
  }, []);

  // 语言选项
  const languages = ["English (en)", "Chinese (zh_CN)", "Spanish (es)", "French (fr)", "German (de)"];

  // 处理弹窗关闭
  const closeModal = () => setIsModalOpen(false);

  // 处理目标语言选择
  const handleLanguageSelect = () => {
    // 此处添加处理语言选择逻辑
    if (selectedLanguage) {
      // 可以调用其他的处理函数或 API
      console.log(`Selected language: ${selectedLanguage}`);
      setIsModalOpen(false); // 选择语言后关闭弹窗
    } else {
      alert("Please select a language");
    }
  };

   // 删除文件
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
        setProjects(projects.filter(project => project.name !== projectName));
      } else {
        throw new Error('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };

  // 创建文件
  const createProject = async (name: string, description: string) => {
    if (!newProjectFile) {
      alert("Please select a file before submitting.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('language_code', newProjectLanguageCode);
      formData.append('source_language', newProjectSourceLanguage);
      formData.append('po_file', newProjectFile);

      // 打印完整的请求数据
      console.log('Request details:', {
        url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/create-project`,
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
        },
        formData: Object.fromEntries(formData.entries())
      });

      const csrfToken = getCookie('csrftoken');

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

      const responseData = await response.text();
      console.log('Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseData
      });

      if (response.ok) {
        const newProject = JSON.parse(responseData);
        setProjects((prevProjects) => [...prevProjects, newProject]);

        // setProjects([...projects, newProject]);
        setIsCreateDialogOpen(false);

        // 重置表单
        setNewProjectName("");
        setNewProjectDescription("");
        setNewProjectSourceLanguage("en");
        setNewProjectLanguageCode("");
        setNewProjectFile(null);
      } else {
        let errorMessage = 'Failed to create project';
        try {
          const errorData = JSON.parse(responseData);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = responseData;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert(error instanceof Error ? error.message : 'Failed to create project');
    }
  };

  const handleDeleteClick = (projectId: string) => {
    setProjectToDelete(projectId);
    setIsDeleteDialogOpen(true);
  };

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

  const handleCreateProject = async () => {
    if (!newProjectName) {
      alert("Project name is required");
      return;
    }
    try {
      await createProject(newProjectName, newProjectDescription);
      setNewProjectName("");
      setNewProjectDescription("");
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
      // console.log(`Starting translation for ${projectName} in ${targetLanguage}`);
      // 调用翻译 API 或执行其他逻辑
    } catch (error) {
      console.error("Failed to start translating:", error);
    }
  };

  // ProjectCard 组件，根据 isAdmin 控制拓展菜单的显示
  interface Project {
    name: string;
    description: string;
  }

  const handleLogout = async () => {
    try {
      logout();
      // 在成功后清除用户会话或重定向
      window.location.href = "/signin" // 重定向到登录页

    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  // 将选择目标语言的下拉框部分提取到单独的组件中
  interface LanguageSelectProps {
    selectedLanguage: string;
    setSelectedLanguage: (language: string) => void;
    languages: string[];
  }
  // LanguageSelect 组件
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


  const ProjectCard = ({ project }: { project: Project }) => (
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
        <Button className="mt-4" onClick={() => {
          setIsLanguageDialogOpen(true); // 打开语言选择弹窗
        }}>
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
                setIsLanguageDialogOpen(false); // 关闭弹窗
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );

  
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
            <h2 className="text-2xl font-semibold text-gray-800">Settings</h2>
            <div className="flex items-center relative"> {/* 将容器设置为 relative 定位 */}
              <Avatar className="ml-4">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <Button variant="ghost" className="ml-2" onClick={toggleDropdown}>
                John Doe
                <ChevronDown className="ml-2 h-4 w-4 z-20" /> {/* 增加z-index确保按钮在最上层 */}
              </Button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-20 w-48 bg-white shadow-lg rounded-md z-10"> {/* 下拉框的 z-index 设置为 10 */}
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
              {/* 可以添加其他 TabsContent */}
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
      {/* 选择目标语言对话框 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Target Language</DialogTitle>
            <DialogDescription>
              Please select a language for translation.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="language-select">Target Language</Label>
            <select
              id="language-select"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              <option value="">Select Language</option>
              {languages.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleLanguageSelect}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
