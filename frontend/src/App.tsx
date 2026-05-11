import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';

// 布局组件
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';

// 守卫组件
import { AuthGuard, PublicAuthGuard } from './components/AuthGuard';

// 错误边界组件
import ErrorBoundary from './components/ErrorBoundary';

// 页面组件
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import PlansPage from './pages/PlansPage';
import GymsPage from './pages/GymsPage';
import HealthDataPage from './pages/HealthDataPage';
import WorkoutsPage from './pages/WorkoutsPage';
import ExercisesPage from './pages/ExercisesPage';
import AchievementsPage from './pages/AchievementsPage';
import ProfilePage from './pages/ProfilePage';

// 自定义主题 - 参考活力健身系统风格
const customTheme = {
  token: {
    colorPrimary: '#00B8D9', // 活力蓝
    colorSuccess: '#00C853', // 品牌绿
    colorBgLayout: '#f5f7fa',
    colorBgContainer: '#ffffff',
    colorBorder: '#e8e8e8',
    borderRadius: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#ffffff',
    },
    Menu: {
      darkItemBg: '#00B8D9',
      darkSelectedBg: '#0096B4',
    },
  },
};

/**
 * 受保护的应用布局路由
 * 统一处理认证守卫和应用布局
 */
const ProtectedLayout: React.FC = () => (
  <AuthGuard>
    <AppLayout />
  </AuthGuard>
);

/**
 * 公开认证布局路由
 * 已登录用户自动重定向到首页
 */
const PublicLayout: React.FC = () => (
  <PublicAuthGuard>
    <AuthLayout />
  </PublicAuthGuard>
);

function App() {
  return (
    <ConfigProvider theme={customTheme} locale={zhCN}>
      <AntApp>
        <ErrorBoundary>
          <BrowserRouter>
            <Routes>
              {/* 公开路由 - 登录/注册 */}
              <Route element={<PublicLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* 受保护路由 - 需要认证 */}
              <Route element={<ProtectedLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/plans" element={<PlansPage />} />
                <Route path="/gyms" element={<GymsPage />} />
                <Route path="/health" element={<HealthDataPage />} />
                <Route path="/workouts" element={<WorkoutsPage />} />
                <Route path="/exercises" element={<ExercisesPage />} />
                <Route path="/achievements" element={<AchievementsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              {/* 默认重定向 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;