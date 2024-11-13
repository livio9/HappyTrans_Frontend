"use client";
import { useAuth } from "@/context/AuthContext"
import { useProject } from "@/context/ProjectContext"
import { useRouter } from "next/navigation";
import * as React from "react"
import { Globe, Home, MoreVertical, Plus, Search, Settings, Trash, Users } from "lucide-react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Projects() {
  const { user } = useAuth(); // 获取用户信息，包括 role
  const { setCurrentProject, fetchProjectInfo } = useProject(); // 获取 setCurrentProject 函数
  const router = useRouter(); // 定义 router
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  type ProjectName = string; // 定义 ProjectName 类型
  const [projectToDelete, setProjectToDelete] = React.useState<ProjectName | null>(null); // 修改为 ProjectName | null

  // 检查当前用户是否为 admin
  const isAdmin = user?.role === "admin";

  // 修改 handleDeleteClick 的参数类型为 name
  const handleDeleteClick = (projectId: ProjectName) => {
    setProjectToDelete(projectId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    // 执行删除逻辑
    console.log(`Deleting project ${projectToDelete}`);
    setIsDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  // 点击 "Start Translating" 按钮时设置当前项目并跳转到详情页面
  const handleStartTranslating = async (project: ProjectName) => {
    await fetchProjectInfo(project); // 从后端获取项目的信息
    setCurrentProject({ name: `Project ${project}`, id: project }); // 设置当前项目的名称和 ID
    // router.push("/project-overview"); // 跳转到项目概览页面
    //暂时修改为跳转到具体词条翻译页面，后续做component之后再改回来
    router.push("/translation-interface");
  };

  // ProjectCard 组件，根据 isAdmin 控制拓展菜单的显示
  const ProjectCard = ({ project, status }: { project: ProjectName; status: "to-translate" | "in-progress" }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Project {project}</CardTitle>
        {/* <CardTitle>string</CardTitle> */}
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => console.log(`Manage Project ${project}`)}>
                Manage Project
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleDeleteClick(project)} className="text-red-600">
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>
        <CardDescription>{status === "to-translate" ? "Awaiting translation" : "In progress"}</CardDescription>
        <p className="text-sm text-gray-600">{status === "to-translate" ? "0%" : "50%"} Complete</p>
        <Button className="mt-4" onClick={() => handleStartTranslating(project)}>
          {status === "to-translate" ? "Start" : "Continue"} Translating
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
            {/* 仅当 isAdmin 为 true 时显示 Create Project 按钮 */}
            {isAdmin && (
              <Button onClick={() => console.log("Create new project")}>
                <Plus className="mr-2 h-4 w-4" /> Create Project
              </Button>
            )}
          </div>

          <Tabs defaultValue="to-translate">
            <TabsList>
              <TabsTrigger value="to-translate">To Translate</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            </TabsList>
            <TabsContent value="to-translate">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {["string", 2, 3, 4, 5, 6].map((project) => (
                  <ProjectCard key={project} project={project.toString()} status="to-translate" />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="in-progress">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((project) => (
                  <ProjectCard key={project} project={project.toString()} status="in-progress" />
                ))}
              </div>
            </TabsContent>
          </Tabs>
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
  )
}