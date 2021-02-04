export default class FMP4Generator {
    static sequenceNumber: number;
    static ftyp(): Uint8Array;
    static moov(data: any, type: any): Uint8Array;
    static moof(trackInfo: any, baseMediaDecodeTime: any): Uint8Array;
    static mdat(trackInfo: any): Uint8Array;
}
