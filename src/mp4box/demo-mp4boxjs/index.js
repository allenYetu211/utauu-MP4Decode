import ISOFile from './isofile'

class MP4Box {

  constructor(_keepMdatData, _stream) { }
  static createFile(_keepMdatData, _stream) {
    var keepMdatData = (_keepMdatData !== undefined ? _keepMdatData : true);
    var file = new ISOFile(_stream);
    file.discardMdatData = (keepMdatData ? false : true);
    return file;
  }
}

export default MP4Box;