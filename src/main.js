import express from 'express';
import * as bodyParser from 'body-parser';
import cors from 'cors';

import * as Mongo from './DB/mongo';
import * as Sys from './sys';
import * as router from './Router';

const app = express();
Mongo.connect(Sys.MONGODB_URL);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// 동일출처정책(CORS)를 해결하기 위해 해더에 다음과 같은 내용을 추가.
// 이 항목은 가능한 미들웨어 선언 이후에 위치하도록 하자.
// app.use((req, res, next) => {
// 	res.header('Access-Control-Allow-Origin', '*');
// 	res.header('Access-Control-Allow-Headers', 'X-Requested-With, Origin, Accept, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization, c-access-token');
// 	res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, OPTIONS, DELETE');
// 	next();
// });

const optionUrl = 's';
app.use(`/${optionUrl}/project`, router.project); 
app.use(`/${optionUrl}/account`, router.account);
app.use(`/${optionUrl}/subject`, router.subject);
app.use(`/${optionUrl}/item`, router.item);

const httpServer = app.listen(8030, '', () => {
  console.log(`port: ${httpServer.address().port}`);
});