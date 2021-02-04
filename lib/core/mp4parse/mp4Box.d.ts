export default class MP4Box {
    start: number;
    size: number;
    type: string;
    data: any;
    box: any;
    readSize(stream: any): void;
    readType(stream: any): void;
    readBody(stream: any): void;
    parserContainerBox(): void;
}
