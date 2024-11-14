"use client";
import { useAuth } from "@/context/AuthContext";
import { useProject } from "@/context/ProjectContext";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Globe, Home, MoreVertical, Plus, Search, Settings } from "lucide-react";
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

interface Project {
  name: string;
  description: string;
}

export default function Projects() {
  const { user, token } = useAuth(); // 获取用户信息，包括 role
  const { setCurrentProject, fetchProjectInfo } = useProject();// 获取 setCurrentProject 函数
  const router = useRouter(); // 定义 router
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [newProjectName, setNewProjectName] = React.useState("");
  const [newProjectDescription, setNewProjectDescription] = React.useState("");
  const [projectToDelete, setProjectToDelete] = React.useState<string | null>(null); // 当前选择删除的项目名称
  const [projects, setProjects] = React.useState<Project[]>([]); // 存储从后端获取的项目列表
  const [loading, setLoading] = React.useState(true); // 加载状态
  type ProjectName = string; // 定义 ProjectName 类型

  // 检查当前用户是否为 admin
  const isAdmin = user?.role === "admin";

  // 获取项目列表
  React.useEffect(() => {
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
          setProjects(data); // 将项目列表存储在状态中
        } else {
          console.error("Failed to fetch projects");
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

   // Delete project function
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

  // Create project function
  const createProject = async (name: string, description: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/create-project?name=${name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ name, description }),
      });

      if (response.ok) {
        const newProject = await response.json();
        setProjects([...projects, newProject]);
        setIsCreateDialogOpen(false);
      } else {
        throw new Error('Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
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

  const handleStartTranslating = async (projectName: string) => {
    await fetchProjectInfo(projectName);
    setCurrentProject({ name: projectName });
    router.push("/translation-interface");
  };

  // ProjectCard 组件，根据 isAdmin 控制拓展菜单的显示
  interface Project {
    name: string;
    description: string;
  }

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
        <Button className="mt-4" onClick={() => handleStartTranslating(project.name)}>
          Start Translating
        </Button>
      </CardContent>
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
            <h2 className="text-2xl font-semibold text-gray-800">Projects</h2>
            <div className="flex items-center">
              <Avatar className="ml-4">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
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
              <Button onClick={() => console.log("Create new project")}>
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
