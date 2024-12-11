"use client"; // 指定该文件为客户端组件，确保在客户端渲染

import * as React from "react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // 导入头像组件
import { Button } from "@/components/ui/button"; // 导入按钮组件
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; // 导入卡片组件
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; // 导入对话框组件
import { Input } from "@/components/ui/input"; // 导入输入框组件
import { Textarea } from "@/components/ui/textarea"; // 导入多行文本框组件
import { Badge } from "@/components/ui/badge"; // 导入徽章组件
import { MessageCircle, ThumbsUp, Eye } from "lucide-react"; // 导入图标组件
import { useSearchParams, useRouter } from "next/navigation"; 
import { useProject } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext"; 
import TextareaAutosize from 'react-textarea-autosize';

// 在组件加载时获取项目名称
const usePersistentProjectName = () => {
  const { getProjectName } = useProject();
  const [projectName, setProjectName] = useState<string | null>(null);

  useEffect(() => {
    const storedProjectName = localStorage.getItem("projectName");
    if (storedProjectName) {
      setProjectName(storedProjectName);
    } else {
      const currentProjectName = getProjectName();
      if (currentProjectName) {
        setProjectName(currentProjectName);
        localStorage.setItem("projectName", currentProjectName);
      }
    }
  }, [getProjectName]);

  return projectName;
};

// 根据用户的贡献数量返回对应的徽章等级
function getBadge(contributionCount: number): string {
  if (contributionCount >= 100) return "Gold"; // 100及以上为金牌
  if (contributionCount >= 50) return "Silver"; // 50及以上为银牌
  return "Bronze"; // 低于50为铜牌
}

// 定义用户类型
type User = {
  id: string;
  role: string;
  bio: string;
  native_language: string;
  preferred_languages: string;
  accepted_entries: string;
  managed_projects: string;
  translated_projects: string;
  username: string;
  email: string;
  avatar: string;
  contributionCount: number;
};

// 定义评论类型
type CommentType = {
  id: string;
  content: string;
  likes: number;
  replies: CommentType[];
  created_by: string;
  created_at: string;
  updated_at: string;
  parent?: string | null;
};

