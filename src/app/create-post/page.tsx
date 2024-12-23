'use client';

import { useState, useEffect, ChangeEvent, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { getCookie } from '@/utils/cookies';
import { useAuth } from '@/context/AuthContext';
import { useDiscussions } from '@/context/DiscussionsContext';
import { useProject } from '@/context/ProjectContext';

const CreatePost = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedTopics, setSelectedTopics] = useState('');
    const [errorMessage, setErrorMessage] = useState(''); // 用于显示错误信息
    const [languageCode, setLanguageCode] = useState('');
    const [idxInLanguage, setIdxInLanguage] = useState('');
    const [inputError, setInputError] = useState(''); // 用于显示输入错误信息

    const router = useRouter();
    const csrfToken = getCookie('csrftoken'); // 获取 CSRF token
    const { user, token, projectInProcess } = useAuth(); // 使用用户上下文获取当前用户
    const searchParams = useSearchParams();
    const projectName = searchParams.get('project');
    const { addDiscussion } = useDiscussions();

    interface Language {
        language_code: string;
    }

    interface Entry {
        value: number;
        label: string;
    }

    // 使用 ProjectContext
    const {
        loading,
        error,
        entries,
        fetchProjectInfo,
        fetchEntries,
        getLabelByValue,
        getFormattedEntryInfo,
    } = useProject();

    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [selectedEntry, setSelectedEntry] = useState('');
    const [languages, setLanguages] = useState([]);

    // 在组件加载时获取项目信息
    useEffect(() => {
        if (projectName) {
            fetchProjectInfo(projectName).then((projectData: { languages: SetStateAction<never[]>; }) => {
                if (projectData && projectData.languages) {
                    setLanguages(projectData.languages);
                }
            });
            // 初始化 topics 为项目名
            setSelectedTopics(`#${projectName}`);
        }
    }, [projectName]);

    const handleLanguageChange = async (e: ChangeEvent<HTMLSelectElement>) => {
        setInputError(''); // 清除错误信息

        const languageCode = e.target.value;
        setSelectedLanguage(languageCode);
        setSelectedEntry(''); // 清空条目选择
        if (languageCode) {
            await fetchEntries(projectName, languageCode);
        }
        updateTopics(languageCode, '');
    };

    const handleEntryChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setInputError(''); // 清除错误信息
        if (!selectedLanguage) {
            setInputError('Please select a Language first.');
            setSelectedEntry('');
            return;
        }

        const entryValue = e.target.value;
        setSelectedEntry(entryValue);
        updateTopics(selectedLanguage, entryValue);
    };

    // 处理Topics的格式化
    const handleTopicChange = () => {
        if (projectName && languageCode && idxInLanguage) {
            setSelectedTopics(
                `#${projectName} #${languageCode} #${idxInLanguage}`
            );
        } else if (projectName && languageCode) {
            setSelectedTopics(`#${projectName} #${languageCode}`);
        } else if (projectName) {
            setSelectedTopics(`#${projectName}`);
        } else {
            setSelectedTopics('');
        }
    };

    // 每当 projectName, languageCode 或 idxInLanguage 变化时都更新话题
    useEffect(() => {
        handleTopicChange();
    }, [projectName, languageCode, idxInLanguage]);

    // 跳转到社区页面
    const handleCommunityNavigation = () => {
        router.push(`/community-forum?project=${projectName }`);
    };

    // 提交新评论
    const handlePostSubmit = async () => {
        // 清除错误信息
        setErrorMessage('');

        // 检查标题是否为空
        if (!title) {
            setErrorMessage('The title cannot be empty.');
            return;
        }
        // 检查内容是否为空
        if (!content) {
            setErrorMessage('The content cannot be empty.');
            return;
        }

        // 检查标题中是否包含 #，如果有则提示用户重新编写标题
        if (title.includes('#')) {
            setErrorMessage(
                "The title cannot contain '#', please rewrite the title."
            );
            return;
        }

        // 3. 拼接标题和话题
        const finalTitle = `${title}  ${selectedTopics}`;

        // 4. 提交表单数据
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/discussions/?project_name=${projectName }`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Token ${token}`, // 使用认证令牌
                        'X-CSRFToken': csrfToken || '', // 添加 CSRF token
                    },
                    body: JSON.stringify({
                        title: finalTitle || 'Example', // 使用拼接后的标题
                        content: content, // 新评论内容
                    }),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to post comment');
            }

            const createdDiscussion = await response.json();

            // 将新帖子添加到 DiscussionsContext
            addDiscussion({ ...createdDiscussion, topics: selectedTopics });

            // 提交后跳转回社区页面
            handleCommunityNavigation();
        } catch (error) {
            console.error('Error posting comment:', error);
        }
    };

    // 更新 Topics
    const updateTopics = (language: string, entry: string) => {
        let topics = `#${projectName}`; // 始终包含项目名
        if (language) {
            topics += ` #${language}`;
            if (entry) {
                topics += ` #${entry}`;
            }
        }
        setSelectedTopics(topics);
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Create a New Post</h1>

            {/* 显示错误信息 */}
            {errorMessage && (
                <p className="text-red-500 mb-4">{errorMessage}</p>
            )}
            {inputError && <p className="text-red-500 mb-4">{inputError}</p>}

            <div className="mb-4">
                <label
                    htmlFor="title"
                    className="block text-sm font-semibold mb-2"
                >
                    Title
                </label>
                <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        setErrorMessage(''); // 清除标题错误信息
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter the title of your post"
                />
            </div>

            <div className="mb-4">
                <label
                    htmlFor="content"
                    className="block text-sm font-semibold mb-2"
                >
                    Content
                </label>
                <textarea
                    id="content"
                    value={content}
                    onChange={(e) => {
                        setContent(e.target.value);
                        setErrorMessage(''); // 清除内容错误信息
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={6}
                    placeholder="Write your post content here"
                />
            </div>

            {/* 横向排列的输入框 */}
            <div className="mb-4 flex space-x-4">
                <div className="flex-1">
                    <label
                        htmlFor="languageCode"
                        className="block text-sm font-semibold mb-2"
                    >
                        Language Code
                    </label>
                    <select
                        id="languageCode"
                        value={selectedLanguage}
                        onChange={handleLanguageChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                    >
                        <option value="">Select a language</option>
                        {languages.map((lang: Language) => (
                            <option
                                key={lang.language_code}
                                value={lang.language_code}
                            >
                                {lang.language_code}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex-1">
                    <label
                        htmlFor="idxInLanguage"
                        className="block text-sm font-semibold mb-2"
                    >
                        Index in Language
                    </label>
                    <select
                        id="idxInLanguage"
                        value={selectedEntry}
                        onChange={handleEntryChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        disabled={!selectedLanguage}
                    >
                        <option value="">Select an entry</option>
                        {entries.map((entry: Entry) => (
                            <option key={entry.value} value={entry.value}>
                                {entry.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 显示拼接后的 Topics */}
            <div className="mb-4">
                <label
                    htmlFor="topics"
                    className="block text-sm font-semibold mb-2"
                >
                    Topics (Automatically generated)
                </label>
                <input
                    id="topics"
                    type="text"
                    value={selectedTopics}
                    disabled
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                    placeholder="Topics will be generated automatically"
                />
            </div>

            <div className="space-x-2">
                <button
                    onClick={handlePostSubmit}
                    className="text-white bg-black hover:bg-gray-800 py-2 px-4 rounded-md"
                >
                    Post
                </button>
                <button
                    onClick={handleCommunityNavigation} // 点击取消时返回社区页面
                    className="bg-gray-300 py-2 px-4 rounded-md"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default CreatePost;
