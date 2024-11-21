"use client"; // 指定该文件为客户端组件，确保在客户端渲染

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // 导入头像组件
import { Button } from "@/components/ui/button"; // 导入按钮组件
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; // 导入卡片组件
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; // 导入对话框组件
import { Input } from "@/components/ui/input"; // 导入输入框组件
import { Textarea } from "@/components/ui/textarea"; // 导入多行文本框组件
import { Badge } from "@/components/ui/badge"; // 导入徽章组件
import { MessageCircle, ThumbsUp, Eye } from "lucide-react"; // 导入图标组件

// 定义用户类型
type User = {
  id: string; // 用户唯一标识符
  name: string; // 用户姓名
  email: string; // 用户邮箱
  avatar: string; // 用户头像的URL
  contributionCount: number; // 用户贡献数量，用于计算徽章等级
};

// 定义评论类型
type Comment = {
  id: string; // 评论唯一标识符
  user: User; // 发表评论的用户
  content: string; // 评论内容
  likes: number; // 点赞数量
  replies: Comment[]; // 回复列表，嵌套同类型的评论
  createdAt: string; // 评论创建时间
};

// 示例用户数据
const users: User[] = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@example.com",
    avatar: "/placeholder.svg?height=40&width=40", // 用户头像的占位图
    contributionCount: 150, // 贡献数量，150代表高级别徽章
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    contributionCount: 75, // 中等级别徽章
  },
  {
    id: "3",
    name: "Charlie Brown",
    email: "charlie@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    contributionCount: 30, // 初级别徽章
  },
];

// 示例评论数据
const comments: Comment[] = [
  {
    id: "1",
    user: users[0],
    content: "This is a great feature! I've been waiting for something like this.", // 评论内容
    likes: 5, // 点赞数
    replies: [
      {
        id: "1.1",
        user: users[1],
        content: "I agree! It's really useful.", // 回复内容
        likes: 2,
        replies: [], // 无进一步回复
        createdAt: "2023-05-15T10:30:00Z", // 回复创建时间
      },
      {
        id: "1.2",
        user: users[2],
        content: "How does it compare to other solutions?", // 回复内容
        likes: 1,
        replies: [],
        createdAt: "2023-05-15T11:15:00Z",
      },
    ],
    createdAt: "2023-05-15T09:00:00Z", // 评论创建时间
  },
  {
    id: "2",
    user: users[1],
    content: "I'm having trouble with the installation. Can someone help?", // 评论内容
    likes: 2,
    replies: [
      {
        id: "2.1",
        user: users[2],
        content: "What error are you seeing?", // 回复内容
        likes: 1,
        replies: [],
        createdAt: "2023-05-16T14:30:00Z",
      },
    ],
    createdAt: "2023-05-16T13:00:00Z",
  },
];

// 根据用户的贡献数量返回对应的徽章等级
function getBadge(contributionCount: number): string {
  if (contributionCount >= 100) return "Gold"; // 100及以上为金牌
  if (contributionCount >= 50) return "Silver"; // 50及以上为银牌
  return "Bronze"; // 低于50为铜牌
}

