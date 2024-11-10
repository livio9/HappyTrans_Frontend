"use client"
import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, ThumbsUp, Eye } from "lucide-react"

type User = {
  id: string
  name: string
  email: string
  avatar: string
  contributionCount: number
}

type Comment = {
  id: string
  user: User
  content: string
  likes: number
  replies: Comment[]
  createdAt: string
}

const users: User[] = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com", avatar: "/placeholder.svg?height=40&width=40", contributionCount: 150 },
  { id: "2", name: "Bob Smith", email: "bob@example.com", avatar: "/placeholder.svg?height=40&width=40", contributionCount: 75 },
  { id: "3", name: "Charlie Brown", email: "charlie@example.com", avatar: "/placeholder.svg?height=40&width=40", contributionCount: 30 },
]

const comments: Comment[] = [
  {
    id: "1",
    user: users[0],
    content: "This is a great feature! I've been waiting for something like this.",
    likes: 5,
    replies: [
      { id: "1.1", user: users[1], content: "I agree! It's really useful.", likes: 2, replies: [], createdAt: "2023-05-15T10:30:00Z" },
      { id: "1.2", user: users[2], content: "How does it compare to other solutions?", likes: 1, replies: [], createdAt: "2023-05-15T11:15:00Z" },
    ],
    createdAt: "2023-05-15T09:00:00Z",
  },
  {
    id: "2",
    user: users[1],
    content: "I'm having trouble with the installation. Can someone help?",
    likes: 2,
    replies: [
      { id: "2.1", user: users[2], content: "What error are you seeing?", likes: 1, replies: [], createdAt: "2023-05-16T14:30:00Z" },
    ],
    createdAt: "2023-05-16T13:00:00Z",
  },
]

function getBadge(contributionCount: number): string {
  if (contributionCount >= 100) return "Gold"
  if (contributionCount >= 50) return "Silver"
  return "Bronze"
}

export default function CommunityForum() {
  const [newComment, setNewComment] = React.useState("")
  const [replyingTo, setReplyingTo] = React.useState<{ commentId: string, replyId: string | null } | null>(null)
  const [newReply, setNewReply] = React.useState("")
  const [expandedComments, setExpandedComments] = React.useState<Set<string>>(new Set())

  const toggleCommentExpansion = (commentId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }

  const handlePostComment = () => {
    // Logic to post a new comment
    console.log("Posting comment:", newComment)
    setNewComment("")
  }

  const handlePostReply = (commentId: string, replyId: string | null) => {
    // Logic to post a new reply
    console.log("Posting reply to comment", commentId, "reply", replyId, ":", newReply)
    setNewReply("")
    setReplyingTo(null)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Community Forum</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Start a new discussion</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="What's on your mind?"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mb-2"
          />
          <Button onClick={handlePostComment}>Post</Button>
        </CardContent>
      </Card>
      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id}>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Avatar className="cursor-pointer">
                      <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
                      <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{comment.user.name}</DialogTitle>
                      <DialogDescription>
                        Email: {comment.user.email}<br />
                        Contributions: {comment.user.contributionCount}<br />
                        Badge: <Badge>{getBadge(comment.user.contributionCount)}</Badge>
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
                <div>
                  <h3 className="font-semibold">{comment.user.name}</h3>
                  <p className="text-sm text-gray-500">{new Date(comment.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p>{comment.content}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  {comment.likes}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setReplyingTo({ commentId: comment.id, replyId: null })}>
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Reply
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleCommentExpansion(comment.id)}
              >
                <Eye className="w-4 h-4 mr-1" />
                {expandedComments.has(comment.id) ? 'Hide' : 'View'} Replies ({comment.replies.length})
              </Button>
            </CardFooter>
            {(expandedComments.has(comment.id) ? comment.replies : comment.replies.slice(0, 2)).map((reply) => (
              <Card key={reply.id} className="ml-8 mt-2">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={reply.user.avatar} alt={reply.user.name} />
                      <AvatarFallback>{reply.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{reply.user.name}</h4>
                      <p className="text-sm text-gray-500">{new Date(reply.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{reply.content}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm">
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    {reply.likes}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setReplyingTo({ commentId: comment.id, replyId: reply.id })}>
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Reply
                  </Button>
                </CardFooter>
                {replyingTo && replyingTo.commentId === comment.id && replyingTo.replyId === reply.id && (
                  <CardContent>
                    <Textarea
                      placeholder="Write a reply..."
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      className="mb-2"
                    />
                    <Button onClick={() => handlePostReply(comment.id, reply.id)}>Post Reply</Button>
                  </CardContent>
                )}
              </Card>
            ))}
            {!expandedComments.has(comment.id) && comment.replies.length > 2 && (
              <Button
                variant="link"
                size="sm"
                className="ml-8 mt-2"
                onClick={() => toggleCommentExpansion(comment.id)}
              >
                View {comment.replies.length - 2} more replies
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}