import express from 'express';
import * as Mongo from '../DB/mongo';
import { jwtVerify } from '../utils';
import { decode } from 'jsonwebtoken';
import * as Errors from '../errors';

export const route = express.Router();

route.post('/projectList', (req, res) => {
  const accessToken = req.get('c-access-token');
  const { projUserId } = req.body;
  let promise;

  if (accessToken === 'undefined') {
    promise = Mongo.getProject().getProjectList(projUserId, undefined);
  } else {
    if (!jwtVerify(accessToken)) {
      res.json(Result(false, '엑세스토큰이 문제가 있어요.',
                      Errors.ACCESS_TOKEN_ERROR));
      return 0;
    }
    const userId = decode(accessToken)['userId'];
    promise = Mongo.getProject().getProjectList(projUserId, userId);
  }
  
  promise.then(result => {
    res.json(result);
  });
});

route.post('/projectOne', (req, res) => {
  const accessToken = req.get('c-access-token');
  const { projHisId } = req.body;
  let promise;

  if (accessToken === 'undefined') {
    promise = Mongo.getProject().getProjectOne(projHisId, undefined);
  } else {
    if (!jwtVerify(accessToken)) {
      res.json(Result(false, '엑세스토큰이 문제가 있어요.',
                      Errors.ACCESS_TOKEN_ERROR));
      return 0;
    }
    const userId = decode(accessToken)['userId'];
    promise = Mongo.getProject().getProjectOne(projHisId, userId);
  }

  promise.then(result => {
    res.json(result);
  });

});

route.post('/newProject', (req, res) => {
  const accessToken = req.get('c-access-token');
  const project = req.body;

  console.log(`newProject`);
  console.log(`accessToken`);
  console.log(accessToken);

  if (!jwtVerify(accessToken)) {
    res.json(Result(false, '엑세스토큰에 문제가 발생했어요.',
                    Errors.ACCESS_TOKEN_ERROR));
    return 0;
  }

  const userId = decode(accessToken)['userId'];

  Mongo.getProject().insertNewProject(userId, project)
  .then(result => {
    res.json(result);
  });
});