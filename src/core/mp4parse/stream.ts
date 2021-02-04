export default class Stream {

  buffer = null;

  position: number = 0;

  constructor(buffer) {
    this.buffer = buffer;
  }

  readType(length = 4) {
    // 判断类型为什么长度是4？
    // mp4box中类型描述为4个字符，截取4个创建对应的字符如：moov，ftyp。
    const typeBuffer = [];
    let i = 0;

    while (i < length) {
      i++;
      // 遍历type类型
      typeBuffer.push(this.buffer[this.position++]);
    }
    // 静态 String.fromCharCode() 方法返回由指定的 UTF-16 代码单元序列创建的字符串。   String.fromCodePoint()相同效果
    // fromCharCode()fromCharCode() 可接受一个指定的 Unicode 值
    return String.fromCharCode.apply(null, typeBuffer);
  }




  readByte(length) {
    switch (length) {
      case 1: {
        return this.readOneByte()
       }
      case 2: { 
        return this.readTwoByte()
      }
      case 3: {
        return this.readThreeByte()
       }
      case 4: {
        return this.readFourByte()
       }
      default: {
        return 0
      }
    }
  }

  readOneByte() {
    return this.buffer[this.position++] >>> 0
  }


  readTwoByte() {
    return (
      ((this.buffer[this.position++] << 8) | this.buffer[this.position++]) >>> 0
    )
  }
  readThreeByte() {
    return (
      ((this.buffer[this.position++] << 16) |
        (this.buffer[this.position++] << 8) |
        this.buffer[this.position++]) >>>
      0
    )
  }

  readFourByte() {
    return (
      ((this.buffer[this.position++] << 24) |
        (this.buffer[this.position++] << 16) |
        (this.buffer[this.position++] << 8) |
        this.buffer[this.position++]) >>> 0
    )
  }








}