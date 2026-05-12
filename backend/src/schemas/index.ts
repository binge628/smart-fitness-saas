import { z } from 'zod';

// 用户注册校验
export const registerSchema = z.object({
  username: z.string()
    .min(3, '用户名至少3个字符')
    .max(20, '用户名最多20个字符')
    .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, '用户名只能包含字母、数字、下划线和中文'),
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6个字符'),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确').optional(),
});

// 用户登录校验
export const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

// 更新用户信息校验
export const updateUserSchema = z.object({
  username: z.string()
    .min(3, '用户名至少3个字符')
    .max(20, '用户名最多20个字符')
    .optional(),
  email: z.string().email('邮箱格式不正确').optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确').optional(),
  avatar: z.string().max(100000, '头像数据过大').optional(),
});

// 修改密码校验
export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, '旧密码不能为空'),
  newPassword: z.string().min(6, '新密码至少6个字符'),
});

// 健身计划创建校验
export const createPlanSchema = z.object({
  name: z.string().min(1, '计划名称不能为空').max(100, '计划名称最多100个字符'),
  description: z.string().max(1000, '描述最多1000个字符').optional(),
  duration_weeks: z.number().int('持续周数必须是整数').min(1, '持续周数至少1周').max(52, '持续周数最多52周'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced'], {
    message: '难度等级必须是 beginner、intermediate 或 advanced',
  }),
  target_goal: z.string().max(100, '目标最多100个字符').optional(),
  is_template: z.boolean().optional(),
  gym_id: z.string().uuid('健身房ID格式不正确').optional().nullable(),
});

// 健身计划更新校验
export const updatePlanSchema = z.object({
  name: z.string().min(1, '计划名称不能为空').max(100, '计划名称最多100个字符').optional(),
  description: z.string().max(1000, '描述最多1000个字符').optional(),
  duration_weeks: z.number().int('持续周数必须是整数').min(1, '持续周数至少1周').max(52, '持续周数最多52周').optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced'], {
    message: '难度等级必须是 beginner、intermediate 或 advanced',
  }).optional(),
  target_goal: z.string().max(100, '目标最多100个字符').optional(),
  is_template: z.boolean().optional(),
  status: z.enum(['active', 'inactive'], {
    message: '状态必须是 active 或 inactive',
  }).optional(),
});

// 训练组数校验
export const workoutSetSchema = z.object({
  exercise_id: z.string().uuid('动作ID格式不正确'),
  set_order: z.number().int('组序号必须是整数').min(1, '组序号从1开始'),
  weight: z.number().min(0, '重量不能为负数').optional().nullable(),
  reps: z.number().int('次数必须是整数').min(1, '次数至少1次').optional().nullable(),
  rest_seconds: z.number().int('休息时间必须是整数').min(0, '休息时间不能为负数').optional().nullable(),
  notes: z.string().max(200, '备注最多200个字符').optional(),
});

// 训练日志创建校验
export const createWorkoutSchema = z.object({
  plan_id: z.string().uuid('计划ID格式不正确').optional().nullable(),
  workout_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式不正确，应为 YYYY-MM-DD'),
  duration_minutes: z.number().int('训练时长必须是整数').min(1, '训练时长至少1分钟').max(600, '训练时长最多600分钟'),
  calories_burned: z.number().int('消耗热量必须是整数').min(0, '消耗热量不能为负数').optional().nullable(),
  notes: z.string().max(500, '备注最多500个字符').optional().nullable(),
  sets: z.array(workoutSetSchema).optional(),
});

// 训练日志更新校验
export const updateWorkoutSchema = z.object({
  plan_id: z.string().uuid('计划ID格式不正确').optional().nullable(),
  workout_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式不正确，应为 YYYY-MM-DD').optional(),
  duration_minutes: z.number().int('训练时长必须是整数').min(1, '训练时长至少1分钟').max(600, '训练时长最多600分钟').optional(),
  calories_burned: z.number().int('消耗热量必须是整数').min(0, '消耗热量不能为负数').optional().nullable(),
  notes: z.string().max(500, '备注最多500个字符').optional().nullable(),
  sets: z.array(workoutSetSchema).optional(),
});

