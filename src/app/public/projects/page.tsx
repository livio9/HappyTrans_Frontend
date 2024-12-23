'use client'; // 指定该文件为客户端组件，确保在客户端渲染

import React, { useState, useEffect, useCallback } from 'react'; // 导入 React 和必要的 Hooks
import { useRouter } from 'next/navigation'; // 导入路由钩子
import { Globe, Search } from 'lucide-react'; // 导入图标组件
import { Button } from '@/components/ui/button'; // 导入按钮组件
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'; // 导入卡片组件
import { Input } from '@/components/ui/input'; // 导入输入框组件
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // 导入标签页组件

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

export default function Projects() {
    const router = useRouter(); // 使用路由钩子进行页面跳转

    const dropdownRef = React.useRef<HTMLDivElement>(null); // 下拉菜单引用

    // 定义项目相关的状态
    const [newProjectName, setNewProjectName] = useState(''); // 新项目名称
    const [newProjectDescription, setNewProjectDescription] = useState(''); // 新项目描述
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null); // 要删除的项目名称
    const [projects, setProjects] = useState<Project[]>([]); // 项目列表
    const [loading, setLoading] = useState(true); // 加载状态
    const [newIsPublic, setNewIsPublic] = useState(false); // 新项目源语言代码
    const [projectInProcess, setProjectInProcess] = useState<Project[]>([]); // 翻译中的项目
    const [shouldFetchProjects, setShouldFetchProjects] = useState(false); // 是否应该获取项目列表
    const [shouldAddAdmin, setShouldAddAdmin] = useState(false); // 是否应该添加管理员
    const [createdProjectName, setCreatedProjectName] = useState(''); // 创建的项目名称
    const [projectFilterTerm, setProjectFilterTerm] = useState(''); // 项目过滤条件

    // 定义分页相关的状态
    const [currentPage, setCurrentPage] = useState(1); // 当前页码
    const [currentPageInProcess, setCurrentPageInProcess] = useState(1); // 当前页码

    const fetchProjects = useCallback(async () => {
        setLoading(true); // 设置加载状态为加载中
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects?project_name=${projectFilterTerm}&page_size=${100}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
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
            } else {
                console.error('Failed to fetch projects'); // 打印错误日志
            }
        } catch (error) {
            console.error('Error fetching projects:', error); // 捕获并打印错误
        } finally {
            setLoading(false); // 结束加载状态
            setShouldFetchProjects(false);
        }
    }, [projectFilterTerm]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects, shouldFetchProjects]);

    /**
     * 启动翻译项目的函数
     * @param {string} projectName - 项目名称
     */
    const handleGoToTranslate = async (projectName: string) => {
        try {
            router.push(
                `/public/language-versions?project=${encodeURIComponent(projectName)}`
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
        return (
            <Card className="h-48 flex flex-col justify-between">
                {/* 项目卡片头部，显示项目名称和操作菜单 */}
                <CardHeader className="flex flex-row items-center justify-between pb-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>{' '}
                    {/* 项目名称 */}
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
                            <p>Please log in to view the projects </p>
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </div>
    );
}
