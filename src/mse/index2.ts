import ffetch from '../http/index';

import Mp4Parse from '../core/mp4parse';

import MP4Probe from '../core/mp4parse/mp4probe';

import FMP4 from '../core/fmp4';

import concatTypedArray from '../core/fmp4/utils/concatTypedArray';

// import log from '../utils/log';



const SEGMENTBYTE = 200000;

// let index = 0;


export default class MSE {

  public videoEl: HTMLVideoElement;
  public src: string;

  public mediaSource: MediaSource;
  // public sourceBuffer: { video: any, audio: any } = { video: '', audio: '' };
  public sourceBuffer: any;

  public mp4probe: any;

  private videoQuery: any[] = [];


  constructor(videoEl, src) {
    this.videoEl = videoEl;
    this.src = src;
  }

  // 加载数据
  loader = (start = 0, end = SEGMENTBYTE) => {
    return new Promise((resolve, reject) => {
      ffetch({ url: this.src, start, end }).then((data) => {
        resolve(data)
      })
    })
  }

  // 1、 初始媒体信息
  init = () => {
    this.mediaSource = new MediaSource();
    this.videoEl.src = URL.createObjectURL(this.mediaSource);
    console.log('this.video.src', this.videoEl.src);
    this.mediaSource.addEventListener('sourceopen', evt => this.sourceOpen(evt));
  }

  // 2、 监听媒体接口
  sourceOpen = (evt) => {
    // 销毁url， 控制内存
    this.sourceBuffer = this.mediaSource.addSourceBuffer('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
    //  根据分辨率像素数据。
    const chunkSize = 43224;
    this.loader(0, chunkSize).then((res: any) => {
      return res.arrayBuffer();
    }).then((data: ArrayBuffer) => {

      return new Mp4Parse(new Uint8Array(data)).mp4BoxTreeObject;

      this.sourceBuffer.addEventListener('updateend', () => {
        if (!this.sourceBuffer.updating && this.mediaSource.readyState === 'open') {
          console.log('endOfStream -->>>')
          // this.mediaSource.endOfStream()
        }
      })


      this.sourceBuffer.appendBuffer(new Uint8Array(data));
      console.log('appendBuffer -->>>')


      this.videoEl.addEventListener('timeupdate', () => {
        console.log('timeupdate')
      });

      this.videoEl.addEventListener('canplay', () => {
        console.log('canplay')
        this.videoEl.play();
      });

      this.videoEl.addEventListener('seeking', () => {
        console.log('seeking')
      });

    }).then((mp4BoxTreeObject: any) => {
      console.log('mp4BoxTreeObject', mp4BoxTreeObject)

      this.mp4probe = new MP4Probe(mp4BoxTreeObject)
      console.log('mp4Probe:::', this.mp4probe);

      const videoRawData = concatTypedArray(
        FMP4.ftyp(),
        FMP4.moov(this.mp4probe.mp4Data, 'video')
      )

      const audioRawData = concatTypedArray(
        FMP4.ftyp(),
        FMP4.moov(this.mp4probe.mp4Data, 'audio')
      )

      console.log('this.mediaSource.readyState', this.mediaSource.readyState)

      // this.handleAppendBuffer(videoRawData, 'video')
      // this.handleAppendBuffer(audioRawData, 'audio')
      
    })

  }
  
}