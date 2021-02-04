
import log from '../../utils/log';
import Stream from './stream';
import Box from './mp4Box';


export default class Mp4Parse {

  private  buffer: any;

  private  stream: Stream;

  mp4BoxTreeObject : any = {};

  constructor (buffer) {
    this.buffer = buffer;
    this.stream = new Stream(buffer);
    this.init();
  }

  init () {
    while (this.stream.position < this.buffer.length) {
      const MP4BOX = new Box();
      MP4BOX.readSize(this.stream);
      MP4BOX.readType(this.stream);
      MP4BOX.readBody(this.stream);
      this.mp4BoxTreeObject[MP4BOX.type] = MP4BOX.box
      this.mp4BoxTreeObject[MP4BOX.type].size = MP4BOX.size
    }
  }

}