// 社区论坛组件
export default function CommunityForum() {
  const [newComment, setNewComment] = React.useState(""); // 新评论内容的状态
  const [replyingTo, setReplyingTo] = React.useState<{ commentId: string; replyId: string | null } | null>(null); // 当前正在回复的评论或回复的状态
  const [newReply, setNewReply] = React.useState(""); // 新回复内容的状态
  const [expandedComments, setExpandedComments] = React.useState<Set<string>>(new Set()); // 展开评论的ID集合

  // 切换评论的展开状态
  const toggleCommentExpansion = (commentId: string) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev); // 创建一个新的Set以避免直接修改状态
      if (newSet.has(commentId)) {
        newSet.delete(commentId); // 如果已展开，则收起
      } else {
        newSet.add(commentId); // 如果未展开，则展开
      }
      return newSet;
    });
  };

  // 处理提交新评论的逻辑
  const handlePostComment = () => {
    // TODO: 在这里添加将新评论发送到后端的逻辑
    console.log("Posting comment:", newComment); // 打印新评论内容到控制台
    setNewComment(""); // 清空新评论输入框
  };

  // 处理提交新回复的逻辑
  const handlePostReply = (commentId: string, replyId: string | null) => {
    // TODO: 在这里添加将新回复发送到后端的逻辑
    console.log("Posting reply to comment", commentId, "reply", replyId, ":", newReply); // 打印新回复内容到控制台
    setNewReply(""); // 清空新回复输入框
    setReplyingTo(null); // 清除正在回复的状态
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Community Forum</h1> {/* 页面标题 */}

      {/* 创建新讨论的卡片 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Start a new discussion</CardTitle> {/* 卡片标题 */}
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="What's on your mind?" // 输入框占位符
            value={newComment} // 绑定输入框的值
            onChange={(e) => setNewComment(e.target.value)} // 监听输入变化，更新状态
            className="mb-2"
          />
          <Button onClick={handlePostComment}>Post</Button> {/* 提交按钮 */}
        </CardContent>
      </Card>

      {/* 评论列表区域 */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id}>
            {/* 评论头部，显示用户信息 */}
            <CardHeader>
              <div className="flex items-center space-x-4">
                {/* 用户头像及详情对话框 */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Avatar className="cursor-pointer">
                      <AvatarImage src={comment.user.avatar} alt={comment.user.name} /> {/* 用户头像图片 */}
                      <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback> {/* 用户名首字母作为备用显示 */}
                    </Avatar>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{comment.user.name}</DialogTitle> {/* 对话框标题，显示用户姓名 */}
                      <DialogDescription>
                        Email: {comment.user.email}
                        <br />
                        Contributions: {comment.user.contributionCount}
                        <br />
                        Badge: <Badge>{getBadge(comment.user.contributionCount)}</Badge> {/* 显示用户徽章 */}
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
                <div>
                  <h3 className="font-semibold">{comment.user.name}</h3> {/* 显示用户姓名 */}
                  <p className="text-sm text-gray-500">{new Date(comment.createdAt).toLocaleString()}</p> {/* 显示评论时间 */}
                </div>
              </div>
            </CardHeader>

            {/* 评论内容 */}
            <CardContent>
              <p>{comment.content}</p> {/* 显示评论文本 */}
            </CardContent>

            {/* 评论操作区，包括点赞和回复按钮，以及查看回复 */}
            <CardFooter className="flex justify-between">
              <div className="flex items-center space-x-2">
                {/* 点赞按钮 */}
                <Button variant="ghost" size="sm">
                  <ThumbsUp className="w-4 h-4 mr-1" /> {/* 点赞图标 */}
                  {comment.likes} {/* 显示点赞数 */}
                </Button>
                {/* 回复按钮 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo({ commentId: comment.id, replyId: null })} // 设置当前回复的评论ID，无特定回复ID
                >
                  <MessageCircle className="w-4 h-4 mr-1" /> {/* 回复图标 */}
                  Reply {/* 按钮文字 */}
                </Button>
              </div>
              {/* 查看或隐藏回复按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleCommentExpansion(comment.id)} // 切换评论的展开状态
              >
                <Eye className="w-4 h-4 mr-1" /> {/* 查看图标 */}
                {expandedComments.has(comment.id) ? 'Hide' : 'View'} Replies ({comment.replies.length}) {/* 按钮文字根据状态变化 */}
              </Button>
            </CardFooter>

            {/* 显示回复列表，如果评论被展开则显示所有回复，否则只显示前两条 */}
            {(expandedComments.has(comment.id) ? comment.replies : comment.replies.slice(0, 2)).map((reply) => (
              <Card key={reply.id} className="ml-8 mt-2">
                {/* 回复头部，显示回复用户信息 */}
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={reply.user.avatar} alt={reply.user.name} /> {/* 回复者头像图片 */}
                      <AvatarFallback>{reply.user.name.charAt(0)}</AvatarFallback> {/* 回复者姓名首字母 */}
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{reply.user.name}</h4> {/* 回复者姓名 */}
                      <p className="text-sm text-gray-500">{new Date(reply.createdAt).toLocaleString()}</p> {/* 回复时间 */}
                    </div>
                  </div>
                </CardHeader>

                {/* 回复内容 */}
                <CardContent>
                  <p className="text-sm">{reply.content}</p> {/* 显示回复文本 */}
                </CardContent>

                {/* 回复操作区，包括点赞和回复按钮 */}
                <CardFooter>
                  <Button variant="ghost" size="sm">
                    <ThumbsUp className="w-3 h-3 mr-1" /> {/* 点赞图标 */}
                    {reply.likes} {/* 显示点赞数 */}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo({ commentId: comment.id, replyId: reply.id })} // 设置当前回复的评论ID和回复ID
                  >
                    <MessageCircle className="w-3 h-3 mr-1" /> {/* 回复图标 */}
                    Reply {/* 按钮文字 */}
                  </Button>
                </CardFooter>

                {/* 如果当前正在回复该回复，则显示回复输入框和提交按钮 */}
                {replyingTo && replyingTo.commentId === comment.id && replyingTo.replyId === reply.id && (
                  <CardContent>
                    <Textarea
                      placeholder="Write a reply..." // 输入框占位符
                      value={newReply} // 绑定输入框的值
                      onChange={(e) => setNewReply(e.target.value)} // 监听输入变化，更新状态
                      className="mb-2"
                    />
                    <Button onClick={() => handlePostReply(comment.id, reply.id)}>Post Reply</Button> {/* 提交回复按钮 */}
                  </CardContent>
                )}
              </Card>
            ))}

            {/* 如果评论未展开且有超过两条回复，则显示查看更多回复的按钮 */}
            {!expandedComments.has(comment.id) && comment.replies.length > 2 && (
              <Button
                variant="link"
                size="sm"
                className="ml-8 mt-2"
                onClick={() => toggleCommentExpansion(comment.id)} // 切换评论的展开状态
              >
                View {comment.replies.length - 2} more replies {/* 按钮文字，显示剩余的回复数量 */}
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
