/**
 * API 客户端基础配置
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 创建 axios 实例
 */
const apiClient = axios.create({
	baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
	timeout: 60000, // 增加到60秒，适应GitHub Actions网络环境
	headers: {
		'Content-Type': 'application/json',
	},
});

/**
 * 请求拦截器
 */
apiClient.interceptors.request.use(
	(config) => {
		console.log(`[API请求] ${config.method.toUpperCase()} ${config.url}`);
		// 为每个请求设置重试次数
		config.retryCount = config.retryCount || 0;
		config.maxRetries = config.maxRetries || 2; // 默认最多重试2次
		config.retryDelay = config.retryDelay || 1000; // 默认重试延迟1秒
		return config;
	},
	(error) => {
		console.error('[API请求错误]', error);
		return Promise.reject(error);
	}
);

/**
 * 响应拦截器（带自动重试机制）
 */
apiClient.interceptors.response.use(
	(response) => {
		console.log(`[API响应] ${response.config.url} - 状态: ${response.status}`);
		return response;
	},
	async (error) => {
		const config = error.config;

		// 记录详细错误信息
		if (error.response) {
			// 服务器返回了错误响应
			console.error(
				`[API错误] ${error.response.status} - ${error.response.data?.errMsg || error.message}`
			);
		} else if (error.request) {
			// 请求发出但没有收到响应
			console.error(
				`[API错误] 没有收到响应 - ${error.message} (code: ${error.code || 'N/A'}, url: ${config?.url || 'N/A'})`
			);
		} else {
			console.error('[API错误]', error.message);
		}

		// 判断是否应该重试
		const shouldRetry =
			config &&
			config.retryCount < config.maxRetries &&
			(error.code === 'ECONNABORTED' || // 超时
				error.code === 'ETIMEDOUT' || // 超时
				error.code === 'ECONNRESET' || // 连接重置
				error.code === 'ENOTFOUND' || // DNS解析失败
				error.code === 'EAI_AGAIN' || // DNS临时失败
				error.code === 'ENETUNREACH' || // 网络不可达
				!error.response); // 没有收到响应

		if (shouldRetry) {
			config.retryCount += 1;
			console.log(
				`[API重试] 第 ${config.retryCount}/${config.maxRetries} 次重试 (${error.code || error.message})，${config.retryDelay}ms 后重试...`
			);

			// 延迟后重试
			await new Promise((resolve) => setTimeout(resolve, config.retryDelay));

			// 重新发起请求
			return apiClient(config);
		}

		return Promise.reject(error);
	}
);

/**
 * 通用 API 响应处理
 * @param {Promise} apiPromise - API 请求 Promise
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function handleApiResponse(apiPromise) {
	try {
		const response = await apiPromise;
		const data = response.data;

		// 判断响应是否成功
		if (data.errCode === 0) {
			return {
				success: true,
				data: data.data,
			};
		} else {
			return {
				success: false,
				error: data.errMsg || '未知错误',
			};
		}
	} catch (error) {
		return {
			success: false,
			error: error.response?.data?.errMsg || error.message || '未知错误',
		};
	}
}

export default apiClient;
