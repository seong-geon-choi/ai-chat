const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // MCP 서버로의 API 요청을 프록시
  app.use(
    '/api/mcp',
    createProxyMiddleware({
      target: process.env.REACT_APP_MCP_SERVER_URL || 'http://localhost:3001',
      changeOrigin: true,
      pathRewrite: {
        '^/api/mcp': '/api', // MCP 서버의 엔드포인트에 맞게 경로 재작성
      },
      logLevel: 'debug',
    })
  );
};
