import express from 'express';
import * as Mongo from '../DB/mongo';
import * as Errors from '../errors';
import { decode } from 'jsonwebtoken';

import { Result, jwtVerify, jwtCreate } from '../utils';

export const route = express.Router();

route.get('/checkAccessToken', (req, res) => {
  const accessToken = req.get('c-access-token');

  if (!jwtVerify(accessToken)) {
    res.json(Result(false, '엑세스 토큰에 문제가 있어요.', 1));
    return 0;
  }
  
  console.log(`${decode(accessToken).userId} 유저가 엑세스토큰 상태 확인을 요청했어요.`);

  res.json(Result(true, '인증 성공'));
});

route.post('/login', (req, res) => {
  const { id, password } = req.body;
  
  Mongo.getAccount().login(id, password)
  .then(result => {
    const accessToken = jwtCreate({  userId: id });
    const resultWithPayload = 
      Object.assign({}, result, { payload: { accessToken } });
  
    res.json(resultWithPayload);
  });
});

route.post('/sign', (req, res) => {
  const { id, password, nickName } = req.body;

  console.log('가입요청이 들어왔어요.');
  console.log(`${id} : ${password} : ${nickName}`);
  console.log();

  if (id === undefined || id === '' || 
      password === undefined || password === '' ||
      nickName === undefined || nickName === '') {
    res.json(Result(false, '비어있는 필수 항목이 있어요.',
                    Errors.SIGN_EMPTY_REQUIRED_VALUE));
    return 0;
  }

  Mongo.getAccount().insertNewAccount({ id, password, nickName })
  .then(result => {
    if (result.result) {
      console.log(`${id} 유저가 가입했어요.`);
      const accessToken = jwtCreate({ userId: id });
      res.json(Result(true, '가입 성공', Errors.NONE, 
                      { 
                        accessToken: accessToken,
                        id: id,
                        nickName: nickName
                      }));
    } else {
      res.json(Result(false, result.msg, Errors.SIGN_ERROR))
    } 
  });
});