// 评论组件
const Comment = ({
  comment,
  onReply,
  onEditComment,
  onEditReply,
  onDeleteComment,
  onDeleteReply,
  onLike,
  expandedComments,
  toggleExpand,
  isReply = false,  // 默认是评论，若为回复，传入 isReply: true
}: {
  comment: CommentType;
  onReply: (commentId: string, replyContent: string) => void;
  onEditComment: (commentId: string, newContent: string) => void;
  onEditReply: (commentId: string, newContent: string) => void;
  onDeleteComment: (commentId: string) => void;
  onDeleteReply: (commentId: string) => void;
  onLike: (commentId: string) => void;
  expandedComments: Set<string>;
  toggleExpand: (commentId: string) => void;
  isReply?: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState(""); // 回复内容
  const [isReplying, setIsReplying] = useState(false); // 是否显示回复框
  const [user, setUser] = useState<User | null>(null); // 使用 state 存储 user

  // 请求用户数据并更新评论中的 user 信息
  useEffect(() => {
    const fetchUserData = async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/profile?id=${comment.created_by}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': 'Token 11062b541ec273fdaffc6289c13862c698fdb59f'
        }
      });
      const data = await response.json();
      setUser(data); // 更新用户信息
    };

    if (!user) {  // 只有当 comment.user 为空时才请求数据
      fetchUserData();
    }
  }, [comment.created_by]);

  useEffect(() => {
    setEditContent(comment.content); // 确保初始化 editContent
  }, [comment.content]); // 当 comment 内容变化时，更新 editContent


  // 编辑评论
  const handleEditComment = async () => {
    onEditComment(comment.id, editContent);
  };

  // 编辑回复
  const handleEditReply = async () => {
    onEditReply(comment.id, editContent);
  };

  // 删除评论
  const handleDeleteComment = () => {
    onDeleteComment(comment.id);
  };

  // 删除回复
  const handleDeleteReply = () => {
    onDeleteReply(comment.id);
  };

  // 进行回复
  const handleReply = () => {
    setIsReplying(true); // 显示回复框
  };

  // 发送回复
  const handlePostReply = () => {
    if (replyContent) {
      onReply(comment.id, replyContent);
      setReplyContent(""); // 清空输入框
      setIsReplying(false); // 隐藏回复框
    }
  };

  // 取消回复
  const handleCancelReply = () => {
    setIsReplying(false); // 隐藏回复框
  };

  // 点赞
  const handleLike = () => {
    onLike(comment.id);
    comment.likes += 1; // 本地更新点赞数
  };

  return (
    <Card className="mb-2 shadow-md rounded-lg border border-gray-200">
      <CardHeader className="flex space-x-4 p-4 bg-white shadow rounded-md">
        {/* 头像和用户信息 */}
        <div className="flex items-center space-x-3 relative">
          <Dialog>
            <DialogTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarImage
                  src={user?.avatar || "/placeholder.svg"}
                  alt={user?.username || "User"}
                  className="w-10 h-10 rounded-full"
                />
                <AvatarFallback>
                  {user?.username ? user.username.charAt(0) : "U"}
                </AvatarFallback>
              </Avatar>
            </DialogTrigger>
            <DialogContent className="max-w-xs p-4 bg-gray-50 rounded-md shadow-lg">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">
                  {user?.username || "Anonymous"}
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm text-gray-700">
                  <div id="radix-:r2:" className="mt-2 text-sm text-gray-700" ref={null}>
                    <div>
                      <div>Email: {user?.email || "N/A"}</div>
                      <div>Contributions: {user?.contributionCount || 0}</div>
                      <div>
                        Badge: <Badge className="mt-1">{getBadge(user?.contributionCount || 0)}</Badge>
                      </div>
                    </div>
                  </div>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        
          {/* 用户信息 */}
          <div className="flex flex-col">
            <h4 className="font-semibold text-sm text-gray-800">
              {user?.username || "Anonymous"}
            </h4>
          </div>
        </div>

        {/* 评论内容 */}
        <div className="flex-1">
          <CardContent className="mt-1 p-3 bg-gray-100 rounded-md w-full">
            {isEditing ? (
              <TextareaAutosize
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                minRows={4}
                maxRows={10}
                className="w-full mb-2 text-sm border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="is editing..."
              />
            ) : (
              <p className="text-gray-700 text-sm break-words">{comment.content}</p>
            )}
          </CardContent>
        </div>

        {/* 创建和更新日期 */}
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">
            createdAt:{new Date(comment.created_at).toLocaleString()}
          </span>
          <span className="text-xs text-gray-500">
            updateAt: {new Date(comment.updated_at).toLocaleString()}
          </span>
        </div>
      </CardHeader>

      <CardFooter className="flex justify-between items-center mt-2">
        <div className="flex items-center space-x-2">
          {/* 点赞按键 */}
          <Button
            variant="ghost"
            onClick={handleLike}
            className="flex items-center space-x-1 p-1 transition-colors duration-200 hover:text-blue-500"
          >
            <ThumbsUp className="w-4 h-4" />
            <span className="text-xs">{comment.likes}</span>
          </Button>

          {/* 回复按键 */}
          <Button
            variant="ghost"
            onClick={handleReply}
            className="flex items-center space-x-1 p-1 transition-colors duration-200 hover:text-blue-500"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs">Reply</span>
          </Button>

          {/* 编辑按键 */}
          <Button
            variant="ghost"
            onClick={() => {
              if (isEditing) {
                // 如果正在编辑，保存评论/回复内容
                isReply ? handleEditReply() : handleEditComment();
                setIsEditing(false); // 保存后，切换回非编辑状态
              } else {
                // 切换到编辑模式
                setIsEditing(true);
                setEditContent(comment.content); // 在开始编辑时，确保内容是最新的
              }
            }}
            className="flex items-center space-x-1 p-1 transition-colors duration-200 hover:text-blue-500"
          >
            <span className="text-xs">{isEditing ? "Save" : "Edit"}</span>
          </Button>

          {/* 删除按键 */}
          <Button
            variant="ghost"
            onClick={() => (isReply ? handleDeleteReply() : handleDeleteComment())}
            className="flex items-center space-x-1 p-1 text-red-500 transition-colors duration-200 hover:text-red-700"
          >
            <span className="text-xs">Delete</span>
          </Button>
        </div>

        <Button
          variant="ghost"
          onClick={() => toggleExpand(comment.id)}
          className="flex items-center space-x-1 p-1 transition-colors duration-200 hover:text-blue-500"
        >
          <Eye className="w-4 h-4" />
          <span className="text-xs">
            {expandedComments.has(comment.id) ? "Hide" : "View"} Replies ({comment.replies?.length || 0})
          </span>
        </Button>
      </CardFooter>

      {/* 回复输入框 */}
      {isReplying && (
        <div className="ml-12 mt-2 space-y-2">
          <TextareaAutosize
            placeholder="Write you reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            minRows={3}
            className="w-full mb-4 text-sm border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex space-x-2">
            <Button onClick={handlePostReply} className="bg-green-500 text-white hover:bg-green-600">
              Send
            </Button>
            <Button onClick={handleCancelReply} className="bg-gray-300 hover:bg-gray-400">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* 回复列表 */}
      {expandedComments.has(comment.id) && (
        <div className="ml-12 mt-2 space-y-2">
          {comment.replies.length === 0 ? (
            <p className="text-gray-500 text-sm">No replies yet. Be the first to comment!</p>
          ) : (
            comment.replies.map((reply) => (
              <Comment
                key={reply.id}
                comment={reply}
                onReply={onReply}
                onEditComment={onEditComment}
                onEditReply={onEditReply}
                onDeleteComment={onDeleteComment}
                onDeleteReply={onDeleteReply}
                onLike={onLike}
                expandedComments={expandedComments}
                toggleExpand={toggleExpand}
                isReply={true} 
              />
            ))
          )}
        </div>
      )}
    </Card>
  );
};

