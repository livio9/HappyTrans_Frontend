'use client';

import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'; // 你自定义或shadcn/ui的Dialog组件
import AddUserForm from '@/components/AddUserForm';

const UserList: React.FC = () => {
    const { user } = useAuth(); // 从上下文中获取当前用户信息
    const [users, setUsers] = useState([]); // 保存用户列表数据
    const [searchTerm, setSearchTerm] = useState(''); // 搜索关键字
    const [loading, setLoading] = useState(true); // 加载状态
    const [error, setError] = useState(''); // 错误信息
    const [openDialog, setOpenDialog] = useState(false); // 控制对话框开关

    // 确保只有管理员可以访问该页面
    useEffect(() => {
        if (user?.role !== 'admin') {
            window.location.href = '/dashboard'; // 非管理员重定向到仪表板
        }
    }, [user]);

    // 获取用户列表
    const fetchUsers = async (search = '') => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/user-list?start_id=0&length=10&username=${search}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Token ${localStorage.getItem('authToken')}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch users: ${response.status}`);
            }

            const data = await response.json();
            setUsers(data.results || []);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to fetch users.');
        } finally {
            setLoading(false);
        }
    };

    // 删除用户
    const deleteUser = async (userId: number) => {
        if (!window.confirm('Are you sure you want to delete this user?'))
            return;

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/remove-user?user_id=${userId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Token ${localStorage.getItem('authToken')}`,
                    },
                }
            );

            if (response.ok) {
                alert('User deleted successfully');
                fetchUsers(); // 刷新列表
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to delete user.');
            }
        } catch (err) {
            console.error('Error deleting user:', err);
            setError('Failed to delete user.');
        }
    };

    // 页面加载时获取用户列表
    useEffect(() => {
        fetchUsers();
    }, []);

    if (!user || user.role !== 'admin') {
        return null;
    }

    // 添加用户成功后：关闭对话框 & 刷新列表
    const handleAddUserSuccess = () => {
        setOpenDialog(false);
        fetchUsers();
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">User Management</h2>

            {/* “添加用户”按钮：点击打开对话框 */}
            <div className="mb-4">
                <Button onClick={() => setOpenDialog(true)}>Add User</Button>
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
                        {users.map((u: any) => (
                            <TableRow key={u.id}>
                                <TableCell>{u.id}</TableCell>
                                <TableCell>{u.username}</TableCell>
                                <TableCell>{u.email}</TableCell>
                                <TableCell>
                                    {u.profile?.role || 'N/A'}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        onClick={() => deleteUser(u.id)}
                                        color="red"
                                    >
                                        Delete
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {/* Dialog */}
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>
                            Please fill out the form below.
                        </DialogDescription>
                    </DialogHeader>
                    {/* 这里放我们抽离的表单组件 */}
                    <AddUserForm
                        onSuccess={handleAddUserSuccess}
                        onClose={() => setOpenDialog(false)}
                    />
                    <DialogFooter />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default function UserListPage() {
    return <UserList />;
}
