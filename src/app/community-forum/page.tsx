// src/app/community-forum/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { getCookie } from '@/utils/cookies';
import { useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import UserAvatar from '@/components/shared/UserAvatar';
import { useDiscussions } from '@/context/DiscussionsContext';
import { useProject } from "@/context/ProjectContext";

interface UserType {
  id: string;
  username: string;
  email?: string;
  bio?: string;
}

interface DiscussionType {
  id: number;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  user?: UserType;
}
interface Entry {
  value: number;
  label: string;
}

const CommunityForumPage = () => {
  const { token, user: authUser } = useAuth();
  const csrfToken = getCookie('csrftoken');

  const router = useRouter();
  const searchParams = useSearchParams();
  const projectName = searchParams.get("project") || "";

  // 编辑相关状态
  const [editingDiscussionId, setEditingDiscussionId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');

  // 用户信息弹出框相关状态
  const [showUserInfoFor, setShowUserInfoFor] = useState<string | null>(null);
  const [hoveredUserInfo, setHoveredUserInfo] = useState<UserType | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  const { user, projectInProcess } = useAuth(); // 使用用户上下文获取当前用户
  const canCreateDiscussion = user && projectName && (projectInProcess?.includes(projectName));

  const {
    discussions,
    fetchAllDiscussions,
    loading,
    currentPage,
    setCurrentPage,
    totalPages,
  } = useDiscussions();

    // 使用 ProjectContext
      const {
          fetchProjectInfo,
          fetchEntries,
      } = useProject();

  // 获取所有帖子及对应用户信息
  useEffect(() => {
    if (!token) return;
    (async () => {
      fetchAllDiscussions(); 
    })();
  }, [currentPage, token, projectName]);

  // 解析标题并返回带有链接的标题和字段
  const parseTitle = (title: string) => {
    // 按照 # 分割字符串
    const parts = title.split('#').map(part => part.trim()); // 对每个部分使用 trim() 去除首尾空格

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
          fontSize: '1.5rem', // 标题字体大小
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

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // 跳转到创建帖子页面
  const createNewPost = () => {
    router.push(`/create-post?project=${encodeURIComponent(projectName)}`);
  };

  // 点击头像时显示用户信息
  const handleAvatarClick = (userId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const discussion = discussions.find(d => d.user?.id === userId);
    if (discussion && discussion.user) {
      setShowUserInfoFor(userId);
      setHoveredUserInfo(discussion.user);
      setPopupPosition({ x: event.clientX, y: event.clientY });
    }
  };

  // 仅在显示弹框时监听全局点击
  useEffect(() => {
    if (!showUserInfoFor) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowUserInfoFor(null);
        setHoveredUserInfo(null);
      }
    };

    document.addEventListener('click', handleClickOutside, { capture: true });
    return () => {
      document.removeEventListener('click', handleClickOutside, { capture: true });
    };
  }, [showUserInfoFor]);

  // 开始编辑帖子
  const startEditing = (discussion: DiscussionType) => {
    if (!authUser || authUser.id !== discussion.user?.id) return;
    setEditingDiscussionId(discussion.id);
    setEditTitle(discussion.title);
    setEditContent(discussion.content);
  };

  // 取消编辑
  const cancelEditing = () => {
    setEditingDiscussionId(null);
    setEditTitle('');
    setEditContent('');
  };

  // 提交编辑
  const submitEdit = async (discussionId: number) => {
    if (!authUser) return;

    // 解析编辑后的标题
    const { mainTitle, projectName, languageCode, idxInLanguage } = parseTitle(editTitle);

    // 1. 验证 projectName
    if (projectName) {
      if (!projectInProcess?.includes(projectName)) {
        window.alert(`Error: Project "${projectName}" is not valid`);
        return;
      }
    }

    // 2. 验证 languageCode
    if (languageCode) {
      if (!projectName) {
        window.alert('Error: Cannot validate language code without a valid project');
        return;
      }

      try {
        const projectData = await fetchProjectInfo(projectName);
        if (!projectData || !projectData.languages) {
          window.alert('Error: Failed to fetch project data');
          return;
        }

        const validLanguages = projectData.languages.map((lang: { language_code: string }) => lang.language_code);
        if (!validLanguages.includes(languageCode)) {
          window.alert(`Error: Language "${languageCode}" is not valid for project "${projectName}"`);
          return;
        }
      } catch (error) {
        console.error('Error fetching project languages:', error);
        window.alert('Error: Failed to validate language code');
        return;
      }
    }

    // 3. 验证 idxInLanguage
    if (idxInLanguage) {
      if (!projectName || !languageCode) {
        window.alert('Error: Cannot validate entry without valid project and language');
        return;
      }

      try {
        console.log("name:", projectName);
        console.log("lang: ", languageCode);
        const entriesData = await fetchEntries(projectName, languageCode);
        console.log("entriesData", entriesData);
        if (!entriesData) {
          window.alert('Error: Failed to fetch entries data');
          return;
        }

        const validEntries = entriesData.map((entry: Entry) => entry.value.toString());
        if (!validEntries.includes(idxInLanguage)) {
          window.alert(`Error: Entry "${idxInLanguage}" is not valid for the selected project and language`);
          return;
        }
      } catch (error) {
        console.error('Error fetching entries:', error);
        window.alert('Error: Failed to validate entry');
        return;
      }
    }

    // 确认编辑
    const confirmMessage = `Editing the post will likely affect existing comments, sure you want to re-edit?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/discussions/${discussionId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
          'X-CSRFToken': csrfToken || '',
        },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to edit post');
      }
      await fetchAllDiscussions(); 
      cancelEditing();
    } catch (error: any) {
      console.error('Edit discussion error:', error);
      alert(error.message || 'Error when editing a post');
    }
  };

  // 删除帖子
  const deleteDiscussion = async (discussion: DiscussionType) => {
    if (!authUser || authUser.id !== discussion.user?.id) return;

    const confirmMessage = `Deleting this post will also delete all comments, sure you want to delete it?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/discussions/${discussion.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
          'X-CSRFToken': csrfToken || '',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete post');
      }
      await fetchAllDiscussions(); 
    } catch (error: any) {
      console.error('Delete discussion error:', error);
      alert(error.message || 'Error when deleting a post');
    }
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
      router.push(`/language-versions?project=${encodeURIComponent(projectName)}`);
    } else {
      console.error("Project name is missing");
    }
  };

  return (
    <div className="community-forum-page container mx-auto p-4">
      {/* 项目导航面包屑 */}
      <div className="flex items-center space-x-1 mb-6 text-sm text-gray-600">
        {/* Projects按钮 */}
        <Button
          variant="link"
          onClick={handleProjectNavigation}
          className="text-gray-500 font-semibold"
        >
          Projects
        </Button>
        {/* 分隔符 */}
        <span className="text-gray-400">/</span>
        {/* 当前项目按钮 */}
        <Button
          variant="link"
          onClick={handleProjectLanguage}
          className="text-gray-500 font-semibold"
        >
          {projectName}
        </Button>
        {/* 分隔符 */}
        <span className="text-gray-400">/</span>
        {/* 当前项目社区按钮 */}
        <Button
          variant="link"
          className="font-semibold text-gray-800 hover:text-blue-700 focus:outline-none"
        >
          Community
        </Button>
      </div>
      
      {/* 项目标题和按钮容器 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold mb-6">Community Forum</h1>
        {canCreateDiscussion &&
          <Button
            onClick={createNewPost}
            className="text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600 rounded-md py-2 px-6 shadow-sm transition-all duration-200"
          >
            Create new discussion
          </Button>
        }
      </div>

      {/* 讨论列表 */}
      <div className="discussions-list">
        {loading ? (
          <p>Loading...</p>
        ) : discussions.length === 0 ? (
            <p>There is no discussion at this time, so come on and start the first one!</p>
        ) : (
          discussions.map(discussion => (
            <Card
              key={discussion.id}
              className="mb-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardHeader className="flex justify-between">
                {editingDiscussionId === discussion.id ? (
                  <div className="flex-1">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full p-2 border rounded mb-2"
                    />
                  </div>
                ) : (
                  <CardTitle className="text-xl font-semibold">
                    <TitleDisplay title={discussion.title} />
                  </CardTitle>
                )}
                <div className="text-sm text-gray-500">
                  {formatDate(discussion.created_at)}
                </div>
              </CardHeader>
              <CardContent>
                {editingDiscussionId === discussion.id ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-700">
                    {discussion.content.length > 200
                      ? `${discussion.content.substring(0, 200)}...`
                      : discussion.content}
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div onClick={(e) => handleAvatarClick(discussion.user?.id || 'Anonymous', e)}>
                    <UserAvatar username={discussion.user?.username || 'Anonymous'} size="sm" />
                  </div>
                  <span className="text-sm text-gray-600">
                    {discussion.user?.username || 'Anonymous'}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  {editingDiscussionId === discussion.id ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => submitEdit(discussion.id)}
                        className="bg-transparent border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md transition duration-200"
                      >
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelEditing}
                        className="bg-transparent border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md transition duration-200"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                        <Link href={`/discussion?project_name=${projectName}&id=${discussion.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                            className="bg-transparent border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md transition duration-200"
                        >
                          View Details
                        </Button>
                      </Link>
                      {/* 如果当前用户是帖子作者，显示编辑/删除按钮 */}
                      {authUser && authUser.id === discussion.user?.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(discussion)}
                              className="bg-transparent border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md transition duration-200"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDiscussion(discussion)}
                              className="bg-transparent border-gray-300 text-red-500 hover:bg-red-50 rounded-md transition duration-200"
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>

              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* 分页 */}
      {totalPages > 0 && (
        <div className="pagination flex justify-center items-center space-x-4 mt-6">
          <Button
            onClick={() => setCurrentPage((prev: number) => prev - 1)}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
            className="flex items-center space-x-1"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            <span>Previous</span>
          </Button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of  {totalPages} 
          </span>
          <Button
            onClick={() => setCurrentPage((prev: number) => prev + 1)}
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

      {/* 用户信息弹出框 */}
      {showUserInfoFor && hoveredUserInfo && (
        <div
          ref={popupRef}
          className="absolute z-50 p-4 bg-white border border-gray-300 rounded shadow-md"
          style={{
            top: popupPosition.y,
            left: popupPosition.x,
            transform: 'translate(-50%, 10px)',
          }}
        >
          <h3 className="font-semibold mb-2">{hoveredUserInfo.username}</h3>
          {hoveredUserInfo.email && <p className="text-sm text-gray-600">Email: {hoveredUserInfo.email}</p>}
          {hoveredUserInfo.bio && <p className="text-sm text-gray-600">Bio: {hoveredUserInfo.bio}</p>}
        </div>
      )}
    </div>
  );
};

export default CommunityForumPage;