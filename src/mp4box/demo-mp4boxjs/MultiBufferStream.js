
import {Log} from './log';

export default class MultiBufferStream {
  constructor(buffer) {
    /* List of ArrayBuffers, with a fileStart property, sorted in fileStart order and non overlapping */
    this.buffers = [];
    this.bufferIndex = -1;
    if (buffer) {
      this.insertBuffer(buffer);
      this.bufferIndex = 0;
    }
  }

  insertBuffer(ab) {
    var to_add = true;
    /* TODO: improve insertion if many buffers */
    for (var i = 0; i < this.buffers.length; i++) {
      var b = this.buffers[i];
      if (ab.fileStart <= b.fileStart) {
        /* the insertion position is found */
        if (ab.fileStart === b.fileStart) {
          /* The new buffer overlaps with an existing buffer */
          if (ab.byteLength > b.byteLength) {
            /* the new buffer is bigger than the existing one
               remove the existing buffer and try again to insert 
               the new buffer to check overlap with the next ones */
            this.buffers.splice(i, 1);
            i--;
            continue;
          } else {
            /* the new buffer is smaller than the existing one, just drop it */
            Log.warn("MultiBufferStream", "Buffer (fileStart: " + ab.fileStart + " - Length: " + ab.byteLength + ") already appended, ignoring");
          }
        } else {
          /* The beginning of the new buffer is not overlapping with an existing buffer
             let's check the end of it */
          if (ab.fileStart + ab.byteLength <= b.fileStart) {
            /* no overlap, we can add it as is */
          } else {
            /* There is some overlap, cut the new buffer short, and add it*/
            ab = this.reduceBuffer(ab, 0, b.fileStart - ab.fileStart);
          }
          Log.debug("MultiBufferStream", "Appending new buffer (fileStart: " + ab.fileStart + " - Length: " + ab.byteLength + ")");
          this.buffers.splice(i, 0, ab);
          /* if this new buffer is inserted in the first place in the list of the buffer, 
             and the DataStream is initialized, make it the buffer used for parsing */
          if (i === 0) {
            this.buffer = ab;
          }
        }
        to_add = false;
        break;
      } else if (ab.fileStart < b.fileStart + b.byteLength) {
        /* the new buffer overlaps its beginning with the end of the current buffer */
        var offset = b.fileStart + b.byteLength - ab.fileStart;
        var newLength = ab.byteLength - offset;
        if (newLength > 0) {
          /* the new buffer is bigger than the current overlap, drop the overlapping part and try again inserting the remaining buffer */
          ab = this.reduceBuffer(ab, offset, newLength);
        } else {
          /* the content of the new buffer is entirely contained in the existing buffer, drop it entirely */
          to_add = false;
          break;
        }
      }
    }
    /* if the buffer has not been added, we can add it at the end */
    if (to_add) {
      // Log.debug("MultiBufferStream", "Appending new buffer (fileStart: " + ab.fileStart + " - Length: " + ab.byteLength + ")");
      this.buffers.push(ab);
      /* if this new buffer is inserted in the first place in the list of the buffer, 
         and the DataStream is initialized, make it the buffer used for parsing */
      if (i === 0) {
        this.buffer = ab;
      }
    }
  }

  reduceBuffer(buffer, offset, newLength) {
    var smallB;
    smallB = new Uint8Array(newLength);
    smallB.set(new Uint8Array(buffer, offset, newLength));
    smallB.buffer.fileStart = buffer.fileStart + offset;
    smallB.buffer.usedBytes = 0;
    return smallB.buffer;
  }


  logBufferLevel (info) {
    var i;
    var buffer;
    var used, total;
    var ranges = [];
    var range;
    var bufferedString = "";
    used = 0;
    total = 0;
    for (i = 0; i < this.buffers.length; i++) {
      buffer = this.buffers[i];
      if (i === 0) {
        range = {};
        ranges.push(range);
        range.start = buffer.fileStart;
        range.end = buffer.fileStart + buffer.byteLength;
        bufferedString += "[" + range.start + "-";
      } else if (range.end === buffer.fileStart) {
        range.end = buffer.fileStart + buffer.byteLength;
      } else {
        range = {};
        range.start = buffer.fileStart;
        bufferedString += (ranges[ranges.length - 1].end - 1) + "], [" + range.start + "-";
        range.end = buffer.fileStart + buffer.byteLength;
        ranges.push(range);
      }
      used += buffer.usedBytes;
      total += buffer.byteLength;
    }
    if (ranges.length > 0) {
      bufferedString += (range.end - 1) + "]";
    }
    if (this.buffers.length === 0) {
      Log.log("MultiBufferStream", "No more buffer in memory");
    } else {
      Log.log("MultiBufferStream", "" + this.buffers.length + " stored buffer(s) (" + used + "/" + total + " bytes): " + bufferedString);
    }
  }

  initialized () {
    var firstBuffer;
    if (this.bufferIndex > -1) {
      return true;
    } else if (this.buffers.length > 0) {
      firstBuffer = this.buffers[0];
      if (firstBuffer.fileStart === 0) {
        this.buffer = firstBuffer;
        this.bufferIndex = 0;
        Log.debug("MultiBufferStream", "Stream ready for parsing");
        return true;
      } else {
        Log.warn("MultiBufferStream", "The first buffer should have a fileStart of 0");
        this.logBufferLevel();
        return false;
      }
    } else {
      Log.warn("MultiBufferStream", "No buffer to start parsing from");
      this.logBufferLevel();
      return false;
    }
  }
}