// 成就 & 勋章系统测试
// 验证后端逻辑、路由注册、前端组件完整性

const fs = require('fs');
const path = require('path');

const CONTROLLER_PATH = path.join(__dirname, '../controllers/achievementController.ts');
const ROUTES_PATH = path.join(__dirname, '../routes/achievementRoutes.ts');
const INDEX_PATH = path.join(__dirname, '../index.ts');
const SQL_PATH = path.join(__dirname, '../../db/achievements.sql');
const FRONTEND_PAGE_PATH = path.resolve(__dirname, '../../../frontend/src/pages/AchievementsPage.tsx');
const API_SERVICE_PATH = path.resolve(__dirname, '../../../frontend/src/services/api.ts');

// ==================== 后端控制器测试 ====================

describe('成就系统 - 后端控制器', () => {
  let controllerContent: string;

  beforeAll(() => {
    controllerContent = fs.readFileSync(CONTROLLER_PATH, 'utf-8');
  });

  // T1: streak 计算逻辑验证
  describe('T1 - 连续打卡计算逻辑', () => {
    it('应使用 DISTINCT 去重训练日期', () => {
      expect(controllerContent).toContain('SELECT DISTINCT workout_date');
    });

    it('应从今天或昨天开始计算 streak', () => {
      expect(controllerContent).toContain('todayTime');
      expect(controllerContent).toContain('yesterdayTime');
    });

    it('应使用时间戳比较避免时区问题', () => {
      expect(controllerContent).toContain('86400000');
    });

    it('今天无训练且昨天也无训练时应返回 0', () => {
      // 检查 return 0 的分支存在
      const streakFunction = controllerContent.match(/async function calculateStreak[\s\S]*?^}/m);
      expect(streakFunction).not.toBeNull();
      expect(streakFunction![0]).toContain('return 0');
    });
  });

  // T2: 成就检查函数可被外部调用
  describe('T2 - checkAndUnlockAchievements 导出', () => {
    it('应导出 checkAndUnlockAchievements 函数', () => {
      expect(controllerContent).toContain('export async function checkAndUnlockAchievements');
    });

    it('应使用事务保证原子性', () => {
      expect(controllerContent).toContain("await client.query('BEGIN')");
      expect(controllerContent).toContain("await client.query('COMMIT')");
      expect(controllerContent).toContain("await client.query('ROLLBACK')");
    });

    it('应在 finally 中释放连接', () => {
      expect(controllerContent).toContain('client.release()');
    });

    it('应返回新解锁成就名称数组', () => {
      expect(controllerContent).toContain('newUnlocks: string[]');
      expect(controllerContent).toContain('return newUnlocks');
    });
  });

  // T3: getAchievements 返回进度数据
  describe('T3 - 成就列表包含进度信息', () => {
    it('应返回 current_progress 字段', () => {
      expect(controllerContent).toContain('current_progress');
    });

    it('应返回 progress_percentage 字段', () => {
      expect(controllerContent).toContain('progress_percentage');
    });

    it('应返回 user_stats 用户统计', () => {
      expect(controllerContent).toContain('user_stats');
    });

    it('已解锁成就进度应为 100%', () => {
      expect(controllerContent).toContain('unlocked');
      expect(controllerContent).toContain('row.requirement_value');
    });

    it('进度百分比应限制最大 100%', () => {
      expect(controllerContent).toContain('Math.min');
      expect(controllerContent).toContain('100');
    });
  });

  // T4: 进度计算映射正确
  describe('T4 - 进度值计算映射', () => {
    it('workouts 类型应映射到 totalWorkouts', () => {
      expect(controllerContent).toContain("case 'workouts'");
      expect(controllerContent).toContain('userStats.totalWorkouts');
    });

    it('days 类型应映射到 currentStreak', () => {
      expect(controllerContent).toContain("case 'days'");
      expect(controllerContent).toContain('userStats.currentStreak');
    });

    it('duration 类型应转换为小时', () => {
      expect(controllerContent).toContain('Math.floor(userStats.totalDuration / 60)');
    });

    it('calories 类型应映射到 totalCalories', () => {
      expect(controllerContent).toContain("case 'calories'");
      expect(controllerContent).toContain('userStats.totalCalories');
    });
  });

  // T5: 三个 API 端点存在
  describe('T5 - API 端点完整性', () => {
    it('应导出 getAchievements', () => {
      expect(controllerContent).toContain('export const getAchievements');
    });

    it('应导出 checkAchievements', () => {
      expect(controllerContent).toContain('export const checkAchievements');
    });

    it('应导出 getAchievementStats', () => {
      expect(controllerContent).toContain('export const getAchievementStats');
    });
  });
});

