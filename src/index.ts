
// import MSE from './mse/index2';
import MSE from './mse';

const videoEL: HTMLVideoElement = document.querySelector('#videoEl');
const init = document.querySelector('#init');
const play = document.querySelector('#play');
const nextSegment = document.querySelector('#nextSegment');


// const mse  = new MSE(videoEL, 'http://localhost:3000/old.mp4');
// const mse  = new MSE(videoEL, 'https://testdevcdn.xylink.com/test-video/video.mp4?v=2');
// const mse  = new MSE(videoEL, 'https://devcdn.xylink.com/video-tset/dpi1.mp4');
// const mse  = new MSE(videoEL, 'http://localhost:3000/1.mp4');

// const mse  = new MSE(videoEL, 'https://devcdn.xylink.com/video-tset/test.mp4'); // not fmp4d

// const mse = new MSE(videoEL, 'https://testdevcdn.xylink.com/test-video/video.mp4'); // not fmp4d

// const mse = new MSE(videoEL, 'https://testdevcdn.xylink.com/test-video/xg360.mp4'); // not fmp4d  last moov

const mse = new MSE(videoEL, 'https://testdevcdn.xylink.com/test-video/xg360Moov.mp4'); // not fmp4d  first moov

// const mse  = new MSE(videoEL, 'https://devcdn.xylink.com/video-tset/base.mp4'); //  fmp4

// mse.init()


init.addEventListener('click', () => {
  mse.init()
})


play.addEventListener('click', () => {
  // videoEL.play()
  mse.seek(0)
})


videoEL.addEventListener('timeupdate', () => {
  console.log('timeupdate');
  mse.handleTimeUpdate()
});

videoEL.addEventListener('seeking', () => {
  console.log('seeking')
  const currentTime = videoEL.currentTime
  const buffered = videoEL.buffered

  if (buffered && buffered.length > 0) {
    if (currentTime - 0.1 > buffered.start(0)) {
      mse.seek(videoEL.currentTime)
    }
  } else {
    mse.seek(videoEL.currentTime)
  }
})



nextSegment.addEventListener('click', () => {
  mse.seek(20)
  // videoEL.play().then(() => {
  //   console.log('play')
  // }).catch((err) => {
  //   console.log('err', err)
  // })
})
