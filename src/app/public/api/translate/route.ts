// src/app/api/translate/route.ts
'use strict';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Redis } from 'ioredis';
import { headers } from 'next/headers';

// 初始化 Redis 客户端（确保在无服务器环境中复用连接）
let redis: Redis | null = null;

if (!redis) {
    redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
    });

    redis.on('error', (err) => {
        console.error('Redis 连接错误:', err);
    });
}

// 速率限制相关常量
const RATE_LIMIT_MAX = 5; // 每小时最大请求次数
const RATE_LIMIT_WINDOW = 3600; // 时间窗口(秒)
  // 添加检查速率限制的函数
  async function checkRateLimit(ip: string): Promise<boolean> {
    const key = `ratelimit:${ip}`;
    try {
        const count = await redis!.incr(key);
        console.log(`IP: ${ip}, Key: ${key}, Count: ${count}`);

        if (count === 1) {
            await redis!.expire(key, RATE_LIMIT_WINDOW);
            console.log(`设置键 ${key} 的过期时间为 ${RATE_LIMIT_WINDOW} 秒`);
        }

        return count <= RATE_LIMIT_MAX;
    } catch (error) {
        console.error('检查速率限制时出错:', error);
        // 根据需求选择允许或拒绝请求
        return false; // 拒绝请求
    }
}

type TranslationSuggestion = {
    source: string;
    translation: string;
};

const languageCodeMapForBaiDu: { [key: string]: string } = {
    en: 'en',
    'zh-hans': 'zh',
    'zh-hant': 'zh',
    es: 'es',
    fr: 'fr',
    de: 'de',
    it: 'it',
    ja: 'jp',
    ko: 'ko',
    ru: 'ru',
    ar: 'ar',
    pt: 'pt',
    hi: 'hi',
    tr: 'tr',
    pl: 'pl',
    nl: 'nl',
    sv: 'sv',
    no: 'no',
    da: 'da',
};

function getBaiduTargetLanguage(languageCode: string): string | undefined {
    return languageCodeMapForBaiDu[languageCode];
}

const languageCodeMapForYouDao: { [key: string]: string } = {
    en: 'en',
    'zh-hans': 'zh-CHS',
    'zh-hant': 'zh-CHT',
    es: 'es',
    fr: 'fr',
    de: 'de',
    it: 'it',
    ja: 'ja',
    ko: 'ko',
    ru: 'ru',
    ar: 'ar',
    pt: 'pt',
    hi: 'hi',
    tr: 'tr',
    pl: 'pl',
    nl: 'nl',
    sv: 'sv',
    no: 'no',
    da: 'da',
    '': 'EN',
};

function getYoudaoTargetLanguage(languageCode: string): string | undefined {
    return languageCodeMapForYouDao[languageCode];
}

