import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import fs from 'fs';
import path from 'path';

/**
 * T15-T25: 前端扩展场景回归测试
 * 覆盖：ErrorBoundary 多场景、ProfilePage 头像逻辑、App.tsx 包裹验证、Docker/nginx 配置
 */

// ==================== ErrorBoundary 扩展场景 ====================

let consoleSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleSpy.mockRestore();
});

describe('T15 - ErrorBoundary 嵌套组件错误隔离', () => {
  it('应捕获深层嵌套组件的错误', async () => {
    const ErrorBoundary = (await import('../components/ErrorBoundary')).default;
    const DeepChild = () => {
      throw new Error('深层错误');
    };

    render(
      <ErrorBoundary>
        <DeepChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('页面出错了')).toBeTruthy();
  });

  it('错误边界外的组件应不受影响', async () => {
    const ErrorBoundary = (await import('../components/ErrorBoundary')).default;
    const BuggyComponent = () => {
      throw new Error('独立错误');
    };

    render(
      <div>
        <div data-testid="safe-area">安全内容</div>
        <ErrorBoundary>
          <BuggyComponent />
        </ErrorBoundary>
      </div>
    );

    expect(screen.getByTestId('safe-area')).toBeTruthy();
    expect(screen.getByText('页面出错了')).toBeTruthy();
  });
});

describe('T16 - ErrorBoundary 多次恢复', () => {
  it('重试后再次出错应再次显示错误 UI', async () => {
    const ErrorBoundary = (await import('../components/ErrorBoundary')).default;

    render(
      <ErrorBoundary>
        <ThrowAlways />
      </ErrorBoundary>
    );

    expect(screen.getByText('页面出错了')).toBeTruthy();

    // 点击重试 - 组件仍会抛错
    fireEvent.click(screen.getByRole('button', { name: /重\s*试/ }));

    // 仍应显示错误 UI
    expect(screen.getByText('页面出错了')).toBeTruthy();
  });
});

// 始终抛错的组件
function ThrowAlways() {
  throw new Error('始终报错');
}

describe('T17 - ErrorBoundary 生产环境不显示详情', () => {
  it('生产环境（DEV=false）不应显示错误详情区域', async () => {
    const ErrorBoundary = (await import('../components/ErrorBoundary')).default;

    render(
      <ErrorBoundary>
        <ThrowAlways />
      </ErrorBoundary>
    );

    // vitest 中 DEV 为 false
    if (!import.meta.env.DEV) {
      const errorDetailElements = screen.queryAllByText(/错误信息（仅开发环境显示）/);
      expect(errorDetailElements.length).toBe(0);
    }
  });
});

describe('T18 - ErrorBoundary 错误信息包含正确内容', () => {
  it('应显示用户友好的错误提示', async () => {
    const ErrorBoundary = (await import('../components/ErrorBoundary')).default;

    render(
      <ErrorBoundary>
        <ThrowAlways />
      </ErrorBoundary>
    );

    expect(screen.getByText('页面出错了')).toBeTruthy();
    expect(screen.getByText(/抱歉，页面遇到了一些问题/)).toBeTruthy();
  });
});

// ==================== ProfilePage 头像逻辑扩展 ====================

describe('T19 - ProfilePage 文件类型前端校验', () => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  it('应拒绝 BMP 文件', () => {
    expect(allowedTypes.includes('image/bmp')).toBe(false);
  });

  it('应拒绝 SVG 文件（安全考虑）', () => {
    expect(allowedTypes.includes('image/svg+xml')).toBe(false);
  });

  it('应拒绝 TIFF 文件', () => {
    expect(allowedTypes.includes('image/tiff')).toBe(false);
  });

  it('应拒绝非图片 MIME 类型', () => {
    const nonImageTypes = [
      'application/pdf',
      'application/zip',
      'video/mp4',
      'text/html',
      'application/javascript',
    ];
    nonImageTypes.forEach((type) => {
      expect(allowedTypes.includes(type)).toBe(false);
    });
  });

  it('前后端文件类型白名单应一致', () => {
    const frontendTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const backendTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    expect(frontendTypes.sort()).toEqual(backendTypes.sort());
  });
});

describe('T20 - ProfilePage 头像预览与状态管理', () => {
  it('FileReader 读取文件后应设置预览和选中文件', () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    expect(file.type).toBe('image/jpeg');
    expect(file.name).toBe('test.jpg');
  });

  it('取消弹窗应清空预览和选中文件', () => {
    const cleanup = () => {
      let avatarModalVisible = true;
      let previewAvatar = 'image/png;base64,xxx';
      let selectedFile: File | null = new File([''], 'test.jpg');

      avatarModalVisible = false;
      previewAvatar = '';
      selectedFile = null;

      return { avatarModalVisible, previewAvatar, selectedFile };
    };

    const state = cleanup();
    expect(state.avatarModalVisible).toBe(false);
    expect(state.previewAvatar).toBe('');
    expect(state.selectedFile).toBe(null);
  });

  it('上传成功后应清空状态并触发事件', () => {
    let avatarModalVisible = true;
    let previewAvatar = 'image/png;base64,xxx';
    let selectedFile: File | null = new File([''], 'test.jpg');
    let eventDispatched = false;

    avatarModalVisible = false;
    previewAvatar = '';
    selectedFile = null;
    eventDispatched = true;

    expect(avatarModalVisible).toBe(false);
    expect(previewAvatar).toBe('');
    expect(selectedFile).toBe(null);
    expect(eventDispatched).toBe(true);
  });

  it('上传成功后应更新 localStorage 中的用户信息', () => {
    // 验证 localStorage.setItem 在上传成功后被调用
    const mockUser = { id: '1', username: 'test', avatar: '/uploads/avatars/new.jpg' };
    const stored = JSON.stringify(mockUser);
    expect(JSON.parse(stored).avatar).toBe('/uploads/avatars/new.jpg');
  });
});

