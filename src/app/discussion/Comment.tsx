// src/app/discussion/Comment.tsx
// 评论板块中的每个小评论

'use client';
import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { getCookie } from '@/utils/cookies';
import { useRouter } from 'next/navigation';
import UserAvatar from '@/components/shared/UserAvatar';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, ThumbsUp, Eye } from 'lucide-react'; // 导入图标组件
import { FixedSizeList as List, ListChildComponentProps } from 'react-window'; // 导入 react-window
import { useSearchParams } from 'next/navigation';
import { WithSearchParams } from '@/components/common/WithSearchParams';

interface UserType {
    id: string;
    username: string;
}

interface CommentType {
    id: number;
    content: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    parent: number;
    user?: UserType; // 添加用户信息
    parent_user?: string; // 父评论的用户
    replies?: CommentType[]; // 添加回复
}

interface CommentProps {
    comment: CommentType;
    fetchComments: () => void; // 接收 fetchComments 函数作为 props
}

// 定义扁平化后的回复类型
type FlattenedReply = CommentType & { replyToUsername?: string };

function CommentContent({ comment, fetchComments }: CommentProps) {
    const { token, user, projectInProcess } = useAuth(); // 获取 token 和当前用户信息
    const csrfToken = getCookie('csrftoken'); // 获取 CSRF token
    const [commentUser, setCommentUser] = useState<UserType | null>(null); // 存储评论用户信息
    const [replies, setReplies] = useState<CommentType[]>([]); // 存储回复
    const [showReplies, setShowReplies] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [newReply, setNewReply] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const router = useRouter();
    const [flattenedReplies, setFlattenedReplies] = useState<FlattenedReply[]>(
        []
    );
    const [userCache, setUserCache] = useState<Map<string, UserType>>(
        new Map()
    ); // 缓存用户信息，避免重复请求
    const [commentCache, setCommentCache] = useState<Map<number, CommentType>>(
        new Map()
    ); // 缓存评论信息
    const searchParams = useSearchParams();
    const discussion_id = searchParams.get('id') || '';
    const projectName = searchParams.get('project_name'); // 获取项目名称

    const canCreateComment =
        user && projectName && projectInProcess?.includes(projectName);

    // 初始化 replies 状态与 comment.replies 同步
    useEffect(() => {
        setReplies(comment.replies || []);
    }, [comment.replies]);

    // 根据用户名获取用户信息的函数（用来点击头像时显示具体信息）
    const fetchUserInfo = useCallback(
        async (username: string): Promise<UserType | undefined> => {
            if (userCache.has(username)) return userCache.get(username);

            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/profile?username=${username}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Token ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to get user information');
                }

                const user: UserType = await response.json();
                setUserCache((prev) => new Map(prev).set(username, user));
                return user;
            } catch (error) {
                console.error('Failed to get user information:', error);
                return undefined;
            }
        },
        [userCache, token]
    );

    // 获取单条评论信息的函数（用于获取父评论的详细信息，主要是created_by）
    const fetchCommentById = useCallback(
        async (commentId: number): Promise<CommentType | undefined> => {
            if (commentCache.has(commentId)) return commentCache.get(commentId);

            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/comments/${commentId}/`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Token ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to get comment information');
                }

                const fetchedComment: CommentType = await response.json();
                setCommentCache((prev) =>
                    new Map(prev).set(commentId, fetchedComment)
                );
                return fetchedComment;
            } catch (error) {
                console.error('Failed to get comment information:', error);
                return undefined;
            }
        },
        [commentCache, token]
    );

    // 更新评论中的 user 信息
    useEffect(() => {
        const fetchAndSetUser = async () => {
            if (comment.created_by && !comment.user) {
                // 确保只有在 created_by 存在且没有获取到用户信息时才请求
                const user = await fetchUserInfo(comment.created_by);
                if (user) {
                    setCommentUser(user); // 更新评论中的用户信息
                }
            }
        };

        fetchAndSetUser();
    }, [comment.created_by, token, fetchUserInfo, comment]);

    // 辅助函数，计算评论下的总回复数量
    const countTotalReplies = (replies: CommentType[]): number => {
        let count = replies.length;
        replies.forEach((reply) => {
            if (reply.replies && reply.replies.length > 0) {
                count += countTotalReplies(reply.replies);
            }
        });
        return count;
    };

    // 定义一个 useEffect 来更新 replyCount 每当 replies 变化时
    const [replyCount, setReplyCount] = useState<number>(
        countTotalReplies(comment.replies || [])
    );

    useEffect(() => {
        setReplyCount(countTotalReplies(replies));
    }, [replies]);

    // 得到扁平化回复列表
    const flattenReplies = useCallback(
        (replies: CommentType[]): FlattenedReply[] => {
            let flatList: FlattenedReply[] = [];
            const traverse = (reply: CommentType, parentUsername?: string) => {
                flatList.push({ ...reply, replyToUsername: parentUsername });
                if (reply.replies && reply.replies.length > 0) {
                    reply.replies.forEach((childReply) =>
                        traverse(childReply, reply.user?.username)
                    );
                }
            };
            replies.forEach((reply) => traverse(reply));
            return flatList;
        },
        []
    );

    // 加载所有回复及对应用户信息
    const loadReplies = useCallback(async () => {
        const flatReplies = flattenReplies(replies);
        const userPromises = flatReplies.map(async (reply) => {
            if (!reply.user) {
                const user = await fetchUserInfo(reply.created_by);
                reply.user = user;
            }

            // 如果有父评论，获取父评论的用户信息
            if (reply.parent && !reply.parent_user) {
                const parentUser = await loadParentUser(reply.parent);
                reply.parent_user = parentUser;
            }

            return reply;
        });

        await Promise.all(userPromises);
        setFlattenedReplies([...flatReplies]);
    }, [replies, fetchUserInfo, flattenReplies]);

    const loadParentUser = async (parentId: number) => {
        try {
            const parentComment = await fetchCommentById(parentId);
            if (parentComment && parentComment.created_by) {
                // 如果父评论用户信息未缓存，则加载
                if (!userCache.has(parentComment.created_by)) {
                    const parentUser = await fetchUserInfo(
                        parentComment.created_by
                    );
                    return parentUser?.username || 'Anonymous';
                } else {
                    return (
                        userCache.get(parentComment.created_by)?.username ||
                        'Anonymous'
                    );
                }
            }
        } catch (error) {
            console.error(
                'Failed to get parent comment user information:',
                error
            );
        }
        return 'Anonymous'; // 返回默认的用户名
    };

    useEffect(() => {
        if (showReplies) {
            loadReplies();
        }
    }, [showReplies, replies, loadReplies]);

    // 编辑该评论
    const handleEdit = () => {
        setIsEditing(true);
    };
    const submitEdit = async () => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/comments/${comment.id}/`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Token ${token}`,
                        'X-CSRFToken': csrfToken || '',
                    },
                    body: JSON.stringify({ content: editedContent }),
                }
            );

            if (!response.ok) {
                throw new Error('Edit comment failed');
            }

            const updatedComment: CommentType = await response.json();

            // 本地更新评论内容
            setReplies((prevReplies) =>
                prevReplies.map((reply) =>
                    reply.id === comment.id
                        ? {
                            ...reply,
                            content: updatedComment.content,
                            updated_at: updatedComment.updated_at,
                        }
                        : reply
                )
            );
            fetchComments(); // 重新加载评论

            setIsEditing(false);
        } catch (error) {
            console.error('Edit comment failed:', error);
        }
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditedContent(comment.content);
    };

    // 删除该评论内容，同时删除评论下的所有回复内容
    const handleDelete = async () => {
        if (
            !window.confirm(
                'Are you sure you want to delete this comment and all its replies?'
            )
        ) {
            return;
        }
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/comments/${comment.id}/`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Token ${token}`,
                        'X-CSRFToken': csrfToken || '',
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to delete comment.');
            }

            // 从状态中移除该评论
            setReplies((prevReplies) =>
                prevReplies.filter((reply) => reply.id !== comment.id)
            );

            fetchComments(); // 重新加载评论
        } catch (error) {
            console.error('Error when deleting a comment:', error);
        }
    };

    // 开始回复
    const startReplying = () => {
        setIsReplying(true);
    };

    // 取消回复
    const cancelReplying = () => {
        setIsReplying(false);
        setNewReply('');
    };

    // 发送回复
    const submitReply = async () => {
        if (newReply.trim() === '') {
            alert('Reply content cannot be empty.');
            return;
        }
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/comments/?discussion_id=${discussion_id}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Token ${token}`,
                        'X-CSRFToken': csrfToken || '',
                    },
                    body: JSON.stringify({
                        content: newReply,
                        parent: comment.id,
                    }),
                }
            );
            if (!response.ok) {
                throw new Error('Failed to submit reply.');
            }
            const createdReply: CommentType = await response.json();
            setReplies((prev) => [...prev, createdReply]);
            setNewReply('');
            setIsReplying(false);
            setShowReplies(true);
        } catch (error) {
            console.error('Failed to submit reply:', error);
        }
    };

    // 删除回复的函数
    const handleDeleteReply = async (replyId: number) => {
        if (!window.confirm('Are you sure you want to delete this reply?')) {
            return;
        }
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/comments/${replyId}/`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Token ${token}`,
                        'X-CSRFToken': csrfToken || '',
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to delete reply.');
            }

            // 递归函数，用于删除嵌套的回复
            const removeReply = (comments: CommentType[]): CommentType[] => {
                return comments.reduce<CommentType[]>((acc, comment) => {
                    if (comment.id === replyId) {
                        // 跳过要删除的回复
                        return acc;
                    }
                    if (comment.replies && comment.replies.length > 0) {
                        // 递归删除嵌套的回复
                        const updatedReplies = removeReply(comment.replies);
                        return [
                            ...acc,
                            { ...comment, replies: updatedReplies },
                        ];
                    }
                    return [...acc, comment];
                }, []);
            };

            // 更新回复状态
            setReplies((prevReplies) => removeReply(prevReplies));
        } catch (error) {
            console.error('Failed to delete reply:', error);
        }
    };

    // 单个回复组件
    const ReplyItem = memo(({ index, style }: ListChildComponentProps) => {
        const reply = flattenedReplies[index];
        if (!reply) {
            return null;
        }
        const replyUser = reply.user;
        const parentUsername = reply.parent_user;
        const [isReplyingToReply, setIsReplyingToReply] = useState(false); // 控制对该回复的回复
        const [replyToReplyContent, setReplyToReplyContent] = useState(''); // 对回复内容

        const handleReplyToReply = async () => {
            if (!replyToReplyContent.trim()) {
                alert('Reply content cannot be empty.');
                return;
            }
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/comments/?discussion_id=${discussion_id}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Token ${token}`,
                            'X-CSRFToken': csrfToken || '',
                        },
                        body: JSON.stringify({
                            content: replyToReplyContent,
                            parent: reply.id, // 当前回复的 ID 作为父评论
                        }),
                    }
                );
                if (!response.ok) {
                    throw new Error('Failed to submit reply to reply.');
                }
                const createdReply: CommentType = await response.json();

                // 更新评论状态
                const addReply = (comments: CommentType[]): CommentType[] => {
                    return comments.map((r) => {
                        if (r.id === reply.id) {
                            return {
                                ...r,
                                replies: [...(r.replies || []), createdReply],
                            };
                        } else if (r.replies) {
                            return {
                                ...r,
                                replies: addReply(r.replies),
                            };
                        }
                        return r;
                    });
                };
                setReplies((prev) => addReply(prev));
                setReplyToReplyContent('');
                setIsReplyingToReply(false);
                setShowReplies(true);
            } catch (error) {
                console.error('Failed to reply to reply:', error);
            }
        };

        return (
            <div className="flex items-start space-x-4 ml-8 mb-6">
                {/* 用户头像 */}
                <UserAvatar
                    username={replyUser?.username || 'Anonymous'}
                    size="sm"
                />
                {/* 右侧内容 */}
                <div className="flex-1 w-full">
                    {/* 用户名 */}
                    <div className="flex items-center space-x-2">
                        <CardTitle className="text-base text-gray-600">
                            {replyUser?.username || 'Anonymous'}
                        </CardTitle>
                        {parentUsername && (
                            <span className="text-xs text-gray-500 ml-2">
                                reply to{' '}
                                <span className="font-semibold">
                                    {parentUsername}
                                </span>
                            </span>
                        )}
                    </div>
                    {/* 评论内容 */}
                    <div className="mt-1 text-base">
                        <p className="text-gray-800">{reply.content}</p>
                        {/* 对回复的回复输入框 */}
                        {isReplyingToReply && (
                            <div className="absolute left-0 mt-2 pl-4 w-full bg-white border-none rounded shadow-lg z-10">
                                <textarea
                                    value={replyToReplyContent}
                                    onChange={(e) =>
                                        setReplyToReplyContent(e.target.value)
                                    }
                                    className="w-full p-2 border-2 rounded focus:outline-none focus:border-gray-500"
                                    rows={2}
                                    placeholder="Write your reply..."
                                />
                                <div className="mt-2 flex space-x-2">
                                    <Button
                                        onClick={handleReplyToReply}
                                        variant="ghost"
                                    >
                                        Send
                                    </Button>
                                    <Button
                                        onClick={() =>
                                            setIsReplyingToReply(false)
                                        }
                                        variant="ghost"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 时间 */}
                    <div className="mt-2 text-xs text-gray-500">
                        {formatDistanceToNow(new Date(reply.updated_at), {
                            addSuffix: true,
                        })}
                    </div>
                </div>
                <div className="flex-1 ml-2">
                    {/* 回复按钮和删除按钮 */}
                    <div className="flex space-x-6 mt-2 ml-10">
                        {/* 回复按钮 */}
                        {canCreateComment && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center space-x-1 p-2 transition-colors duration-200 hover:text-blue-500"
                                onClick={() =>
                                    setIsReplyingToReply(!isReplyingToReply)
                                }
                            >
                                <MessageCircle className="w-2 h-2" />
                                <span className="text-xs">Reply</span>
                            </Button>
                        )}

                        {/* 删除按钮，仅作者可见 */}
                        {replyUser?.id === user?.id && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteReply(reply.id)}
                                className="flex items-center space-x-1 p-2 transition-colors duration-200 hover:text-red-500"
                            >
                                <span className="text-xs">Delete</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    });

    // 切换回复展开/收起状态，点击 view replies 时展开回复区
    const toggleReplyExpansion = () => {
        setShowReplies((prev) => !prev);
    };

    return (
        <Card className="mb-4 rounded-lg shadow-lg">
            <CardHeader className="flex items-start space-x-4 w-full">
                {' '}
                {/* 确保宽度填满 */}
                <div className="flex items-start space-x-6 w-full">
                    {' '}
                    {/* 确保此 div 使用完整的宽度 */}
                    {/* 头像 */}
                    <UserAvatar
                        username={commentUser?.username || 'Anonymous'}
                        size="md"
                    />
                    {/* 右侧内容 */}
                    <div className="flex-1 w-full">
                        {' '}
                        {/* 确保右侧内容占满剩余空间 */}
                        {/* 用户名 */}
                        <div className="flex items-center space-x-2">
                            <CardTitle className="text-lg text-gray-600 font-semibold">
                                {commentUser?.username || 'Anonymous'}
                            </CardTitle>
                        </div>
                        {/* 评论内容 */}
                        <div className="mt-1 text-base">
                            {isEditing ? (
                                <div>
                                    <textarea
                                        value={editedContent}
                                        onChange={(e) =>
                                            setEditedContent(e.target.value)
                                        }
                                        className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                    />
                                    <div className="mt-2 flex space-x-2">
                                        <Button
                                            onClick={submitEdit}
                                            variant="ghost"
                                            className="text-blue-500"
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            onClick={cancelEdit}
                                            variant="ghost"
                                            className="text-gray-500"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-800">
                                    {comment.content}
                                </p>
                            )}
                        </div>
                        {/* 时间 */}
                        <div className="mt-2 text-xs text-gray-500">
                            {formatDistanceToNow(new Date(comment.created_at), {
                                addSuffix: true,
                            })}
                            {comment.updated_at &&
                                comment.updated_at !== comment.created_at && (
                                    <>
                                        {' '}
                                        (updated at{' '}
                                        {formatDistanceToNow(
                                            new Date(comment.updated_at),
                                            {
                                                addSuffix: true,
                                            }
                                        )}
                                        )
                                    </>
                                )}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardFooter className="flex items-center justify-between">
                <div className="flex items-center space-x-4 ml-20">
                    {canCreateComment && (
                        <Button
                            variant="ghost"
                            onClick={startReplying}
                            className="flex items-center space-x-1 p-2 transition-colors duration-200 hover:text-blue-500"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-xs">Reply</span>
                        </Button>
                    )}

                    {/* 编辑按钮 */}
                    {user?.id === commentUser?.id && (
                        <Button
                            variant="ghost"
                            onClick={handleEdit}
                            className="flex items-center space-x-1 p-2 transition-colors duration-200 hover:text-blue-500"
                        >
                            <span className="text-xs">Edit</span>
                        </Button>
                    )}

                    {/* 删除按钮 */}
                    {user?.id === commentUser?.id && (
                        <Button
                            variant="ghost"
                            onClick={handleDelete}
                            className="flex items-center space-x-1 p-2 transition-colors duration-200 hover:text-red-500"
                        >
                            <span className="text-xs">Delete</span>
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleReplyExpansion}
                    >
                        {showReplies
                            ? 'Hide Replies'
                            : `View More (${replyCount})`}
                    </Button>
                </div>
            </CardFooter>

            {/* 回复输入框 */}
            {isReplying && (
                <div className="mt-2 pl-8">
                    <textarea
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Write your reply..."
                    />
                    <div className="mt-2 flex space-x-2">
                        <Button
                            onClick={submitReply}
                            variant="ghost"
                            className="text-blue-500"
                        >
                            Send
                        </Button>
                        <Button
                            onClick={cancelReplying}
                            variant="ghost"
                            className="text-gray-500"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* 回复列表 */}
            {showReplies && (
                <div className="mt-2 pl-20">
                    {flattenedReplies.length > 0 ? (
                        <List
                            height={120 * flattenedReplies.length} // 根据需要调整高度
                            itemCount={flattenedReplies.length}
                            itemSize={120} // 根据回复项的高度调整
                            width={'100%'}
                        >
                            {ReplyItem}
                        </List>
                    ) : (
                        <p className="text-gray-500">No replies yet.</p>
                    )}
                </div>
            )}
        </Card>
    );
}

const Comment = ({ comment, fetchComments }: CommentProps) => {
    return (
        <WithSearchParams>
            <CommentContent
                comment={comment}
                fetchComments={fetchComments}
            />
        </WithSearchParams>
    );
};

export default Comment;
