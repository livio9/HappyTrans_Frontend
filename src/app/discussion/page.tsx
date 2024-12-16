'use client';
// 上面是帖子，下面是评论区

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useDiscussions } from '@/context/DiscussionsContext';
import CommentSection from './CommentSection'; // 评论区组件
import { useAuth } from '@/context/AuthContext';

const PostDetails = () => {
    const { singleDiscussion, fetchDiscussion, loading } = useDiscussions(); // 使用上下文提供的单个帖子数据
    const searchParams = useSearchParams();
    const { user } = useAuth(); // 获取当前登录用户信息
    const id = searchParams.get('id'); // 获取帖子 ID
    const [isOwner, setIsOwner] = useState(false); // 用于标识当前用户是否为帖子创建者

    // 解析标题并返回带有链接的标题和字段
    const parseTitle = (title: string) => {
        // 按照 # 分割字符串
        const parts = title.split('#');

        // 获取标题、projectName、languageCode 和 idxInLanguage
        const mainTitle = parts[0]; // 标题部分是 # 之前的内容
        const projectName = parts[1] || null; // 第一个 # 后面的部分
        const languageCode = parts[2] || null; // 第二个 # 后面的部分
        const idxInLanguage = parts[3] || null; // 第三个 # 后面的部分

        console.log('mainTitle:', mainTitle);
        console.log('projectName:', projectName);
        console.log('languageCode:', languageCode);
        console.log('idxInLanguage:', idxInLanguage);

        // 返回提取的结果
        return {
            mainTitle,
            projectName,
            languageCode,
            idxInLanguage
        };
    };

    // 组件展示逻辑
    const TitleDisplay = ({ title }: { title: string }) => {
        const { mainTitle, projectName, languageCode, idxInLanguage } = parseTitle(title);

        return (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                {/* 主标题部分 */}
                <h1 style={{
                    fontSize: '1.9rem', // 标题字体大小
                    fontWeight: 'bold', // 标题加粗
                    margin: 0,          // 清除默认的 margin
                    lineHeight: '1.2',  // 设置行高，与话题对齐更紧密
                }}>
                    {mainTitle}
                </h1>

                {/* 项目链接、语言代码链接、索引链接 */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    flexDirection: 'row', // 默认是水平方向
                }}>
                    {/* projectName */}
                    {projectName && (
                        <a
                            href={`language-versions?project=${projectName}`}
                            style={{
                                fontSize: '1.2rem',        // 话题字体大小
                                color: '#6b7280',        // 灰色字体
                                textDecoration: 'none',  // 默认无下划线
                                lineHeight: '1.2',       // 与标题保持一致的行高
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                        >
                            {`#${projectName}`}
                        </a>
                    )}

                    {/* languageCode */}
                    {languageCode && (
                        <a
                            href={`Entries?project_name=${projectName}&language_code=${languageCode}`}
                            style={{
                                fontSize: '1.2rem',
                                color: '#6b7280',
                                textDecoration: 'none',
                                lineHeight: '1.2',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                        >
                            {`#${languageCode}`}
                        </a>
                    )}

                    {/* idxInLanguage */}
                    {idxInLanguage && (
                        <a
                            href={`translation-interface?project_name=${projectName}&language_code=${languageCode}&idx_in_language=${encodeURIComponent(idxInLanguage)}`}
                            style={{
                                fontSize: '1.2rem',
                                color: '#6b7280',
                                textDecoration: 'none',
                                lineHeight: '1.2',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                        >
                            {`#${idxInLanguage}`}
                        </a>
                    )}
                </div>
            </div>
        );
    };

    useEffect(() => {
        if (id) {
            fetchDiscussion(Number(id)); // 根据帖子 ID 获取帖子数据
        }
    }, [id]);

    useEffect(() => {
        if (singleDiscussion && user) {
            // 判断当前用户是否是帖子创建者
            setIsOwner(singleDiscussion.created_by === user.id);
        }
    }, [singleDiscussion, user]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!singleDiscussion) {
        return <div>Post not found</div>;
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString(); // 格式化时间
    };

    return (
        <div className="post-details">
            {/* 帖子标题和内容 */}
            <Card className="mb-4 shadow-md rounded-lg border border-gray-200">
                <CardHeader className="bg-white p-8">
                    <h2 className="text-4xl font-bold mb-4">
                        <TitleDisplay title={singleDiscussion.title} />
                    </h2>
                    {singleDiscussion.user && (
                        <p className="text-sm text-gray-400 mb-4">
                            <strong>Created by: {singleDiscussion.user.username}</strong>
                        </p>
                    )}
                    <p className="text-lm text-gray-500 mt-2">{singleDiscussion.content}</p>
                    <div className="text-xs text-gray-400 ml-auto">
                        <span>Created At: {formatDate(singleDiscussion.created_at)}</span>
                        <br />
                        <span>Updated At: {formatDate(singleDiscussion.updated_at)}</span>
                    </div>
                </CardHeader>

                {/* 评论区 */}
                <CardContent>
                    <CommentSection discussionId={singleDiscussion.id} />
                </CardContent>
            </Card>
        </div>
    );
};

export default PostDetails;