export default class MSE {
    videoEl: HTMLVideoElement;
    src: string;
    mediaSource: MediaSource;
    sourceBuffer: {
        video: any;
        audio: any;
    };
    mp4Probe: any;
    private videoQueue;
    private audioQueue;
    private evt;
    private needUpdateTime;
    constructor(videoEl: any, src: any);
    loader: (start?: number, end?: number) => Promise<unknown>;
    initSource: () => void;
    sourceOpen: (evt: any) => void;
    handleTimeUpdate: () => void;
    shouldFetchNextSegment: () => boolean;
    handleReplayCase: () => void;
    destroy: () => void;
    init: () => void;
    seek: (time?: number) => void;
    handleAppendBuffer: (buffer: any, type: any) => void;
    handleQuotaExceededError: (buffer: any, type: any) => void;
    removeBuffer(start: any, end: any, type: any): void;
}
