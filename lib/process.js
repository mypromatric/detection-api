const { spawn } = require('child_process');
const path = require('path');

const detectionDir = path.resolve(process.cwd(), '../', 'detection')
console.log('decdir', detectionDir);
exports.identify = function (subjectName, file, cb) {
  const dir = detectionDir;
  console.log('......................Detecting image......................');
  try {
    const cmd = spawn('sh', [dir + '/identify.sh'], {
      cwd: dir,
      env: {
        file,
        subName: subjectName,
      }
    });

    let result = ''

    cmd.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
      result = data + '';
    });

    cmd.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });

    cmd.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      cb(null, {
        status: 1,
        result
      });
    });
  } catch (err) {
    console.log('exec err', err);
    cb(err);
  }
};

exports.p1 = function (subjectName, cb) {
  console.log('......................Starting image processing......................');
  console.log('---log', process.cwd());
  try {
    const cmdS = `subName=${subjectName} baseDir=${process.cwd()}/processedImages userImgDir=${process.cwd()}/images sh `
    console.log('cmdSS', cmdS);
    const dir = detectionDir;
    const cmd = spawn('sh', [dir + '/p1.sh'], {
      cwd: dir,
      env: {
        subName: subjectName,
        baseDir: dir,
        userImgDir: `${process.cwd()}/images`
      }
    });

    cmd.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    cmd.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });

    cmd.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      cb(null, 1);
    });
  } catch (err) {
    console.log('exec err', err);
    cb(err);
  }
};