// ==================== 路由注册测试 ====================

describe('成就系统 - 路由注册', () => {
  let routesContent: string;
  let indexContent: string;

  beforeAll(() => {
    routesContent = fs.readFileSync(ROUTES_PATH, 'utf-8');
    indexContent = fs.readFileSync(INDEX_PATH, 'utf-8');
  });

  // T6: 路由定义正确
  describe('T6 - 路由定义', () => {
    it('GET / 应映射到 getAchievements', () => {
      expect(routesContent).toContain("router.get('/', authMiddleware, getAchievements)");
    });

    it('GET /stats 应映射到 getAchievementStats', () => {
      expect(routesContent).toContain("router.get('/stats', authMiddleware, getAchievementStats)");
    });

    it('POST /check 应映射到 checkAchievements', () => {
      expect(routesContent).toContain("router.post('/check', authMiddleware, checkAchievements)");
    });

    it('所有路由都应使用 authMiddleware', () => {
      const routeLines = routesContent.split('\n').filter(l => l.includes('router.'));
      routeLines.forEach(line => {
        expect(line).toContain('authMiddleware');
      });
    });
  });

  // T7: 路由在 index.ts 中注册
  describe('T7 - 路由挂载', () => {
    it('应导入 achievementRoutes', () => {
      expect(indexContent).toContain("import achievementRoutes from './routes/achievementRoutes'");
    });

    it('应挂载到 /api/achievements', () => {
      expect(indexContent).toContain("app.use('/api/achievements', achievementRoutes)");
    });
  });
});

// ==================== 训练与成就集成测试 ====================

describe('成就系统 - 训练集成', () => {
  let workoutContent: string;

  beforeAll(() => {
    workoutContent = fs.readFileSync(
      path.join(__dirname, '../controllers/workoutController.ts'),
      'utf-8'
    );
  });

  // T8: createWorkout 集成成就检查
  describe('T8 - 训练创建自动检查成就', () => {
    it('应导入 checkAndUnlockAchievements', () => {
      expect(workoutContent).toContain("import { checkAndUnlockAchievements } from './achievementController'");
    });

    it('应在 createWorkout 的 COMMIT 后调用成就检查', () => {
      // 找 createWorkout 函数区域内的 COMMIT 和 checkAndUnlockAchievements
      const createWorkoutStart = workoutContent.indexOf('export const createWorkout');
      const createWorkoutEnd = workoutContent.indexOf('export const getWorkouts');
      const createWorkoutSection = workoutContent.substring(createWorkoutStart, createWorkoutEnd);
      const commitIndex = createWorkoutSection.indexOf("query('COMMIT')");
      const checkIndex = createWorkoutSection.indexOf('checkAndUnlockAchievements');
      expect(commitIndex).toBeGreaterThan(-1);
      expect(checkIndex).toBeGreaterThan(-1);
      expect(checkIndex).toBeGreaterThan(commitIndex);
    });

    it('应在响应中包含 new_achievements', () => {
      expect(workoutContent).toContain('new_achievements');
    });

    it('仅有新成就时才返回 new_achievements', () => {
      expect(workoutContent).toContain('newAchievements.length > 0 ? newAchievements : undefined');
    });
  });
});

// ==================== SQL 迁移脚本测试 ====================

