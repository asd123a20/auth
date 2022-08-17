'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  // 获取验证码
  router.get('/api/auth/pwdlogin/get_verification_code', controller.pwdlogin.get_verification_code);
  // 帐号密码登录
  router.post('/api/auth/pwdlogin/auth', controller.pwdlogin.auth);
  // 使用二维码换取登录凭证
  router.get('/api/auth/qrlogin/qrcodeLogin', controller.qrlogin.qrcodeLogin);
  // 获取二维码（uuid）
  router.get('/api/auth/qrlogin/qrcode', controller.qrlogin.qrcode);
  // 获取openid 带参数二维码uuid
  router.get('/api/auth/qrlogin/get_openid', controller.qrlogin.get_openid);
  // 二维码登录验证
  router.post('/api/auth/qrlogin/auth', controller.qrlogin.auth);
};
