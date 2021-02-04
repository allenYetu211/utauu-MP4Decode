export default class MSE {
    videoEl: HTMLVideoElement;
    src: string;
    mediaSource: MediaSource;
    sourceBuffer: any;
    mp4probe: any;
    private videoQuery;
    constructor(videoEl: any, src: any);
    loader: (start?: number, end?: number) => Promise<unknown>;
    init: () => void;
    sourceOpen: (evt: any) => void;
}
