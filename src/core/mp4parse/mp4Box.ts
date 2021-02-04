import boxParse from './boxes';
import Stream from './stream';


const CONTAINER_BOXES = ['moov', 'trak', 'edts', 'mdia', 'minf', 'dinf', 'stbl']

const SPECIAL_BOXES = ['udta', 'free']


export default class MP4Box {
  start: number = 0;
  size: number = 0;
  type: string = '';
  data: any;
  box: any = {};

  readSize(stream) {
    // 大小分析
    this.start = stream.position
    this.size = stream.readByte(4)
  }

  readType(stream) {
    this.type = stream.readType()
  }

  readBody(stream) {
    this.data = stream.buffer.slice(stream.position, this.size + this.start);
    // console.log('this.data:::===>>>', this.type);
    // 枚举字段
    if (
      CONTAINER_BOXES.find(item => item === this.type) || 
      SPECIAL_BOXES.find(item => item === this.type)
    ) {
      this.parserContainerBox()
    } else {
      if (!boxParse[this.type]) {
        this.box = {}
      }  else {
      // 获取 mp4 box 类型
      // console.log('boxParse[this.type]', this.type);
        this.box = {
          ...this.box,
          ...boxParse[this.type](this.data),
        }
      }
      // 修改stream 定位
      stream.position += this.data.length
    }
  }

  parserContainerBox() {
    const stream = new Stream(this.data)
    const size = stream.buffer.length
    while (stream.position < size) {
      const Box = new MP4Box()
      Box.readSize(stream)
      Box.readType(stream)
      Box.readBody(stream)
      if (Box.type === 'trak' && Box.box.mdia && Box.box.mdia.hdlr) {

        const handlerType = Box.box.mdia.hdlr.handlerType
        if (handlerType === 'vide') {
          this.box.videoTrak = Box.box
        } else if (handlerType === 'soun') {
          this.box.audioTrak = Box.box
        } else {
          this.box[`${handlerType}Trak`] = Box.box
        }
      } else {
        this.box[Box.type] = Box.box
      }
      // console.log('this.box::', this.box)

    }
  }

}