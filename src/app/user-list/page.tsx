"use client";

import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

const UserList: React.FC = () => {
  const { user } = useAuth(); // 从上下文中获取当前用户信息
  const [users, setUsers] = useState([]); // 保存用户列表数据
  const [searchTerm, setSearchTerm] = useState(""); // 搜索关键字
  const [loading, setLoading] = useState(true); // 加载状态
  const [error, setError] = useState(""); // 错误信息

  // 确保只有管理员可以访问该页面
  useEffect(() => {
    if (user?.role !== "admin") {
      window.location.href = "/dashboard"; // 非管理员重定向到仪表板
    }
  }, [user]);

  // 获取用户列表
  const fetchUsers = async (search = "") => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`http://127.0.0.1:8000/user-list?start_id=0&length=10&username=${search}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${localStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data.results || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时获取默认用户列表
  useEffect(() => {
    fetchUsers();
  }, []);

  if (!user || user.role !== "admin") {
    return null; // 如果当前用户不是管理员，则不渲染任何内容
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">User Management</h2>

      {/* 搜索框 */}
      <div className="mb-4 flex space-x-2">
        <Input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button onClick={() => fetchUsers(searchTerm)}>Search</Button>
      </div>

      {/* 错误提示 */}
      {error && <p className="text-red-500">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.profile?.role || "N/A"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default function UserListPage() {
  return <UserList />;
}
