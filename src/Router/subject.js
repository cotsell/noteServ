import express from 'express';
import * as Mongo from '../DB/mongo';
import { jwtVerify } from '../utils';
import { decode } from 'jsonwebtoken';
import * as Errors from '../errors';

export const route = express.Router();

route.post('/subjectList', (req, res) => {
  const accessToken = req.get('c-access-token');
  const projHisId = req.body.projHisId;
  let promise;

  // console.log(projHisId);
  // TODO 2. 로그인 안하고 들어오면, 공개 프로젝트면 노출, 아니면, 퉁구기.
  // 3. 로그인 되어있으면, 
    //  1. 내 프로젝트면 오키.
    //  2. 내 프로젝트가 아니면..
    //    1. 공개 프로젝트면 노출
    //    2. 아니면 퉁구기.

  if (accessToken !== 'undefined') {
    if (!jwtVerify(accessToken)) {
      res.json(Result(false, '엑세스토큰에 문제가 있어요.', 
                      Errors.ACCESS_TOKEN_ERROR));
      return 0;
    }

    const userId = decode(accessToken)['userId'];

    promise = Mongo.getSubject().getSubjectList(userId, projHisId);

  } else {
    promise = Mongo.getSubject().getSubjectList(undefined, projHisId);
  }

  promise.then(result => {
    res.json(result)
  });
  
});

route.post('/newSubject', (req, res) => {
  const accessToken = req.get('c-access-token');
  const subject = req.body;

  if (!jwtVerify(accessToken)) {
    res.json(Result(false, '엑세스토큰에 문제가 있어요.', 
                    Errors.ACCESS_TOKEN_ERROR));
    return 0;
  }

  const userId = decode(accessToken)['userId'];

  Mongo.getSubject().insertNewSubject(userId, subject)
  .then(result => {
    res.json(result);
  });
});

route.post('/subjectOne', (req, res) => {
  const accessToken = req.get('c-access-token');
  const { subjHisId } = req.body;
  let promise;
  console.log(`엑세스토큰은..`);
  console.log(accessToken);

  if (accessToken === 'undefined') {
    console.log(`엑세스토큰 undefined`);
    promise = Mongo.getSubject().getSubjectOne(undefined, subjHisId);
  } else {
    console.log(`엑세스토큰 있음.`);
    if (!jwtVerify(accessToken)) {
      res.json(Result(false, '엑세스토큰에 문제가 있어요.',
                      Errors.ACCESS_TOKEN_ERROR));
      return 0;
    }
    const userId = decode(accessToken)['userId'];
    promise = Mongo.getSubject().getSubjectOne(userId, subjHisId);
  }

  promise.then(result => {
    res.json(result)
  });
});

route.post('/modifySubject', (req, res) => {
  const accessToken = req.get('c-access-token');
  const subject = req.body;

  console.log(`modifySubject()`);
  console.log(accessToken);
  console.log(subject); 

  if (!jwtVerify(accessToken)) {
    res.json(Result(false, Errors.MSG_ACCESS_TOKEN_ERROR, 
                    Errors.ACCESS_TOKEN_ERROR));
    return;
  }

  const userId = decode(accessToken)['userId'];

  Mongo.getSubject().modifySubject(userId, subject)
  .then(result => {
    res.json(result);
  })
});

route.post('/deleteSubject', (req, res) => {
  const accessToken = req.get('c-access-token');
  const { subjHisId } = req.body;

  if (!jwtVerify(accessToken)) {
    res.json(Result(false, Errors.MSG_ACCESS_TOKEN_ERROR, 
      Errors.ACCESS_TOKEN_ERROR));
    return ;
  }

  const userId = decode(accessToken)['userId'];

  Mongo.getSubject().deleteSubjectOne(userId, subjHisId)
  .then(result => {
    // TODO 아이템도 삭제해야 함.
    res.json(result);
  });
});