// 健康数据创建校验
export const createHealthDataSchema = z.object({
  record_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式不正确，应为 YYYY-MM-DD'),
  weight: z.number().min(20, '体重不能小于20kg').max(300, '体重不能超过300kg').optional(),
  height: z.number().min(50, '身高不能小于50cm').max(250, '身高不能超过250cm').optional(),
  body_fat_percentage: z.number().min(0, '体脂率不能为负数').max(100, '体脂率不能超过100%').optional(),
  muscle_mass: z.number().min(0, '肌肉量不能为负数').optional(),
  heart_rate_resting: z.number().int('心率必须是整数').min(30, '静息心率不能小于30').max(200, '静息心率不能超过200').optional(),
  blood_pressure_systolic: z.number().int('收缩压必须是整数').min(60, '收缩压不能小于60').max(250, '收缩压不能超过250').optional(),
  blood_pressure_diastolic: z.number().int('舒张压必须是整数').min(40, '舒张压不能小于40').max(150, '舒张压不能超过150').optional(),
});

// 健康数据更新校验
export const updateHealthDataSchema = createHealthDataSchema.partial();

// 健身房创建校验
export const createGymSchema = z.object({
  name: z.string().min(1, '健身房名称不能为空').max(100, '健身房名称最多100个字符'),
  description: z.string().max(1000, '描述最多1000个字符').optional(),
  address: z.string().max(200, '地址最多200个字符').optional(),
  phone: z.string().max(20, '电话最多20个字符').optional(),
});

// 健身房更新校验
export const updateGymSchema = z.object({
  name: z.string().min(1, '健身房名称不能为空').max(100, '健身房名称最多100个字符').optional(),
  description: z.string().max(1000, '描述最多1000个字符').optional(),
  address: z.string().max(200, '地址最多200个字符').optional(),
  phone: z.string().max(20, '电话最多20个字符').optional(),
  status: z.enum(['active', 'inactive'], {
    message: '状态必须是 active 或 inactive',
  }).optional(),
});

// 添加会员校验
export const addMemberSchema = z.object({
  user_id: z.string().uuid('用户ID格式不正确'),
  membership_type: z.enum(['basic', 'premium', 'vip'], {
    message: '会员类型必须是 basic、premium 或 vip',
  }),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式不正确，应为 YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式不正确，应为 YYYY-MM-DD').optional(),
});

// 更新会员校验
export const updateMemberSchema = z.object({
  membership_type: z.enum(['basic', 'premium', 'vip'], {
    message: '会员类型必须是 basic、premium 或 vip',
  }).optional(),
  membership_status: z.enum(['active', 'expired', 'suspended'], {
    message: '会员状态必须是 active、expired 或 suspended',
  }).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式不正确，应为 YYYY-MM-DD').optional(),
});

// 动作创建校验
export const createExerciseSchema = z.object({
  name: z.string().min(1, '动作名称不能为空').max(100, '动作名称最多100个字符'),
  muscle_group: z.enum(['chest', 'back', 'shoulder', 'leg', 'arm', 'core', 'full_body', 'cardio'], {
    message: '肌群必须是 chest/back/shoulder/leg/arm/core/full_body/cardio',
  }),
  category: z.enum(['compound', 'isolation', 'cardio'], {
    message: '类别必须是 compound/isolation/cardio',
  }),
  description: z.string().max(500, '描述最多500个字符').optional(),
});

// 分页查询参数校验
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// UUID 参数校验
export const uuidParamSchema = z.object({
  id: z.string().uuid('ID格式不正确'),
});

// 订阅创建校验
export const subscribeSchema = z.object({
  plan_type: z.enum(['monthly', 'yearly'], {
    message: '套餐类型必须是 monthly 或 yearly',
  }),
  payment_method: z.string().max(50, '支付方式最多50个字符').optional(),
});

// 订阅取消校验
export const cancelSubscriptionSchema = z.object({});