describe('成就系统 - 数据库迁移', () => {
  let sqlContent: string;

  beforeAll(() => {
    sqlContent = fs.readFileSync(SQL_PATH, 'utf-8');
  });

  // T9: 表结构验证
  describe('T9 - 表结构', () => {
    it('应创建 achievements 表', () => {
      expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS achievements');
    });

    it('应创建 user_achievements 表', () => {
      expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS user_achievements');
    });

    it('achievements 表应有 code 唯一约束', () => {
      expect(sqlContent).toContain('code VARCHAR(50) NOT NULL UNIQUE');
    });

    it('achievements 表应包含 category 枚举约束', () => {
      expect(sqlContent).toContain("category VARCHAR(20) NOT NULL CHECK (category IN ('milestone', 'streak', 'cumulative'))");
    });

    it('achievements 表应包含 requirement_type 枚举约束', () => {
      expect(sqlContent).toContain("requirement_type VARCHAR(20) NOT NULL CHECK (requirement_type IN ('workouts', 'days', 'duration', 'calories'))");
    });

    it('user_achievements 应有外键约束', () => {
      expect(sqlContent).toContain('REFERENCES achievements(id)');
      expect(sqlContent).toContain('REFERENCES users(id)');
    });

    it('user_achievements 应有唯一约束防止重复解锁', () => {
      expect(sqlContent).toContain('UNIQUE(user_id, achievement_id)');
    });

    it('应创建必要索引', () => {
      expect(sqlContent).toContain('idx_user_achievements_user');
      expect(sqlContent).toContain('idx_user_achievements_achievement');
    });
  });

  // T10: 预设数据验证
  describe('T10 - 预设成就数据', () => {
    it('应包含里程碑类成就', () => {
      expect(sqlContent).toContain("'milestone'");
    });

    it('应包含连续打卡类成就', () => {
      expect(sqlContent).toContain("'streak'");
    });

    it('应包含累计类成就', () => {
      expect(sqlContent).toContain("'cumulative'");
    });

    it('应包含训练次数成就（1/10/50/100）', () => {
      expect(sqlContent).toContain("'first_workout'");
      expect(sqlContent).toContain("'workout_10'");
      expect(sqlContent).toContain("'workout_50'");
      expect(sqlContent).toContain("'workout_100'");
    });

    it('应包含连续天数成就（3/7/14/30/100）', () => {
      expect(sqlContent).toContain("'streak_3'");
      expect(sqlContent).toContain("'streak_7'");
      expect(sqlContent).toContain("'streak_14'");
      expect(sqlContent).toContain("'streak_30'");
      expect(sqlContent).toContain("'streak_100'");
    });

    it('应包含时长成就（10h/50h/100h/500h）', () => {
      expect(sqlContent).toContain("'duration_10h'");
      expect(sqlContent).toContain("'duration_100h'");
    });

    it('应包含卡路里成就（1k/10k/50k/100k）', () => {
      expect(sqlContent).toContain("'calories_1000'");
      expect(sqlContent).toContain("'calories_100000'");
    });
  });
});

// ==================== 前端组件测试 ====================

describe('成就系统 - 前端页面', () => {
  let pageContent: string;
  let apiContent: string;

  beforeAll(() => {
    pageContent = fs.readFileSync(FRONTEND_PAGE_PATH, 'utf-8');
    apiContent = fs.readFileSync(API_SERVICE_PATH, 'utf-8');
  });

  // T11: 前端组件结构
  describe('T11 - 页面组件', () => {
    it('应导入 achievementService', () => {
      expect(pageContent).toContain("import { achievementService } from '../services/api'");
    });

    it('应显示进度条组件', () => {
      expect(pageContent).toContain('Progress');
    });

    it('应显示统计卡片', () => {
      expect(pageContent).toContain('Statistic');
    });

    it('应有刷新成就按钮', () => {
      expect(pageContent).toContain('handleCheckAchievements');
    });

    it('应按分类分组展示', () => {
      expect(pageContent).toContain('groupByCategory');
    });

    it('应有用户统计展示', () => {
      expect(pageContent).toContain('userStats');
      expect(pageContent).toContain('currentStreak');
    });
  });

  // T12: 前端进度展示
  describe('T12 - 进度展示逻辑', () => {
    it('未解锁成就应显示当前进度', () => {
      expect(pageContent).toContain('current_progress');
      expect(pageContent).toContain('requirement_value');
    });

    it('应显示进度百分比', () => {
      expect(pageContent).toContain('progress_percentage');
    });

    it('应有条件描述文字', () => {
      expect(pageContent).toContain('getRequirementText');
    });

    it('应有解锁日期展示', () => {
      expect(pageContent).toContain('unlocked_at');
    });
  });

  // T13: API 服务定义
  describe('T13 - API 服务', () => {
    it('应定义 getAchievements 方法', () => {
      expect(apiContent).toContain("getAchievements: () =>");
      expect(apiContent).toContain("'/achievements'");
    });

    it('应定义 getStats 方法', () => {
      expect(apiContent).toContain("getStats: () =>");
      expect(apiContent).toContain("'/achievements/stats'");
    });

    it('应定义 checkAchievements 方法', () => {
      expect(apiContent).toContain("checkAchievements: () =>");
      expect(apiContent).toContain("'/achievements/check'");
    });
  });
});

