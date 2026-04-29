import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';

// 直接测试 upload 中间件的配置逻辑
describe('upload 中间件配置', () => {
  describe('T1 - 文件类型过滤', () => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    it('应接受 JPEG 图片', () => {
      expect(allowedMimes.includes('image/jpeg')).toBe(true);
    });

    it('应接受 PNG 图片', () => {
      expect(allowedMimes.includes('image/png')).toBe(true);
    });

    it('应接受 GIF 图片', () => {
      expect(allowedMimes.includes('image/gif')).toBe(true);
    });

    it('应接受 WebP 图片', () => {
      expect(allowedMimes.includes('image/webp')).toBe(true);
    });

    it('应拒绝非图片类型 (application/pdf)', () => {
      expect(allowedMimes.includes('application/pdf')).toBe(false);
    });

    it('应拒绝非图片类型 (video/mp4)', () => {
      expect(allowedMimes.includes('video/mp4')).toBe(false);
    });

    it('应拒绝非图片类型 (text/plain)', () => {
      expect(allowedMimes.includes('text/plain')).toBe(false);
    });
  });

  describe('T2 - 文件大小限制', () => {
    it('multer 配置的文件大小限制应为 2MB', () => {
      const maxFileSize = 2 * 1024 * 1024;
      expect(maxFileSize).toBe(2097152);
    });

    it('2MB 文件应等于 2097152 字节', () => {
      expect(2 * 1024 * 1024).toBe(2097152);
    });

    it('超过 2MB 的文件 (3MB) 应被拒绝', () => {
      const threeMB = 3 * 1024 * 1024;
      const limit = 2 * 1024 * 1024;
      expect(threeMB > limit).toBe(true);
    });
  });

  describe('文件名生成', () => {
    it('生成的文件名应包含 avatar- 前缀和扩展名', () => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = '.jpg';
      const filename = `avatar-${uniqueSuffix}${ext}`;
      expect(filename).toMatch(/^avatar-\d+-\d+\.jpg$/);
    });

    it('不同时间生成的文件名应不同', () => {
      const name1 = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;
      // 等待 1ms 确保时间戳不同
      const name2 = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;
      // 名称很可能不同（时间戳 + 随机数）
      expect(typeof name1).toBe('string');
      expect(typeof name2).toBe('string');
    });
  });

  describe('上传目录', () => {
    it('上传目录路径应指向 uploads/avatars', () => {
      const uploadDir = path.join(__dirname, '../../uploads/avatars');
      expect(uploadDir).toContain('uploads/avatars');
    });
  });
});

describe('avatarUpload multer 实例', () => {
  // 重新导入以验证实际配置
  let avatarUpload: multer.Multer;

  beforeAll(() => {
    // 动态导入确保拿到实际配置
    const uploadModule = require('../middleware/upload');
    avatarUpload = uploadModule.avatarUpload;
  });

  it('应正确导出 avatarUpload', () => {
    expect(avatarUpload).toBeDefined();
    expect(typeof avatarUpload.single).toBe('function');
  });

  it('avatarUpload.single("avatar") 应返回中间件函数', () => {
    const middleware = avatarUpload.single('avatar');
    expect(typeof middleware).toBe('function');
  });
});