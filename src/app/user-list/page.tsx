"use client";

import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation"; // 导入 useRouter

const UserList: React.FC = () => {
  const { user } = useAuth(); // 从上下文中获取当前用户信息
  const router = useRouter(); // 获取路由对象
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user-list?start_id=0&length=10&username=${search}`, {
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

  // 删除用户
  const deleteUser = async (userId: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/remove-user?user_id=${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${localStorage.getItem("authToken")}`,
        },
      });

      if (response.ok) {
        alert("User deleted successfully");
        fetchUsers(); // 刷新用户列表
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete user.");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Failed to delete user.");
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

      {/* 添加用户按钮 */}
      <div className="mb-4">
        <Button onClick={() => router.push("/add-user")}>Add User</Button>
      </div>

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
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.profile?.role || "N/A"}</TableCell>
                <TableCell>
                  <Button onClick={() => deleteUser(user.id)} color="red">
                    Delete
                  </Button>
                </TableCell>
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
