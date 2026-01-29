/**
 * 邮箱账号管理 API
 */

import apiClient, { handleApiResponse } from './client.js';

/**
 * 添加邮箱账号记录
 * @description 创建新的邮箱账号记录。支持两种使用场景：
 *
 * **场景1：先创建注册信息记录**
 * - 提供注册信息（reg_name、reg_id_card、reg_backup_email、reg_phone）
 * - 不提供 username 和 password
 * - 注册成功后使用 updateEmailAccount 接口补充 username 和 password
 *
 * **场景2：直接创建完整账号**
 * - 如果已有账号密码，可以直接创建完整记录
 * - 提供 username、password 以及可选的注册信息
 *
 * **功能特性**：
 * 1. 所有字段都是可选的，但至少需要提供一项信息
 * 2. 如果提供了 username，会自动检查是否重复
 * 3. 自动设置创建时间
 * 4. 默认 is_sold 为 false
 *
 * @param {Object} accountData - 邮箱账号数据
 * @param {string} [accountData.username] - 邮箱用户名（完整邮箱地址），注册成功后更新
 * @param {string} [accountData.password] - 邮箱账号密码（明文存储），注册成功后更新
 * @param {string} [accountData.reg_name] - 注册时使用的姓名
 * @param {string} [accountData.reg_id_card] - 注册时使用的身份证号码
 * @param {string} [accountData.reg_backup_email] - 注册时使用的备用邮箱地址
 * @param {string} [accountData.reg_phone] - 注册时使用的手机号码
 * @param {string} [accountData.notes] - 备注信息
 * @param {boolean} [accountData.is_sold=false] - 是否已出售（可选，默认false）
 * @returns {Promise<{success: boolean, data?: {_id: string, username?: string, reg_name?: string, reg_backup_email?: string, create_date: number}, error?: string}>}
 * @example
 * // 场景1：先创建注册信息记录
 * const result = await addEmailAccount({
 *   reg_name: '张三',
 *   reg_id_card: '110101199001011234',
 *   reg_backup_email: 'backup@example.com',
 *   reg_phone: '13800138000',
 *   notes: '待注册'
 * });
 * if (result.success) {
 *   console.log('注册信息记录已创建，ID:', result.data._id);
 *   // 注册成功后调用 updateEmailAccount 更新 username 和 password
 * }
 *
 * @example
 * // 场景2：直接创建完整账号
 * const result = await addEmailAccount({
 *   username: 'test@kmmu.edu.cn',
 *   password: 'password123',
 *   reg_name: '李四',
 *   reg_id_card: '110101199002021234',
 *   reg_backup_email: 'backup2@example.com',
 *   reg_phone: '13900139000',
 *   notes: '已注册'
 * });
 */
export async function addEmailAccount(accountData) {
	const {
		username,
		password,
		reg_name,
		reg_id_card,
		reg_backup_email,
		reg_phone,
		notes,
		is_sold = false,
	} = accountData;

	// 验证至少提供一项信息
	if (
		!username &&
		!password &&
		!reg_name &&
		!reg_id_card &&
		!reg_backup_email &&
		!reg_phone &&
		!notes
	) {
		return {
			success: false,
			error: '至少需要提供一项信息',
		};
	}

	// 构建请求数据（只包含非 undefined 的字段）
	const requestData = {};

	if (username !== undefined) requestData.username = username;
	if (password !== undefined) requestData.password = password;
	if (reg_name !== undefined) requestData.reg_name = reg_name;
	if (reg_id_card !== undefined) requestData.reg_id_card = reg_id_card;
	if (reg_backup_email !== undefined) requestData.reg_backup_email = reg_backup_email;
	if (reg_phone !== undefined) requestData.reg_phone = reg_phone;
	if (notes !== undefined) requestData.notes = notes;
	if (is_sold !== undefined) requestData.is_sold = is_sold;

	return handleApiResponse(apiClient.post('/emailAccountAdmin/addEmailAccount', requestData));
}

