import MultiBufferStream from './MultiBufferStream';
import {Log} from './log';

export default class ISOFile {
  constructor(stream) {
  this.stream = stream || new MultiBufferStream();
	this.boxes = [];
	this.mdats = [];
	this.moofs = [];
	this.isProgressive = false;
	this.moovStartFound = false;
	this.onMoovStart = null;
	this.moovStartSent = false;
	this.onReady = null;
	this.readySent = false;
	this.onSegment = null;
	this.onSamples = null;
	this.onError = null;
	this.sampleListBuilt = false;
	this.fragmentedTracks = [];
	this.extractedTracks = [];
	this.isFragmentationInitialized = false;
	this.sampleProcessingStarted = false;
	this.nextMoofNumber = 0;
	this.itemListBuilt = false;
	this.onSidx = null;
	this.sidxSent = false;
  }

  // 添加 buffer
  appendBuffer (ab, last) {
    var nextFileStart;
  
    // 判断buffer 是否存在
    if (!this.checkBuffer(ab)) {
      return;
    }
  
    // 解析数据
    /* Parse whatever is in the existing buffers */
    this.parse();
  
    /* Check if the moovStart callback needs to be called */
    if (this.moovStartFound && !this.moovStartSent) {
      this.moovStartSent = true;
      if (this.onMoovStart) this.onMoovStart();
    }
  
    if (this.moov) {
      /* A moov box has been entirely parsed */
  
      /* if this is the first call after the moov is found we initialize the list of samples (may be empty in fragmented files) */
      if (!this.sampleListBuilt) {
        this.buildSampleLists();
        this.sampleListBuilt = true;
      }
  
      /* We update the sample information if there are any new moof boxes */
      this.updateSampleLists();
  
      /* If the application needs to be informed that the 'moov' has been found,
         we create the information object and callback the application */
      if (this.onReady && !this.readySent) {
        this.readySent = true;
        this.onReady(this.getInfo());
      }
  
      /* See if any sample extraction or segment creation needs to be done with the available samples */
      this.processSamples(last);
  
      /* Inform about the best range to fetch next */
      if (this.nextSeekPosition) {
        nextFileStart = this.nextSeekPosition;
        this.nextSeekPosition = undefined;
      } else {
        nextFileStart = this.nextParsePosition;
      }
      if (this.stream.getEndFilePositionAfter) {
        nextFileStart = this.stream.getEndFilePositionAfter(nextFileStart);
      }
    } else {
      if (this.nextParsePosition) {
        /* moov has not been parsed but the first buffer was received,
           the next fetch should probably be the next box start */
        nextFileStart = this.nextParsePosition;
      } else {
        /* No valid buffer has been parsed yet, we cannot know what to parse next */
        nextFileStart = 0;
      }
    }
    if (this.sidx) {
      if (this.onSidx && !this.sidxSent) {
        this.onSidx(this.sidx);
        this.sidxSent = true;
      }
    }
    if (this.meta) {
      if (this.flattenItemInfo && !this.itemListBuilt) {
        this.flattenItemInfo();
        this.itemListBuilt = true;
      }
      if (this.processItems) {
        this.processItems(this.onItem);
      }
    }
  
    if (this.stream.cleanBuffers) {
      Log.info("ISOFile", "Done processing buffer (fileStart: " + ab.fileStart + ") - next buffer to fetch should have a fileStart position of " + nextFileStart);
      this.stream.logBufferLevel();
      this.stream.cleanBuffers();
      this.stream.logBufferLevel(true);
      Log.info("ISOFile", "Sample data size in memory: " + this.getAllocatedSampleDataSize());
    }
    return nextFileStart;
  }


  checkBuffer (ab) {
    if (ab === null || ab === undefined) {
      throw ("Buffer must be defined and non empty");
    }
    if (ab.fileStart === undefined) {
      throw ("Buffer must have a fileStart property");
    }
    if (ab.byteLength === 0) {
      this.stream.logBufferLevel();
      return false;
    }
  
    /* mark the bytes in the buffer as not being used yet */
    ab.usedBytes = 0;
    this.stream.insertBuffer(ab);
    this.stream.logBufferLevel();
  
    if (!this.stream.initialized()) {
      return false;
    }
    return true;
  }

  // 解析数据
  parse  () {
    var found;
    var ret;
    var box;
    var parseBoxHeadersOnly = false;
  
    if (this.restoreParsePosition) {
      if (!this.restoreParsePosition()) {
        return;
      }
    }
  
    while (true) {
  
      if (this.hasIncompleteMdat && this.hasIncompleteMdat()) {
        if (this.processIncompleteMdat()) {
          continue;
        } else {
          return;
        }
      } else {
        if (this.saveParsePosition) {
          // 记录解析位置
          this.saveParsePosition();
        }
        ret = BoxParser.parseOneBox(this.stream, parseBoxHeadersOnly);
        if (ret.code === BoxParser.ERR_NOT_ENOUGH_DATA) {
          if (this.processIncompleteBox) {
            if (this.processIncompleteBox(ret)) {
              continue;
            } else {
              return;
            }
          } else {
            return;
          }
        } else {
          var box_type;
          /* the box is entirely parsed */
          box = ret.box;
          box_type = (box.type !== "uuid" ? box.type : box.uuid);
          /* store the box in the 'boxes' array to preserve box order (for file rewrite if needed)  */
          this.boxes.push(box);
          /* but also store box in a property for more direct access */
          switch (box_type) {
            case "mdat":
              this.mdats.push(box);
              break;
            case "moof":
              this.moofs.push(box);
              break;
            case "moov":
              this.moovStartFound = true;
              if (this.mdats.length === 0) {
                this.isProgressive = true;
              }
            /* no break */
            /* falls through */
            default:
              if (this[box_type] !== undefined) {
                Log.warn("ISOFile", "Duplicate Box of type: " + box_type + ", overriding previous occurrence");
              }
              this[box_type] = box;
              break;
          }
          if (this.updateUsedBytes) {
            this.updateUsedBytes(box, ret);
          }
        }
      }
    }
  }


}