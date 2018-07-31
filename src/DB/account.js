import mongoose, { Document, Model, Schema } from 'mongoose';
import crypto from 'crypto';
import * as Sys from '../sys';
import { Result } from '../utils';
import * as Errors from '../errors';

export default class Account {
  schema;
  model;

  constructor() {
    this.schema = this.setSchema();
    this.model = mongoose.model('account', this.schema);
  }

  setSchema() {
    const schema = new Schema(
      {
        id: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        nickName: { type: String, required: true, unique: true },
        grade: { type: Number, default: 9 },
        profileImgUrl: { type: String, defualt: '' },

        createdTime: { type: Date, default: Date.now },
        updatedTime: { type: Date, default: Date.now }
      }
    );
    return schema;
  }

  async insertNewAccount(userInfo) {
    let count = await this.model.count({ id: userInfo.id })
    .catch(err => { console.error(err); return null; });;

    if (count === null)
      return Result(false, '사용자 정보를 입력하는 과정에 문제가 발생했어요..',
                    Errors.SIGN_ERROR);
    if (count > 0)
      return Result(false, '이미 존재하는 사용자 정보에요.',
                    Errors.ALREADY_HAVE_ERROR);

    const encryptedPassword = crypto.createHmac('sha1', Sys.SECRET)
    .update(userInfo.password)
    .digest('base64');

    const doc = new this.model({
      id: userInfo.id,
      password: encryptedPassword,
      nickName: userInfo.nickName,
    });

    let result = await doc.save()
    .catch(err => { console.error(err); return null; });

    if (result === null)
      return Result(false, '사용자 정보를 입력하는 과정에 문제가 발생했어요..',
                    Errors.SIGN_ERROR);

    return Result(true, '사용자 정보 입력 완료했어요.', Errors.NONE);
  }

  async login(id, password) {
    const encryptedPassword = crypto.createHmac('sha1', Sys.SECRET)
    .update(password)
    .digest('base64');

    const result = await this.model.count({ id: id, password: encryptedPassword})
    .catch(err => { console.error(err); return null; });

    if (result === null || result < 1) {
      return Result(false, '해당 계정이 존재하지 않아요.', 
                    Errors.LOGIN_NOT_HAVE_ACCOUNT);
    }

    return Result(true, '로그인 성공.', 0);
  }


}