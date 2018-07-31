// 메모
// private는 'public', 'team', 'private'로 분류.



import mongoose, { Schema } from 'mongoose';
import uuid from 'uuid/v1';
import { Result } from '../utils';
import * as Errors from '../errors';

export default class Project {
  schema;
  model;

  constructor() {
    this.schema = this.setSchema();
    this.model = mongoose.model('project', this.schema);
  }

  setSchema() {
    const schema = new Schema(
      {
        writerId: { type: String, required: true },
        historyId: { type: String, default: uuid },
        title: { type: String, required: true },
        memo: { type: String, default: '' },
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

  // 새로운 프로젝트를 생성해요.
  async insertNewProject(writerId, project) {
    let count = await this.model.count({writerId})
    .catch(err => { console.error(err); return null; });

    if (count === null) {
      return Result(false, 'DB 에러.');
    }

    count += 1;

    const doc  = new this.model(
      {
        writerId: writerId,
        title: project.title,
        private: project.private,
        sortNumber: count,
        historyId: `${writerId}_${uuid()}`,
      }
    );

    const result = await doc.save()
    .catch(err => { console.error(err); return null; });

    if (result === null) {
      return Result(false, '프로젝트 저장 중에 DB에서 문제가 발생했어요.',
                    Errors.INS_NEW_PROJ_SAVE_ERROR);
    }

    return Result(true, '프로젝트 저장 완료.', Errors.NONE, result);
  }
  
  // 프로젝트 리스트 가져오기.
  // 검색 결과가 없으면 14번 에러코드와 오류를 리턴해요.
  async getProjectList(projUserId, userId) {
    let condition = { writerId: projUserId, deleted: false };

    if (userId === undefined || projUserId !== userId) {
      condition = Object.assign({}, { ...condition, private: false });
    } 

    const result = await this.model.find(condition)
    .catch(err => { console.error(err); return -1; });

    if (result === -1) {
      return Result(false, '프로젝트 검색에 실패했어요.', Errors.GET_PROJ_LIST_ERROR);
    }

    if (result.length === 0) {
      return Result(false, '데이터가 존재하지 않아요.', Errors.EMPTY);
    }

    return Result(true, '프로젝트 리스트 가져오기 성공.', Errors.NONE, result);
  }

  // projHisId에 해당하는 프로젝트를 한개 돌려줘요.
  // 해당 프로젝트가 없거나, 권한이 없는 유저가 비공개 자료를 요청했을 시에는
  // 오류를 리턴해요.
  async getProjectOne(projHisId, userId) {
    let condition = { historyId: projHisId, deleted: false };

    const result = await this.model.findOne(condition)
    .catch(err => { console.error(err); return -1; });

    if (result === -1) {
      return Result(false, 'DB 오류에요.');
    }

    if (result === null) {
      return Result(false, '해당 프로젝트가 존재하지 않아요. 이럴수가 있나?');
    }

    const { privateMode, writerId } = result;

    if (privateMode === true && writerId !== userId) {
      return Result(false, '비공개 프로젝트에요.', Errors.GET_PROJ_ONE_ERROR);
    }
    return Result(true, '검색 성공', Errors.NONE, result);
  }
}