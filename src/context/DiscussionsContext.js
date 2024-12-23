'use client';

import React, { createContext, useContext, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { WithSearchParams } from '@/components/common/WithSearchParams';

// 定义讨论的数据结构类型
/**
 * @typedef {Object} UserType
 * @property {string} id - 用户ID
 * @property {string} username - 用户名
 * @property {string} [email] - 邮箱（可选）
 * @property {string} [bio] - 简介（可选）
 */

/**
 * @typedef {Object} Discussion
 * @property {number} id - 讨论的ID
 * @property {string} title - 讨论的标题
 * @property {string} content - 讨论的内容
 * @property {string} created_by - 创建者ID
 * @property {string} created_at - 创建时间
 * @property {string} updated_at - 更新时间
 * @property {UserType} [user] - 创建者的用户信息
 */

// 创建一个上下文，讨论数据类型为 `Discussion | null`
const DiscussionsContext = createContext(undefined);

/**
 * DiscussionsProvider 组件提供讨论数据和加载状态
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件
 * @returns {JSX.Element}
 */
function DiscussionsProviderContent({ children }) {
    const [discussions, setDiscussions] = useState([]); // 存储讨论列表
    const [singleDiscussion, setSingleDiscussion] = useState(null); // 存储单个讨论的详细信息
    const [loading, setLoading] = useState(false); // 表示加载状态
    const { token } = useAuth(); // 从 AuthContext 获取用户 token
    const searchParams = useSearchParams();
    const projectName = searchParams.get('project') || '';
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 4;
    const [totalPages, setTotalPages] = useState(1); // 新增总页数状态

    /**
     * 获取用户信息
     * @param {string} userId - 用户ID
     * @returns {Promise<UserType|null>}
     */
    const fetchUser = async (userId) => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/profile?id=${userId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Token ${token}`,
                    },
                }
            );

            if (response.ok) {
                return await response.json();
            } else {
                console.error(`Failed to fetch user with ID: ${userId}`);
                return null;
            }
        } catch (error) {
            console.error(`Error fetching user with ID: ${userId}`, error);
            return null;
        }
    };

    /**
     * 获取所有讨论数据
     * @returns {Promise<void>}
     */
    const fetchAllDiscussions = async () => {
        setLoading(true);
        try {
            const offset = (currentPage - 1) * pageSize;
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/discussions/?offset=${offset}&page_length=${pageSize}&ordering=desc&project_name=${encodeURIComponent(
                    projectName || ''
                )}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Token ${token}`,
                    },
                }
            );
            if (!response.ok) {
                throw new Error('Failed to get discussion list.');
            }
            const data = await response.json();
            // 为每个讨论附加用户信息
            const discussionsWithUsers = await Promise.all(
                data.results.map(async (discussion) => {
                    const user = await fetchUser(discussion.created_by);
                    return { ...discussion, user };
                })
            );

            setDiscussions(discussionsWithUsers); // 设置所有讨论数据
            setTotalPages(Math.ceil(data.total / pageSize)); // 设置总页数
            return data;
        } catch (error) {
            console.error('Error fetching discussions:', error);
            return null;
        } finally {
            setLoading(false);
        }
    };

    /**
     * 获取单个讨论的详细信息
     * @param {number} id - 讨论的ID
     * @returns {Promise<void>}
     */
    const fetchDiscussion = async (id) => {
        setLoading(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/discussions/${id}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Token ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch discussion');
            }

            const data = await response.json();
            const user = await fetchUser(data.created_by); // 获取创建者信息
            setSingleDiscussion({ ...data, user }); // 包含用户信息
        } catch (error) {
            console.error('Error fetching discussion:', error);
            setSingleDiscussion(null);
        } finally {
            setLoading(false); // 确保结束加载状态
        }
    };

    /**
     * 添加新讨论到 discussions 列表
     * @param {Discussion} discussion - 新的讨论数据
     */
    const addDiscussion = (discussion) => {
        setDiscussions((prev) => [...prev, discussion]);
    };

    // // 在 currentPage 或 projectName 变化时重新获取讨论列表
    // useEffect(() => {
    //   fetchAllDiscussions();
    //   // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [currentPage, projectName, token]);

    return (
        <DiscussionsContext.Provider
            value={{
                discussions,
                singleDiscussion,
                addDiscussion,
                fetchAllDiscussions,
                fetchDiscussion,
                loading,
                currentPage,
                setCurrentPage,
                totalPages,
            }}
        >
            {children}
        </DiscussionsContext.Provider>
    );
};

export const DiscussionsProvider = ({ children }) => {
    return (
        <WithSearchParams>
            <DiscussionsProviderContent>
                {children}
            </DiscussionsProviderContent>
        </WithSearchParams>
    );
};

/**
 * 自定义 Hook 用于访问 DiscussionsContext
 * @returns {{
 *   discussions: Discussion[],
 *   singleDiscussion: Discussion | null,
 *   addDiscussion: Function,
 *   fetchAllDiscussions: Function,
 *   fetchDiscussion: Function,
 *   loading: boolean
 *   currentPage: number,
 *   setCurrentPage: Function,
 *   totalPages: number,
 * }}
 */
export const useDiscussions = () => {
    const context = useContext(DiscussionsContext);
    if (!context) {
        throw new Error(
            'useDiscussions must be used within a DiscussionsProvider'
        );
    }
    return context;
};
