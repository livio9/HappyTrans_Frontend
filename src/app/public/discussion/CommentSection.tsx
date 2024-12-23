// src/app/discussion/CommentsSection.tsx
// 所有顶级评论板块
'use client';

import { useEffect, useState } from 'react';
import Comment from './Comment'; // 导入 Comment 组件
import { getCookie } from '@/utils/cookies';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

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

    // 获取所有评论
    const fetchComments = async () => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/comments/?discussion_id=${discussionId}&offset=0&ordering=desc&page_length=10`,
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
        } catch (error) {
            console.error('Fail to fetch comments:', error);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [discussionId, token]);

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
        </div>
    );
};

export default CommentsSection;
