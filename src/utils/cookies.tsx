// utils/cookies.tsx

// 辅助函数：从 Cookie 中获取指定的值
export function getCookie(name: string): string | null {
    if (typeof document === "undefined") {
        // 在服务器端渲染时，不尝试获取 cookie
        return null;
    }

    const value = `${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(";").shift() || null;
    }
    return null;
}
