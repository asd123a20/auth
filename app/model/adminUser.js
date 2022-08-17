'use strict';
const Schema = require('mongoose').Schema;
const SchemaDefine = {
  userName: { type: String, required: true },
  password: { type: String, required: true },
  openid: { type: String, required: false },
  name: { type: String, required: false },
  phone: { type: String, required: false },
  salt: { type: String, required: false },
};
const schema = new Schema(SchemaDefine);
module.exports = app => {
  const { mongoose } = app;
  return mongoose.model('adminUser', schema, 'adminUser');
};
