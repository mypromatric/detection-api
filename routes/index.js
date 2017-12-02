var express = require('express');
var router = express.Router();
var fs = require('mz/fs');
const { p1, i } = require('../lib/process');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Photo Saver'
  });
});

router.post('/api/identify', async (req, res, next) => {
  console.log('req.post', req.post);
  const { userName, data } = req.post;
  if (userName) {
    var imageBuffer = decodeBase64Image(req.body.data);
    const file = await fs.writeFile(`testImages/${req.body.userName}/${Date.now()}.jpg`, imageBuffer.data);

    p1(userName, function (err, result) {

    });
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
      // if (err) {
      //   res.send(500, {
      //     message: 'Error'
      //   });
      // } else {

      // }
      // res.send(422, {
      //   message: 'no name in processing'
      // });
    });

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
      var imageBuffer = decodeBase64Image(req.body.data);
      const path = process.cwd() + `/testImages/${req.body.userName}/${Date.now()}.jpg`
      const file = await fs.writeFile(path, imageBuffer.data);
      console.log('fileeee', file);

      i(req.body.userName, path, function (err, r) {
        res.send(200, r);
      })

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
