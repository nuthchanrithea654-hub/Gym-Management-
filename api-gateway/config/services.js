// Services can be reached over the local Compose network or across EC2 private IPs.
const membership = (
  process.env.MEMBERSHIP_SERVICES ||
  process.env.MEMBERSHIP_SERVICE ||
  'http://nginx:80'
)
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

module.exports = {
  registration: process.env.REGISTRATION_SERVICE || 'http://registration-service:5001',
  login: process.env.LOGIN_SERVICE || 'http://login-service:5002',
  membership,
  payment: process.env.PAYMENT_SERVICE || 'http://payment-service:5004',
  class: process.env.CLASS_SERVICE || 'http://class-service:5005',
  booking: process.env.BOOKING_SERVICE || 'http://booking-service:5006'
};
