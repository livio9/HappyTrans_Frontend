// src/app/discussion/CommentsSection.tsx
// 所有顶级评论板块
'use client';

import { useEffect, useState } from 'react';
import Comment from './Comment'; // 导入 Comment 组件
import { getCookie } from '@/utils/cookies';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

interface CommentSection {
    total: string;
    page_length: string;
    offset: string;
    ordering: string;
    results: CommentType[];
}

interface CommentType {
    id: number;
    discussion: number;
    content: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    parent: number;
    user?: UserType;
    replies?: CommentType[];
}

interface UserType {
    id: string;
    username: string;
}

const CommentsSection = ({ discussionId }: { discussionId: number }) => {
    const { token } = useAuth();
    const csrfToken = getCookie('csrftoken');
    const [comments, setComments] = useState<CommentType[]>([]);
    const [newComment, setNewComment] = useState('');
    const [offset, setOffset] = useState(0);
    const pageSize = 6; // 每页显示的评论数量
    const [totalPages, setTotalPages] = useState(1); // 新增总页数状态
    const [currentPage, setCurrentPage] = useState(1);

    // 获取所有评论
    const fetchComments = async () => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/comments/?discussion_id=${discussionId}&offset=${offset}&ordering=desc&page_length=${pageSize}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Token ${token}`,
                    },
                }
            );
            if (!response.ok) {
                throw new Error('Fail to fetch comments');
            }
            const result: CommentSection = await response.json();
            const data: CommentType[] = Array.isArray(result.results)
                ? result.results
                : [];
            setComments(data); 
            setTotalPages(Math.ceil(parseInt(result.total) / pageSize)); // 设置总页数
        } catch (error) {
            console.error('Fail to fetch comments:', error);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [offset, discussionId]);

    // 更新偏移量和当前页码
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        setOffset((newPage - 1) * pageSize);
    };

    // 发送新评论
    const submitNewComment = async () => {
        if (newComment.trim() === '') {
            alert('Comment content cannot be empty!');
            return;
        }
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/comments/?discussion_id=${discussionId}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Token ${token}`,
                        'X-CSRFToken': csrfToken || '',
                    },
                    body: JSON.stringify({
                        content: newComment,
                        parent: null, // 顶级评论
                        discussion_id: discussionId,
                    }),
                }
            );
            if (!response.ok) {
                throw new Error('Failed to submit comment');
            }
            const createdComment: CommentType = await response.json();
            setComments((prev) => [createdComment, ...prev]);
            setNewComment('');
        } catch (error) {
            console.error('Error when submitting comment:', error);
        }
    };

    return (
        <div className="comments-section">
            <h2 className="text-xl font-bold mb-4">comment</h2>

            {/* 新评论输入框 */}
            <div className="mb-6">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className={`w-full p-2 border rounded`}
                    rows={4}
                    placeholder="Write your comment..."
                    disabled={false}
                />
                <div className="mt-2 mb-4 text-gray-500 text-sm italic">
                    You have not been added to this project yet, so you cannot
                    post comments.
                </div>
                <div className="mt-2">
                    <Button
                        onClick={submitNewComment}
                        disabled={false}
                        className={'opacity-50 cursor-not-allowed'}
                    >
                        Submit
                    </Button>
                </div>
            </div>

            {/* 评论列表 */}
            <div>
                {comments.length > 0 ? (
                    comments.map((comment) => (
                        <Comment
                            key={comment.id}
                            comment={comment}
                            fetchComments={fetchComments}
                        />
                    ))
                ) : (
                    <p>No comments yet, be the first to comment one!</p>
                )}
            </div>


            {/* 分页 */}
            {totalPages > 0 && (
                <div className="pagination flex justify-center items-center space-x-4 mt-6">
                    <Button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1"
                    >
                        <ChevronLeftIcon className="w-4 h-4" />
                        <span>Previous</span>
                    </Button>
                    <span className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1"
                    >
                        <span>Next</span>
                        <ChevronRightIcon className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default CommentsSection;
