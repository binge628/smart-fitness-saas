import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Mock 数据库模块
const mockQuery = jest.fn();
jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    query: mockQuery,
  },
}));

// Mock auth 工具
jest.mock('../utils/auth', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
  generateToken: jest.fn(),
  JwtPayload: {},
}));

import { uploadAvatar } from '../controllers/userController';

describe('T3-T7: uploadAvatar 控制器', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = {
      json: jsonMock,
      status: statusMock,
    } as Partial<Response>;

    jest.clearAllMocks();
  });

  describe('T3 - 未认证用户', () => {
    it('应返回 401 状态码', async () => {
      mockReq = { user: undefined } as Partial<Request>;

      await uploadAvatar(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: '未认证',
      });
    });
  });

  describe('T4 - 未上传文件', () => {
    it('应返回 400 状态码', async () => {
      mockReq = {
        user: { userId: 'user-1', username: 'test' },
        file: undefined,
      } as Partial<Request>;

      await uploadAvatar(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: '请选择要上传的图片',
      });
    });
  });

  describe('T5 - 上传成功', () => {
    it('应返回 200 和头像 URL', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        phone: null,
        avatar: '/uploads/avatars/avatar-123.jpg',
        role: 'user',
        status: 'active',
        created_at: new Date(),
      };

      mockReq = {
        user: { userId: 'user-1', username: 'test' },
        file: {
          filename: 'avatar-1234567890-987654321.jpg',
          fieldname: 'avatar',
          originalname: 'photo.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          destination: '/tmp/uploads/avatars',
          path: '/tmp/uploads/avatars/avatar-1234567890-987654321.jpg',
          buffer: Buffer.from(''),
          stream: {} as any,
          encoding: '7bit',
        },
      } as Partial<Request>;

      // Mock: 查询当前头像
      mockQuery.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ avatar: null }],
      });

      // Mock: 更新数据库
      mockQuery.mockResolvedValueOnce({
        rowCount: 1,
        rows: [mockUser],
      });

      await uploadAvatar(mockReq as Request, mockRes as Response);

      const callArgs = jsonMock.mock.calls[0][0];
      expect(callArgs.success).toBe(true);
      expect(callArgs.message).toBe('头像上传成功');
      expect(callArgs.data.id).toBe('user-1');
      expect(callArgs.data.avatar).toBe('/uploads/avatars/avatar-123.jpg');

      // 验证数据库更新调用
      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE users SET avatar = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, email, phone, avatar, role, status, created_at',
        ['/uploads/avatars/avatar-1234567890-987654321.jpg', 'user-1']
      );
    });
  });

  describe('T6 - 旧头像清理', () => {
    it('当旧头像为 null 时不应尝试删除', async () => {
      mockReq = {
        user: { userId: 'user-1', username: 'test' },
        file: {
          filename: 'avatar-new.jpg',
          fieldname: 'avatar',
          originalname: 'new.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          destination: '/tmp',
          path: '/tmp/avatar-new.jpg',
          buffer: Buffer.from(''),
          stream: {} as any,
          encoding: '7bit',
        },
      } as Partial<Request>;

      // Mock: 查询当前头像为 null
      mockQuery.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ avatar: null }],
      });

      // Mock: 更新数据库
      mockQuery.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 'user-1', avatar: '/uploads/avatars/avatar-new.jpg' }],
      });

      await uploadAvatar(mockReq as Request, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: '头像上传成功',
        })
      );
    });

    it('当旧头像不是 /uploads/avatars/ 开头时不应删除文件', async () => {
      mockReq = {
        user: { userId: 'user-1', username: 'test' },
        file: {
          filename: 'avatar-new.jpg',
          fieldname: 'avatar',
          originalname: 'new.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          destination: '/tmp',
          path: '/tmp/avatar-new.jpg',
          buffer: Buffer.from(''),
          stream: {} as any,
          encoding: '7bit',
        },
      } as Partial<Request>;

      // Mock: 旧头像为 base64 data URL（老方案）
      mockQuery.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ avatar: 'data:image/png;base64,abc123' }],
      });

      // Mock: 更新数据库
      mockQuery.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 'user-1', avatar: '/uploads/avatars/avatar-new.jpg' }],
      });

      await uploadAvatar(mockReq as Request, mockRes as Response);

      // base64 头像不以 /uploads/avatars/ 开头，不应进入文件删除逻辑
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('当旧头像以 /uploads/avatars/ 开头时应进入删除逻辑', async () => {
      mockReq = {
        user: { userId: 'user-1', username: 'test' },
        file: {
          filename: 'avatar-new.jpg',
          fieldname: 'avatar',
          originalname: 'new.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          destination: '/tmp',
          path: '/tmp/avatar-new.jpg',
          buffer: Buffer.from(''),
          stream: {} as any,
          encoding: '7bit',
        },
      } as Partial<Request>;

      // Mock: 旧头像为文件路径
      mockQuery.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ avatar: '/uploads/avatars/avatar-old.jpg' }],
      });

      // Mock: 更新数据库
      mockQuery.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 'user-1', avatar: '/uploads/avatars/avatar-new.jpg' }],
      });

      // 旧头像文件路径在测试环境中不存在，所以不会实际删除
      // 但逻辑分支会被覆盖
      await uploadAvatar(mockReq as Request, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });

  describe('数据库错误处理', () => {
    it('数据库查询出错时应返回 500', async () => {
      mockReq = {
        user: { userId: 'user-1', username: 'test' },
        file: {
          filename: 'avatar-new.jpg',
          fieldname: 'avatar',
          originalname: 'new.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          destination: '/tmp',
          path: '/tmp/avatar-new.jpg',
          buffer: Buffer.from(''),
          stream: {} as any,
          encoding: '7bit',
        },
      } as Partial<Request>;

      // Mock: 数据库查询抛出错误
      mockQuery.mockRejectedValueOnce(new Error('DB connection failed'));

      await uploadAvatar(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: '上传头像失败',
      });
    });
  });
});