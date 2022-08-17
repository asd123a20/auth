'use strict';

const Controller = require('egg').Controller;
const assert = require('assert');
const jsonwebtoken = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
class QrloginController extends Controller {
  constructor(ctx) {
    super(ctx);
    this.model = this.ctx.model.AdminUser;
  }
  // 使用二维码换取登录凭证
  async qrcodeLogin() {
    const uuid = this.ctx.query.uuid;
    assert(uuid, 'uuid不能为空');
    const key = `qrlogin:${uuid}`;
    const val = await this.app.redis.get(key);
    if (!val) {
      return { errcode: -1001, errmsg: '二维码已过期', data: '' };
    }
    const [ status, token, userinfo ] = val.split(':');
    if (status !== 'scaned' || !token) {
      return { errcode: -1001, errmsg: '二维码状态无效', data: '' };
    }
    // TODO: 修改二维码状态
    await this.app.redis.set(key, 'consumed', 'EX', 600);
    return { token, userinfo };
  }
  // 登录验证
  async auth() {
    const { uuid, openid } = this.ctx.request.body;
    const key = `qrlogin:${uuid}`;
    const qrcode = await this.app.redis.get(key);
    if (!qrcode) return { errcode: -1001, errmsg: '二维码已过期', data: '' };
    if (qrcode !== 'pending') return { errcode: -1001, errmsg: '二维码已失效', data: '' };
    const user = await this.model.findOne({ openid });
    if (!user) return { errcode: -1001, errmsg: '微信用户不存在', data: '' };
    const { jwt } = this.app.config;
    const token = await jsonwebtoken.sign(user, jwt.secret, { expiresIn: jwt.expiresIn, issuer: jwt.issuer });
    const userinfo = { userName: user.userName, name: user.name, phone: user.phone };
    await this.app.redis.set(key, `scaned:${token}:${userinfo}`, 'EX', 600);
    // 发送mq消息通知
  }
  // 获取二维码
  async qrcode() {
    const uuid = uuidv4();
    const key = `qrlogin:${uuid}`;
    await this.app.redis.set(key, 'pending');
    this.ctx.body = { errcode: 0, errmsg: '', data: { uuid } };
  }
  // 获取openid
  async get_openid() {
    const { ctx } = this;
    const { code, state, uuid } = ctx.query;
    const { appid } = this.app.config.wxconfig;
    if (code) {
      return await this.get_openid_back({ code, state });
    }
    // const host = this.ctx.header.referer.split('/')[2];
    const host = this.ctx.header.host;
    const backUrl = `${this.ctx.protocol}://${host}${ctx.path}`;
    const to_url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${backUrl}&response_type=code&state=${uuid}&scope=snsapi_base#wechat_redirect`;
    ctx.redirect(to_url);
  }
  // 获取openid认证回调
  async get_openid_back({ code, state }) {
    const { appid, appsecret } = this.app.config.wxconfig;
    const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appid}&secret=${appsecret}&code=${code}&grant_type=authorization_code`;
    const { openid } = await this.ctx.curl(url);
    // 重定向到确认登录页
    await this.ctx.render('login.njk', { openid, uuid: state, message: '扫码登录确认' });
  }
}

module.exports = QrloginController;
