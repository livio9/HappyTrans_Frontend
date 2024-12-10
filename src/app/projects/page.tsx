"use client"; // 指定该文件为客户端组件，确保在客户端渲染

import React, { useState, useEffect, useCallback } from "react"; // 导入 React 和必要的 Hooks
import { useAuth } from "@/context/AuthContext"; // 导入用户认证上下文钩子
import { useProject } from "@/context/ProjectContext"; // 导入项目管理上下文钩子
import { useRouter } from "next/navigation"; // 导入路由钩子
import {
  Globe,
  MoreVertical,
  Plus,
  Search,
} from "lucide-react"; // 导入图标组件
import Link from "next/link"; // 导入 Link 组件，用于页面跳转
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // 导入头像组件
import { Button } from "@/components/ui/button"; // 导入按钮组件
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // 导入卡片组件
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // 导入选择框组件
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // 导入对话框组件
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // 导入下拉菜单组件
import { Input } from "@/components/ui/input"; // 导入输入框组件
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // 导入标签页组件
import { Label } from "@/components/ui/label"; // 导入标签组件
import { Textarea } from "@/components/ui/textarea"; // 导入多行文本输入框组件
import { EditProjectDialog } from "@/components/edit-project-dialog";

// 定义项目类型
interface Project {
  name: string; // 项目名称
  description: string; // 项目描述
  source_language: string; // 源语言代码
  create_at: string; // 创建日期
  language_code: string; // 目标语言代码
  po_file?: File; // 可选的 PO 文件
  languages: {
    language_code: string;
    total_entries_count: number;
    selected_entries_count: number;
    selected_entries_ratio: number;
  }[]; // 目标语言列表
  overall_statistics: {
    total_languages: number; // 总语言数
    total_entries: number; // 总字符串数
    total_selected_entries: number; // 已选择的字符串数
    overall_selected_ratio: number; // 已选择的字符串比例
  }
  translators: {
    id: number;
    username: string;
  }[]; // 翻译者列表
  managers: {
    id: number;
    username: string;
  }[]; // 项目管理员列表
  is_public: boolean; // 是否为公共项目
}

interface User {
  id: number;
  username: string;
}

// 假设的语言列表，您可以根据实际情况从后端获取或定义在其他地方
const languages = [
  "English (en)",
  "Simplified Chinese (zh-hans)",
  "Traditional Chinese (zh-hant)",
  "Spanish (es)",
  "French (fr)",
  "German (de)",
  "Italian (it)",
  "Japanese (ja)",
  "Korean (ko)",
  "Russian (ru)",
  "Arabic (ar)",
  "Portuguese (pt)",
  "Hindi (hi)",
  "Turkish (tr)",
  "Polish (pl)",
  "Dutch (nl)",
  "Swedish (sv)",
  "Norwegian (no)",
  "Danish (da)",
];

// 辅助函数：从 Cookie 中获取 CSRF token
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
}

