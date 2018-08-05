import mongoose, { Schema } from 'mongoose';
import uuid from 'uuid/v1';
import { Result } from '../utils';
import * as Errors from '../errors';

export default class Subject {
  schema;
  model;

  constructor() {
    this.schema = this.setSchema();
    this.model = mongoose.model('subject', this.schema);
  }

  setSchema() {
    const schema = new Schema(
      {
        writerId: { type: String, required: true },
        parentId: { type: String, required: true },
        historyId: { type: String, default: uuid },
        title: { type: String, required: true },
        memo: { type: Number, default: '' },
        sortNumber: { type: Number, default: 1 },
        private: { type: Boolean, default: true },
        shareUserList: [String],

        deleted: { type: Boolean, default: false },
        createdTime: { type: Date, default: Date.now },
        updatedTime: { type: Date, default: Date.now }
      }
    );

    return schema;
  }

  getModel() {
    return this.model;
  }

  // 서브젝트 리스트 가져오기.
  async getSubjectList(userId, projHisId) {
    const subj = await this.model
    .findOne({ parentId: projHisId, deleted: false })
    .catch(err => { console.error(err); return null; });

    if (subj === null) {
      return Result(false, '비교대상 서브젝트를 가져오는 도중에 문제가 발생했어요.');
    }

    if (userId === undefined) {

      // 로그인 없이 검색 요청한 경우.
      const result = await this.model
      .find({ parentId: projHisId, deleted: false, private: false })
      .catch(err => { console.error(err); return null; });

      if (result === null) {
        return Result(false, '관련 서브젝트를 검색하는 도중에 문제가 발생했어요.');
      }

      return Result(true, '검색 성공', Errors.NONE, result);

    } else {

      let condition = { parentId: projHisId, deleted: false };
      const subjWriterId = subj.writerId;

      if (userId === subjWriterId) {
        // 필요 없지만, 나중에 조건이 바뀔 가능성이 높아서 일단 두기로 함.
      } else {
        // 여기도 변경 가능성이 매우 높음. 서브젝트 권한을 갖는 유저의 경우에 대한 처리가
        // 나중에 필요하게 될 것임.
        condition = Object.assign({}, condition, { private: false })
      }

      const result = await this.model.find(condition)
      .catch(err => { console.error(err); return null; });

      if (result === null) {
        return Result(false, '검색 도중 문제가 발생했어요.');
      }

      return Result(true, '검색 완료.', Errors.NONE, result);
    }

  }

  async getSubjectOne(userId, subjHisId) {
    const condition = { historyId: subjHisId, deleted: false };
    const result = await this.model.findOne(condition)
    .catch(err => { console.error(err); return -1; });

    if (result === -1) {
      return Result(false, Errors.MSG_DB_WORK_ERROR);
    }

    if (result === null) {
      return Result(false, '해당 서브젝트가 존재하지 않아요.', Errors.EMPTY);
    }

    if (result.private && result.writerId !== userId) {
      return Result(false, '비공개 서브젝트에요.', Errors.PRIVATE);
    }

    return Result(true, Errors.MSG_DB_WORK_OK, Errors.NONE, result);
  }

  // 새로운 서브젝트 입력.
  async insertNewSubject(writerId, subject) {
    let count = await this.model
    .count({ writerId: writerId, parentId: subject.parentId })
    .catch(err => { console.error(err); return null; });

    if (count === null ) {
      return Result(false, Errors.MSG_DB_WORK_ERROR, Errors.DB_ERROR);
    }

    count += 1;

    const doc = new this.model(
      {
        writerId: writerId,
        parentId: subject.parentId,
        title: subject.title,
        sortNumber: count,
        private: subject.private,
      }
    );
    const result = await doc.save()
    .catch(err => { console.error(err); return null; });

    if (result === null) {
      return Result(false, 'DB 에러.');
    }

    return Result(true, 'Subject 생성 성공.', Errors.NONE, result);
  }

  // 서브젝트 한개 수정.
  async modifySubject(userId, subject) {
    // title, private, historyId, writerId
    const condition = {
      writerId: userId,
      historyId: subject.historyId,
      deleted: false
    };
    const result = await this.model
    .findOneAndUpdate(
      condition,
      { $set: {
        title: subject.title,
        private: subject.private,
        updatedTime: Date.now()
      } },
      { new: true })
    .catch(err => { console.error(err); return -1; });

    if (result === -1 ) {
      return Result(false, Errors.MSG_DB_WORK_ERROR, Errors.DB_ERROR);
    }

    console.log(result);

    return Result(true, Errors.MSG_DB_WORK_OK, Errors.NONE, result);
  }

  // 서브젝트 한개 삭제.
  async deleteSubjectOne(userId, subjHisId) {
    // 로그인 상태라고 해도 본인이 아닐수도 있으까..
    const condition = { writerId: userId, historyId: subjHisId,
      deleted: false };
    const change = { $set: { deleted: true, updatedTime: Date.now() } };

    const result = await this.model
    .findOneAndUpdate(condition, change, { new: true })
    .catch(err => { console.error(err); return -1; });
      
    if (result === -1) {
      return Result(false, Errors.MSG_DB_WORK_ERROR, Errors.DB_ERROR);
    }

    if (result === null) {
      return Result(false, '삭제는 문서 작성자만 가능해요.', Errors.PERMISSION_ERROR);
    }

    return Result(true, Errors.MSG_DB_WORK_OK, Errors.NONE, result);
  }
}