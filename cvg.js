cvg = (function() {
  var ajax = require('marmottajax');
  var self = {};

  var AUTHORITY = 'cvg_authority';

  var frameCount = -1;

  self.addFrame = function(canvas) {
    frameCount++;
    ajax({
      url: AUTHORITY + '/addFrame',
      method: 'post',
      parameters: {
        png: canvas.toDataURL(),
        frame: frameCount
      }
    }).error(function(err) {
      console.warn(err);
    });
  }

  self.render = function(filename) {
    filename = filename || 'untitled';
    ajax({
      url: AUTHORITY + '/render',
      method: 'post',
      parameters: {
        filename: filename
      }
    }).error(function(err) {
      console.warn(err);
    });
  }

  return self;
}());
