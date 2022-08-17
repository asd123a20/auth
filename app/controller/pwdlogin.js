'use strict';

const Controller = require('egg').Controller;
const sm3 = require('sm3');
const assert = require('assert');
const jsonwebtoken = require('jsonwebtoken');
const svgCaptcha = require('svg-captcha');
class LoginController extends Controller {
  constructor(ctx) {
    super(ctx);
    this.model = this.ctx.model.AdminUser;
  }
  // 用户名密码登录
  async auth() {
    const { userName, password, uuid, code } = this.ctx.request.body;
    assert(userName, '缺少用户名');
    assert(password, '缺少密码');
    assert(uuid, '缺少uuid');
    assert(code, '缺少验证码');
    const { jwt } = this.app.config;
    let msg;
    const ban = await this.app.redis.get(userName);
    if (ban) {
      // 判断是否超出登录次数
      if (ban >= this.app.config.ban) {
        this.ctx.body = { errcode: -1001, errmsg: '限制登录， 请在5分钟后重试', data: '' };
        return;
      }
      await this.app.redis.set(userName, Number(ban) + 1, 'EX', this.app.config.bantime);
    } else {
      await this.app.redis.set(userName, 1, 'EX', this.app.config.bantime);
    }
    // 验证码
    const redisCode = await this.app.redis.get(uuid);
    if (!redisCode) {
      this.ctx.body = { errcode: -1001, errmsg: '验证码已失效', data: '' };
      return;
    }
    if (code !== redisCode) {
      this.ctx.body = { errcode: -1001, errmsg: '验证码错误', data: '' };
      return;
    }
    // 密码
    const res = await this.model.findOne({ userName });
    if (!res) {
      this.ctx.body = { errcode: -1001, errmsg: '用户不存在', data: '' };
      return;
    }
    const pwd = sm3(`${password}:${res.salt}`);
    if (res && res.password !== pwd) {
      this.ctx.body = { errcode: -1001, errmsg: '密码错误', data: '' };
      return;
    }
    const token = jsonwebtoken.sign({ userName: res.userName, name: res.name, id: res._id, phone: res.phone }, jwt.secret, { expiresIn: jwt.expiresIn, issuer: jwt.issuer });
    const userinfo = { userName, name: res.name || null, phone: res.phone || null, id: res._id };
    // 验证当前账号是否登录
    const usertoken = await this.app.redis.get(`${userName}token`);
    // 登录过设置token为失效状态
    if (usertoken) {
      await this.app.redis.set(usertoken, 1);
    }
    // 未登录则正常登录  存储token未正常状态
    await this.app.redis.set(`${userName}token`, token);
    await this.app.redis.set(token, 0);
    if (token && userinfo) msg = { errcode: 0, errmsg: '', data: { userinfo, token } };
    this.ctx.body = msg;
  }
  // 获取验证码
  async get_verification_code() {
    const uuid = this.ctx.query.uuid;
    const captcha = svgCaptcha.createMathExpr({
      // 翻转颜色
      inverse: false,
      // 字体大小
      fontSize: 36,
      // 噪声线条数
      noise: 2,
      // 宽度
      width: 80,
      // 高度
      height: 30,
    });
    // 保存到redis,忽略大小写
    const code = captcha.text.toLowerCase();
    await this.app.redis.set(uuid, code, 'EX', 60 * 5);
    this.ctx.response.type = 'image/svg+xml';
    this.ctx.body = captcha.data;
  }
}

module.exports = LoginController;
