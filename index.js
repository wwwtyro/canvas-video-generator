#!/usr/bin/env node

var browserify = require('browserify');
var bodyParser = require('body-parser');
var minimist = require('minimist');
var express = require('express');
var sprintf = require('sprintf').sprintf;
var tmp = require('tmp');
var cp = require('child_process');
var fs = require('fs');

var args = minimist(process.argv.slice(2));
if (args.h || args.help) {
  console.log('usage: cvg [options]');
  console.log();
  console.log('options:');
  console.log('  -h --help:     This help');
  console.log('  -p --port:     Port to use [3172]');
  console.log('  -o --odir:     Directory to store final video in [current working directory]');
  console.log('  -n --noclean:  Do not clean up temporary files [false]')
  process.exit();
}

var PORT = args.p || args.port || 3172;
var OUTDIR = args.o || args.odir || process.cwd();
var NOCLEAN = args.n || args.noclean || false;


var app = express();
tempDir = tmp.dirSync({unsafeCleanup: true});


app.use(function(req, res, next) {
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", 0);
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(bodyParser.urlencoded({extended: true, limit: '100mb'}));


app.get('/cvg.js', function (req, res) {
  var b = browserify();
  b.add(__dirname + '/cvg.js');
  b.bundle(function(err, buf) {
    if (err !== null) {
      console.log(err);
    }
    var authority = req.protocol + '://' + req.get('host');
    var src = buf.toString();
    src = src.replace('cvg_authority', authority);
    res.send(src);
  });
});


app.post('/addFrame', function(req, res) {
  var data = req.body.png.replace(/^data:image\/png;base64,/, "");
  var filename = sprintf('image-%010d.png', parseInt(req.body.frame));
  fs.writeFileSync(sprintf('%s/%s', tempDir.name, filename), data, 'base64');
  res.end();
  process.stdout.write(sprintf('Recieved frame %s\r', req.body.frame));
});


app.post('/render', function(req, res) {
  var oldTemp = tempDir;
  console.log("Begining rendering of your video. This might take a long time...")
  var ffmpeg = cp.spawn('ffmpeg', [
    '-framerate', '60',
    '-start_number', '0',
    '-i', 'image-%010d.png',
    '-refs', '5',
    '-c:v', 'libx264',
    '-preset', 'veryslow',
    '-crf', '18',
    sprintf('%s/%s.mp4', OUTDIR, req.body.filename)
  ], {
    cwd: oldTemp.name,
    stdio: 'inherit'
  });
  ffmpeg.on('close', function(code) {
    console.log(sprintf('Finished rendering video. You can find it at %s/%s.mp4', OUTDIR, req.body.filename));
    if (NOCLEAN) {
      console.log(sprintf('Not cleaning temp files. You can find them in %s', oldTemp.name));
    } else {
      console.log(sprintf('Cleaning up temp files in %s', oldTemp.name));
      oldTemp.removeCallback();
    }
  });
  tempDir = tmp.dirSync({unsafeCleanup: true});
  res.end();
});


app.listen(PORT, function() {
  console.log("Canvas video generator server listening on port " + PORT +".");
});
