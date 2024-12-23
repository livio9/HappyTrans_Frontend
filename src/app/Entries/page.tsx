'use client'; // 使用客户端模式
import { useAuth } from '@/context/AuthContext'; // 使用认证上下文获取用户信息和认证令牌
import React, { useEffect, useState, useMemo, useCallback } from 'react'; // 添加useMemo实现缓存排序和筛选结果
import { useSearchParams, useRouter } from 'next/navigation'; // 使用路由钩子跳转页面，使用useSearchParams获取URL查询参数
import { FixedSizeList as List } from 'react-window'; // 使用 react-window 渲染虚拟列表，提高性能
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'; // 使用表格组件
import { Input } from '@/components/ui/input'; // 使用输入框组件
import { Button } from '@/components/ui/button'; // 使用按钮组件
import { Progress } from '@/components/ui/progress'; // 使用进度条组件
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'; // 使用下拉选择组件
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUpDown,
    Search,
} from 'lucide-react'; // 使用lucide图标
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // 使用卡片组件

// 用于entries返回的数据结构中的msgstr数组
type msgstr = {
    msg: string; // 翻译内容
    timestamp: string; // 时间戳，更新时间
    user_id: string; // 提交翻译的用户id
    id: string; // 在 msgstr 数组中的索引
};

// 用于entries返回的数据结构中的entry数组
type Entry = {
    comments: string; // 提交翻译时的注释
    extracted_comments: string; // 提取的注释
    flags: string; // 标记
    msgctxt: string | null; // 上下文
    idx_in_language: number; // 索引
    msgid: string; // 原文
    msgid_plural: string; // 复数原文
    msgstr: msgstr[]; // 翻译内容数组
    msgstr_plural: string; // 复数翻译
    updated_at: string; // 最近一次更新时间
    selected_msgstr_index: number; // 选中的翻译内容索引
    references: string; // 字符串位置
    tags: string[]; // 新增：标签（修改为数组类型）
};

type LanguageData = {
    language_code: string; // 语言代码
    entries: Entry[]; // 翻译条目数组
};

// 这两个LanguageData的区别在于第二个是从project_info返回的数据结构中的languages数组中取出的，第一个是从entries返回的数据结构中取出的
type ProjectLanguageData = {
    language_code: string;
    pot_creation_date: string;
    po_revision_date: string;
};

// 用于project_info返回的数据结构
type ProjectData = {
    name: string; // 项目名称
    description: string; // 项目描述
    source_language: string; // 源语言（修正拼写错误）
    languages: ProjectLanguageData[]; // 语言数组
    created_at: string; // 创建时间
};

type Entries = {
    project: string; // 项目名称
    languages: LanguageData[]; // 语言数组
};

// 根据标签设置不同的颜色类
const getTagColorClass = (tag: string) => {
    switch (tag) {
        case 'To be translated':
            return 'bg-red-500 text-white';
        case 'To be reviewed':
            return 'bg-yellow-500 text-black';
        case 'Need to check again':
            return 'bg-blue-500 text-white';
        // 自定义
        default:
            return 'bg-gray-300 text-black';
    }
};

// 自定义 List 的外部元素，移除水平滚动
const OuterElement = React.forwardRef<
    HTMLDivElement,
    React.HTMLProps<HTMLDivElement>
>((props, ref) => (
    <div {...props} ref={ref} style={{ ...props.style, overflowX: 'hidden' }} />
));

