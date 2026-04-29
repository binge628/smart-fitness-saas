# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建 TypeScript
RUN npm run build

# 生产阶段
FROM node:20-alpine

WORKDIR /app

# 复制 package 文件和构建产物
COPY package*.json ./
COPY --from=builder /app/dist ./dist

# 只安装生产依赖
RUN npm ci --only=production

# 创建上传目录
RUN mkdir -p uploads/avatars

# 暴露端口
EXPOSE 3001

# 启动应用
CMD ["node", "dist/index.js"]