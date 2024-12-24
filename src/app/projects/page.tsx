'use client'; // 指定该文件为客户端组件，确保在客户端渲染

import React, { useState, useEffect, useCallback } from 'react'; // 导入 React 和必要的 Hooks
import { useAuth } from '@/context/AuthContext'; // 导入用户认证上下文钩子
import { useProject } from '@/context/ProjectContext'; // 导入项目管理上下文钩子
import { useRouter } from 'next/navigation'; // 导入路由钩子
import { Globe, MoreVertical, Plus, Search } from 'lucide-react'; // 导入图标组件
import { Button } from '@/components/ui/button'; // 导入按钮组件
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'; // 导入卡片组件
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'; // 导入对话框组件
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'; // 导入下拉菜单组件
import { Input } from '@/components/ui/input'; // 导入输入框组件
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // 导入标签页组件
import { EditProjectDialog } from '@/components/projectsDialog/edit-project-dialog';
import { CreateProjectDialog } from '@/components/projectsDialog/create-project-dialog';

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
    }; // 修正为单个分号
    translators: {
        id: number;
        username: string;
    }[]; // 翻译者列表
    managers: {
        id: number;
        username: string;
    }[]; // 项目管理员列表
    is_public: boolean; // 是否为公共项目
    is_managed: boolean; // 是否为管理员
}

interface User {
    id: number;
    username: string;
}

// 假设的语言列表，您可以根据实际情况从后端获取或定义在其他地方
const languages = [
    'English (en)',
    'Simplified Chinese (zh-hans)',
    'Traditional Chinese (zh-hant)',
    'Spanish (es)',
    'French (fr)',
    'German (de)',
    'Italian (it)',
    'Japanese (ja)',
    'Korean (ko)',
    'Russian (ru)',
    'Arabic (ar)',
    'Portuguese (pt)',
    'Hindi (hi)',
    'Turkish (tr)',
    'Polish (pl)',
    'Dutch (nl)',
    'Swedish (sv)',
    'Norwegian (no)',
    'Danish (da)',
];