export default function Projects() {
  const { user, token } = useAuth(); // 使用认证上下文获取用户信息和认证令牌
  const { setCurrentProject, fetchProjectInfo } = useProject(); // 使用项目上下文获取和设置当前项目
  const router = useRouter(); // 使用路由钩子进行页面跳转

  // 定义状态
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // 删除项目对话框的打开状态
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false); // 创建项目对话框的打开状态
  const [dropdownOpen, setDropdownOpen] = useState(false); // 下拉菜单的打开状态
  const dropdownRef = React.useRef<HTMLDivElement>(null); // 下拉菜单引用

  // 定义项目相关的状态
  const [newProjectName, setNewProjectName] = useState(""); // 新项目名称
  const [newProjectDescription, setNewProjectDescription] = useState(""); // 新项目描述
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null); // 要删除的项目名称
  const [projects, setProjects] = useState<Project[]>([]); // 项目列表
  const [loading, setLoading] = useState(true); // 加载状态
  const [newProjectSourceLanguage, setNewProjectSourceLanguage] = useState("en"); // 新项目源语言代码
  const [newIsPublic, setNewIsPublic] = useState(false); // 新项目源语言代码
  const [newProjectLanguageCode, setNewProjectLanguageCode] = useState(""); // 新项目目标语言代码
  const [newProjectFile, setNewProjectFile] = useState<File | null>(null); // 新项目的 PO 文件

  // 管理项目的状态
  const [manSearchTerm, setManSearchTerm] = useState(""); // 管理者搜索关键字
  const [tranSearchTerm, setTranSearchTerm] = useState(""); // 翻译者搜索关键字
  const [managers, setManagers] = useState<User[]>([]); // 管理者列表
  const [translators, setTranslators] = useState<User[]>([]); // 翻译者列表

  // 在组件内部定义编辑项目的状态
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const isAdmin = user?.role === "admin"; // 判断当前用户是否为管理员

  // 定义分页相关的状态
  const [currentPage, setCurrentPage] = useState(1); // 当前页码

  // 获取项目列表的函数，使用 useCallback 以避免不必要的重新创建
  const fetchProjects = useCallback(async () => {
    setLoading(true); // 设置加载状态为加载中
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`, // 使用认证令牌
        },
      });
      
      if (response.ok) {
        const data: Project[] = await response.json(); // 解析响应数据
        console.log("data", data)
        const validatedData = data.filter((project) => typeof project.name === "string");
        setProjects(validatedData);
      } else {
        console.error("Failed to fetch projects"); // 打印错误日志
      }
    } catch (error) {
      console.error("Error fetching projects:", error); // 捕获并打印错误
    } finally {
      setLoading(false); // 结束加载状态
    }
  }, [token]); 

  // 组件挂载时获取项目列表
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  /**
   * 点击外部区域关闭下拉菜单的事件处理
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false); // 关闭下拉菜单
      }
    };
    document.addEventListener("mousedown", handleClickOutside); // 添加事件监听
    return () => {
      document.removeEventListener("mousedown", handleClickOutside); // 移除事件监听
    };
  }, []);

  /**
   * 删除项目的函数
   * @param {string} projectName - 要删除的项目名称
   */
  const deleteProject = async (projectName: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/delete-project?project_name=${projectName}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`, // 使用认证令牌
        },
      });
      if (response.ok) {
        setProjects((prevProjects) => prevProjects.filter((project) => project.name !== projectName)); // 从项目列表中移除已删除项目
      } else {
        throw new Error("Failed to delete project"); // 抛出错误以便后续处理
      }
    } catch (error) {
      console.error("Error deleting project:", error); // 打印错误日志
      throw error; // 重新抛出错误
    }
  };

  /**
   * 创建项目的函数
   * @param {string} name - 新项目名称
   * @param {string} description - 新项目描述
   */
  const createProject = async (name: string, description: string) => {
    if (!newProjectFile) {
      alert("Please select a file before submitting."); // 提示用户选择文件
      return;
    }
    try {
      console.log("start to create.")
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("language_code", newProjectLanguageCode);
      formData.append("source_language", newProjectSourceLanguage);
      formData.append("is_public", newIsPublic.toString());
      formData.append("po_file", newProjectFile);

      const csrfToken = getCookie("csrftoken"); // 获取 CSRF token

      console.log("before use create")

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/create-project`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`, // 使用认证令牌
          "X-CSRFToken": csrfToken || "", // 添加 CSRF token
        },
        credentials: "include", // 包含凭证
        body: formData, // 发送表单数据
        mode: "cors", // 跨域请求模式
      });
      console.log("after use create")
      if (response.ok) {
        const newProject = await response.json(); // 解析响应数据
        setProjects((prevProjects) => [...prevProjects, newProject]); // 将新项目添加到项目列表
        setIsCreateDialogOpen(false); // 关闭创建项目对话框
        // 重置表单
        setNewProjectName("");
        setNewProjectDescription("");
        setNewProjectSourceLanguage("en");
        setNewProjectLanguageCode("");
        setNewProjectFile(null);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.message || "Failed to create project"; // 获取错误信息
        throw new Error(errorMessage); // 抛出错误
      }
    } catch (error) {
      console.error("Error creating project:", error); // 打印错误日志
      alert(error instanceof Error ? error.message : "Failed to create project"); // 提示用户错误信息
    }
  };

  /**
  * 管理项目的函数
  */
  const handleManageClick = (project: Project) => {
    setEditingProject(project);
    setNewProjectName(project.name);
    setNewProjectDescription(project.description);
    setNewProjectLanguageCode(project.languages[0]?.language_code || ""); // 默认选择第一个语言
    setNewIsPublic(project.is_public);
    setIsEditDialogOpen(true);
  };

  /**
  * 更新项目的处理函数
  */
  const handleSaveProject = async () => {
    if (!editingProject) return;

    try {
      const response = await fetch(`${ process.env.NEXT_PUBLIC_API_BASE_URL }/project-info?project_name=${editingProject.name}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription,
          language_code: newProjectLanguageCode,
          is_public: newIsPublic,
        }),
      });

      if (response.ok) {
        // 更新成功，关闭弹窗并更新项目列表
        setIsEditDialogOpen(false);
        fetchProjects(); // 重新获取项目列表
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to update project");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      alert("An error occurred while updating the project.");
    }
  };

  /**
   * 处理删除按钮点击事件，打开删除确认对话框
   * @param {string} projectId - 要删除的项目名称
   */
  const handleDeleteClick = (projectId: string) => {
    setProjectToDelete(projectId); // 设置要删除的项目
    setIsDeleteDialogOpen(true); // 打开删除确认对话框
  };

  /**
   * 确认删除项目的函数
   */
  const handleDeleteConfirm = async () => {
    if (projectToDelete) {
      try {
        await deleteProject(projectToDelete); // 调用删除项目函数
        setIsDeleteDialogOpen(false); // 关闭删除确认对话框
        setProjectToDelete(null); // 清除要删除的项目
      } catch (error) {
        console.error("Error during project deletion:", error); // 打印错误日志
      }
    }
  };

  /**
   * 确认创建项目的函数
   */
  const handleCreateProject = async () => {
    if (!newProjectName) {
      alert("Project name is required"); // 提示用户项目名称是必填项
      return;
    }
    try {
      await createProject(newProjectName, newProjectDescription); // 调用创建项目函数
      // 重新获取项目列表以确保数据一致性
      await fetchProjects();
    } catch (error) {
      console.error("Error creating project:", error); // 打印错误日志
    }
  };

  /**
   * 启动翻译项目的函数
   * @param {string} projectName - 项目名称
   */
  const handleGoToTranslate = async (projectName: string) => {
    try {
      await fetchProjectInfo(projectName); // 获取项目详细信息
      setCurrentProject({ name: projectName }); // 设置当前项目
      router.push(`/language-versions?project=${encodeURIComponent(projectName)}`);  // 跳转到语言版本页面
    } catch (error) {
      console.error("Failed to start translating:", error); // 打印错误日志
      alert("无法启动翻译工作，请稍后再试。"); // 提示用户错误信息
    }
  };




  /**
   * 实现分页功能的函数
   */

  // 计算排序后的项目列表
  const sortedProjects = React.useMemo(() => {
    return [...projects].sort((a, b) => {
      const nameA = a.name || ""; // 如果 a.name 为 undefined，使用空字符串兜底
      const nameB = b.name || ""; // 如果 b.name 为 undefined，使用空字符串兜底
      return nameA.localeCompare(nameB);
    });
  }, [projects]);

  // 计算分页相关的变量
  const itemsPerPage = 6; // 每页显示的项目数量
  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);
  const paginatedProjects = sortedProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 跳转到指定页码
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  /**
   * 项目卡片组件
   * @param {Project} project - 项目对象
   */
  const ProjectCard = ({ project }: { project: Project }) => {
    const { user } = useAuth(); // 使用认证上下文
    const isAdmin = user?.role === "admin"; // 判断用户是否为管理员

    return (
      <Card>
        {/* 项目卡片头部，显示项目名称和操作菜单 */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{project.name}</CardTitle> {/* 项目名称 */}
          {isAdmin && ( // 如果用户是管理员，显示下拉菜单
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span> {/* 无障碍标签 */}
                  <MoreVertical className="h-4 w-4" /> {/* 更多操作图标 */}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => handleManageClick(project)}>
                  Manage Project {/* 管理项目 */}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleDeleteClick(project.name)} className="text-red-600">
                  Delete Project {/* 删除项目 */}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>
        {/* 项目卡片内容，显示项目描述和启动翻译按钮 */}
        <CardContent>
          <CardDescription>{project.description}</CardDescription> {/* 项目描述 */}
          <Button className="mt-4" onClick={() => handleGoToTranslate(project.name)}>
            <Globe className="mr-2 h-4 w-4" /> {/* 地球图标 */}
            Go to Translation {/* 启动翻译 */}
          </Button>
        </CardContent>
      </Card>
    );
  };


  return (
    <div className="container mx-auto p-4">
      {/* 页面标题 */}
      <h1 className="text-2xl font-bold mb-6">Project Management</h1>
      {/* 搜索和创建项目部分 */}
      <div className="mb-6 flex items-center justify-between">
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" /> {/* 搜索图标 */}
          <Input type="text" placeholder="Search Project..." className="pl-8 pr-4 w-64" />
        </div>
        {isAdmin && ( // 如果用户是管理员，显示创建项目按钮
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Project {/* 加号图标和按钮文字 */}
          </Button>
        )}
      </div>
      {/* 加载状态显示 */}
      {loading ? (
        <p>Loading projects...</p>
      ) : (
        <Tabs defaultValue="to-translate">
          <TabsList>
            <TabsTrigger value="to-translate">To Translate</TabsTrigger> {/* 待翻译标签页 */}
            <TabsTrigger value="in-progress">In Progress</TabsTrigger> {/* 翻译中标签页 */}
          </TabsList>
          <TabsContent value="to-translate">
            {/* 待翻译项目网格 */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedProjects.map((project) => (
                <ProjectCard key={project.name} project={project} />
              ))}
            </div>
            {/* 分页导航 */}
            <div className="flex justify-center mt-6 space-x-2">
              {/* 页码按钮 */}
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "outline" : "ghost"} // 当前页码为主按钮
                  onClick={() => goToPage(page)}
                >
                  {page} {/* 显示页码 */}
                </Button>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="in-progress">
            {/* 翻译中项目网格（示例，可根据实际数据调整） */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* 这里可以添加翻译中项目的展示 */}
              <p>There are no projects in translation.</p>
            </div>
          </TabsContent>
        </Tabs>
      )}
      {/* 创建项目对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle> {/* 对话框标题 */}
            <DialogDescription>
              Fill in the details below to create a new translation project.
            </DialogDescription>
          </DialogHeader>
          {/* 创建项目表单 */}
          <form
            onSubmit={(e) => {
              e.preventDefault(); // 防止表单默认提交行为
              handleCreateProject(); // 调用创建项目函数
            }}
          >
            <div className="grid gap-4 py-4">
              {/* 项目名称输入 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="project-name" className="text-right">
                  Name
                </Label>
                <Input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter project name"
                  required // 设置为必填项
                />
              </div>
              {/* 项目描述输入 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="project-description" className="text-right">
                  Description
                </Label>
                <Textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter project description"
                  required // 设置为必填项
                />
              </div>
              {/* 源语言输入 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="source-language" className="text-right">
                  Source Language
                </Label>
                <Select
                  value={newProjectSourceLanguage}
                  onValueChange={(value) => setNewProjectSourceLanguage(value)}
                  required // 设置为必填项
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Source Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang: string) => {
                      const [name, code] = lang.split(" (");
                      return <SelectItem key={code} value={code.replace(")", "")}>{name}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              {/* 目标语言输入 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="language-code" className="text-right">
                  Target Language
                </Label>
                <Select
                  value={newProjectLanguageCode}
                  onValueChange={(value) => setNewProjectLanguageCode(value)}
                  required // 设置为必填项
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Target Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang: string) => {
                      const [name, code] = lang.split(" (");
                      return <SelectItem key={code} value={code.replace(")", "")}>{name}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              {/* 设置是否公开 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="source-language" className="text-right">
                  Is Public
                </Label>
                <Select
                  value={newIsPublic.toString()}
                  onValueChange={(value) => setNewIsPublic(value === "true")}
                  required // 设置为必填项
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
              {/* PO 文件上传 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="po-file" className="text-right">
                  PO 文件
                </Label>
                <Input
                  type="file"
                  accept=".po"
                  onChange={(e) => setNewProjectFile(e.target.files?.[0] || null)}
                  className="col-span-3"
                  required // 设置为必填项
                />
              </div>
            </div>
            {/* 对话框底部按钮 */}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel {/* 取消按钮 */}
              </Button>
              <Button type="submit">
                Create {/* 创建按钮 */}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* 编辑项目的对话框 */}
      <EditProjectDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        projectName={newProjectName}
        projectDescription={newProjectDescription}
        projectLanguageCode={newProjectLanguageCode}
        languages={languages}
        ispublic={newIsPublic}
        onIsPublicChange={setNewIsPublic}
        onProjectNameChange={setNewProjectName}
        onProjectDescriptionChange={setNewProjectDescription}
        onProjectLanguageCodeChange={setNewProjectLanguageCode}
        onSave={handleSaveProject}
      />

      {/* 删除项目确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle> {/* 对话框标题 */}
            <DialogDescription>
              Are you sure you want to delete Project "{projectToDelete}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel {/* 取消按钮 */}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete {/* 删除按钮 */}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