// 社区论坛组件
export default function CommunityForum() {
  const [newComment, setNewComment] = useState(""); // 新评论内容的状态
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    replyId: string | null;
  } | null>(null); // 当前正在回复的评论或回复的状态
  const [newReply, setNewReply] = useState(""); // 新回复内容的状态
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set()
  ); // 展开评论的ID集合
  const [comments, setComments] = useState<CommentType[]>([]); // 评论列表
  const router = useRouter(); // 使用路由钩子跳转页面
  const projectName = usePersistentProjectName(); // 获取项目名称
  const { token } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [showDeleteReplyDialog, setShowDeleteReplyDialog] = useState(false);
  const [replyToDelete, setReplyToDelete] = useState<string | null>(null);

  useEffect(() => {
    // 在组件加载时，获取评论列表
    if (projectName) {
      fetchComments(projectName);
    }
  }, [projectName]);

  // 获取讨论区的评论
  const fetchComments = async (projectName: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/discussions/?project_name=${encodeURIComponent(
          projectName || ""
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`, // 使用认证令牌
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }
      const data = await response.json();
      // 确保每个评论都有 replies 字段，即使是空数组
      const commentsWithReplies = data.map((comment: CommentType) => ({
        ...comment,
        replies: comment.replies || [], // 如果没有 replies 字段，则初始化为空数组
      }));
      setComments(commentsWithReplies); // 设置评论列表
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  // 提交新评论
  const handlePostComment = async () => {
    if (!newComment) return;
    try {
      // 获取 CSRF token 和认证令牌
      const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content"); // 假设你有从 HTML meta 标签中获取的 CSRF token
      const projectName = localStorage.getItem("projectName"); // 从 localStorage 获取项目名
      if (!projectName) {
        console.error("Project name is missing");
        return;
      }

      // 发送 POST 请求
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/discussions/?project_name=${encodeURIComponent(
          projectName || ""
        )}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`, // 使用认证令牌
            "X-CSRFTOKEN": csrfToken || "", // 获取 CSRF token
          },
          body: JSON.stringify({
            title: "Example", // 作为默认标题
            content: newComment, // 新评论内容
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to post comment");
      }

      const data = await response.json();
      setComments([data, ...comments]); // 将新评论添加到评论列表
      setNewComment(""); // 清空输入框
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  // 切换评论展开/收起状态
  const toggleCommentExpansion = (commentId: string) => {
    setExpandedComments((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(commentId)) {
        newExpanded.delete(commentId);
      } else {
        newExpanded.add(commentId);
        fetchReplies(commentId); // 展开评论时获取回复
      }
      return newExpanded;
    });
  };

  // 提交编辑后的评论
  const handleEditComment = async (commentId: string, newContent: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/discussions/${commentId}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ content: newContent }),
    });

    if (!response.ok) {
      throw new Error("Failed to edit comment");
    }

    const updatedComment = await response.json();
    setComments(prevComments =>
      prevComments.map(comment =>
        comment.id === commentId ? { ...comment, content: updatedComment.content } : comment
      )
    );
  } catch (error) {
    console.error("Error editing comment:", error);
  }
};

  // 递归函数：在评论列表中更新评论内容
  const updateCommentInComments = (commentsList: CommentType[], commentId: string, updatedData: Partial<CommentType>): CommentType[] => {
    return commentsList.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          ...updatedData,
        };
      }
      return {
        ...comment,
        replies: updateCommentInComments(comment.replies, commentId, updatedData),
      };
    });
  };

  // 提交删除评论
  const handleDeleteComment = async (commentId: string) => {
    setCommentToDelete(commentId);
    setShowDeleteDialog(true);
  };

  // 确认删除评论
  const confirmDeleteComment = async () => {
    if (commentToDelete) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/discussions/${commentToDelete}/`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete comment");
        }

        setComments((prevComments) =>
          prevComments.filter((comment) => comment.id !== commentToDelete)
        );
      } catch (error) {
        console.error("Error deleting comment:", error);
      }
    }
    setShowDeleteDialog(false); 
  };

  // 取消删除操作
  const cancelDelete = () => {
    setShowDeleteDialog(false); // Close the dialog if the user cancels
  };

  // 递归函数：在评论列表中移除评论
  const removeCommentFromComments = (commentsList: CommentType[], commentId: string): CommentType[] => {
    return commentsList
      .filter(comment => comment.id !== commentId)
      .map(comment => ({
        ...comment,
        replies: removeCommentFromComments(comment.replies, commentId),
      }));
  };

  // 点赞评论
  const handleLike = async (commentId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/comments/${commentId}/like/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to like comment");
      }

      const data = await response.json();

      setComments((prevComments) =>
        updateLikesInComments(prevComments, commentId, data.likes)
      );
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  // 递归函数：在评论列表中更新点赞数
  const updateLikesInComments = (commentsList: CommentType[], commentId: string, newLikes: number): CommentType[] => {
    return commentsList.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          likes: newLikes,
        };
      }
      return {
        ...comment,
        replies: updateLikesInComments(comment.replies, commentId, newLikes),
      };
    });
  };

  // 获取评论的回复
  const fetchReplies = async (commentId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/comments/?discussion_id=${commentId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`, // 使用认证令牌
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch replies");
      }
      const data = await response.json();
      // 更新相应评论的回复
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === commentId
            ? { ...comment, replies: data || [] }
            : comment
        )
      );
    } catch (error) {
      console.error("Error fetching replies:", error);
    }
  };

  // 提交新回复
  const handleReply = async (commentId: string, replyContent: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/comments/?discussion_id=${commentId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`, // 使用认证令牌
          },
          body: JSON.stringify({
            content: replyContent,
            replyTo: null, // 如果有回复某个评论的逻辑，可以传递相应的ID
            discussion_id: commentId, // 评论所属的讨论ID
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to post reply");
      }

      const data = await response.json(); // 获取新回复的数据

      // 更新评论列表，添加新的回复
      setComments((prevComments) =>
        addReplyToComments(prevComments, commentId, data)
      );
    } catch (error) {
      console.error("Error posting reply:", error);
    }
  };

  // 递归函数：在评论列表中添加回复
  const addReplyToComments = (commentsList: CommentType[], parentId: string, reply: CommentType): CommentType[] => {
    return commentsList.map(comment => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...comment.replies, reply],
        };
      }
      return {
        ...comment,
        replies: addReplyToComments(comment.replies, parentId, reply),
      };
    });
  };

  // // 提交回复内容
  // const handleSubmitReply = () => {
  //   if (replyingTo && newReply) {
  //     handleReply(replyingTo.commentId, replyingTo.replyId);
  //   }
  // };

  // 提交编辑后的回复
  const handleEditReply = async (replyId: string, newContent: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/comments/${replyId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({ content: newContent }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to edit reply");
      }

      const updatedReply = await response.json();
      setComments((prevComments) =>
        prevComments.map((comment) =>
          updateReply(comment, replyId, updatedReply.content)
        )
      );
    } catch (error) {
      console.error("Error editing reply:", error);
    }
  };

  // 递归更新回复内容
  const updateReply = (
    comment: CommentType,
    replyId: string,
    newContent: string
  ): CommentType => {
    // 如果当前评论是目标回复，则更新其内容
    if (comment.id === replyId) {
      return { ...comment, content: newContent };
    }

    // 否则，递归更新其回复
    return {
      ...comment,
      replies: comment.replies.map((reply) =>
        updateReply(reply, replyId, newContent)  // 对每个子回复递归更新
      ),
    };
  };

  // 提交删除回复
  const handleDeleteReply = async (replyId: string) => {
    setReplyToDelete(replyId); // 设置要删除的回复ID
    setShowDeleteReplyDialog(true); // 显示删除确认对话框
  };
  // 确认删除回复
  const confirmDeleteReply = async () => {
    if (replyToDelete) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/comments/${replyToDelete}/`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete reply");
        }

        // 更新评论列表，移除被删除的回复
        setComments((prevComments) =>
          prevComments.map((comment) =>
            deleteReplyFromComment(comment, replyToDelete)
          )
        );
      } catch (error) {
        console.error("Error deleting reply:", error);
      }
    }
    setShowDeleteReplyDialog(false); // 关闭删除对话框
  };

  // 递归删除回复
  const deleteReplyFromComment = (comment: CommentType, replyId: string): CommentType => {
    return {
      ...comment,
      replies: comment.replies
        .filter((reply) => reply.id !== replyId)
        .map((reply) => deleteReplyFromComment(reply, replyId)),
    };
  };

  // 取消删除操作
  const cancelDeleteReply = () => {
    setShowDeleteReplyDialog(false); // 关闭删除对话框
  };

  /**
   * 跳转到项目页面
   */
  const handleProjectNavigation = () => {
    router.push("/projects");
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
      console.error("Project name is missing");
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* 项目导航面包屑 */}
      <div className="flex items-center space-x-1 mb-6 text-sm text-gray-600">
        {/* Projects按钮 */}
        <Button
          variant="link"
          onClick={handleProjectNavigation}
          className="text-gray-800 font-semibold"
        >
          Projects
        </Button>
        {/* 分隔符 */}
        <span className="text-gray-400">/</span>
        {/* 当前项目按钮 */}
        <Button
          variant="link"
          onClick={handleProjectLanguage}
          className="text-gray-800 font-semibold"
        >
          {projectName}
        </Button>
        {/* 分隔符 */}
        <span className="text-gray-400">/</span>
        {/* 当前项目语言按钮 */}
        <Button
          variant="link"
          className="text-blue-500 hover:text-blue-700 focus:outline-none"
        >
          Community Forum
        </Button>
      </div>
      <h1 className="text-2xl font-bold mb-4">Community Forum</h1> {/* 页面标题 */}

      {/* 创建新讨论的卡片 */}
      <Card className="mb-6 shadow-md">
        <CardHeader>
          {/* 卡片标题 */}
          <CardTitle className="text-xl font-semibold">
            Start a new discussion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="What's on your mind?" // 输入框占位符
            value={newComment} // 绑定输入框的值
            onChange={(e) => setNewComment(e.target.value)} // 监听输入变化，更新状态
            className="mb-4 resize-none"
            rows={4}
          />
          {/* 提交按钮 */}
          <Button onClick={handlePostComment} className="bg-blue-500 text-white hover:bg-blue-600">
            Post
          </Button> 
        </CardContent>
      </Card>

      {/* 评论列表区域 */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onEditComment={handleEditComment}
              onEditReply={handleEditReply}
              onDeleteComment={handleDeleteComment}
              onDeleteReply={handleDeleteReply}
              onLike={handleLike}
              expandedComments={expandedComments}
              toggleExpand={toggleCommentExpansion}
              isReply={false}  // 传递 isReply = true 表示是回复
            />
          ))
        )}
      </div>

      {/* 删除确认评论对话框 */}
      {showDeleteDialog && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogTitle>
              Delete Comment
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment?
            </DialogDescription>
            <div className="flex space-x-2">
              <Button onClick={confirmDeleteComment} className="bg-red-500 text-white">
                Confirm
              </Button>
              <Button onClick={cancelDelete} className="bg-gray-300">
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 删除确认回复对话框 */}
      {showDeleteReplyDialog && (
        <Dialog open={showDeleteReplyDialog} onOpenChange={setShowDeleteReplyDialog}>
          <DialogContent>
            <DialogTitle>
              Delete Reply
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this reply?
            </DialogDescription>
            <div className="flex space-x-2">
              <Button onClick={confirmDeleteReply} className="bg-red-500 text-white">
                Confirm
              </Button>
              <Button onClick={cancelDeleteReply} className="bg-gray-300">
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}