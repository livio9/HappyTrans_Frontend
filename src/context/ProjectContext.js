"use client";

import { createContext, useState, useContext } from "react";
import { useAuth } from "./AuthContext";

// 创建 ProjectContext
const ProjectContext = createContext();

/**
 * ProjectProvider 组件
 * 提供项目管理上下文，包括当前项目信息、加载状态、错误信息及相关操作函数
 */
export const ProjectProvider = ({ children }) => {
  const [project, setProject] = useState(null); // 当前项目的信息
  const [loading, setLoading] = useState(false); // 加载状态
  const [error, setError] = useState(null); // 错误信息
  const { token } = useAuth();

  // 直接设置当前项目的信息
  const setCurrentProject = (projectData) => {
    setProject(projectData);
    setLoading(false); // 如果需要，可以设置为已加载状态
    setError(null); // 清空错误信息
  };

  // 获取特定项目的信息（通过 API 请求）
  const fetchProjectInfo = async (projectName) => {
    setLoading(true); // 设置加载状态
    setError(null); // 清空错误信息
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/project-info?project_name=${projectName}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });

      if (response.ok) {
        
        const projectData = await response.json();
        console.log("Project info fetched in ProjectContext:", projectData);
        setProject(projectData); // 设置项目信息
        return projectData; // 返回项目信息
      } else if (response.status === 404) {
        setError("Project not found");
        return null;
      } else {
        setError("Failed to fetch project information");
        return null;
      }
    } catch (error) {
      setError("Error fetching project info: " + error.message);
      return null;
    } finally {
      setLoading(false); // 结束加载状态
    }
  };

  // 获取项目名称
  const getProjectName = () => {
    return project?.name || null; // 假设项目对象中的 `name` 字段存储了项目名称
  };

  // 清空项目信息（可用于切换项目时）
  const clearProject = () => {
    setProject(null);
    setLoading(false);
    setError(null);
  };

  return (
    <ProjectContext.Provider value={{ project, loading, error, setProject, setCurrentProject, fetchProjectInfo, clearProject, getProjectName  }}>
      {children}
    </ProjectContext.Provider>
  );
};

// 自定义钩子，方便使用 ProjectContext
export const useProject = () => useContext(ProjectContext);
