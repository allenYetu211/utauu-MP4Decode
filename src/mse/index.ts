import ffetch from '../http/index';
// import ffetch from '../http/axios';
// import concatTypedArray from '../utils/concat';

import Mp4Parse from '../core/mp4parse';

import MP4Probe from '../core/mp4parse/mp4probe';

import FMP4 from '../core/fmp4';

import concatTypedArray from '../core/fmp4/utils/concatTypedArray';

import log from '../utils/log';



const SEGMENTBYTE = 200000;

let index = 0;


export default class MSE {

  public videoEl: HTMLVideoElement;
  public src: string;

  public mediaSource: MediaSource;
  public sourceBuffer: { video: any, audio: any } = { video: '', audio: '' };

  public mp4Probe: any;

  private videoQueue: any[] = [];
  private audioQueue: any[] = [];

  private evt: any;
  private needUpdateTime: boolean = false;


  constructor(videoEl, src) {
    this.videoEl = videoEl;
    this.src = src;
    this.initSource()
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
  initSource = () => {
    this.mediaSource = new MediaSource();
    this.mediaSource.addEventListener('sourceopen', evt => this.sourceOpen(evt));
    this.videoEl.src = URL.createObjectURL(this.mediaSource);

  }

  // 2、 监听媒体接口
  sourceOpen = (evt) => {
    this.evt = evt;
    // 销毁url， 控制内存
    // URL.revokeObjectURL(this.videoEl.src);
    // URL.revokeObjectURL(evt.target.src);
    const mimeTypes = {
      // video/mp4; codecs="avc1.42E01E,mp4a.40.2"
      // video/mp4; codecs="avc1.64001E, mp4a.40.5"
      // video/mp4; codecs="avc1.64001E, mp4a.40.5"
      // video: 'video/mp4; codecs="avc1.64001E, mp4a.40.5"',

      
      // video: 'video/mp4; codecs="avc1.64001f"',
      video: 'video/mp4; codecs="avc1.42E01E"',
      audio: 'audio/mp4; codecs="mp4a.40.2"',
    }
    this.sourceBuffer.video = this.mediaSource.addSourceBuffer(mimeTypes.video);
    this.sourceBuffer.audio = this.mediaSource.addSourceBuffer(mimeTypes.audio);

    this.sourceBuffer.video.addEventListener('updateend', () => {
      const buffer = this.videoQueue.shift()
      if (buffer && this.mediaSource.readyState === 'open') {
        this.handleAppendBuffer(buffer, 'video');

      }
      if (this.needUpdateTime) {
        this.needUpdateTime = false
        this.handleTimeUpdate()
      }
    })

    this.sourceBuffer.audio.addEventListener('updateend', () => {
      const buffer = this.audioQueue.shift()

      if (buffer && this.mediaSource.readyState === 'open') {
        this.handleAppendBuffer(buffer, 'audio');
      }
    })

  }

  handleTimeUpdate = () => {
    if (!this.mp4Probe) {
      return
    }
    const {
      videoInterval: { offsetInterVal = [] } = [],
      mp4Data: { videoSamplesLength },
      timeRange = [],
    } = this.mp4Probe

    if (this.mediaSource.readyState !== 'closed') {
      if (
        offsetInterVal[1] === videoSamplesLength &&
        this.videoEl.currentTime > timeRange[0]
      ) {
        this.destroy()
      } else if (this.shouldFetchNextSegment()) {
        this.seek()
      }
    }
  }

  shouldFetchNextSegment = () => {
    this.handleReplayCase()
    if (this.mp4Probe.isDraining(this.videoEl.currentTime)) {
      return true
    }
    return false
  }

  handleReplayCase = () => {
    console.log('this.mediaSource.readyState>>>>>>', this.mediaSource.readyState);
    if (this.mediaSource.readyState === 'ended') {
      // If MediaSource.readyState value is ended,
      // setting SourceBuffer.timestampOffset will cause this value to transition to open.
      this.sourceBuffer.video.timestampOffset = 0
    }
  }


  destroy = () => {
    this.mediaSource.removeEventListener('sourceopen', this.sourceOpen)
    URL.revokeObjectURL(this.videoEl.src)
    if (
      this.mediaSource.readyState === 'open' &&
      !this.sourceBuffer.video.updating &&
      !this.sourceBuffer.audio.updating
    ) {
      this.mediaSource.endOfStream()
    }
  }

  init = () => {
    //  根据分辨率像素数据。
    const chunkSize = 1280 * 640;
    // const chunkSize = 4691480;
    this.loader(0, chunkSize).then((res: any) => {
      return res.arrayBuffer();
    }).then((data: ArrayBuffer) => {
      // 分析媒体格式
      return new Mp4Parse(new Uint8Array(data)).mp4BoxTreeObject;
    }).then((mp4BoxTreeObject) => {

      console.log('mp4BoxTreeObject::::>>>>>>', mp4BoxTreeObject)

      // 获取关键帧
      // 获取流媒体关键信息
      this.mp4Probe = new MP4Probe(mp4BoxTreeObject);
      this.mp4Probe.mp4BoxTreeObject = mp4BoxTreeObject;

      console.log('mp4BoxTreeObject.moov.duration', mp4BoxTreeObject.moov)

      // 设置视频
      this.evt.duration = mp4BoxTreeObject.moov.mvhd.duration / mp4BoxTreeObject.moov.mvhd.timescale;

      console.log(' this.mediaSource.duration', this.evt.duration)
      // 合成FMP4视频信息
      const videoRawData = concatTypedArray(
        FMP4.ftyp(),
        FMP4.moov(this.mp4Probe.mp4Data, 'video')
      )


      const audioRawData = concatTypedArray(
        FMP4.ftyp(),
        FMP4.moov(this.mp4Probe.mp4Data, 'audio')
      )

      console.log('this.mediaSource.readyState', this.mediaSource.readyState)
      if (this.mediaSource.readyState === 'open') {
        // this.sourceBuffer.video.appendBuffer(videoRawData);
        // this.sourceBuffer.audio.appendBuffer(audioRawData);
        this.handleAppendBuffer(videoRawData, 'video');
        this.handleAppendBuffer(audioRawData, 'audio');
        console.log('=>>>>>>>>>')
        // this.seek(0)/
      }
      // 获取视频关键信息
    })
  }

  seek = (time?: number) => {
    const [start, end] = this.mp4Probe.getFragmentPosition(time);

    this.handleReplayCase()


    this.loader(start, end).then((res: any) => {
      return res.arrayBuffer();
    }).then((mdatBuffer: ArrayBuffer) => {
      const { videoTrackInfo, audioTrackInfo } = this.mp4Probe.getTrackInfo(
        mdatBuffer
      )

      const { videoInterval, audioInterval } = this.mp4Probe
      const videoBaseMediaDecodeTime = videoInterval.timeInterVal[0]
      const audioBaseMediaDecodeTime = audioInterval.timeInterVal[0]

      const videoRawData = concatTypedArray(
        FMP4.moof(videoTrackInfo, videoBaseMediaDecodeTime),
        FMP4.mdat(videoTrackInfo)
      )

      if (audioTrackInfo.samples.length !== 0) {
        const audioRawData = concatTypedArray(
          FMP4.moof(audioTrackInfo, audioBaseMediaDecodeTime),
          FMP4.mdat(audioTrackInfo)
        )
        this.handleAppendBuffer(audioRawData, 'audio');
      }

      this.handleAppendBuffer(videoRawData, 'video');

      if (time) {
        this.needUpdateTime = true
      }


      // console.log('endOfStream')
      // this.mediaSource.endOfStream()

    })

  }


  handleAppendBuffer = (buffer, type) => {
    if (this.mediaSource.readyState === 'open') {
      try {
        if (this.sourceBuffer[type]) {
          console.log('this.sourceBuffer[type]: ',type ,  buffer )
          this.sourceBuffer[type].appendBuffer(buffer)
        }
      } catch (error) {
        // see https://developers.google.com/web/updates/2017/10/quotaexceedederror
        if (error.code === 22) {
          console.log('error::::', error)
          this.handleQuotaExceededError(buffer, type)
        } else {
          throw error
        }
      }
    } else {
      console.log('[`${type}Queue`] ',`${type}Queue`,  buffer )
      this[`${type}Queue`].push(buffer)
    }
  }

  handleQuotaExceededError = (buffer, type) => {
    for (const key in this.sourceBuffer) {
      const track = this.sourceBuffer[key]

      const currentTime = this.videoEl.currentTime

      let removeStart = 0

      if (track.buffered.length > 0) {
        removeStart = track.buffered.start(0) + 10
      }
      this.removeBuffer(removeStart, currentTime - 10, key)
    }

    // re-append(maybe should lower the playback resolution)
    this.handleAppendBuffer(buffer, type)
  }

  removeBuffer(start, end, type) {
    console.log('removeBuffer')
    const track = this.sourceBuffer[type]
    if (track.updating) {
      // const {isSafari} = ua

      // if (isSafari) {
      //   // Safari 9/10/11/12 does not correctly implement abort() on SourceBuffer.
      //   // Calling abort() before appending a segment causes that segment to be
      //   // incomplete in buffer.
      //   // Bug filed: https://bugs.webkit.org/show_bug.cgi?id=165342
      //   abortPolyfill()
      // }
      track.abort()
    }
    track.remove(start, end)
  }
}