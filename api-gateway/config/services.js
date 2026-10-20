// Upstream targets. Membership traffic goes through nginx, which load balances
// across the membership replicas; every other service is called directly.
module.exports = {
  registration: process.env.REGISTRATION_SERVICE || 'http://registration-service:5001',
  login: process.env.LOGIN_SERVICE || 'http://login-service:5002',
  membership: process.env.MEMBERSHIP_SERVICE || 'http://nginx:80',
  payment: process.env.PAYMENT_SERVICE || 'http://payment-service:5004',
  class: process.env.CLASS_SERVICE || 'http://class-service:5005',
  booking: process.env.BOOKING_SERVICE || 'http://booking-service:5006'
};