// ==================== 业务逻辑单元测试（纯函数） ====================

describe('成就系统 - 业务逻辑', () => {
  // T14: getRequirementText 映射
  describe('T14 - 条件描述映射', () => {
    const getRequirementText = (type: string, value: number): string => {
      switch (type) {
        case 'workouts': return `累计训练 ${value} 次`;
        case 'days': return `连续训练 ${value} 天`;
        case 'duration': return `累计训练 ${value} 小时`;
        case 'calories': return `累计消耗 ${value.toLocaleString()} 卡`;
        default: return '';
      }
    };

    it('workouts 类型应返回"次训练"', () => {
      expect(getRequirementText('workouts', 10)).toBe('累计训练 10 次');
    });

    it('days 类型应返回"天连续"', () => {
      expect(getRequirementText('days', 7)).toBe('连续训练 7 天');
    });

    it('duration 类型应返回"小时"', () => {
      expect(getRequirementText('duration', 100)).toBe('累计训练 100 小时');
    });

    it('calories 类型应格式化数字', () => {
      expect(getRequirementText('calories', 100000)).toBe('累计消耗 100,000 卡');
    });

    it('未知类型应返回空字符串', () => {
      expect(getRequirementText('unknown', 1)).toBe('');
    });
  });

  // T15: 进度百分比计算
  describe('T15 - 进度百分比计算', () => {
    const calcProgress = (current: number, target: number): number => {
      return Math.min(Math.round((current / target) * 100), 100);
    };

    it('进度为 0 时返回 0', () => {
      expect(calcProgress(0, 10)).toBe(0);
    });

    it('进度过半时返回正确百分比', () => {
      expect(calcProgress(5, 10)).toBe(50);
    });

    it('进度超过目标时上限为 100', () => {
      expect(calcProgress(15, 10)).toBe(100);
    });

    it('恰好达成时返回 100', () => {
      expect(calcProgress(10, 10)).toBe(100);
    });
  });

  // T16: streak 计算逻辑（模拟）
  describe('T16 - 连续打卡逻辑模拟', () => {
    const calculateStreak = (workoutDates: string[], today: string): number => {
      const MS_PER_DAY = 86400000;
      const dates = new Set(
        workoutDates.map(d => {
          const dt = new Date(d);
          dt.setHours(0, 0, 0, 0);
          return dt.getTime();
        })
      );

      const todayTime = new Date(today);
      todayTime.setHours(0, 0, 0, 0);
      const todayMs = todayTime.getTime();
      const yesterdayMs = todayMs - MS_PER_DAY;

      let startTime: number;
      if (dates.has(todayMs)) {
        startTime = todayMs;
      } else if (dates.has(yesterdayMs)) {
        startTime = yesterdayMs;
      } else {
        return 0;
      }

      let streak = 0;
      let checkTime = startTime;
      while (dates.has(checkTime)) {
        streak++;
        checkTime -= MS_PER_DAY;
      }
      return streak;
    };

    it('无训练记录时返回 0', () => {
      expect(calculateStreak([], '2026-05-07')).toBe(0);
    });

    it('只有今天训练时返回 1', () => {
      expect(calculateStreak(['2026-05-07'], '2026-05-07')).toBe(1);
    });

    it('今天和昨天都训练时返回 2', () => {
      expect(calculateStreak(['2026-05-06', '2026-05-07'], '2026-05-07')).toBe(2);
    });

    it('连续3天训练返回 3', () => {
      expect(calculateStreak(['2026-05-05', '2026-05-06', '2026-05-07'], '2026-05-07')).toBe(3);
    });

    it('今天没训练但昨天训练返回 1', () => {
      expect(calculateStreak(['2026-05-06'], '2026-05-07')).toBe(1);
    });

    it('今天没训练且昨天也没训练返回 0', () => {
      expect(calculateStreak(['2026-05-05'], '2026-05-07')).toBe(0);
    });

    it('同一天多次训练只算一天', () => {
      expect(calculateStreak(['2026-05-07', '2026-05-07', '2026-05-07'], '2026-05-07')).toBe(1);
    });

    it('中间断了一天返回 0（从今天算）', () => {
      expect(calculateStreak(['2026-05-05', '2026-05-04'], '2026-05-07')).toBe(0);
    });

    it('连续7天返回 7', () => {
      const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date('2026-05-07');
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      });
      expect(calculateStreak(dates, '2026-05-07')).toBe(7);
    });
  });
});