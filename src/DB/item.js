import mongoose, { Schema } from 'mongoose';
import uuid from 'uuid/v1';
import { Result } from '../utils';
import * as Errors from '../errors';
import * as Mongo from './mongo';

export default class Item {
  schema;
  model;

  constructor() {
    this.schema = this.setSchema();
    this.model = mongoose.model('item', this.schema);
  }

  setSchema() {
    const schema = new Schema(
      {
        writerId: { type: String, required: true },
        historyId: { type: String, default: uuid },
        title: { type: String, required: true },
        text: { type: String, default: '' },
        projectId: { type: String, required: true },
        subjectId: { type: String, requitred: true },
        sortNumber: { type: Number, default: 1 },
        private: { type: Boolean, default: true },
        shareUserList: [String],
        deleted: { type: Boolean, default: false },
        checkBoxList: [
          {
            title: { type: String, default: '미입력' },
            checked: { type: Boolean, default: false }
          }
        ],
        tagList: [String],

        createdTime: { type: Date, default: Date.now },
        updatedTime: { type: Date, default: Date.now },
      }
    );

    return schema;
  }

  async getTitleList(userId, subjHisId) {

    if (userId === undefined) {

      const result = await this.model
      .find({ subjectId: subjHisId, deleted: false, private: false })
      .catch(err => { console.error(err); return null; });

      if (result === null) {
        return Result(false, '아이템 검색 실패.');
      }

      return Result(true, '검색 성공.', Errors.NONE, result);

    } else {

      const subj = await Mongo.getSubject().getModel()
      .findOne({ historyId: subjHisId, deleted: false })
      .catch(err => { console.error(err); return null; });

      if (subj === null) {
        return Result(false, '비교용 서브젝트 검색에 실패했어요.');
      }

      let condition = { subjectId: subjHisId, deleted: false };
      const subjWriterId = subj.writerId;

      if (subjWriterId === userId) {
        // 필요 없는 부분이지만, 수정될 가능성이 높아서 이대로 둠.
      } else {
        // 나중에 그룹 기능 추가되면, 수정될 것임.
        condition = Object.assign({}, condition, { private: false });
      }

      const result = await this.model.find(condition)
      .catch(err => { console.error(err); return null; });

      if (result === null) {
        return Result(false, '해당 서브젝트의 아이템 검색 실패.');
      }

      return Result(true, '검색 성공', Errors.NONE, result);
    }

  }

  // 새로운 아이템 입력.
  async insertNewItem(userId, item) {
    // TODO 해당 userId가 작성 권한이 있는지 확인 필요.
    let count = await this.model
    .count({ subjectId: item.subjectId, writerId: userId })
    .catch(err => { console.error(err); return null; });

    if (count === null) {
      return Result(false, 'DB에러.');
    }

    count += 1;

    const Item = Object.assign( {}, item,
                                { writerId: userId },
                                { sortNumber: count });
    const doc = new this.model(Item);
    const result = await doc.save()
    .catch(err => { console.error(err); return null; });

    if (result === null) {
      return Result(false, '아이템 저장하면서 문제가 발생했어요.');
    }

    const payload = {
      historyId: result.historyId,
      title: result.title,
      sortNumber: result.sortNumber,
      projectId: result.projectId,
      subjectId: result.subjectId,
      private: result.private,
      shareUserList: result.shareUserList,
    };

    return Result(true, '아이템 저장 성공', Errors.NONE, payload);
  }

  // 아이템 수정.
  async modifyItem(userId, item) {
    const result = await this.model
    .findOneAndUpdate({ writerId: userId,
                        historyId: item.historyId,
                        deleted: false },
                      { title: item.title,
                        text: item.text,
                        updatedTime: Date.now()
                      },
                      { new: true }
                      )
    .catch(err => { console.error(err); return null; });

    if (result === null) {
      return Result(false, 'DB에러');
    }

    return Result(true, '성공', Errors.NONE, result);
  }

  // 아이템 삭제. 한개이상 다수 지원해요. 다만 한개라도 items는 배열로 넣어주세요.
  async deleteItems(userId, items) {
    let condition = { writerId: userId, deleted: false };
    const update = { $set: { deleted: true, updatedTime: Date.now() } };
    const tempQuery = items.map(value => {
      return { historyId: value };
    });
    condition = Object.assign({}, condition, { $or: [...tempQuery] });


    const result = await this.model.updateMany(condition, update)
    .catch(err => { console.error(err); return -1; });

    if (result === -1) {
      return Result(false, Errors.MSG_DB_WORK_ERROR, Errors.DB_ERROR);
    }

    if (result === null) {
      return Result(false, Errors.MSG_DB_WORK_ERROR, Errors.EMPTY);
    }

    console.log(condition);
    console.log(result);
    return Result(true, Errors.MSG_DB_WORK_OK, Errors.NONE, result);
  }

  // 아이템의 자세한 내용 가져오기.
  async getItemDetail(userId, itemHisId) {
    const result = await this.model
    .findOne({ historyId: itemHisId, deleted: false })
    .catch(err => { console.error(err); return -1; });

    if (result === -1) {
      return Result(false, Errors.MSG_DB_WORK_ERROR);
    }

    if (result === null) {
      return Result(false, '검색 결과가 없어요.');
    }

    if (userId === undefined) {
      return getItemDetailWithoutUserId(result);
    } else {
      return getItemDetail(userId, result);
    }

    // -----------------------------------------------------------
    // ---- 정리용도 함수 모음 시작
    function getItemDetail(userId, result) {
      if (result.private && result.writerId !== userId) {
        return Result(false, '해당 문서는 비밀문서에요. 문서 작성자만 볼 수 있어요.',
                      Errors.PRIVATE);
      }

      return Result(true, Errors.MSG_DB_WORK_OK, Errors.NONE, result);
    }

    function getItemDetailWithoutUserId(result) {
      if (result.private) {
        return Result(false, '검색 결과가 없어요.', Errors.EMPTY);
      }

      return Result(true, Errors.MSG_DB_WORK_OK, Errors.NONE, result);
    }
    // ---- 정리용도 함수 모음 끝
    // -----------------------------------------------------------
  }

  // 태그를 생성해요.
  async insertNewTag(userId, itemHisId, tag) {
    const condition = { historyId: itemHisId, writerId: userId, deleted: false };

    const result = await this.model
    .update(condition, { $addToSet: { tagList: tag } })
    .catch(err => { console.error(err); return -1; });

    if (result === -1) {
      return Result(false, Errors.MSG_DB_WORK_ERROR, Errors.DB_ERROR);
    }

    if (result.nModified === 0) {
      return Result(false, '중복된 태그에요.', Errors.ALREADY_HAVE_ERROR);
    }

    return Result(true, Errors.MSG_DB_WORK_OK, Errors.NONE, '');
  }

  // 태그를 삭제해요.
  async deleteTag(userId, itemHisId, tag) {
    const condition = { historyId: itemHisId, writerId: userId, deleted: false };

    const result = await this.model
    .update(condition, { $pull: { tagList: tag } })
    .catch(err => { console.error(err); return -1; });

    if (result === -1) {
      return Result(false, Errors.MSG_DB_WORK_ERROR, Errors.DB_ERROR);
    }

    if (result.nModified === 0) {
      return Result(false, '중복된 태그에요.', Errors.ALREADY_HAVE_ERROR);
    }

    return Result(true, Errors.MSG_DB_WORK_OK, Errors.NONE, '');
  }
}