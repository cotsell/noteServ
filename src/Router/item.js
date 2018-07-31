import express from 'express';
import * as Mongo from '../DB/mongo';
import { jwtVerify, Result } from '../utils';
import { decode } from 'jsonwebtoken';
import * as Errors from '../errors';

export const route = express.Router();

// Item들의 text 같은 용량이 큰 항목을 제외하고 전송해줘요.
route.post('/titleList', (req, res) => {
  const accessToken = req.get('c-access-token');
  const subjHisId = req.body.subjHisId;
  let promise;

  if (accessToken === 'undefined') {
    promise = Mongo.getItem().getTitleList(undefined, subjHisId);
  } else {
    if (!jwtVerify(accessToken)) {
      res.json(
        Result(false, Errors.MSG_ACCESS_TOKEN_ERROR, Errors.ACCESS_TOKEN_ERROR));
      return 0;
    }

    const userId = decode(accessToken)['userId'];

    promise = Mongo.getItem().getTitleList(userId, subjHisId);
  }

  promise.then(result => {
    res.json(result);
  });
});

// 새로운 아이템을 입력해요. text는 비어있어요.
route.post('/newItem', (req, res) => {
  const accessToken = req.get('c-access-token');
  const item = req.body;

  if (!jwtVerify(accessToken)) {
    res.json(
      Result(false, Errors.MSG_ACCESS_TOKEN_ERROR, Errors.ACCESS_TOKEN_ERROR));
    return 0;
  }

  const userId = decode(accessToken)['userId'];

  Mongo.getItem().insertNewItem(userId, item)
  .then(result => {
    res.json(result);
  });
});

route.post('/modifyItem', (req, res) => {
  const accessToken = req.get('c-access-token');
  const item = req.body;

  console.log(item);

  if (!jwtVerify(accessToken)) {
    res.json(
      Result(false, Errors.MSG_ACCESS_TOKEN_ERROR, Errors.ACCESS_TOKEN_ERROR));
    return 0;
  }

  const userId = decode(accessToken)['userId'];

  Mongo.getItem().modifyItem(userId, item)
  .then(result => {
    res.json(result);
  });
});

route.post('/deleteItems', (req, res) => {
  const accessToken = req.get('c-access-token');
  const items = req.body['itemHisIds'];

  if (!jwtVerify(accessToken)) {
    res.json(Result(false, Errors.MSG_ACCESS_TOKEN_ERROR, 
      Errors.ACCESS_TOKEN_ERROR));
    return;
  }

  const userId = decode(accessToken)['userId'];

  Mongo.getItem().deleteItems(userId, items)
  .then(result => {
    res.json(result);
  });
});

// 아이템의 자세한 내용을 돌려줘요.
route.post('/detail', (req, res) => {
  const accessToken = req.get('c-access-token');
  const itemHisId = req.body.itemHisId;
  let promise;

  if (accessToken === 'undefined') {
    promise = Mongo.getItem().getItemDetail(undefined, itemHisId);
  } else {

    if (!jwtVerify(accessToken)) {
      res.json(
        Result(false, Errors.MSG_ACCESS_TOKEN_ERROR, 
          Errors.ACCESS_TOKEN_ERROR));
      return 0;
    }

    const userId = decode(accessToken)['userId'];

    promise = Mongo.getItem().getItemDetail(userId, itemHisId);
  }

  promise.then(result => {
    res.json(result);
  });
});

route.post('/newTag', (req, res) => {
  const accessToken = req.get('c-access-token');
  const { itemHisId, tag } = req.body;

  if (accessToken === undefined || accessToken === 'undefined' || 
      !jwtVerify(accessToken)) {
    res.json(
      Result(false, `엑세스토큰에 문제가 발생했어요.`, Errors.ACCESS_TOKEN_ERROR));
    return 0;
  }

  const userId = decode(accessToken)['userId'];
  Mongo.getItem().insertNewTag(userId, itemHisId, tag)
  .then(result => {
    res.json(result);
  });

});

route.post('/deleteTag', (req, res) => {
  const accessToken = req.get('c-access-token');
  const { itemHisId, tag } = req.body;

  if (!jwtVerify(accessToken)) {
    res.json(
      Result(false, `엑세스토큰에 문제가 발생했어요.`, Errors.ACCESS_TOKEN_ERROR));
    return 0;
  }

  const userId = decode(accessToken)['userId'];
  Mongo.getItem().deleteTag(userId, itemHisId, tag)
  .then(result => {
    res.json(result);
  });
});