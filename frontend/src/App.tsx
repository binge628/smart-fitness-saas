import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Layout, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';

// 布局组件
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';

// 页面组件
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import PlansPage from './pages/PlansPage';
import GymsPage from './pages/GymsPage';
import HealthDataPage from './pages/HealthDataPage';
import WorkoutsPage from './pages/WorkoutsPage';

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
      <BrowserRouter>
        <Routes>
          {/* 认证相关路由 */}
          <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
          <Route path="/register" element={<AuthLayout><RegisterPage /></AuthLayout>} />

          {/* 主应用路由 */}
          <Route path="/*" element={<AppLayout><HomePage /></AppLayout>} />
          <Route path="/plans" element={<AppLayout><PlansPage /></AppLayout>} />
          <Route path="/gyms" element={<AppLayout><GymsPage /></AppLayout>} />
          <Route path="/health" element={<AppLayout><HealthDataPage /></AppLayout>} />
          <Route path="/workouts" element={<AppLayout><WorkoutsPage /></AppLayout>} />

          {/* 默认重定向 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;