var express = require('express');
var router = express.Router();
var fs = require('mz/fs');
const { p1, identify } = require('../lib/process');
const { MongoClient } = require('mongodb');
const mongodbURL = process.env.MONGO_URL || 'mongodb://localhost/test';
let _db;
let isConnecting = false;
let SubjectUserCollection, ResultCollection;


const _p1Logs = {};

async function getDB() {
  if (isConnecting) {
    console.log('connecting to DB');
    await sleep(2000);
  }
  if (!_db) {
    isConnecting = true;
    _db = await MongoClient.connect(mongodbURL, {
      loggerLevel: 'error',
      reconnectInterval: 2000
    });
    console.log('DB connected ' + _db.databaseName);
    SubjectUserCollection = _db.collection('SubjectUser');
    ResultCollection = _db.collection('Result');
    isConnecting = false;
  };
  return _db;
};


getDB().then().catch(e => {
  console.log('Error occurred while connecting db', e);
  process.exit(1);
});


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Photo Saver'
  });
});

router.get('/api/initbatch', async (req, res, next) => {
  const { userName } = req.query;
  if (!_p1Logs[userName]) {
    res.send(200, { status: 1 });
    return;
  }
  
  const name = userName;
  const dd = await SubjectUserCollection.find({ name, process: false }).toArray();
  console.log('dddd lwn', dd.length);
  for (var i = 0; i < dd.length; i++) {
    var element = dd[i];
    identify(name, element.path, async function (err, { result }) {
      const idx = result.indexOf(userName);
      const ss1 = result.substr(idx);
      const score = parseFloat(ss1.split("=")[1]);
      console.log('ratio---', score);
      await ResultCollection.insert({ name: userName, result, score });
      await SubjectUserCollection.update({ name: userName }, { $set: { process: true } });
    });
  }

  res.send(200, { status: 1 });
});

router.post('/api/identify', async (req, res, next) => {
  const { userName, data, timestamp } = req.body;
  if (userName) {
    var imageBuffer = decodeBase64Image(req.body.data);
    const imgId = Date.now();
    const path = process.cwd() + `/testImages/${req.body.userName}/${imgId}.jpg`
    const file = await fs.writeFile(path, imageBuffer.data);

    await SubjectUserCollection.insert({ name: userName, path, imgId, timestamp, process: false });
    // await SubjectUser.update({ name: userName }, { $set: { path, imgId, timestamp } });
    res.send(200, { status: 1 });

    // i(req.body.userName, path, function (err, r) {
    //   res.send(200, r);
    // })
  } else {
    res.send(422, {
      message: 'no name in identification'
    });
  }
});


router.get('/api/p1', async (req, res, next) => {
  const name = req.query.userName;
  if (name) {
    p1(name, function (err, r) {
      console.log('--------------', err, r);
      if (r) {
        _p1Logs[name] = true;
      }
    });

    // await SubjectUser.insert({ name });

    res.send(200, {
      status: 1
    });
  } else {
    res.send(422, {
      message: 'no name in processing'
    });
  }
});

router.post('/api/photo', async (req, res, next) => {
  if (req.body.userName) {
    if (req.body.identify) {

      return;

      // p1(userName, function (err, result) {

      // });


    }
    const exists = await fs.exists(`images/${req.body.userName}`);
    if (!exists) {
      await fs.mkdir(`images/${req.body.userName}`);
      await fs.mkdir(`testImages/${req.body.userName}`);
    }
    var imageBuffer = decodeBase64Image(req.body.data);
    fs.writeFile(`images/${req.body.userName}/${new Date().getTime()}.jpg`, imageBuffer.data, function (err) {
      if (err) {
        console.log('err', err)
        res.send(500, {
          message: 'internal server error'
        });
      } else {
        res.send(200, {
          message: 'done'
        });
      }

    });

  } else {
    res.send(422, {
      message: 'please provide user name'
    });
  }
});


function decodeBase64Image(dataString) {
  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    response = {};

  if (matches.length !== 3) {
    return new Error('Invalid input string');
  }

  response.type = matches[1];
  response.data = new Buffer(matches[2], 'base64');

  return response;
}

module.exports = router;
