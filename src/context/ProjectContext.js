'use client';

import { createContext, useState, useContext } from 'react';
import { useAuth } from './AuthContext';

// 创建 ProjectContext
const ProjectContext = createContext();

/**
 * ProjectProvider 组件
 * 提供项目管理上下文，包括当前项目信息、加载状态、错误信息及相关操作函数
 */

export const ProjectProvider = ({ children }) => {
    const [project, setProject] = useState(null); // 当前项目的信息
    const [loading, setLoading] = useState(false); // 加载状态
    const [error, setError] = useState(null); // 错误信息
    const { token } = useAuth();

    // entries 相关状态
    const [entries, setEntries] = useState([]);
    const [entriesMap, setEntriesMap] = useState(new Map());

    // 更新 entries 和 entriesMap
    const updateEntries = (newEntries) => {
        const formattedEntries = newEntries.map((entry) => ({
            value: entry.idx_in_language,
            label: `${entry.idx_in_language}: ${entry.msgid}`,
        }));
        setEntries(formattedEntries);
        setEntriesMap(
            new Map(formattedEntries.map((entry) => [entry.value, entry.label]))
        );
        return formattedEntries;
    };

    // 获取 entries
    const fetchEntries = async (projectName, languageCode) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/entries?&language_code=${languageCode}&project_name=${encodeURIComponent(projectName)}&start=0`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Token ${token}`,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                if (
                    data.languages &&
                    data.languages[0] &&
                    data.languages[0].entries
                ) {
                    return updateEntries(data.languages[0].entries);
                } else {
                    setEntries([]);
                    setEntriesMap(new Map());
                    return [];
                }
            } else {
                setError('Failed to fetch entries');
            }
        } catch (err) {
            setError('Error fetching entries: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // 根据 value 获取 label
    const getLabelByValue = (value) => {
        return entriesMap.get(value) || `Entry ${value}`;
    };

    // 清空 entries
    const clearEntries = () => {
        setEntries([]);
        setEntriesMap(new Map());
    };

    // 直接设置当前项目的信息
    const setCurrentProject = (projectData) => {
        setProject(projectData);
        setLoading(false); // 如果需要，可以设置为已加载状态
        setError(null); // 清空错误信息
    };

    // 获取特定项目的信息（通过 API 请求）
    const fetchProjectInfo = async (projectName) => {
        setLoading(true); // 设置加载状态
        setError(null); // 清空错误信息
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/project-info?project_name=${projectName}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Token ${token}`,
                    },
                }
            );

            if (response.ok) {
                const projectData = await response.json();
                console.log(
                    'Project info fetched in ProjectContext:',
                    projectData
                );
                setProject(projectData); // 设置项目信息
                return projectData; // 返回项目信息
            } else if (response.status === 404) {
                setError('Project not found');
                return null;
            } else {
                setError('Failed to fetch project information');
                return null;
            }
        } catch (error) {
            setError('Error fetching project info: ' + error.message);
            return null;
        } finally {
            setLoading(false); // 结束加载状态
        }
    };

    // 获取项目名称
    const getProjectName = () => {
        return project?.name || null; // 假设项目对象中的 `name` 字段存储了项目名称
    };

    // 清空项目信息（可用于切换项目时）
    const clearProject = () => {
        setProject(null);
        setLoading(false);
        setError(null);
    };

    return (
        <ProjectContext.Provider
            value={{
                project,
                loading,
                error,
                entries,
                entriesMap,
                setProject,
                setCurrentProject,
                fetchProjectInfo,
                clearProject,
                getProjectName,
                fetchEntries,
                getLabelByValue,
                clearEntries,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
};

// 自定义钩子，方便使用 ProjectContext
export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};
