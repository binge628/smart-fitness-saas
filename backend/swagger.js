const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '智慧健身 SaaS 系统 API 文档',
      version: '1.0.0',
      description: '基于 SaaS 模式的智慧健身管理系统 API',
      contact: {
        name: 'API Support',
        email: 'support@smartfitness.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: '本地开发环境',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const specs = swaggerJsdoc(options);

app.use('/api-docs', swaggerUi.serve, setup(specs));

/**
 * @openapi
 * @title 智慧健身 SaaS 系统 API 文档
 * @version 1.0.0
 * @description 基于 SaaS 模式的智慧健身管理系统 API 文档
 */
const specs = swaggerJsdoc(options);

app.use('/api-docs', swaggerUi.setup(specs));