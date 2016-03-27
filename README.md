# canvas-video-generator
Capture HTML5 canvas frames and render high quality video with FFMPEG.

This module has two components:

* A server for collecting frames and rendering them to video
* A client library for sending frames to the server

The workflow is to start the server, then use the client library to send frames to the server and signal when the video is to be finalized.

## Install

```sh
$ npm install -g canvas-video-generator
```

## Step 1: Start the server.

Run `cvg`:

```sh
$ cvg
```

This will start a server listening on port `3172` that will store rendered videos in the current working directory and clean up any generated temp files.

Here's all the options:

```sh
$ cvg --help
usage: cvg [options]

options:
  -h --help:     This help
  -p --port:     Port to use [3172]
  -o --odir:     Directory to store final video in [current working directory]
  -n --noclean:  Do not clean up temporary files [false]
```

## Step 2: Edit your HTML & Javascript to use the client.

First, include the client library:

```html
<script src='http://localhost:3172/cvg.js'></script>
```

The `cvg` module has been added to the browser's global context.

Next, in your render loop, set up some logic to send frames to the server:

```javascript
var count = 0;

function render() {

  // Draw on your canvas.

  // Send the current canvas contents to the server.
  cvg.addFrame(canvas);

  count++;

  if (count < 100) {
    requestAnimationFrame(render);
  } else {
    // Tell the server that we're done with this video. Render it with the filename 'example' (.mp4 will be appended).
    cvg.render('example');
  }
}
```

Note that you'll want to fix your canvas size to the resolution you want your video rendered at.

That's it. Watch your terminal to see the video rendering progress. `cvg` will tell you where to find it when it's done.
