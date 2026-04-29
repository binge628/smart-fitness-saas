import express from 'express';

// T7 - 路由顺序测试
// 验证 /me/avatar 在 /:id 之前注册，避免 "me" 被当作 :id 参数

describe('T7 - 用户路由顺序', () => {
  it('POST /me/avatar 应在 GET /:id 之前注册', () => {
    // 读取路由文件内容验证路由顺序
    const fs = require('fs');
    const path = require('path');
    const routeContent = fs.readFileSync(
      path.join(__dirname, '../routes/userRoutes.ts'),
      'utf-8'
    );

    const meAvatarIndex = routeContent.indexOf("post('/me/avatar'");
    const getByIdIndex = routeContent.indexOf("get('/:id'");

    expect(meAvatarIndex).toBeGreaterThan(-1);
    expect(getByIdIndex).toBeGreaterThan(-1);
    expect(meAvatarIndex).toBeLessThan(getByIdIndex);
  });

  it('PUT /me 和 PUT /me/password 应在 GET /:id 之前', () => {
    const fs = require('fs');
    const path = require('path');
    const routeContent = fs.readFileSync(
      path.join(__dirname, '../routes/userRoutes.ts'),
      'utf-8'
    );

    const meUpdateIndex = routeContent.indexOf("put('/me',");
    const mePasswordIndex = routeContent.indexOf("put('/me/password'");
    const getByIdIndex = routeContent.indexOf("get('/:id'");

    expect(meUpdateIndex).toBeGreaterThan(-1);
    expect(mePasswordIndex).toBeGreaterThan(-1);
    expect(meUpdateIndex).toBeLessThan(getByIdIndex);
    expect(mePasswordIndex).toBeLessThan(getByIdIndex);
  });

  it('路由应包含 avatarUpload 中间件', () => {
    const fs = require('fs');
    const path = require('path');
    const routeContent = fs.readFileSync(
      path.join(__dirname, '../routes/userRoutes.ts'),
      'utf-8'
    );

    expect(routeContent).toContain("avatarUpload.single('avatar')");
    expect(routeContent).toContain('uploadAvatar');
  });

  it('路由应导入 upload 中间件', () => {
    const fs = require('fs');
    const path = require('path');
    const routeContent = fs.readFileSync(
      path.join(__dirname, '../routes/userRoutes.ts'),
      'utf-8'
    );

    expect(routeContent).toContain("from '../middleware/upload'");
    expect(routeContent).toContain('avatarUpload');
  });
});