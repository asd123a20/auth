/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1637194502813_3847';

  // add your middleware config here
  config.middleware = [];

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };
  // 安全配置
  config.security = {
    csrf: {
      // ignoreJSON: true, // 默认为 false，当设置为 true 时，将会放过所有 content-type 为 `application/json` 的请求
      enable: false,
    },
  };
  config.cluster = {
    listen: {
      port: 9000,
    },
  };
  // 数据库配置
  config.mongoose = {
    url: 'mongodb://127.0.0.1/Microservices',
    options: {
      // user: 'root',
      // pass: 'cms@cc-lotus',
      // authSource: 'admin',
      // useNewUrlParser: true,
      // useCreateIndex: true,
    },
  };
  config.redis = {
    client: {
      port: 6379,
      host: '127.0.0.1',
      password: null,
      db: 0,
    },
  };
  config.jwt = {
    issuer: 'naf',
    expiresIn: '12h',
    secret: '123456',
  };
  config.wxconfig = {
    appid: '',
    appsecret: '',
  };
  config.view = {
    defaultViewEngine: 'nunjucks',
    mapping: {
      '.njk': 'nunjucks',
    },
  };
  // 禁止登录次数
  config.ban = 3;
  // 禁止登录时间
  config.bantime = 60 * 5;
  config.logger = {
    level: 'DEBUG',
  };
  return {
    ...config,
    ...userConfig,
  };
};
