const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const services = require('../config/services');

const router = express.Router();

// Express strips the mount path, so add it back before forwarding
const proxyTo = (target, prefix) => {
  const targets = Array.isArray(target) ? target : [target];
  let nextTarget = 0;

  return createProxyMiddleware({
    target: targets[0],
    ...(targets.length > 1 && {
      router: () => {
        const selectedTarget = targets[nextTarget];
        nextTarget = (nextTarget + 1) % targets.length;
        return selectedTarget;
      }
    }),
    changeOrigin: true,
    pathRewrite: (path) => prefix + path
  });
};

const routes = [
  { prefix: '/register', target: services.registration },
  { prefix: '/login', target: services.login },
  { prefix: '/memberships', target: services.membership },
  { prefix: '/server', target: services.membership },
  { prefix: '/payments', target: services.payment },
  { prefix: '/classes', target: services.class },
  { prefix: '/bookings', target: services.booking }
];

routes.forEach(({ prefix, target }) => {
  router.use(prefix, proxyTo(target, prefix));
});

module.exports = router;
