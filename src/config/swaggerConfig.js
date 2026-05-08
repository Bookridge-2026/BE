const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
        title: 'Bookridge API 문서',
        version: '1.0.0',
        description: 'Bookridge 프로젝트 API 명세서',
        },
        components: {
        securitySchemes: {
            Authorization: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            },
        },
        },
        security: [
        {
            Authorization: [],
        },
        ],
        servers: [
        {
            url: 'http://localhost:3000',
            description: '로컬 개발 서버',
        },
        {
            url: 'http://15.164.218.166',
            description: '원격 개발 서버',
        },
        ],
    },
    apis: [
        path.join(__dirname, '../routes/*.js'),
        path.join(__dirname, '../controllers/*.js'),
        path.join(__dirname, '../services/*.js'),
    ],
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };