'use client'; // 指定该文件为客户端组件，确保在客户端渲染

import { createContext, useState, useEffect, useContext } from 'react';

/**
 * @typedef {Object} AuthContextType
 * @property {{ username?: string, role?: string, managed_projects?: string[], translated_projects?: string, id?: string } | null} user - 用户信息
 * @property {string[] | null} projectInProcess - 正在进行的项目
 * @property {string[] | null} projectManaged - 管理的项目
 * @property {string | null} token - 用户认证令牌
 * @property {(authToken: string, username: string) => void} login - 登录方法
 * @property {() => void} logout - 登出方法
 */

// 创建上下文并指定默认值为 null
/** @type {React.Context<AuthContextType | null>} */
const AuthContext = createContext(null);

/**
 * AuthProvider 组件
 * @param {{ children: React.ReactNode }} props
 */
export const AuthProvider = ({ children }) => {
    // 用户信息状态，包括用户角色
    const [user, setUser] = useState(null);
    // 项目状态，用于存储当前正在进行的项目
    const [projectInProcess, setProjectInProcess] = useState([]);
    const [projectManaged, setProjectManaged] = useState([]);
    const [projectTranslating, setProjectTranslating] = useState([]);

    // 初次加载时从 localStorage 获取 token（如果存在）
    const [token, setToken] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('authToken');
        }
        return null; // 或者返回一个默认值
    });

    /**
     * useEffect 钩子
     * 组件挂载时，从 localStorage 中获取存储的认证令牌，并尝试获取用户信息
     */
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken'); // 从 localStorage 获取存储的 token
        const storedUsername = localStorage.getItem('username'); // 获取存储的 username
        if (storedToken) {
            setToken(storedToken); // 设置 token 状态
            setUser((prevUser) => ({
                ...prevUser,
                username: storedUsername, // 恢复 username
            }));
            fetchUserInfo(storedToken); // 使用 token 获取用户信息
        }
    }, []); // 只在组件挂载时执行一次

    /**
     * fetchUserInfo 函数
     * 使用认证令牌从后端 API 获取用户信息
     */
    const fetchUserInfo = async (authToken) => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/profile`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Token ${authToken}`, // 使用 `Token` 格式的认证头
                    },
                }
            );

            if (response.ok) {
                const userData = await response.json(); // 解析响应数据
                setUser((prevUser) => ({
                    ...prevUser, // 保留原有的 user 信息
                    ...userData, // 合并后端返回的用户数据
                }));
                console.log('User data fetched:', userData); // 打印用户数据
                checkUserRole(userData.role); // 根据用户角色执行相应逻辑
                // 筛选出 projectManaged 和 projectTranslating 中重复的项目
                const managedProjectNames = userData.managed_projects.map(
                    (project) => project.name
                );
                const translatingProjectNames =
                    userData.translated_projects.map((project) => project.name);

                // 筛选出两个数组中重复的项目名
                const combinedProjects = [
                    ...new Set([
                        ...managedProjectNames,
                        ...translatingProjectNames,
                    ]),
                ];

                // 将重复项目放入 projectInProcess
                setProjectInProcess(combinedProjects);

                // 设置其他项目数据
                setProjectManaged(managedProjectNames);
                setProjectTranslating(translatingProjectNames);
            } else if (response.status === 401) {
                logout(); // 如果认证失败，执行登出操作
                console.log('Unauthorized access. Logging out...'); // 打印日志
            } else {
                console.log('Failed to fetch user information'); // 打印错误日志
            }
        } catch (error) {
            console.error('Error fetching user info:', error); // 捕获并打印错误
        }
    };

    /**
     * checkUserRole 函数
     * 根据用户角色执行不同的逻辑处理
     */
    const checkUserRole = (role) => {
        if (role === 'admin') {
            console.log('Admin user logged in');
            // 在这里可以触发特定的管理员逻辑或状态更新
        } else if (role === 'user') {
            console.log('Regular user logged in');
            // 在这里处理普通用户的逻辑
        } else {
            console.log('Unknown role');
            // 处理未知角色（可选）
        }
    };

    /**
     * login 函数
     * 处理用户登录，设置认证令牌并获取用户信息
     */
    const login = (authToken, username) => {
        setToken(authToken); // 设置 token 状态
        setUser((prevUser) => ({
            ...prevUser, // 保留原来的 user 信息
            username, // 设置新的 username
        }));
        localStorage.setItem('authToken', authToken); // 将 token 存储到 localStorage
        localStorage.setItem('username', username); // 存储 username
        fetchUserInfo(authToken); // 使用 token 获取用户信息
        // setUser({ username }); // 将 username 存储到 user 中
    };

    /**
     * logout 函数
     * 处理用户登出，清除认证令牌和用户信息
     */
    const logout = () => {
        setToken(null); // 清除 token 状态
        setUser(null); // 清除用户信息状态
        localStorage.removeItem('authToken'); // 从 localStorage 中移除 token
        localStorage.removeItem('username'); // 从 localStorage 中移除 username
    };

    return (
        // 提供 AuthContext，上下文值包括用户信息、认证令牌、登录和登出函数
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                logout,
                projectInProcess,
                projectManaged,
                projectTranslating,
            }}
        >
            {children} {/* 渲染子组件 */}
        </AuthContext.Provider>
    );
};

/**
 * 自定义钩子，简化上下文的使用
 * @returns {AuthContextType}
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
