export default class Stream {
    buffer: any;
    position: number;
    constructor(buffer: any);
    readType(length?: number): any;
    readByte(length: any): number;
    readOneByte(): number;
    readTwoByte(): number;
    readThreeByte(): number;
    readFourByte(): number;
}
