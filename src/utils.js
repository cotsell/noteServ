import * as jwt from 'jsonwebtoken';
import * as sys from './sys';

export const Result = (result, msg, code, payload) => {
  let what = {};

  what.result = result;
  if (msg !== undefined)
    what.msg = msg;
  if (code !== undefined)
    what.code = code;
  if (payload !== undefined)
    what.payload = payload;

  return what;
}

export const jwtVerify = (accessToken) => {
  let trueOrFalse = false;

  if (accessToken !== undefined || accessToken !== 'undefined') {
    try {
      let result = jwt.verify(accessToken, sys.SECRET);
      trueOrFalse = true;
    } catch(exception) {
      console.error(exception);
      trueOrFalse = false;
    }
  }

  return trueOrFalse;
}

export const jwtCreate = (payload) => {
  return jwt.sign(payload,
                  sys.SECRET,
                  {
                    expiresIn: '1d',
                    issuer: 'cotsell',
                    subject: 'user'
                  }
  );
};