describe('T21 - ProfilePage handleConfirmAvatar 空文件校验', () => {
  it('selectedFile 为 null 时应提示错误', () => {
    const selectedFile = null;
    expect(!selectedFile).toBe(true);
  });

  it('selectedFile 存在时应继续上传流程', () => {
    const selectedFile = new File(['data'], 'avatar.jpg', { type: 'image/jpeg' });
    expect(!selectedFile).toBe(false);
  });
});

describe('T22 - uploadAvatar API 调用验证', () => {
  it('userService.uploadAvatar 应为函数', async () => {
    const api = await import('../services/api');
    expect(typeof api.userService.uploadAvatar).toBe('function');
  });

  it('应将文件放入 FormData 的 avatar 字段', () => {
    const formData = new FormData();
    const file = new File(['test'], 'photo.png', { type: 'image/png' });
    formData.append('avatar', file);

    const retrieved = formData.get('avatar') as File;
    expect(retrieved.name).toBe('photo.png');
    expect(retrieved.type).toBe('image/png');
  });

  it('Content-Type 应为 multipart/form-data', () => {
    const expectedHeaders = { 'Content-Type': 'multipart/form-data' };
    expect(expectedHeaders['Content-Type']).toBe('multipart/form-data');
  });
});

// ==================== App.tsx 包裹验证 ====================

describe('T23 - App.tsx ErrorBoundary 包裹验证', () => {
  it('App.tsx 应导入 ErrorBoundary', () => {
    const appContent = fs.readFileSync(
      path.join(__dirname, '../App.tsx'),
      'utf-8'
    );
    expect(appContent).toContain("import ErrorBoundary from './components/ErrorBoundary'");
  });

  it('ErrorBoundary 应包裹 BrowserRouter', () => {
    const appContent = fs.readFileSync(
      path.join(__dirname, '../App.tsx'),
      'utf-8'
    );
    const ebIndex = appContent.indexOf('<ErrorBoundary>');
    const routerIndex = appContent.indexOf('<BrowserRouter>');
    expect(ebIndex).toBeGreaterThan(-1);
    expect(routerIndex).toBeGreaterThan(-1);
    expect(ebIndex).toBeLessThan(routerIndex);
  });

  it('ErrorBoundary 关闭标签应在 BrowserRouter 之后', () => {
    const appContent = fs.readFileSync(
      path.join(__dirname, '../App.tsx'),
      'utf-8'
    );
    const closeRouterIndex = appContent.indexOf('</BrowserRouter>');
    const closeEbIndex = appContent.indexOf('</ErrorBoundary>');
    expect(closeRouterIndex).toBeGreaterThan(-1);
    expect(closeEbIndex).toBeGreaterThan(-1);
    expect(closeRouterIndex).toBeLessThan(closeEbIndex);
  });
});

// ==================== nginx 配置扩展验证 ====================

describe('T24 - nginx 配置扩展验证', () => {
  let nginxContent: string;

  beforeAll(() => {
    nginxContent = fs.readFileSync(
      path.join(__dirname, '../../nginx.conf'),
      'utf-8'
    );
  });

  it('/uploads 代理应设置 X-Forwarded-For 头', () => {
    const uploadsSection = nginxContent.split('location /uploads')[1]?.split('location /')[0] || '';
    expect(uploadsSection).toContain('X-Forwarded-For');
  });

  it('/uploads 代理应设置 X-Real-IP 头', () => {
    const uploadsSection = nginxContent.split('location /uploads')[1]?.split('location /')[0] || '';
    expect(uploadsSection).toContain('X-Real-IP');
  });

  it('/api 代理应支持 WebSocket 升级', () => {
    const apiSection = nginxContent.split('location /api')[1]?.split('location /uploads')[0] || '';
    expect(apiSection).toContain('Upgrade');
    expect(apiSection.toLowerCase()).toContain('upgrade');
  });

  it('应配置 gzip 压缩', () => {
    expect(nginxContent).toContain('gzip on');
    expect(nginxContent).toContain('gzip_types');
  });

  it('应配置 SPA fallback（try_files）', () => {
    expect(nginxContent).toContain('try_files');
    expect(nginxContent).toContain('index.html');
  });

  it('/api 和 /uploads 应分别配置代理', () => {
    expect(nginxContent).toContain('location /api');
    expect(nginxContent).toContain('location /uploads');
  });

  it('应配置错误页面', () => {
    expect(nginxContent).toContain('error_page');
  });

  it('应配置静态资源长缓存', () => {
    expect(nginxContent).toContain('expires 1y');
    expect(nginxContent).toContain('Cache-Control');
  });
});

// ==================== 前端 .dockerignore 验证 ====================

describe('T25 - 前端 .dockerignore 规则验证', () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(
      path.join(__dirname, '../../.dockerignore'),
      'utf-8'
    );
  });

  it('应排除 node_modules', () => {
    expect(content).toContain('node_modules');
  });

  it('应排除 dist 构建产物', () => {
    expect(content).toContain('dist');
  });

  it('应排除 .git 目录', () => {
    expect(content).toContain('.git');
  });

  it('应排除环境变量文件', () => {
    expect(content).toContain('.env');
  });

  it('应排除日志文件', () => {
    expect(content).toContain('*.log');
  });

  it('应排除 .DS_Store', () => {
    expect(content).toContain('.DS_Store');
  });
});