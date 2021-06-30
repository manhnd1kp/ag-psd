"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writePsdBuffer = exports.writePsdUint8Array = exports.writePsd = exports.readPsd = exports.byteArrayToBase64 = exports.initializeCanvas = void 0;
var psdWriter_1 = require("./psdWriter");
var psdReader_1 = require("./psdReader");
__exportStar(require("./abr"), exports);
var helpers_1 = require("./helpers");
Object.defineProperty(exports, "initializeCanvas", { enumerable: true, get: function () { return helpers_1.initializeCanvas; } });
__exportStar(require("./psd"), exports);
var base64_js_1 = require("base64-js");
exports.byteArrayToBase64 = base64_js_1.fromByteArray;
function readPsd(buffer, options) {
    var reader = 'buffer' in buffer ?
        psdReader_1.createReader(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
        psdReader_1.createReader(buffer);
    return psdReader_1.readPsd(reader, options);
}
exports.readPsd = readPsd;
function writePsd(psd, options) {
    var writer = psdWriter_1.createWriter();
    psdWriter_1.writePsd(writer, psd, options);
    return psdWriter_1.getWriterBuffer(writer);
}
exports.writePsd = writePsd;
function writePsdUint8Array(psd, options) {
    var writer = psdWriter_1.createWriter();
    psdWriter_1.writePsd(writer, psd, options);
    return psdWriter_1.getWriterBufferNoCopy(writer);
}
exports.writePsdUint8Array = writePsdUint8Array;
function writePsdBuffer(psd, options) {
    if (typeof Buffer === 'undefined') {
        throw new Error('Buffer not supported on this platform');
    }
    return Buffer.from(writePsdUint8Array(psd, options));
}
exports.writePsdBuffer = writePsdBuffer;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFDQSx5Q0FBNEg7QUFDNUgseUNBQWtGO0FBQ2xGLHdDQUFzQjtBQUN0QixxQ0FBNkM7QUFBcEMsMkdBQUEsZ0JBQWdCLE9BQUE7QUFDekIsd0NBQXNCO0FBQ3RCLHVDQUEwQztBQVM3QixRQUFBLGlCQUFpQixHQUFHLHlCQUFhLENBQUM7QUFFL0MsU0FBZ0IsT0FBTyxDQUFDLE1BQWdDLEVBQUUsT0FBcUI7SUFDOUUsSUFBTSxNQUFNLEdBQUcsUUFBUSxJQUFJLE1BQU0sQ0FBQyxDQUFDO1FBQ2xDLHdCQUFZLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ25FLHdCQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDdEIsT0FBTyxtQkFBZSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUN6QyxDQUFDO0FBTEQsMEJBS0M7QUFFRCxTQUFnQixRQUFRLENBQUMsR0FBUSxFQUFFLE9BQXNCO0lBQ3hELElBQU0sTUFBTSxHQUFHLHdCQUFZLEVBQUUsQ0FBQztJQUM5QixvQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZDLE9BQU8sMkJBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNoQyxDQUFDO0FBSkQsNEJBSUM7QUFFRCxTQUFnQixrQkFBa0IsQ0FBQyxHQUFRLEVBQUUsT0FBc0I7SUFDbEUsSUFBTSxNQUFNLEdBQUcsd0JBQVksRUFBRSxDQUFDO0lBQzlCLG9CQUFnQixDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDdkMsT0FBTyxpQ0FBcUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN0QyxDQUFDO0FBSkQsZ0RBSUM7QUFFRCxTQUFnQixjQUFjLENBQUMsR0FBUSxFQUFFLE9BQXNCO0lBQzlELElBQUksT0FBTyxNQUFNLEtBQUssV0FBVyxFQUFFO1FBQ2xDLE1BQU0sSUFBSSxLQUFLLENBQUMsdUNBQXVDLENBQUMsQ0FBQztLQUN6RDtJQUVELE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUN0RCxDQUFDO0FBTkQsd0NBTUMiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQc2QsIFJlYWRPcHRpb25zLCBXcml0ZU9wdGlvbnMgfSBmcm9tICcuL3BzZCc7XG5pbXBvcnQgeyBQc2RXcml0ZXIsIHdyaXRlUHNkIGFzIHdyaXRlUHNkSW50ZXJuYWwsIGdldFdyaXRlckJ1ZmZlciwgY3JlYXRlV3JpdGVyLCBnZXRXcml0ZXJCdWZmZXJOb0NvcHkgfSBmcm9tICcuL3BzZFdyaXRlcic7XG5pbXBvcnQgeyBQc2RSZWFkZXIsIHJlYWRQc2QgYXMgcmVhZFBzZEludGVybmFsLCBjcmVhdGVSZWFkZXIgfSBmcm9tICcuL3BzZFJlYWRlcic7XG5leHBvcnQgKiBmcm9tICcuL2Ficic7XG5leHBvcnQgeyBpbml0aWFsaXplQ2FudmFzIH0gZnJvbSAnLi9oZWxwZXJzJztcbmV4cG9ydCAqIGZyb20gJy4vcHNkJztcbmltcG9ydCB7IGZyb21CeXRlQXJyYXkgfSBmcm9tICdiYXNlNjQtanMnO1xuZXhwb3J0IHsgUHNkUmVhZGVyLCBQc2RXcml0ZXIgfTtcblxuaW50ZXJmYWNlIEJ1ZmZlckxpa2Uge1xuXHRidWZmZXI6IEFycmF5QnVmZmVyO1xuXHRieXRlT2Zmc2V0OiBudW1iZXI7XG5cdGJ5dGVMZW5ndGg6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNvbnN0IGJ5dGVBcnJheVRvQmFzZTY0ID0gZnJvbUJ5dGVBcnJheTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRQc2QoYnVmZmVyOiBBcnJheUJ1ZmZlciB8IEJ1ZmZlckxpa2UsIG9wdGlvbnM/OiBSZWFkT3B0aW9ucyk6IFBzZCB7XG5cdGNvbnN0IHJlYWRlciA9ICdidWZmZXInIGluIGJ1ZmZlciA/XG5cdFx0Y3JlYXRlUmVhZGVyKGJ1ZmZlci5idWZmZXIsIGJ1ZmZlci5ieXRlT2Zmc2V0LCBidWZmZXIuYnl0ZUxlbmd0aCkgOlxuXHRcdGNyZWF0ZVJlYWRlcihidWZmZXIpO1xuXHRyZXR1cm4gcmVhZFBzZEludGVybmFsKHJlYWRlciwgb3B0aW9ucyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZVBzZChwc2Q6IFBzZCwgb3B0aW9ucz86IFdyaXRlT3B0aW9ucyk6IEFycmF5QnVmZmVyIHtcblx0Y29uc3Qgd3JpdGVyID0gY3JlYXRlV3JpdGVyKCk7XG5cdHdyaXRlUHNkSW50ZXJuYWwod3JpdGVyLCBwc2QsIG9wdGlvbnMpO1xuXHRyZXR1cm4gZ2V0V3JpdGVyQnVmZmVyKHdyaXRlcik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZVBzZFVpbnQ4QXJyYXkocHNkOiBQc2QsIG9wdGlvbnM/OiBXcml0ZU9wdGlvbnMpOiBVaW50OEFycmF5IHtcblx0Y29uc3Qgd3JpdGVyID0gY3JlYXRlV3JpdGVyKCk7XG5cdHdyaXRlUHNkSW50ZXJuYWwod3JpdGVyLCBwc2QsIG9wdGlvbnMpO1xuXHRyZXR1cm4gZ2V0V3JpdGVyQnVmZmVyTm9Db3B5KHdyaXRlcik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZVBzZEJ1ZmZlcihwc2Q6IFBzZCwgb3B0aW9ucz86IFdyaXRlT3B0aW9ucyk6IEJ1ZmZlciB7XG5cdGlmICh0eXBlb2YgQnVmZmVyID09PSAndW5kZWZpbmVkJykge1xuXHRcdHRocm93IG5ldyBFcnJvcignQnVmZmVyIG5vdCBzdXBwb3J0ZWQgb24gdGhpcyBwbGF0Zm9ybScpO1xuXHR9XG5cblx0cmV0dXJuIEJ1ZmZlci5mcm9tKHdyaXRlUHNkVWludDhBcnJheShwc2QsIG9wdGlvbnMpKTtcbn1cbiJdLCJzb3VyY2VSb290IjoiL2hvbWUvbWFuaC9rYW9waXovZWVsL2FnLXBzZC9zcmMifQ==
