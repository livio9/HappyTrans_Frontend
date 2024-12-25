// src/app/settings/page.tsx

'use client';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/context/ThemeContext';
import { User } from 'lucide-react'; // 导入图标组件
import { useRouter } from 'next/navigation'; // 使用 Next.js 路由
import { useAuth } from '@/context/AuthContext';

// 定义完整的语言选项
const languageOptions = [
    { code: 'en', name: 'English' },
    { code: 'zh-hans', name: '简体中文' },
    { code: 'zh-hant', name: '繁體中文' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'ru', name: 'Русский' },
    { code: 'ar', name: 'العربية' },
    { code: 'pt', name: 'Português' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'pl', name: 'Polski' },
    { code: 'nl', name: 'Nederlands' },
    { code: 'sv', name: 'Svenska' },
    { code: 'no', name: 'Norsk' },
    { code: 'da', name: 'Dansk' },
];

const SettingsPage: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    // 个人资料设置状态
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');

    // 语言设置状态（改为数组存储）
    const [primaryLanguage, setPrimaryLanguage] = useState<string>('');
    const [secondaryLanguages, setSecondaryLanguages] = useState<string[]>([]);

    // 编辑时的临时语言状态
    const [editPrimaryLanguage, setEditPrimaryLanguage] = useState<string>('');
    const [editSecondaryLanguages, setEditSecondaryLanguages] = useState<string[]>([]);

    // 控制语言编辑模式
    const [isEditingLanguages, setIsEditingLanguages] = useState<boolean>(false);

    // 状态消息
    const [languageError, setLanguageError] = useState<string>('');
    const [isLanguageSaving, setIsLanguageSaving] = useState<boolean>(false);
    const [languageSuccessMessage, setLanguageSuccessMessage] = useState<string>('');

    // 通用错误消息状态
    const [errorMessage, setErrorMessage] = useState<string>('');

    const router = useRouter();
    const { token } = useAuth();

    // 获取用户资料（个人资料和通知设置）
    useEffect(() => {
        const fetchProfile = async () => {

            try {
                // 获取个人资料和通知设置
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/profile`, {
                    method: 'GET',
                    credentials: 'include', // 包含Cookies
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Token ${token}`, // 使用Token进行认证
                    },
                });

                if (!res.ok) {
                    const contentType = res.headers.get('Content-Type');
                    if (contentType && contentType.includes('application/json')) {
                        const errorData = await res.json();
                        throw new Error(errorData.error || '未知错误');
                    } else {
                        const text = await res.text();
                        throw new Error(`意外的响应格式: ${text}`);
                    }
                }

                const data = await res.json();

                // 设置用户资料
                setUsername(localStorage.getItem('username') || '');
                setEmail(data.email || '');

                // 设置语言设置
                setPrimaryLanguage(data.native_language || '');
                setSecondaryLanguages(data.preferred_languages || []);

                // 初始化编辑状态数据
                setEditPrimaryLanguage(data.native_language || '');
                setEditSecondaryLanguages(data.preferred_languages || []);

                setErrorMessage('');
            } catch (err: any) {
                console.error('Error fetching profile:', err);
                setErrorMessage(err.message || '获取用户资料时出错');
            }
        };

        fetchProfile();
    }, []);

    // 进入编辑语言模式
    const handleEditLanguages = () => {
        setIsEditingLanguages(true);
        setLanguageError('');
        setLanguageSuccessMessage('');
        // 将当前设置同步到编辑状态
        setEditPrimaryLanguage(primaryLanguage);
        setEditSecondaryLanguages([...secondaryLanguages]);
    };

    // 取消编辑语言
    const handleCancelLanguages = () => {
        setIsEditingLanguages(false);
        setLanguageError('');
        setLanguageSuccessMessage('');
        // 恢复到未编辑前状态
        setEditPrimaryLanguage(primaryLanguage);
        setEditSecondaryLanguages([...secondaryLanguages]);
    };

    // 保存语言设置
    const handleSaveLanguages = async () => {
        if (isLanguageSaving) return; // 防止重复提交

        setIsLanguageSaving(true);
        setLanguageError('');
        setLanguageSuccessMessage('');

        

        // 前端验证
        const validLanguageCodes = languageOptions.map((lang) =>
            lang.code.toLowerCase()
        );
        const primaryLangValid = validLanguageCodes.includes(
            editPrimaryLanguage.toLowerCase()
        );
        const secondaryLangsValid = editSecondaryLanguages.every((lang) =>
            validLanguageCodes.includes(lang.toLowerCase())
        );

        if (!primaryLangValid || !secondaryLangsValid) {
            setLanguageError('请输入规范的语言选项。');
            setIsLanguageSaving(false);
            return;
        }

        const updatedData = {
            native_language: editPrimaryLanguage.toLowerCase(),
            preferred_languages: editSecondaryLanguages.map((lang) =>
                lang.toLowerCase()
            ),
        };

        try {
            // 发送请求保存修改后的语言设置
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/profile`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Token ${token}`,
                },
                body: JSON.stringify(updatedData),
            });

            if (!res.ok) {
                const contentType = res.headers.get('Content-Type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || '未知错误');
                } else {
                    const text = await res.text();
                    throw new Error(`意外的响应格式: ${text}`);
                }
            }

            // 假设响应包含更新后的数据
            const data = await res.json();

            // 更新状态
            setPrimaryLanguage(data.native_language || '');
            setSecondaryLanguages(data.preferred_languages || []);
            setLanguageSuccessMessage('语言设置已保存');
            setIsEditingLanguages(false);
            setIsLanguageSaving(false);
        } catch (err: any) {
            console.error('Error saving languages:', err);
            setLanguageError('保存失败: ' + (err.message || '未知错误'));
            setIsLanguageSaving(false);
        }
    };

    return (
        <div className="mx-auto p-4">
            {/* 显示全局错误消息 */}
            {errorMessage && (
                <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                    {errorMessage}
                </div>
            )}

            {/* 个人资料设置部分 */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Profile Settings</CardTitle>
                            <CardDescription>
                                Manage your account information
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/user-profile')}
                            className="flex items-center space-x-2"
                        >
                            <User className="h-4 w-4" />{' '}
                            {/* 假设你使用 lucide-react 图标 */}
                            <span>Go To Profile</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* 用户名显示 */}
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            value={username}
                            readOnly
                            placeholder="Username (Cannot be changed)"
                        />
                    </div>
                    {/* 邮箱显示 */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            readOnly
                            placeholder="Email (Cannot be changed)"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 主题设置部分 */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Theme Settings</CardTitle>
                    <CardDescription>
                        Choose your preferred theme
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="theme-toggle">Dark Mode</Label>
                        <Switch
                            id="theme-toggle"
                            checked={theme === 'dark'}
                            onCheckedChange={toggleTheme}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 语言设置部分 */}
            <Card>
                <CardHeader>
                    <CardTitle>Language Settings</CardTitle>
                    <CardDescription>
                        Set your native and preferred languages
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isEditingLanguages ? (
                        <>
                            {/* 编辑状态 */}
                            <div className="space-y-2">
                                <Label htmlFor="native-language">
                                    Native Language
                                </Label>
                                <select
                                    id="native-language"
                                    value={editPrimaryLanguage}
                                    onChange={(e) =>
                                        setEditPrimaryLanguage(e.target.value)
                                    }
                                    className="w-full p-2 border rounded"
                                >
                                    {languageOptions.map((lang) => (
                                        <option
                                            key={lang.code}
                                            value={lang.code}
                                        >
                                            {lang.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label>Preferred Languages</Label>
                                <div className="flex flex-col gap-2">
                                    {languageOptions.map((lang) => (
                                        <label
                                            key={lang.code}
                                            className="flex items-center space-x-2"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={editSecondaryLanguages.includes(
                                                    lang.code
                                                )}
                                                onChange={(e) => {
                                                    const isChecked =
                                                        e.target.checked;
                                                    setEditSecondaryLanguages(
                                                        (prev) =>
                                                            isChecked
                                                                ? [
                                                                      ...prev,
                                                                      lang.code,
                                                                  ]
                                                                : prev.filter(
                                                                      (code) =>
                                                                          code !==
                                                                          lang.code
                                                                  )
                                                    );
                                                }}
                                            />
                                            <span>{lang.name}</span>
                                        </label>
                                    ))}
                                </div>
                                {languageError && (
                                    <p className="text-red-500 text-sm">
                                        {languageError}
                                    </p>
                                )}
                                {languageSuccessMessage && (
                                    <p className="text-green-500 text-sm">
                                        {languageSuccessMessage}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    variant="secondary"
                                    onClick={handleCancelLanguages}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveLanguages}
                                    disabled={isLanguageSaving}
                                >
                                    {isLanguageSaving
                                        ? 'Saving...'
                                        : 'Save Languages'}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* 非编辑状态 */}
                            <div className="space-y-2">
                                <Label>Native Language</Label>
                                <p className="text-sm text-muted-foreground">
                                    {languageOptions.find(
                                        (lang) => lang.code === primaryLanguage
                                    )?.name || primaryLanguage}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Preferred Languages</Label>
                                <p className="text-sm text-muted-foreground">
                                    {secondaryLanguages &&
                                    secondaryLanguages.length > 0
                                        ? secondaryLanguages
                                              .map((code) => {
                                                  const lang =
                                                      languageOptions.find(
                                                          (l) => l.code === code
                                                      );
                                                  return lang
                                                      ? lang.name
                                                      : code;
                                              })
                                              .join(', ')
                                        : 'None'}
                                </p>
                            </div>

                            <Button onClick={handleEditLanguages}>
                                Edit Languages
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );

};

export default SettingsPage;
