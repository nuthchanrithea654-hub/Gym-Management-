const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();

app.get('/', (req, res) => {
  res.json({
    message: 'Gym Management API Gateway is running'
  });
});

app.use(
  '/register',
  createProxyMiddleware({
    target: process.env.REGISTRATION_SERVICE,
    changeOrigin: true,
    pathRewrite: (path) => '/register' + path
  })
);

app.use(
  '/login',
  createProxyMiddleware({
    target: process.env.LOGIN_SERVICE,
    changeOrigin: true,
    pathRewrite: (path) => '/login' + path
  })
);

app.use(
  '/memberships',
  createProxyMiddleware({
    target: process.env.MEMBERSHIP_SERVICE,
    changeOrigin: true,
    pathRewrite: (path) => '/memberships' + path
  })
);

app.use(
  '/payments',
  createProxyMiddleware({
    target: process.env.PAYMENT_SERVICE,
    changeOrigin: true,
    pathRewrite: (path) => '/payments' + path
  })
);

app.use(
  '/classes',
  createProxyMiddleware({
    target: process.env.CLASS_SERVICE,
    changeOrigin: true,
    pathRewrite: (path) => '/classes' + path
  })
);

app.use(
  '/bookings',
  createProxyMiddleware({
    target: process.env.BOOKING_SERVICE,
    changeOrigin: true,
    pathRewrite: (path) => '/bookings' + path
  })
);

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});