export async function POST(request: Request) {
    console.log('Received POST request to /api/translate');
    // 获取请求的 IP 地址
    const headersList = await headers();
    const xForwardedFor = headersList.get('x-forwarded-for');
    const ip = xForwardedFor ? xForwardedFor.split(',')[0].trim() : 'unknown';
    
    // 检查速率限制
    const allowed = await checkRateLimit(ip);
    if (!allowed) {
        return NextResponse.json(
            { error: '请求太频繁，请稍后再试' },
            { status: 429 }
        );
    }
    try {
        const {
            projectName,
            sourceLanguage,
            idx_in_project,
            text,
            targetLanguage,
        } = await request.json();
        console.log(
            'Received POST request to /api/translate',
            projectName,
            sourceLanguage,
            idx_in_project,
            text,
            targetLanguage
        );
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.startsWith('Token ')
            ? authHeader.split(' ')[1]
            : null;
        if (!text || !targetLanguage) {
            return NextResponse.json(
                { error: '缺少 text 或 targetLanguage 参数' },
                { status: 400 }
            );
        }

        const suggestions: TranslationSuggestion[] = [];

        const baiduTargetLanguage = getBaiduTargetLanguage(targetLanguage);

        if (!baiduTargetLanguage) {
            return NextResponse.json(
                { error: `不支持的目标语言代码: ${targetLanguage}` },
                { status: 400 }
            );
        }

        // 调用百度翻译 API
        const appId = process.env.BAIDU_TRANSLATE_APP_ID;
        const secretKey = process.env.BAIDU_TRANSLATE_SECRET_KEY;

        if (appId && secretKey) {
            try {
                const salt = Math.random().toString(36).substring(2, 15);
                const sign = crypto
                    .createHash('md5')
                    .update(appId + text + salt + secretKey)
                    .digest('hex');

                const baiduResponse = await fetch(
                    'https://fanyi-api.baidu.com/api/trans/vip/translate',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: new URLSearchParams({
                            q: text,
                            from: 'auto',
                            to: baiduTargetLanguage,
                            appid: appId,
                            salt: salt,
                            sign: sign,
                        }),
                    }
                );

                if (baiduResponse.ok) {
                    const baiduData = await baiduResponse.json();
                    if (baiduData.error_code) {
                        console.error(
                            'BaiDu API Error:',
                            baiduData.error_code,
                            baiduData.error_msg
                        );
                    } else {
                        const baiduTranslation = baiduData.trans_result
                            .map((item: any) => item.dst)
                            .join(' ');
                        suggestions.push({
                            source: 'Baidu',
                            translation: baiduTranslation,
                        });
                    }
                } else {
                    const errorText = await baiduResponse.text();
                    console.error('百度翻译 API 网络错误:', errorText);
                }
            } catch (error) {
                console.error('调用百度翻译 API 时出错:', error);
            }
        }

        const youdaoTargetLanguage = getYoudaoTargetLanguage(targetLanguage);

        // 调用 网易有道翻译 API（如果已配置）
        const youdaoAppId = process.env.YOUDAO_APP_ID;
        const youdaoAppKey = process.env.YOUDAO_APP_KEY;
        if (youdaoAppId && youdaoAppKey) {
            try {
                const salt = Math.random().toString(36).substring(2, 15);
                const sign = crypto
                    .createHash('md5')
                    .update(`${youdaoAppId}${text}${salt}${youdaoAppKey}`)
                    .digest('hex');

                const youdaoResponse = await fetch(
                    'https://openapi.youdao.com/api',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: new URLSearchParams({
                            q: text,
                            from: 'auto', // 自动检测
                            to: youdaoTargetLanguage || 'EN',
                            appKey: youdaoAppId,
                            salt: salt,
                            sign: sign,
                        }),
                    }
                );

                if (youdaoResponse.ok) {
                    const youdaoData = await youdaoResponse.json();
                    if (youdaoData.errorCode === '0') {
                        const youdaoTranslation = youdaoData.translation[0];
                        suggestions.push({
                            source: 'YouDao',
                            translation: youdaoTranslation,
                        });
                    } else {
                        console.error(
                            '有道翻译 API Error:',
                            youdaoData.errorCode,
                            youdaoData.errorMsg
                        );
                    }
                } else {
                    const errorText = await youdaoResponse.text();
                    console.error('有道翻译 API 网络错误:', errorText);
                }
            } catch (error) {
                console.error('调用有道翻译 API 时出错:', error);
            }
        }
        suggestions.push({
            source: 'ZhiPu',
            translation: '(You have to sign up for a free account to use the API)',
        });

        if (suggestions.length === 0) {
            return NextResponse.json(
                { error: '未能获取任何翻译建议' },
                { status: 500 }
            );
        }

        return NextResponse.json({ suggestions }, { status: 200 });
    } catch (error) {
        console.error('调用翻译 API 时出错:', error);
        return NextResponse.json({ error: '内部服务器错误' }, { status: 500 });
    }
}