export default function ProjectDetails() {
    const router = useRouter(); // 使用路由钩子跳转页面
    const { token } = useAuth(); // 使用认证上下文获取用户信息和认证令牌
    const searchParams = useSearchParams(); // 使用useSearchParams获取URL查询参数
    const projectName = searchParams.get('project_name'); // 获取项目名称
    const languageCode = searchParams.get('language_code'); // 获取语言代码
    const query = searchParams.get('query'); // 获取查询参数，只有在搜索时才会使用

    const [languageProcess, setLanguageProcess] = useState<number>(0); // 保存翻译进度到状态

    // 使用 useMemo 缓存 queryParams，只有在依赖项变化时才重新计算，用于调用entries构建查询参数
    const queryParams = useMemo(() => {
        return new URLSearchParams({
            project_name: projectName || '',
            language_code: languageCode || '',
            ...(query ? { query } : {}), // 只有在 query 存在时才添加到查询参数中
        });
    }, [projectName, languageCode, query]);

    const [currentPage, setCurrentPage] = useState(1); // 当前页码
    const itemsPerPage = 8; // 每页显示的条目数

    const [entriesdata, setEntriesData] = useState<Entries>(); // 保存 entries 数据到状态
    const [projectData, setProjectData] = useState<ProjectData | null>(null); // 保存 project_info 数据到状态
    const [loading, setLoading] = useState<boolean>(true); // 加载状态

    // 搜索、排序和分页相关状态
    const [searchTerm, setSearchTerm] = useState('');

    // 添加新的状态用于排序
    const [sortColumn, setSortColumn] = useState<string>('idx_in_language'); // 选择用于排序的列，默认使用index
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); // 排序方向，默认升序

    useEffect(() => {
        if (!token) return;
        const fetchProjectData = async () => {
            // 获取 project_info 数据
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/project-info?project_name=${encodeURIComponent(projectName || '')}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Token ${token}`, // 使用认证令牌
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch project data');
                }
                const data: ProjectData = await response.json();
                setProjectData(data); // 保存 projectData 到状态
            } catch (error) {
                console.error('Error fetching project data:', error);
            }
        };

        const fetchEntriesData = async () => {
            // 获取 entries 数据
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/entries?${queryParams.toString()}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Token ${token}`, // 使用认证令牌
                        },
                    }
                );
                if (!response.ok) {
                    throw new Error('Failed to fetch entries data');
                }
                const data: Entries = await response.json();
                setEntriesData(data); // 保存 entriesdata 到状态
            } catch (error) {
                console.error('Error fetching entries data:', error);
            }
        };

        const fetchLanguageInfo = async () => {
            // 获取语言版本信息，主要目的是获取语言类的翻译进度
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/language-info?project_name=${encodeURIComponent(
                        projectName || ''
                    )}&language_code=${encodeURIComponent(languageCode || '')}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Token ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch language info');
                }
                const data = await response.json();
                console.log('Fetched language info:', data);
                setLanguageProcess(data.selected_entries_ratio); // 设置进度条进度
            } catch (error) {
                console.error('Error fetching language info:', error);
            }
        };

        const fetchData = async () => {
            // 获取数据，设置加载状态，调用fetchProjectData和fetchEntriesData
            setLoading(true);
            if (projectName && languageCode) {
                await fetchProjectData(); // 获取 project_info 数据
                await fetchEntriesData(); // 获取 entriesdata 数据
                await fetchLanguageInfo(); // 获取语言版本信息
            } else {
                console.error('Missing project_name or language_code in URL.');
            }
            setLoading(false);
        };

        fetchData();
    }, [projectName, languageCode, query, token, queryParams]);

    // 添加排序逻辑，根据点击的列名和当前排序方向进行排序
    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    // 使用 useMemo 缓存筛选和排序结果
    const filteredAndSortedEntries = useMemo(() => {
        if (!entriesdata || !entriesdata.languages) return [];

        const languageData = entriesdata.languages.find(
            (lang) => lang.language_code === languageCode
        );

        if (!languageData) return [];

        // 排序
        const sorted = [...languageData.entries].sort((a, b) => {
            if (sortColumn === 'idx_in_language') {
                // 根据索引排序
                return sortDirection === 'asc'
                    ? a.idx_in_language - b.idx_in_language
                    : b.idx_in_language - a.idx_in_language;
            } else if (sortColumn === 'key') {
                // 根据references排序
                return sortDirection === 'asc'
                    ? a.references.localeCompare(b.references)
                    : b.references.localeCompare(a.references);
            } else if (sortColumn === 'original') {
                // 根据msgid排序
                return sortDirection === 'asc'
                    ? a.msgid.localeCompare(b.msgid)
                    : b.msgid.localeCompare(a.msgid);
            } else if (sortColumn === 'translation') {
                // 根据msgstr排序
                const aTranslation = a.msgstr[0]?.msg || '';
                const bTranslation = b.msgstr[0]?.msg || '';
                return sortDirection === 'asc'
                    ? aTranslation.localeCompare(bTranslation)
                    : bTranslation.localeCompare(aTranslation);
            } else if (sortColumn === 'updatedAt') {
                // 根据更新时间排序
                return sortDirection === 'asc'
                    ? new Date(a.updated_at).getTime() -
                          new Date(b.updated_at).getTime()
                    : new Date(b.updated_at).getTime() -
                          new Date(a.updated_at).getTime();
            }
            return 0;
        });

        return sorted;
    }, [entriesdata, sortColumn, sortDirection, languageCode]);

    // 分页数据
    const paginatedEntries = useMemo(() => {
        // 使用 useMemo 缓存entries的分页结果
        return filteredAndSortedEntries.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        );
    }, [filteredAndSortedEntries, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(
        filteredAndSortedEntries.length / itemsPerPage
    );

    const handleLanguageChange = (newLanguageCode: string) => {
        // 处理语言切换功能
        if (projectName) {
            router.push(
                `/Entries?project_name=${encodeURIComponent(projectName)}&language_code=${encodeURIComponent(newLanguageCode)}`
            );
        }
    };

    // 处理搜索重定向问题，同时更新若query为空则重定向内容不包括query
    const handleSearch = () => {
        if (projectName && languageCode) {
            const baseUrl = `/Entries?project_name=${encodeURIComponent(
                projectName
            )}&language_code=${encodeURIComponent(languageCode)}`;
            const queryParam = searchTerm
                ? `&query=${encodeURIComponent(searchTerm)}`
                : '';

            router.push(baseUrl + queryParam);
        }
    };

    if (loading) {
        // 加载状态，显示加载动画
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    // 现在不区分错误和没有数据的情况，显示一个友好的消息，一般是因为没有数据
    if (!entriesdata?.languages.length) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>No Entries Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            No entries found for the selected language.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    /**
     * 跳转到项目页面
     */
    const handleProjectNavigation = () => {
        router.push('/projects');
    };
    /**
     * 跳转到语言版本
     */
    const handleProjectLanguage = () => {
        if (projectName) {
            // 只有当 projectName 有值时，才会进行跳转
            router.push(
                `/language-versions?project=${encodeURIComponent(projectName)}`
            );
        } else {
            console.error('Project name is missing');
        }
    };

    // 确定表格总宽度
    const tableTotalWidth = 100 + 270 + 400 + 400 + 150; // 1320px

    return (
        <div className="min-h-screen mx-auto p-6 space-y-8">
            {' '}
            {/* 使用 h-screen 代替 h-100vh */}
            {/* 项目导航面包屑 */}
            <div className="flex items-center space-x-1 mb-6 text-sm text-gray-600">
                {/* Projects按钮 */}
                <Button
                    variant="link"
                    onClick={handleProjectNavigation}
                    className="text-gray-500 font-semibold"
                >
                    Projects
                </Button>
                {/* 分隔符 */}
                <span className="text-gray-400">/</span>
                {/* 当前项目按钮 */}
                <Button
                    variant="link"
                    onClick={handleProjectLanguage}
                    className="text-gray-500 font-semibold"
                >
                    {projectName}
                </Button>
                {/* 分隔符 */}
                <span className="text-gray-400">/</span>
                {/* 当前项目语言按钮 */}
                <Button
                    variant="link"
                    className="font-semibold text-gray-800 hover:text-blue-700 focus:outline-none"
                >
                    {languageCode}
                </Button>
            </div>
            {/* 项目信息部分 */}
            <Card className="w-full">
                <CardHeader>
                    {' '}
                    {/* 项目标题和描述 */}
                    <CardTitle className="text-3xl font-bold">
                        {projectData?.name || projectName}
                    </CardTitle>
                    <p className="text-muted-foreground mt-2">
                        {projectData?.description}
                    </p>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-3">
                    {' '}
                    {/* 项目信息 */}
                    <div>
                        <h2 className="text-lg font-semibold mb-2">
                            Current Language
                        </h2>{' '}
                        {/* 当前语言, 可以快速选择其他语言项*/}
                        <Select
                            value={languageCode || undefined}
                            onValueChange={handleLanguageChange}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                                {projectData?.languages.map((lang) => (
                                    <SelectItem
                                        key={lang.language_code}
                                        value={lang.language_code}
                                    >
                                        {lang.language_code}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="md:col-span-2">
                        {' '}
                        {/* 翻译进度 */}
                        <h2 className="text-lg font-semibold mb-2">
                            Translation Progress
                        </h2>
                        <Progress
                            value={languageProcess}
                            className="w-full h-4"
                        />
                    </div>
                </CardContent>
            </Card>
            {/* 当前语言下的词条信息部分 */}
            <Card>
                <CardHeader>
                    <CardTitle>Entries</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* 搜索框和搜索按钮 */}
                    <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                        <div className="relative md:w-2/3">
                            <Input
                                type="text"
                                placeholder="Search translations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full"
                            />
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            variant="default"
                            className="md:w-1/4"
                        >
                            Search
                        </Button>
                    </div>

                    {/* 表格容器，处理水平滚动 */}
                    <div className="overflow-x-auto rounded-md border w-full">
                        {/* 表头和列表一起放在一个容器内，统一水平滚动 */}
                        <div style={{ minWidth: `${tableTotalWidth}px` }}>
                            {' '}
                            {/* 确保总宽度足够，避免内容溢出 */}
                            {/* 表头部分 */}
                            <div className="sticky top-0 bg-muted z-10">
                                <Table>
                                    <TableHeader>
                                        <TableRow
                                            className={`grid grid-cols-[2fr_5.4fr_8fr_8fr_3fr] bg-muted`}
                                        >
                                            <TableHead>
                                                {' '}
                                                {/* 索引 */}
                                                <div className="flex items-center">
                                                    Index
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleSort(
                                                                'idx_in_language'
                                                            )
                                                        }
                                                        className="ml-2 p-0"
                                                    >
                                                        <ArrowUpDown className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableHead>
                                            <TableHead>
                                                {' '}
                                                {/* references */}
                                                <div className="flex items-center">
                                                    Key
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleSort('key')
                                                        }
                                                        className="ml-2 p-0"
                                                    >
                                                        <ArrowUpDown className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableHead>
                                            <TableHead>
                                                {' '}
                                                {/* 翻译原文 */}
                                                <div className="flex items-center">
                                                    Source
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleSort(
                                                                'original'
                                                            )
                                                        }
                                                        className="ml-2 p-0"
                                                    >
                                                        <ArrowUpDown className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableHead>
                                            <TableHead>
                                                {' '}
                                                {/* 翻译结果 */}
                                                <div className="flex items-center">
                                                    Translation
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleSort(
                                                                'translation'
                                                            )
                                                        }
                                                        className="ml-2 p-0"
                                                    >
                                                        <ArrowUpDown className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableHead>
                                            <TableHead>
                                                {' '}
                                                {/* 更新时间 */}
                                                <div className="flex items-center">
                                                    Updated At
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleSort(
                                                                'updatedAt'
                                                            )
                                                        }
                                                        className="ml-2 p-0"
                                                    >
                                                        <ArrowUpDown className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                </Table>
                            </div>
                            {/* 虚拟滚动区域 */}
                            <List
                                // 移除 height={400} 的固定高度
                                height={Math.max(
                                    paginatedEntries.length * 50,
                                    window.innerHeight - 600
                                )} // 动态计算高度
                                itemCount={paginatedEntries.length}
                                itemSize={50}
                                width="100%"
                                className="font-sans text-sm"
                                outerElementType={OuterElement}
                            >
                                {({ index, style }) => {
                                    const entry = paginatedEntries[index];
                                    return (
                                        <div
                                            style={style}
                                            key={entry.idx_in_language}
                                            className="grid grid-cols-[2fr_5.4fr_8fr_8fr_3fr] items-center border-b hover:bg-muted/50 cursor-pointer"
                                            onClick={() =>
                                                router.push(
                                                    `/translation-interface?project_name=${encodeURIComponent(
                                                        projectName!
                                                    )}&language_code=${encodeURIComponent(languageCode!)}&idx_in_language=${entry.idx_in_language}`
                                                )
                                            }
                                        >
                                            {/* 第一列：索引 */}
                                            <div className="font-medium pl-4 text-gray-500">
                                                {entry.idx_in_language}
                                            </div>

                                            {/* 第二列：参考信息 */}
                                            <div className="font-mono text-xs text-gray-600">
                                                {entry.references}
                                            </div>

                                            {/* 第三列：msgid 和 标签 */}
                                            <div className="flex items-center justify-start space-x-2">
                                                <div className="flex-1 pr-2 text-gray-700">
                                                    {entry.msgid}
                                                </div>
                                                <div className="flex flex-wrap mt-1">
                                                    {entry.tags.map(
                                                        (tag, idx) => (
                                                            <span
                                                                key={idx}
                                                                className={`px-2 py-0.5 text-[10px] text-gray-900 rounded-sm mr-1 mb-1 ${getTagColorClass(tag)}`}
                                                                style={{
                                                                    minWidth:
                                                                        '15px', // 最小宽度
                                                                    height: '20px', // 高度
                                                                    lineHeight:
                                                                        '18px', // 行高，使字体垂直居中
                                                                    textAlign:
                                                                        'center', // 水平居中
                                                                    overflow:
                                                                        'hidden', // 防止溢出
                                                                    whiteSpace:
                                                                        'nowrap', // 防止换行
                                                                    textOverflow:
                                                                        'ellipsis', // 文字超出时显示省略号
                                                                }}
                                                                title={tag} // 悬浮显示完整标签
                                                            >
                                                                {tag}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </div>

                                            {/* 第四列：翻译内容 */}
                                            <div className="text-gray-700">
                                                {entry.selected_msgstr_index ===
                                                -1
                                                    ? ''
                                                    : entry.msgstr[
                                                          entry
                                                              .selected_msgstr_index
                                                      ]?.msg ||
                                                      'No translation'}
                                            </div>

                                            {/* 第五列：更新时间 */}
                                            <div className="text-xs text-gray-500">
                                                {new Date(
                                                    entry.updated_at
                                                ).toLocaleString()}
                                            </div>
                                        </div>
                                    );
                                }}
                            </List>
                        </div>
                    </div>

                    {/* 分页控制 */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
                        <div className="text-sm text-muted-foreground">
                            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                            {Math.min(
                                currentPage * itemsPerPage,
                                filteredAndSortedEntries.length
                            )}{' '}
                            of {filteredAndSortedEntries.length} entries
                        </div>
                        <div className="flex space-x-2">
                            {' '}
                            {/* 分页按钮 */}
                            {/* 第一页 */}
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                aria-label="First page"
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            {/* 上一页 */}
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.max(prev - 1, 1)
                                    )
                                }
                                disabled={currentPage === 1}
                                aria-label="Previous page"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {/* 下一页 */}
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.min(prev + 1, totalPages)
                                    )
                                }
                                disabled={currentPage === totalPages}
                                aria-label="Next page"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            {/* 最后一页 */}
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                aria-label="Last page"
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