/**
 * 更新邮箱账号信息
 * @description 更新指定邮箱账号的信息，支持部分字段更新。
 *
 * **查找方式（三选一）**：
 * 1. **_id** - 记录ID（优先级最高）
 * 2. **username** - 邮箱用户名（优先级第二）
 * 3. **reg_backup_email** - 注册备用邮箱（优先级第三）
 *
 * **功能特性**：
 * 1. 支持更新任意字段（除 _id 和 create_date 外）
 * 2. 自动更新 update_date 时间戳
 * 3. 常用场景：注册成功后更新 username、password 和 registration_date
 * 4. 返回更新的字段列表
 *
 * @param {Object} params - 请求参数
 * @param {string} [params._id] - 邮箱账号记录ID（与username、reg_backup_email三选一）
 * @param {string} [params.username] - 邮箱用户名（与_id、reg_backup_email三选一）
 * @param {string} [params.reg_backup_email] - 注册备用邮箱（与_id、username三选一）
 * @param {Object} params.updateData - 要更新的数据（不能包含_id和create_date字段）
 * @param {string} [params.updateData.username] - 邮箱用户名
 * @param {string} [params.updateData.password] - 邮箱密码
 * @param {number} [params.updateData.registration_date] - 邮箱账号注册成功的时间戳
 * @param {string} [params.updateData.reg_name] - 注册姓名
 * @param {string} [params.updateData.reg_id_card] - 注册身份证
 * @param {string} [params.updateData.reg_backup_email] - 注册备用邮箱
 * @param {string} [params.updateData.reg_phone] - 注册手机号
 * @param {boolean} [params.updateData.is_sold] - 是否已出售
 * @param {number} [params.updateData.sell_date] - 出售时间戳
 * @param {string} [params.updateData.notes] - 备注信息
 * @returns {Promise<{success: boolean, data?: {updated: number, updatedFields: string[]}, error?: string}>}
 * @example
 * // 通过 _id 更新（注册成功后更新 username 和 password）
 * const result = await updateEmailAccount({
 *   _id: '507f1f77bcf86cd799439011',
 *   updateData: {
 *     username: 'success@kmmu.edu.cn',
 *     password: 'newpassword123',
 *     registration_date: Date.now()
 *   }
 * });
 * if (result.success) {
 *   console.log('更新的字段:', result.data.updatedFields);
 * }
 *
 * @example
 * // 通过备用邮箱查找并更新
 * const result = await updateEmailAccount({
 *   reg_backup_email: 'backup@example.com',
 *   updateData: {
 *     username: 'registered@kmmu.edu.cn',
 *     password: 'password123',
 *     registration_date: Date.now(),
 *     notes: '注册成功'
 *   }
 * });
 *
 * @example
 * // 标记为已出售
 * const result = await updateEmailAccount({
 *   username: 'test@kmmu.edu.cn',
 *   updateData: {
 *     is_sold: true,
 *     sell_date: Date.now(),
 *     notes: '已出售给客户A'
 *   }
 * });
 */
export async function updateEmailAccount(params) {
	const { _id, username, reg_backup_email, updateData } = params;

	// 验证至少提供一个查找条件
	if (!_id && !username && !reg_backup_email) {
		return {
			success: false,
			error: '必须提供 _id、username 或 reg_backup_email 其中之一作为查找条件',
		};
	}

	// 验证 updateData 必须存在且不为空
	if (!updateData || Object.keys(updateData).length === 0) {
		return {
			success: false,
			error: '更新数据不能为空',
		};
	}

	// 移除不允许更新的字段
	const filteredData = { ...updateData };
	delete filteredData._id;
	delete filteredData.create_date;

	// 构建请求数据
	const requestData = {
		updateData: filteredData,
	};

	if (_id) requestData._id = _id;
	if (username) requestData.username = username;
	if (reg_backup_email) requestData.reg_backup_email = reg_backup_email;

	return handleApiResponse(apiClient.post('/emailAccountAdmin/updateEmailAccount', requestData));
}

export default {
	addEmailAccount,
	updateEmailAccount,
};