// 辅助函数：从 Cookie 中获取 CSRF token
function getCookie(name: string): string | null {
    const value = `${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
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
    const [newProjectName, setNewProjectName] = useState(''); // 新项目名称
    const [newProjectDescription, setNewProjectDescription] = useState(''); // 新项目描述
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null); // 要删除的项目名称
    const [projects, setProjects] = useState<Project[]>([]); // 项目列表
    const [loading, setLoading] = useState(true); // 加载状态
    const [newIsPublic, setNewIsPublic] = useState(false); // 新项目源语言代码
    const [newProjectLanguageCodes, setNewProjectLanguageCodes] = useState<
        string[]
    >([]); // 新项目目标语言代码
    const [projectNameManaged, setProjectNameManaged] = useState<string[]>([]); // 要编辑的项目
    const [projectNameTranslating, setProjectNameTranslating] = useState<
        string[]
    >([]); // 翻译中的项目
    const [projectInProcess, setProjectInProcess] = useState<Project[]>([]); // 翻译中的项目
    const [shouldFetchProjects, setShouldFetchProjects] = useState(false); // 是否应该获取项目列表
    const [shouldAddAdmin, setShouldAddAdmin] = useState(false); // 是否应该添加管理员
    const [createdProjectName, setCreatedProjectName] = useState(''); // 创建的项目名称
    const [projectFilterTerm, setProjectFilterTerm] = useState(''); // 项目过滤条件

    // 在组件内部定义编辑项目的状态
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    const isAdmin = user?.role === 'admin'; // 判断当前用户是否为管理员

    // 定义分页相关的状态
    const [currentPage, setCurrentPage] = useState(1); // 当前页码
    const [currentPageInProcess, setCurrentPageInProcess] = useState(1); // 当前页码

    // 获取项目列表的函数，使用 useCallback 以避免不必要的重新创建
    const fetchProjectsInProcess = useCallback(async () => {
        setLoading(true); // 设置加载状态为加载中
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/profile`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Token ${token}`, // 使用认证令牌
                    },
                }
            );
            if (response.ok) {
                const data = await response.json();
                console.log('data', data);

                setProjectNameManaged(
                    data.managed_projects.map(
                        (project: {
                            id: number;
                            name: string;
                            description: string;
                        }) => project.name
                    )
                );
                setProjectNameTranslating(
                    data.translated_projects.map(
                        (project: {
                            id: number;
                            name: string;
                            description: string;
                        }) => project.name
                    )
                );
            }
        } catch (error) {
            console.error('Error fetching projects in process:', error); // 捕获并打印错误
        } finally {
            setLoading(false); // 结束加载状态
            setShouldFetchProjects(true);
        }
    }, [token, user?.username]);

    const fetchProjects = useCallback(async () => {
        setLoading(true); // 设置加载状态为加载中
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects?project_name=${projectFilterTerm}&page_size=${100000}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Token ${token}`, // 使用认证令牌
                    },
                }
            );

            if (response.ok) {
                const data = await response.json(); // 解析响应数据
                console.log('data', data);
                const validatedData: Project[] = data.results.filter(
                    (project: Project) => typeof project.name === 'string'
                );
                setProjects(validatedData);
                // 筛选名字在 projectNameManaged 中的项目
                console.log('projectNameManaged', projectNameManaged);
                console.log('projectNameTranslating', projectNameTranslating);

                const ManagedProjects = validatedData
                    .filter((project) =>
                        projectNameManaged.includes(project.name)
                    )
                    .map((project) => ({
                        ...project,
                        is_managed: true, // 明确设置为管理员管理
                    }));
                const TranslatingProjects = validatedData
                    .filter(
                        (project) =>
                            projectNameTranslating.includes(project.name) &&
                            !projectNameManaged.includes(project.name)
                    )
                    .map((project) => ({
                        ...project,
                        is_managed: false,
                    }));

                // 使用 Set 防止重复项目
                const allProjects = [
                    ...ManagedProjects,
                    ...TranslatingProjects,
                ];
                setProjectInProcess(allProjects);
            } else {
                console.error('Failed to fetch projects'); // 打印错误日志
            }
        } catch (error) {
            console.error('Error fetching projects:', error); // 捕获并打印错误
        } finally {
            setLoading(false); // 结束加载状态
            setShouldFetchProjects(false);
        }
    }, [token, projectNameManaged, projectNameTranslating, projectFilterTerm]);

    // 组件挂载时获取项目列表
    useEffect(() => {
        if (!user || !token) return;
        fetchProjectsInProcess();
    }, [fetchProjectsInProcess]);

    useEffect(() => {
        if (!user || !token) return;
        if (shouldFetchProjects) {
            fetchProjects();
        }
    }, [fetchProjects, shouldFetchProjects]);

    /**
     * 点击外部区域关闭下拉菜单的事件处理
     */
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setDropdownOpen(false); // 关闭下拉菜单
            }
        };
        document.addEventListener('mousedown', handleClickOutside); // 添加事件监听
        return () => {
            document.removeEventListener('mousedown', handleClickOutside); // 移除事件监听
        };
    }, []);

    /**
     * 删除项目的函数
     * @param {string} projectName - 要删除的项目名称
     */
    const deleteProject = async (projectName: string) => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/delete-project?project_name=${projectName}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Token ${token}`, // 使用认证令牌
                    },
                }
            );
            if (response.ok) {
                setProjects((prevProjects) =>
                    prevProjects.filter(
                        (project) => project.name !== projectName
                    )
                ); // 从项目列表中移除已删除项目
            } else {
                throw new Error('Failed to delete project'); // 抛出错误以便后续处理
            }
        } catch (error) {
            console.error('Error deleting project:', error); // 打印错误日志
            throw error; // 重新抛出错误
        }
    };

    /**
     * 创建项目的函数
     * @param {object} projectData - 新项目的数据
     */
    const createProject = async (projectData: {
        name: string;
        description: string;
        language_code: string;
        targetLanguage: string;
        is_public: boolean;
        po_file: File | null;
    }) => {
        if (!projectData.po_file) {
            alert('Please select a file before submitting.');
            return;
        }
        try {
            console.log('Start creating project:', projectData); // 添加此行以调试
            const formData = new FormData();
            formData.append('name', projectData.name);
            formData.append('description', projectData.description);
            formData.append('language_code', projectData.targetLanguage);
            formData.append('source_language', projectData.language_code);
            formData.append('is_public', projectData.is_public.toString());
            formData.append('po_file', projectData.po_file);

            const csrfToken = getCookie('csrftoken'); // 获取 CSRF token

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/create-project`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Token ${token}`, // 使用认证令牌
                        'X-CSRFToken': csrfToken || '', // 添加 CSRF token
                    },
                    credentials: 'include', // 包含凭证
                    body: formData, // 发送表单数据
                    mode: 'cors', // 跨域请求模式
                }
            );

            if (response.ok) {
                const newProject = await response.json(); // 解析响应数据
                setProjects((prevProjects) => [...prevProjects, newProject]); // 将新项目添加到项目列表
                setIsCreateDialogOpen(false); // 关闭创建项目对话框
                setShouldAddAdmin(true); // 设置标记以添加管理员
                console.log('Project created successfully:', projectData); // 打印成功日志
                setCreatedProjectName(projectData.name); // 设置创建的项目名称
                // 无需重置状态，因为子组件已处理
            } else {
                const errorData = await response.json();
                const errorMessage =
                    errorData.error ||
                    errorData.message ||
                    'Failed to create project'; // 获取错误信息
                throw new Error(errorMessage); // 抛出错误
            }
        } catch (error) {
            console.error('Error creating project:', error); // 打印错误日志
            alert(
                error instanceof Error
                    ? error.message
                    : 'Failed to create project'
            ); // 提示用户错误信息
        }
    };

    /**
     * 添加项目管理员的函数
     */
    const addAdminToProject = async (projectName: string) => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/add-project-group-user?group=managers&project_name=${projectName}&user_id=${2}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Token ${token}`, // 使用认证令牌
                    },
                }
            );
            if (response.ok) {
                console.log('Admin added to project successfully');
            } else {
                throw new Error('Failed to add admin to project'); // 抛出错误
            }
        } catch (error) {
            console.error('Error adding admin to project:', error); // 打印错误日志
            throw error; // 重新抛出错误
        }
    };

    /**
     * 管理项目的函数
     */
    const handleManageClick = (project: Project) => {
        setEditingProject(project);
        setNewProjectName(project.name);
        setNewProjectDescription(project.description);
        const newlanguageCodes = project.languages.map(
            (lang) => lang.language_code
        );
        setNewProjectLanguageCodes(newlanguageCodes || []); // 默认选择第一个语言
        setNewIsPublic(project.is_public);
        setIsEditDialogOpen(true);
    };

    /**
     * 更新项目的处理函数
     */
    const handleSaveProject = async (
        selectedLanguages: string[],
        poFile: File | null
    ) => {
        if (!editingProject) return;

        const originalLanguages = editingProject.languages.map(
            (lang) => lang.language_code
        ); // Assuming this prop contains the original languages
        const updatedLanguages = selectedLanguages; // This should be an array of selected language codes

        // Determine languages to add and remove
        const languagesToAdd = updatedLanguages.filter(
            (lang) => !originalLanguages.includes(lang)
        );
        const languagesToRemove = originalLanguages.filter(
            (lang) => !updatedLanguages.includes(lang)
        );

        // 如果有新增语言且未上传 .po 文件，提示用户
        if (languagesToAdd.length > 0 && !poFile) {
            alert('请上传 .po 文件以添加新的语言。');
            return;
        }

        try {
            // Update project details
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/project-info?project_name=${editingProject.name}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Token ${token}`,
                    },
                    body: JSON.stringify({
                        name: newProjectName,
                        description: newProjectDescription,
                        is_public: newIsPublic,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                alert(errorData.message || 'Failed to update project details');
                return;
            }

            // 添加新语言
            if (languagesToAdd.length > 0 && poFile) {
                for (const lang of languagesToAdd) {
                    const formData = new FormData();
                    formData.append('language_code', lang);
                    formData.append('po_file', poFile);
                    const csrfToken = getCookie('csrftoken'); // 获取 CSRF token

                    const addResponse = await fetch(
                        `${process.env.NEXT_PUBLIC_API_BASE_URL}/add-language?project_name=${newProjectName}`,
                        {
                            method: 'POST',
                            headers: {
                                Authorization: `Token ${token}`,
                                'X-CSRFToken': csrfToken || '', // 添加 CSRF token
                            },
                            credentials: 'include', // 包含凭证
                            body: formData, // 发送表单数据
                            mode: 'cors', // 跨域请求模式
                        }
                    );

                    if (!addResponse.ok) {
                        const errorData = await addResponse.json();
                        alert(
                            `Failed to add language ${lang}: ${errorData.message || 'Unknown error'}`
                        );
                    }
                }
            }

            // 移除旧语言
            for (const lang of languagesToRemove) {
                const removeResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/remove-language?project_name=${newProjectName}&language_code=${lang}`,
                    {
                        method: 'DELETE', // 根据后端 API 确认是否使用 POST 或 DELETE
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Token ${token}`,
                        },
                    }
                );

                if (!removeResponse.ok) {
                    if (removeResponse.status === 404) {
                        console.warn(
                            `Language ${lang} does not exist in project ${newProjectName}.`
                        );
                    } else {
                        const errorData = await removeResponse.json();
                        alert(
                            `Failed to remove language ${lang}: ${errorData.message || 'Unknown error'}`
                        );
                    }
                }
            }

            // After all operations, close the dialog and refresh the project list
            setIsEditDialogOpen(false);
            fetchProjects();
            fetchProjectsInProcess();
        } catch (error) {
            console.error('Error updating project:', error);
            alert('An error occurred while updating the project.');
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
                console.error('Error during project deletion:', error); // 打印错误日志
            }
        }
    };

    /**
     * 确认创建项目的函数
     */
    const handleCreateProject = async (projectData: {
        name: string;
        description: string;
        language_code: string;
        targetLanguage: string;
        is_public: boolean;
        po_file: File | null;
    }) => {
        if (!projectData.name) {
            alert('Project name is required');
            return;
        }
        try {
            await createProject(projectData); // 传递整个项目数据对象
            await fetchProjects(); // 重新获取项目列表以确保数据一致性
            await fetchProjectsInProcess();
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Failed to create project. Please try again.');
        }
    };

    useEffect(() => {
        if (shouldAddAdmin) {
            console.log('Adding admin to project:', createdProjectName);
            addAdminToProject(createdProjectName)
                .then(() => {
                    console.log('管理员添加成功');
                })
                .catch((error) => {
                    console.error('添加管理员失败:', error);
                })
                .finally(() => {
                    setShouldAddAdmin(false);
                });
        }
    }, [shouldAddAdmin, createdProjectName]);

    /**
     * 启动翻译项目的函数
     * @param {string} projectName - 项目名称
     */
    const handleGoToTranslate = async (projectName: string) => {
        try {
            await fetchProjectInfo(projectName); // 获取项目详细信息
            // setCurrentProject({ name: projectName }); // 设置当前项目
            router.push(
                `/language-versions?project=${encodeURIComponent(projectName)}`
            ); // 跳转到语言版本页面
        } catch (error) {
            console.error('Failed to start translating:', error); // 打印错误日志
            alert('无法启动翻译工作，请稍后再试。'); // 提示用户错误信息
        }
    };

    /**
     * 实现分页功能的函数
     */

    // 计算排序后的项目列表
    const sortedProjects = React.useMemo(() => {
        return [...projects].sort((a, b) => {
            const nameA = a.name || ''; // 如果 a.name 为 undefined，使用空字符串兜底
            const nameB = b.name || ''; // 如果 b.name 为 undefined，使用空字符串兜底
            return nameA.localeCompare(nameB);
        });
    }, [projects]);

    const sortedProjectsInProcess = React.useMemo(() => {
        return [...projectInProcess].sort((a, b) => {
            const nameA = a.name || ''; // 如果 a.name 为 undefined，使用空字符串兜底
            const nameB = b.name || ''; // 如果 b.name 为 undefined，使用空字符串兜底
            return nameA.localeCompare(nameB);
        });
    }, [projectInProcess]);

    // 计算分页相关的变量
    const itemsPerPage = 6; // 每页显示的项目数量
    const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);
    const totalPagesInProcess = Math.ceil(
        sortedProjectsInProcess.length / itemsPerPage
    );
    const paginatedProjects = sortedProjects.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    const paginatedProjectsInProcess = sortedProjectsInProcess.slice(
        (currentPageInProcess - 1) * itemsPerPage,
        currentPageInProcess * itemsPerPage
    );

    // 跳转到指定页码
    const goToPage = (page: number) => {
        setCurrentPage(page);
    };
    const goToPageInProcess = (page: number) => {
        setCurrentPageInProcess(page);
    };

    /**
     * 项目卡片组件
     * @param {Project} project - 项目对象
     */
    const ProjectCard = ({ project }: { project: Project }) => {
        const { user } = useAuth(); // 使用认证上下文

        const isManager = isAdmin || project.is_managed;

        return (
            <Card className="h-48 flex flex-col justify-between">
                {/* 项目卡片头部，显示项目名称和操作菜单 */}
                <CardHeader className="flex flex-row items-center justify-between pb-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>{' '}
                    {/* 项目名称 */}
                    {isManager && ( // 如果用户是管理员，显示下拉菜单
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>{' '}
                                    {/* 无障碍标签 */}
                                    <MoreVertical className="h-4 w-4" />{' '}
                                    {/* 更多操作图标 */}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onSelect={() => handleManageClick(project)}
                                >
                                    Manage Project {/* 管理项目 */}
                                </DropdownMenuItem>
                                {isAdmin && (
                                    <DropdownMenuItem
                                        onSelect={() =>
                                            handleDeleteClick(project.name)
                                        }
                                        className="text-red-600"
                                    >
                                        Delete Project {/* 删除项目 */}
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </CardHeader>
                {/* 项目卡片内容，显示项目描述和启动翻译按钮 */}
                <CardContent className="flex flex-col flex-grow">
                    <CardDescription className="text-sm mt-1">
                        {project.description}
                    </CardDescription>{' '}
                    {/* 项目描述 */}
                    <Button
                        className="mt-auto self-start"
                        onClick={() => handleGoToTranslate(project.name)}
                    >
                        <Globe className="mr-2 h-4 w-4" /> {/* 地球图标 */}
                        Go to Translation {/* 启动翻译 */}
                    </Button>
                </CardContent>
            </Card>
        );
    };

    function handleSearch() {
        fetchProjects();
    }

    return (
        <div className="container mx-auto p-4 flex flex-col min-h-screen overflow-x-hidden">
            {/* 页面标题 */}
            <h1 className="text-2xl font-bold mb-6">Project Management</h1>
            {/* 搜索和创建项目部分 */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    {/* 搜索框 */}
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />{' '}
                        {/* 搜索图标 */}
                        <Input
                            type="text"
                            placeholder="Search Project..."
                            value={projectFilterTerm}
                            onChange={(e) => {
                                console.log('输入的值：', e.target.value);
                                setProjectFilterTerm(e.target.value);
                            }}
                            className="pl-8 pr-4 w-64"
                        />
                    </div>
                    <Button
                        variant="outline"
                        className="ml-0 opacity-75" // 添加 margin-left 和透明度样式
                        onClick={handleSearch}
                    >
                        Search
                    </Button>
                </div>
                {isAdmin && ( // 如果用户是管理员，显示创建项目按钮
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Create Project{' '}
                        {/* 加号图标和按钮文字 */}
                    </Button>
                )}
            </div>
            {/* 主内容区域 */}
            <div className="flex-grow">
                {/* 加载状态显示 */}
                {loading ? (
                    <p>Loading projects...</p>
                ) : (
                    <Tabs defaultValue="to-translate">
                        <TabsList>
                            <TabsTrigger value="to-translate">
                                To Translate
                            </TabsTrigger>{' '}
                            {/* 待翻译标签页 */}
                            <TabsTrigger value="in-progress">
                                In Progress
                            </TabsTrigger>{' '}
                            {/* 翻译中标签页 */}
                        </TabsList>
                        <TabsContent value="to-translate">
                            {/* 待翻译项目网格 */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {paginatedProjects.map((project) => (
                                    <ProjectCard
                                        key={project.name}
                                        project={project}
                                    />
                                ))}
                                {/* 添加占位元素，保持网格高度一致 */}
                                {Array.from(
                                    {
                                        length: Math.max(
                                            0,
                                            itemsPerPage -
                                                paginatedProjects.length
                                        ),
                                    },
                                    (_, index) => (
                                        <div
                                            key={index}
                                            className="invisible h-48"
                                        >
                                            {' '}
                                            {/* 固定高度，与 ProjectCard 一致 */}
                                            <Card className="h-48"></Card>
                                        </div>
                                    )
                                )}
                            </div>
                            {/* 分页导航 */}
                            <div className="flex justify-center mt-6 space-x-2">
                                {/* 页码按钮 */}
                                {Array.from(
                                    { length: totalPages },
                                    (_, index) => index + 1
                                ).map((page) => (
                                    <Button
                                        key={page}
                                        variant={
                                            page === currentPage
                                                ? 'outline'
                                                : 'ghost'
                                        } // 当前页码为主按钮
                                        onClick={() => goToPage(page)}
                                    >
                                        {page} {/* 显示页码 */}
                                    </Button>
                                ))}
                            </div>
                        </TabsContent>
                        <TabsContent value="in-progress">
                            {/* 翻译中项目网格 */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {paginatedProjectsInProcess.map((project) => (
                                    <ProjectCard
                                        key={project.name}
                                        project={project}
                                    />
                                ))}
                                {/* 添加占位元素，保持网格高度一致 */}
                                {Array.from(
                                    {
                                        length: Math.max(
                                            0,
                                            itemsPerPage -
                                                paginatedProjectsInProcess.length
                                        ),
                                    },
                                    (_, index) => (
                                        <div
                                            key={index}
                                            className="invisible h-48"
                                        >
                                            {' '}
                                            {/* 固定高度，与 ProjectCard 一致 */}
                                            <Card className="h-48"></Card>
                                        </div>
                                    )
                                )}
                            </div>
                            {/* 分页导航 */}
                            <div className="flex justify-center mt-6 space-x-2">
                                {/* 页码按钮 */}
                                {Array.from(
                                    { length: totalPagesInProcess },
                                    (_, index2) => index2 + 1
                                ).map((page) => (
                                    <Button
                                        key={page}
                                        variant={
                                            page === currentPageInProcess
                                                ? 'outline'
                                                : 'ghost'
                                        } // 当前页码为主按钮
                                        onClick={() => goToPageInProcess(page)}
                                    >
                                        {page} {/* 显示页码 */}
                                    </Button>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </div>
            {/* 创建项目对话框 */}
            <CreateProjectDialog
                isOpen={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onCreateProject={handleCreateProject}
                languages={languages}
            />
            {/* 编辑项目的对话框 */}
            <EditProjectDialog
                isadmin={isAdmin}
                ismanager={editingProject?.is_managed ?? false}
                isOpen={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                projectName={newProjectName}
                originalProjectName={editingProject?.name || ''}
                projectDescription={newProjectDescription}
                projectLanguageCodes={newProjectLanguageCodes}
                originalLanguageCodes={
                    editingProject?.languages.map(
                        (lang) => lang.language_code
                    ) || []
                }
                languages={languages}
                ispublic={newIsPublic}
                onIsPublicChange={setNewIsPublic}
                onProjectNameChange={setNewProjectName}
                onProjectDescriptionChange={setNewProjectDescription}
                onProjectLanguageCodesChange={setNewProjectLanguageCodes}
                onSave={handleSaveProject}
            />

            {/* 删除项目确认对话框 */}
            <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Delete Project</DialogTitle>{' '}
                        {/* 对话框标题 */}
                        <DialogDescription>
                            Are you sure you want to delete Project "
                            {projectToDelete}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                        >
                            Cancel {/* 取消按钮 */}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                        >
                            Delete {/* 删除按钮 */}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
