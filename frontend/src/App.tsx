import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';

// 布局组件
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';

// 守卫组件
import { AuthGuard, PublicAuthGuard } from './components/AuthGuard';

// 页面组件
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import PlansPage from './pages/PlansPage';
import GymsPage from './pages/GymsPage';
import HealthDataPage from './pages/HealthDataPage';
import WorkoutsPage from './pages/WorkoutsPage';
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

function App() {
  return (
    <ConfigProvider theme={customTheme} locale={zhCN}>
      <AntApp>
        <BrowserRouter>
          <Routes>
            {/* 认证相关路由 - 嵌套路由 */}
            <Route element={<PublicAuthGuard><AuthLayout /></PublicAuthGuard>}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* 主应用路由 - 需要认证 */}
            <Route path="/" element={<AuthGuard><AppLayout><HomePage /></AppLayout></AuthGuard>} />
            <Route path="/plans" element={<AuthGuard><AppLayout><PlansPage /></AppLayout></AuthGuard>} />
            <Route path="/gyms" element={<AuthGuard><AppLayout><GymsPage /></AppLayout></AuthGuard>} />
            <Route path="/health" element={<AuthGuard><AppLayout><HealthDataPage /></AppLayout></AuthGuard>} />
            <Route path="/workouts" element={<AuthGuard><AppLayout><WorkoutsPage /></AppLayout></AuthGuard>} />
            <Route path="/profile" element={<AuthGuard><AppLayout><ProfilePage /></AppLayout></AuthGuard>} />

            {/* 默认重定向 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;