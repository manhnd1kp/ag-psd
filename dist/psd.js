"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SectionDividerType = exports.ColorMode = void 0;
var ColorMode;
(function (ColorMode) {
    ColorMode[ColorMode["Bitmap"] = 0] = "Bitmap";
    ColorMode[ColorMode["Grayscale"] = 1] = "Grayscale";
    ColorMode[ColorMode["Indexed"] = 2] = "Indexed";
    ColorMode[ColorMode["RGB"] = 3] = "RGB";
    ColorMode[ColorMode["CMYK"] = 4] = "CMYK";
    ColorMode[ColorMode["Multichannel"] = 7] = "Multichannel";
    ColorMode[ColorMode["Duotone"] = 8] = "Duotone";
    ColorMode[ColorMode["Lab"] = 9] = "Lab";
})(ColorMode = exports.ColorMode || (exports.ColorMode = {}));
var SectionDividerType;
(function (SectionDividerType) {
    SectionDividerType[SectionDividerType["Other"] = 0] = "Other";
    SectionDividerType[SectionDividerType["OpenFolder"] = 1] = "OpenFolder";
    SectionDividerType[SectionDividerType["ClosedFolder"] = 2] = "ClosedFolder";
    SectionDividerType[SectionDividerType["BoundingSectionDivider"] = 3] = "BoundingSectionDivider";
})(SectionDividerType = exports.SectionDividerType || (exports.SectionDividerType = {}));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBzZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFNQSxJQUFrQixTQVNqQjtBQVRELFdBQWtCLFNBQVM7SUFDMUIsNkNBQVUsQ0FBQTtJQUNWLG1EQUFhLENBQUE7SUFDYiwrQ0FBVyxDQUFBO0lBQ1gsdUNBQU8sQ0FBQTtJQUNQLHlDQUFRLENBQUE7SUFDUix5REFBZ0IsQ0FBQTtJQUNoQiwrQ0FBVyxDQUFBO0lBQ1gsdUNBQU8sQ0FBQTtBQUNSLENBQUMsRUFUaUIsU0FBUyxHQUFULGlCQUFTLEtBQVQsaUJBQVMsUUFTMUI7QUFFRCxJQUFrQixrQkFLakI7QUFMRCxXQUFrQixrQkFBa0I7SUFDbkMsNkRBQVMsQ0FBQTtJQUNULHVFQUFjLENBQUE7SUFDZCwyRUFBZ0IsQ0FBQTtJQUNoQiwrRkFBMEIsQ0FBQTtBQUMzQixDQUFDLEVBTGlCLGtCQUFrQixHQUFsQiwwQkFBa0IsS0FBbEIsMEJBQWtCLFFBS25DIiwiZmlsZSI6InBzZC5qcyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCB0eXBlIEJsZW5kTW9kZSA9ICdwYXNzIHRocm91Z2gnIHwgJ25vcm1hbCcgfCAnZGlzc29sdmUnIHwgJ2RhcmtlbicgfCAnbXVsdGlwbHknIHxcblx0J2NvbG9yIGJ1cm4nIHwgJ2xpbmVhciBidXJuJyB8ICdkYXJrZXIgY29sb3InIHwgJ2xpZ2h0ZW4nIHwgJ3NjcmVlbicgfCAnY29sb3IgZG9kZ2UnIHxcblx0J2xpbmVhciBkb2RnZScgfCAnbGlnaHRlciBjb2xvcicgfCAnb3ZlcmxheScgfCAnc29mdCBsaWdodCcgfCAnaGFyZCBsaWdodCcgfFxuXHQndml2aWQgbGlnaHQnIHwgJ2xpbmVhciBsaWdodCcgfCAncGluIGxpZ2h0JyB8ICdoYXJkIG1peCcgfCAnZGlmZmVyZW5jZScgfCAnZXhjbHVzaW9uJyB8XG5cdCdzdWJ0cmFjdCcgfCAnZGl2aWRlJyB8ICdodWUnIHwgJ3NhdHVyYXRpb24nIHwgJ2NvbG9yJyB8ICdsdW1pbm9zaXR5JztcblxuZXhwb3J0IGNvbnN0IGVudW0gQ29sb3JNb2RlIHtcblx0Qml0bWFwID0gMCxcblx0R3JheXNjYWxlID0gMSxcblx0SW5kZXhlZCA9IDIsXG5cdFJHQiA9IDMsXG5cdENNWUsgPSA0LFxuXHRNdWx0aWNoYW5uZWwgPSA3LFxuXHREdW90b25lID0gOCxcblx0TGFiID0gOSxcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gU2VjdGlvbkRpdmlkZXJUeXBlIHtcblx0T3RoZXIgPSAwLFxuXHRPcGVuRm9sZGVyID0gMSxcblx0Q2xvc2VkRm9sZGVyID0gMixcblx0Qm91bmRpbmdTZWN0aW9uRGl2aWRlciA9IDMsXG59XG5cbmV4cG9ydCB0eXBlIFJHQkEgPSB7IHI6IG51bWJlcjsgZzogbnVtYmVyOyBiOiBudW1iZXI7IGE6IG51bWJlcjsgfTsgLy8gdmFsdWVzIGZyb20gMCB0byAyNTVcbmV4cG9ydCB0eXBlIFJHQiA9IHsgcjogbnVtYmVyOyBnOiBudW1iZXI7IGI6IG51bWJlcjsgfTsgLy8gdmFsdWVzIGZyb20gMCB0byAyNTVcbmV4cG9ydCB0eXBlIEhTQiA9IHsgaDogbnVtYmVyOyBzOiBudW1iZXI7IGI6IG51bWJlcjsgfTsgLy8gdmFsdWVzIGZyb20gMCB0byAxXG5leHBvcnQgdHlwZSBDTVlLID0geyBjOiBudW1iZXI7IG06IG51bWJlcjsgeTogbnVtYmVyOyBrOiBudW1iZXI7IH07IC8vIHZhbHVlcyBmcm9tIDAgdG8gMjU1XG5leHBvcnQgdHlwZSBMQUIgPSB7IGw6IG51bWJlcjsgYTogbnVtYmVyOyBiOiBudW1iZXI7IH07IC8vIHZhbHVlcyBgbGAgZnJvbSAwIHRvIDE7IGBhYCBhbmQgYGJgIGZyb20gLTEgdG8gMVxuZXhwb3J0IHR5cGUgR3JheXNjYWxlID0geyBrOiBudW1iZXIgfTsgLy8gdmFsdWVzIGZyb20gMCB0byAyNTVcbmV4cG9ydCB0eXBlIENvbG9yID0gUkdCQSB8IFJHQiB8IEhTQiB8IENNWUsgfCBMQUIgfCBHcmF5c2NhbGU7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRWZmZWN0Q29udG91ciB7XG5cdG5hbWU6IHN0cmluZztcblx0Y3VydmU6IHsgeDogbnVtYmVyOyB5OiBudW1iZXI7IH1bXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFZmZlY3RQYXR0ZXJuIHtcblx0bmFtZTogc3RyaW5nO1xuXHRpZDogc3RyaW5nO1xuXHQvLyBUT0RPOiBhZGQgZmllbGRzXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTGF5ZXJFZmZlY3RTaGFkb3cge1xuXHRwcmVzZW50PzogYm9vbGVhbjtcblx0c2hvd0luRGlhbG9nPzogYm9vbGVhbjtcblx0ZW5hYmxlZD86IGJvb2xlYW47XG5cdHNpemU/OiBVbml0c1ZhbHVlO1xuXHRhbmdsZT86IG51bWJlcjtcblx0ZGlzdGFuY2U/OiBVbml0c1ZhbHVlO1xuXHRjb2xvcj86IENvbG9yO1xuXHRibGVuZE1vZGU/OiBCbGVuZE1vZGU7XG5cdG9wYWNpdHk/OiBudW1iZXI7XG5cdHVzZUdsb2JhbExpZ2h0PzogYm9vbGVhbjtcblx0YW50aWFsaWFzZWQ/OiBib29sZWFuO1xuXHRjb250b3VyPzogRWZmZWN0Q29udG91cjtcblx0Y2hva2U/OiBVbml0c1ZhbHVlOyAvLyBzcHJlYWRcblx0bGF5ZXJDb25jZWFscz86IGJvb2xlYW47IC8vIG9ubHkgZHJvcCBzaGFkb3dcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMYXllckVmZmVjdHNPdXRlckdsb3cge1xuXHRwcmVzZW50PzogYm9vbGVhbjtcblx0c2hvd0luRGlhbG9nPzogYm9vbGVhbjtcblx0ZW5hYmxlZD86IGJvb2xlYW47XG5cdHNpemU/OiBVbml0c1ZhbHVlO1xuXHRjb2xvcj86IENvbG9yO1xuXHRibGVuZE1vZGU/OiBCbGVuZE1vZGU7XG5cdG9wYWNpdHk/OiBudW1iZXI7XG5cdHNvdXJjZT86IEdsb3dTb3VyY2U7XG5cdGFudGlhbGlhc2VkPzogYm9vbGVhbjtcblx0bm9pc2U/OiBudW1iZXI7XG5cdHJhbmdlPzogbnVtYmVyO1xuXHRjaG9rZT86IFVuaXRzVmFsdWU7XG5cdGppdHRlcj86IG51bWJlcjtcblx0Y29udG91cj86IEVmZmVjdENvbnRvdXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTGF5ZXJFZmZlY3RJbm5lckdsb3cge1xuXHRwcmVzZW50PzogYm9vbGVhbjtcblx0c2hvd0luRGlhbG9nPzogYm9vbGVhbjtcblx0ZW5hYmxlZD86IGJvb2xlYW47XG5cdHNpemU/OiBVbml0c1ZhbHVlO1xuXHRjb2xvcj86IENvbG9yO1xuXHRibGVuZE1vZGU/OiBCbGVuZE1vZGU7XG5cdG9wYWNpdHk/OiBudW1iZXI7XG5cdHNvdXJjZT86IEdsb3dTb3VyY2U7XG5cdHRlY2huaXF1ZT86IEdsb3dUZWNobmlxdWU7XG5cdGFudGlhbGlhc2VkPzogYm9vbGVhbjtcblx0bm9pc2U/OiBudW1iZXI7XG5cdHJhbmdlPzogbnVtYmVyO1xuXHRjaG9rZT86IFVuaXRzVmFsdWU7IC8vIHNwcmVhZFxuXHRqaXR0ZXI/OiBudW1iZXI7XG5cdGNvbnRvdXI/OiBFZmZlY3RDb250b3VyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExheWVyRWZmZWN0QmV2ZWwge1xuXHRwcmVzZW50PzogYm9vbGVhbjtcblx0c2hvd0luRGlhbG9nPzogYm9vbGVhbjtcblx0ZW5hYmxlZD86IGJvb2xlYW47XG5cdHNpemU/OiBVbml0c1ZhbHVlO1xuXHRhbmdsZT86IG51bWJlcjtcblx0c3RyZW5ndGg/OiBudW1iZXI7IC8vIGRlcHRoXG5cdGhpZ2hsaWdodEJsZW5kTW9kZT86IEJsZW5kTW9kZTtcblx0c2hhZG93QmxlbmRNb2RlPzogQmxlbmRNb2RlO1xuXHRoaWdobGlnaHRDb2xvcj86IENvbG9yO1xuXHRzaGFkb3dDb2xvcj86IENvbG9yO1xuXHRzdHlsZT86IEJldmVsU3R5bGU7XG5cdGhpZ2hsaWdodE9wYWNpdHk/OiBudW1iZXI7XG5cdHNoYWRvd09wYWNpdHk/OiBudW1iZXI7XG5cdHNvZnRlbj86IFVuaXRzVmFsdWU7XG5cdHVzZUdsb2JhbExpZ2h0PzogYm9vbGVhbjtcblx0YWx0aXR1ZGU/OiBudW1iZXI7XG5cdHRlY2huaXF1ZT86IEJldmVsVGVjaG5pcXVlO1xuXHRkaXJlY3Rpb24/OiBCZXZlbERpcmVjdGlvbjtcblx0dXNlVGV4dHVyZT86IGJvb2xlYW47XG5cdHVzZVNoYXBlPzogYm9vbGVhbjtcblx0YW50aWFsaWFzR2xvc3M/OiBib29sZWFuO1xuXHRjb250b3VyPzogRWZmZWN0Q29udG91cjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMYXllckVmZmVjdFNvbGlkRmlsbCB7XG5cdHByZXNlbnQ/OiBib29sZWFuO1xuXHRzaG93SW5EaWFsb2c/OiBib29sZWFuO1xuXHRlbmFibGVkPzogYm9vbGVhbjtcblx0YmxlbmRNb2RlPzogQmxlbmRNb2RlO1xuXHRjb2xvcj86IENvbG9yO1xuXHRvcGFjaXR5PzogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExheWVyRWZmZWN0U3Ryb2tlIHtcblx0cHJlc2VudD86IGJvb2xlYW47XG5cdHNob3dJbkRpYWxvZz86IGJvb2xlYW47XG5cdGVuYWJsZWQ/OiBib29sZWFuO1xuXHRvdmVycHJpbnQ/OiBib29sZWFuO1xuXHRzaXplPzogVW5pdHNWYWx1ZTtcblx0cG9zaXRpb24/OiAnaW5zaWRlJyB8ICdjZW50ZXInIHwgJ291dHNpZGUnO1xuXHRmaWxsVHlwZT86ICdjb2xvcicgfCAnZ3JhZGllbnQnIHwgJ3BhdHRlcm4nO1xuXHRibGVuZE1vZGU/OiBCbGVuZE1vZGU7XG5cdG9wYWNpdHk/OiBudW1iZXI7XG5cdGNvbG9yPzogQ29sb3I7XG5cdGdyYWRpZW50PzogKEVmZmVjdFNvbGlkR3JhZGllbnQgfCBFZmZlY3ROb2lzZUdyYWRpZW50KSAmIEV4dHJhR3JhZGllbnRJbmZvO1xuXHRwYXR0ZXJuPzogRWZmZWN0UGF0dGVybiAmIHt9OyAvLyBUT0RPOiBhZGRpdGlvbmFsIHBhdHRlcm4gaW5mb1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExheWVyRWZmZWN0U2F0aW4ge1xuXHRwcmVzZW50PzogYm9vbGVhbjtcblx0c2hvd0luRGlhbG9nPzogYm9vbGVhbjtcblx0ZW5hYmxlZD86IGJvb2xlYW47XG5cdHNpemU/OiBVbml0c1ZhbHVlO1xuXHRibGVuZE1vZGU/OiBCbGVuZE1vZGU7XG5cdGNvbG9yPzogQ29sb3I7XG5cdGFudGlhbGlhc2VkPzogYm9vbGVhbjtcblx0b3BhY2l0eT86IG51bWJlcjtcblx0ZGlzdGFuY2U/OiBVbml0c1ZhbHVlO1xuXHRpbnZlcnQ/OiBib29sZWFuO1xuXHRhbmdsZT86IG51bWJlcjtcblx0Y29udG91cj86IEVmZmVjdENvbnRvdXI7XG59XG5cbi8vIG5vdCBzdXBwb3J0ZWQgeWV0IGJlY2F1c2Ugb2YgYFBhdHRgIHNlY3Rpb24gbm90IGltcGxlbWVudGVkXG5leHBvcnQgaW50ZXJmYWNlIExheWVyRWZmZWN0UGF0dGVybk92ZXJsYXkge1xuXHRwcmVzZW50PzogYm9vbGVhbjtcblx0c2hvd0luRGlhbG9nPzogYm9vbGVhbjtcblx0ZW5hYmxlZD86IGJvb2xlYW47XG5cdGJsZW5kTW9kZT86IEJsZW5kTW9kZTtcblx0b3BhY2l0eT86IG51bWJlcjtcblx0c2NhbGU/OiBudW1iZXI7XG5cdHBhdHRlcm4/OiBFZmZlY3RQYXR0ZXJuO1xuXHRwaGFzZT86IHsgeDogbnVtYmVyOyB5OiBudW1iZXI7IH07XG5cdGFsaWduPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFZmZlY3RTb2xpZEdyYWRpZW50IHtcblx0bmFtZTogc3RyaW5nO1xuXHR0eXBlOiAnc29saWQnO1xuXHRzbW9vdGhuZXNzPzogbnVtYmVyO1xuXHRjb2xvclN0b3BzOiBDb2xvclN0b3BbXTtcblx0b3BhY2l0eVN0b3BzOiBPcGFjaXR5U3RvcFtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEVmZmVjdE5vaXNlR3JhZGllbnQge1xuXHRuYW1lOiBzdHJpbmc7XG5cdHR5cGU6ICdub2lzZSc7XG5cdHJvdWdobmVzcz86IG51bWJlcjtcblx0Y29sb3JNb2RlbD86ICdyZ2InIHwgJ2hzYicgfCAnbGFiJztcblx0cmFuZG9tU2VlZD86IG51bWJlcjtcblx0cmVzdHJpY3RDb2xvcnM/OiBib29sZWFuO1xuXHRhZGRUcmFuc3BhcmVuY3k/OiBib29sZWFuO1xuXHRtaW46IG51bWJlcltdO1xuXHRtYXg6IG51bWJlcltdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExheWVyRWZmZWN0R3JhZGllbnRPdmVybGF5IHtcblx0cHJlc2VudD86IGJvb2xlYW47XG5cdHNob3dJbkRpYWxvZz86IGJvb2xlYW47XG5cdGVuYWJsZWQ/OiBib29sZWFuO1xuXHRibGVuZE1vZGU/OiBzdHJpbmc7XG5cdG9wYWNpdHk/OiBudW1iZXI7XG5cdGFsaWduPzogYm9vbGVhbjtcblx0c2NhbGU/OiBudW1iZXI7XG5cdGRpdGhlcj86IGJvb2xlYW47XG5cdHJldmVyc2U/OiBib29sZWFuO1xuXHR0eXBlPzogR3JhZGllbnRTdHlsZTtcblx0b2Zmc2V0PzogeyB4OiBudW1iZXI7IHk6IG51bWJlcjsgfTtcblx0Z3JhZGllbnQ/OiBFZmZlY3RTb2xpZEdyYWRpZW50IHwgRWZmZWN0Tm9pc2VHcmFkaWVudDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMYXllckVmZmVjdHNJbmZvIHtcblx0ZGlzYWJsZWQ/OiBib29sZWFuO1xuXHRzY2FsZT86IG51bWJlcjtcblx0ZHJvcFNoYWRvdz86IExheWVyRWZmZWN0U2hhZG93W107XG5cdGlubmVyU2hhZG93PzogTGF5ZXJFZmZlY3RTaGFkb3dbXTtcblx0b3V0ZXJHbG93PzogTGF5ZXJFZmZlY3RzT3V0ZXJHbG93O1xuXHRpbm5lckdsb3c/OiBMYXllckVmZmVjdElubmVyR2xvdztcblx0YmV2ZWw/OiBMYXllckVmZmVjdEJldmVsO1xuXHRzb2xpZEZpbGw/OiBMYXllckVmZmVjdFNvbGlkRmlsbFtdO1xuXHRzYXRpbj86IExheWVyRWZmZWN0U2F0aW47XG5cdHN0cm9rZT86IExheWVyRWZmZWN0U3Ryb2tlW107XG5cdGdyYWRpZW50T3ZlcmxheT86IExheWVyRWZmZWN0R3JhZGllbnRPdmVybGF5W107XG5cdHBhdHRlcm5PdmVybGF5PzogTGF5ZXJFZmZlY3RQYXR0ZXJuT3ZlcmxheTsgLy8gbm90IHN1cHBvcnRlZCB5ZXQgYmVjYXVzZSBvZiBgUGF0dGAgc2VjdGlvbiBub3QgaW1wbGVtZW50ZWRcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMYXllck1hc2tEYXRhIHtcblx0dG9wPzogbnVtYmVyO1xuXHRsZWZ0PzogbnVtYmVyO1xuXHRib3R0b20/OiBudW1iZXI7XG5cdHJpZ2h0PzogbnVtYmVyO1xuXHRkZWZhdWx0Q29sb3I/OiBudW1iZXI7XG5cdGRpc2FibGVkPzogYm9vbGVhbjtcblx0cG9zaXRpb25SZWxhdGl2ZVRvTGF5ZXI/OiBib29sZWFuO1xuXHRmcm9tVmVjdG9yRGF0YT86IGJvb2xlYW47IC8vIHNldCB0byB0cnVlIGlmIHRoZSBtYXNrIGlzIGdlbmVyYXRlZCBmcm9tIHZlY3RvciBkYXRhLCBmYWxzZSBpZiBpdCdzIGEgYml0bWFwIHByb3ZpZGVkIGJ5IHVzZXJcblx0dXNlck1hc2tEZW5zaXR5PzogbnVtYmVyO1xuXHR1c2VyTWFza0ZlYXRoZXI/OiBudW1iZXI7IC8vIHB4XG5cdHZlY3Rvck1hc2tEZW5zaXR5PzogbnVtYmVyO1xuXHR2ZWN0b3JNYXNrRmVhdGhlcj86IG51bWJlcjtcblx0Y2FudmFzPzogSFRNTENhbnZhc0VsZW1lbnQ7XG5cdGltYWdlRGF0YT86IEltYWdlRGF0YTtcbn1cblxuZXhwb3J0IHR5cGUgVGV4dEdyaWRkaW5nID0gJ25vbmUnIHwgJ3JvdW5kJzsgLy8gVE9ETzogb3RoZXIgdmFsdWVzIChubyBpZGVhIHdoZXJlIHRvIHNldCBpdCB1cCBpbiBQaG90b3Nob3ApXG5leHBvcnQgdHlwZSBPcmllbnRhdGlvbiA9ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCc7XG5leHBvcnQgdHlwZSBBbnRpQWxpYXMgPSAnbm9uZScgfCAnc2hhcnAnIHwgJ2NyaXNwJyB8ICdzdHJvbmcnIHwgJ3Ntb290aCcgfCAncGxhdGZvcm0nIHwgJ3BsYXRmb3JtTENEJztcbmV4cG9ydCB0eXBlIFdhcnBTdHlsZSA9XG5cdCdub25lJyB8ICdhcmMnIHwgJ2FyY0xvd2VyJyB8ICdhcmNVcHBlcicgfCAnYXJjaCcgfCAnYnVsZ2UnIHwgJ3NoZWxsTG93ZXInIHwgJ3NoZWxsVXBwZXInIHwgJ2ZsYWcnIHxcblx0J3dhdmUnIHwgJ2Zpc2gnIHwgJ3Jpc2UnIHwgJ2Zpc2hleWUnIHwgJ2luZmxhdGUnIHwgJ3NxdWVlemUnIHwgJ3R3aXN0JyB8ICdjdXN0b20nO1xuZXhwb3J0IHR5cGUgQmV2ZWxTdHlsZSA9ICdvdXRlciBiZXZlbCcgfCAnaW5uZXIgYmV2ZWwnIHwgJ2VtYm9zcycgfCAncGlsbG93IGVtYm9zcycgfCAnc3Ryb2tlIGVtYm9zcyc7XG5leHBvcnQgdHlwZSBCZXZlbFRlY2huaXF1ZSA9ICdzbW9vdGgnIHwgJ2NoaXNlbCBoYXJkJyB8ICdjaGlzZWwgc29mdCc7XG5leHBvcnQgdHlwZSBCZXZlbERpcmVjdGlvbiA9ICd1cCcgfCAnZG93bic7XG5leHBvcnQgdHlwZSBHbG93VGVjaG5pcXVlID0gJ3NvZnRlcicgfCAncHJlY2lzZSc7XG5leHBvcnQgdHlwZSBHbG93U291cmNlID0gJ2VkZ2UnIHwgJ2NlbnRlcic7XG5leHBvcnQgdHlwZSBHcmFkaWVudFN0eWxlID0gJ2xpbmVhcicgfCAncmFkaWFsJyB8ICdhbmdsZScgfCAncmVmbGVjdGVkJyB8ICdkaWFtb25kJztcbmV4cG9ydCB0eXBlIEp1c3RpZmljYXRpb24gPSAnbGVmdCcgfCAncmlnaHQnIHwgJ2NlbnRlcic7XG5leHBvcnQgdHlwZSBMaW5lQ2FwVHlwZSA9ICdidXR0JyB8ICdyb3VuZCcgfCAnc3F1YXJlJztcbmV4cG9ydCB0eXBlIExpbmVKb2luVHlwZSA9ICdtaXRlcicgfCAncm91bmQnIHwgJ2JldmVsJztcbmV4cG9ydCB0eXBlIExpbmVBbGlnbm1lbnQgPSAnaW5zaWRlJyB8ICdjZW50ZXInIHwgJ291dHNpZGUnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFdhcnAge1xuXHRzdHlsZT86IFdhcnBTdHlsZTtcblx0dmFsdWU/OiBudW1iZXI7XG5cdHBlcnNwZWN0aXZlPzogbnVtYmVyO1xuXHRwZXJzcGVjdGl2ZU90aGVyPzogbnVtYmVyO1xuXHRyb3RhdGU/OiBPcmllbnRhdGlvbjtcblx0Ly8gZm9yIGN1c3RvbSB3YXJwc1xuXHRib3VuZHM/OiB7IHRvcDogVW5pdHNWYWx1ZTsgbGVmdDogVW5pdHNWYWx1ZTsgYm90dG9tOiBVbml0c1ZhbHVlOyByaWdodDogVW5pdHNWYWx1ZTsgfTtcblx0dU9yZGVyPzogbnVtYmVyO1xuXHR2T3JkZXI/OiBudW1iZXI7XG5cdGRlZm9ybU51bVJvd3M/OiBudW1iZXI7XG5cdGRlZm9ybU51bUNvbHM/OiBudW1iZXI7XG5cdGN1c3RvbUVudmVsb3BlV2FycD86IHtcblx0XHRxdWlsdFNsaWNlWD86IG51bWJlcltdO1xuXHRcdHF1aWx0U2xpY2VZPzogbnVtYmVyW107XG5cdFx0bWVzaFBvaW50czogeyB4OiBudW1iZXI7IHk6IG51bWJlcjsgfVtdO1xuXHR9O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEZvbnQge1xuXHRuYW1lOiBzdHJpbmc7XG5cdHNjcmlwdD86IG51bWJlcjtcblx0dHlwZT86IG51bWJlcjtcblx0c3ludGhldGljPzogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBhcmFncmFwaFN0eWxlIHtcblx0anVzdGlmaWNhdGlvbj86IEp1c3RpZmljYXRpb247XG5cdGZpcnN0TGluZUluZGVudD86IG51bWJlcjtcblx0c3RhcnRJbmRlbnQ/OiBudW1iZXI7XG5cdGVuZEluZGVudD86IG51bWJlcjtcblx0c3BhY2VCZWZvcmU/OiBudW1iZXI7XG5cdHNwYWNlQWZ0ZXI/OiBudW1iZXI7XG5cdGF1dG9IeXBoZW5hdGU/OiBib29sZWFuO1xuXHRoeXBoZW5hdGVkV29yZFNpemU/OiBudW1iZXI7XG5cdHByZUh5cGhlbj86IG51bWJlcjtcblx0cG9zdEh5cGhlbj86IG51bWJlcjtcblx0Y29uc2VjdXRpdmVIeXBoZW5zPzogbnVtYmVyO1xuXHR6b25lPzogbnVtYmVyO1xuXHR3b3JkU3BhY2luZz86IG51bWJlcltdO1xuXHRsZXR0ZXJTcGFjaW5nPzogbnVtYmVyW107XG5cdGdseXBoU3BhY2luZz86IG51bWJlcltdO1xuXHRhdXRvTGVhZGluZz86IG51bWJlcjtcblx0bGVhZGluZ1R5cGU/OiBudW1iZXI7XG5cdGhhbmdpbmc/OiBib29sZWFuO1xuXHRidXJhc2FnYXJpPzogYm9vbGVhbjtcblx0a2luc29rdU9yZGVyPzogbnVtYmVyO1xuXHRldmVyeUxpbmVDb21wb3Nlcj86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGFyYWdyYXBoU3R5bGVSdW4ge1xuXHRsZW5ndGg6IG51bWJlcjtcblx0c3R5bGU6IFBhcmFncmFwaFN0eWxlO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRleHRTdHlsZSB7XG5cdGZvbnQ/OiBGb250O1xuXHRmb250U2l6ZT86IG51bWJlcjtcblx0ZmF1eEJvbGQ/OiBib29sZWFuO1xuXHRmYXV4SXRhbGljPzogYm9vbGVhbjtcblx0YXV0b0xlYWRpbmc/OiBib29sZWFuO1xuXHRsZWFkaW5nPzogbnVtYmVyO1xuXHRob3Jpem9udGFsU2NhbGU/OiBudW1iZXI7XG5cdHZlcnRpY2FsU2NhbGU/OiBudW1iZXI7XG5cdHRyYWNraW5nPzogbnVtYmVyO1xuXHRhdXRvS2VybmluZz86IGJvb2xlYW47XG5cdGtlcm5pbmc/OiBudW1iZXI7XG5cdGJhc2VsaW5lU2hpZnQ/OiBudW1iZXI7XG5cdGZvbnRDYXBzPzogbnVtYmVyOyAvLyAwIC0gbm9uZSwgMSAtIHNtYWxsIGNhcHMsIDIgLSBhbGwgY2Fwc1xuXHRmb250QmFzZWxpbmU/OiBudW1iZXI7IC8vIDAgLSBub3JtYWwsIDEgLSBzdXBlcnNjcmlwdCwgMiAtIHN1YnNjcmlwdFxuXHR1bmRlcmxpbmU/OiBib29sZWFuO1xuXHRzdHJpa2V0aHJvdWdoPzogYm9vbGVhbjtcblx0bGlnYXR1cmVzPzogYm9vbGVhbjtcblx0ZExpZ2F0dXJlcz86IGJvb2xlYW47XG5cdGJhc2VsaW5lRGlyZWN0aW9uPzogbnVtYmVyO1xuXHR0c3VtZT86IG51bWJlcjtcblx0c3R5bGVSdW5BbGlnbm1lbnQ/OiBudW1iZXI7XG5cdGxhbmd1YWdlPzogbnVtYmVyO1xuXHRub0JyZWFrPzogYm9vbGVhbjtcblx0ZmlsbENvbG9yPzogQ29sb3I7XG5cdHN0cm9rZUNvbG9yPzogQ29sb3I7XG5cdGZpbGxGbGFnPzogYm9vbGVhbjtcblx0c3Ryb2tlRmxhZz86IGJvb2xlYW47XG5cdGZpbGxGaXJzdD86IGJvb2xlYW47XG5cdHlVbmRlcmxpbmU/OiBudW1iZXI7XG5cdG91dGxpbmVXaWR0aD86IG51bWJlcjtcblx0Y2hhcmFjdGVyRGlyZWN0aW9uPzogbnVtYmVyO1xuXHRoaW5kaU51bWJlcnM/OiBib29sZWFuO1xuXHRrYXNoaWRhPzogbnVtYmVyO1xuXHRkaWFjcml0aWNQb3M/OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGV4dFN0eWxlUnVuIHtcblx0bGVuZ3RoOiBudW1iZXI7XG5cdHN0eWxlOiBUZXh0U3R5bGU7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGV4dEdyaWRJbmZvIHtcblx0aXNPbj86IGJvb2xlYW47XG5cdHNob3c/OiBib29sZWFuO1xuXHRzaXplPzogbnVtYmVyO1xuXHRsZWFkaW5nPzogbnVtYmVyO1xuXHRjb2xvcj86IENvbG9yO1xuXHRsZWFkaW5nRmlsbENvbG9yPzogQ29sb3I7XG5cdGFsaWduTGluZUhlaWdodFRvR3JpZEZsYWdzPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMYXllclRleHREYXRhIHtcblx0dGV4dDogc3RyaW5nO1xuXHR0cmFuc2Zvcm0/OiBudW1iZXJbXTtcblx0YW50aUFsaWFzPzogQW50aUFsaWFzO1xuXHRncmlkZGluZz86IFRleHRHcmlkZGluZztcblx0b3JpZW50YXRpb24/OiBPcmllbnRhdGlvbjtcblx0aW5kZXg/OiBudW1iZXI7XG5cdHdhcnA/OiBXYXJwO1xuXHR0b3A/OiBudW1iZXI7XG5cdGxlZnQ/OiBudW1iZXI7XG5cdGJvdHRvbT86IG51bWJlcjtcblx0cmlnaHQ/OiBudW1iZXI7XG5cblx0Z3JpZEluZm8/OiBUZXh0R3JpZEluZm87XG5cdHVzZUZyYWN0aW9uYWxHbHlwaFdpZHRocz86IGJvb2xlYW47XG5cdHN0eWxlPzogVGV4dFN0eWxlOyAvLyBiYXNlIHN0eWxlXG5cdHN0eWxlUnVucz86IFRleHRTdHlsZVJ1bltdOyAvLyBzcGFucyBvZiBkaWZmZXJlbnQgc3R5bGVcblx0cGFyYWdyYXBoU3R5bGU/OiBQYXJhZ3JhcGhTdHlsZTsgLy8gYmFzZSBwYXJhZ3JhcGggc3R5bGVcblx0cGFyYWdyYXBoU3R5bGVSdW5zPzogUGFyYWdyYXBoU3R5bGVSdW5bXTsgLy8gc3R5bGUgZm9yIGVhY2ggbGluZVxuXG5cdHN1cGVyc2NyaXB0U2l6ZT86IG51bWJlcjtcblx0c3VwZXJzY3JpcHRQb3NpdGlvbj86IG51bWJlcjtcblx0c3Vic2NyaXB0U2l6ZT86IG51bWJlcjtcblx0c3Vic2NyaXB0UG9zaXRpb24/OiBudW1iZXI7XG5cdHNtYWxsQ2FwU2l6ZT86IG51bWJlcjtcblxuXHRzaGFwZVR5cGU/OiAncG9pbnQnIHwgJ2JveCc7XG5cdHBvaW50QmFzZT86IG51bWJlcltdO1xuXHRib3hCb3VuZHM/OiBudW1iZXJbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQYXR0ZXJuSW5mbyB7XG5cdG5hbWU6IHN0cmluZztcblx0aWQ6IHN0cmluZztcblx0eDogbnVtYmVyO1xuXHR5OiBudW1iZXI7XG5cdGJvdW5kczogeyB4OiBudW1iZXI7IHk6IG51bWJlcjsgdzogbnVtYmVyLCBoOiBudW1iZXI7IH07XG5cdGRhdGE6IFVpbnQ4QXJyYXk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQmV6aWVyS25vdCB7XG5cdGxpbmtlZDogYm9vbGVhbjtcblx0cG9pbnRzOiBudW1iZXJbXTsgLy8geDAsIHkwLCB4MSwgeTEsIHgyLCB5MlxufVxuXG5leHBvcnQgdHlwZSBCb29sZWFuT3BlcmF0aW9uID0gJ2V4Y2x1ZGUnIHwgJ2NvbWJpbmUnIHwgJ3N1YnRyYWN0JyB8ICdpbnRlcnNlY3QnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEJlemllclBhdGgge1xuXHRvcGVuOiBib29sZWFuO1xuXHRvcGVyYXRpb246IEJvb2xlYW5PcGVyYXRpb247XG5cdGtub3RzOiBCZXppZXJLbm90W107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXh0cmFHcmFkaWVudEluZm8ge1xuXHRzdHlsZT86IEdyYWRpZW50U3R5bGU7XG5cdHNjYWxlPzogbnVtYmVyO1xuXHRhbmdsZT86IG51bWJlcjtcblx0ZGl0aGVyPzogYm9vbGVhbjtcblx0cmV2ZXJzZT86IGJvb2xlYW47XG5cdGFsaWduPzogYm9vbGVhbjtcblx0b2Zmc2V0PzogeyB4OiBudW1iZXI7IHk6IG51bWJlcjsgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFeHRyYVBhdHRlcm5JbmZvIHtcblx0bGlua2VkPzogYm9vbGVhbjtcblx0cGhhc2U/OiB7IHg6IG51bWJlcjsgeTogbnVtYmVyOyB9O1xufVxuXG5leHBvcnQgdHlwZSBWZWN0b3JDb250ZW50ID0geyB0eXBlOiAnY29sb3InOyBjb2xvcjogQ29sb3I7IH0gfFxuXHQoRWZmZWN0U29saWRHcmFkaWVudCAmIEV4dHJhR3JhZGllbnRJbmZvKSB8XG5cdChFZmZlY3ROb2lzZUdyYWRpZW50ICYgRXh0cmFHcmFkaWVudEluZm8pIHxcblx0KEVmZmVjdFBhdHRlcm4gJiB7IHR5cGU6ICdwYXR0ZXJuJzsgfSAmIEV4dHJhUGF0dGVybkluZm8pO1xuXG5leHBvcnQgdHlwZSBSZW5kZXJpbmdJbnRlbnQgPSAncGVyY2VwdHVhbCcgfCAnc2F0dXJhdGlvbicgfCAncmVsYXRpdmUgY29sb3JpbWV0cmljJyB8ICdhYnNvbHV0ZSBjb2xvcmltZXRyaWMnO1xuXG5leHBvcnQgdHlwZSBVbml0cyA9ICdQaXhlbHMnIHwgJ1BvaW50cycgfCAnUGljYXMnIHwgJ01pbGxpbWV0ZXJzJyB8ICdDZW50aW1ldGVycycgfCAnSW5jaGVzJyB8ICdOb25lJyB8ICdEZW5zaXR5JztcblxuZXhwb3J0IGludGVyZmFjZSBVbml0c1ZhbHVlIHtcblx0dW5pdHM6IFVuaXRzO1xuXHR2YWx1ZTogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJyaWdodG5lc3NBZGp1c3RtZW50IHtcblx0dHlwZTogJ2JyaWdodG5lc3MvY29udHJhc3QnO1xuXHRicmlnaHRuZXNzPzogbnVtYmVyO1xuXHRjb250cmFzdD86IG51bWJlcjtcblx0bWVhblZhbHVlPzogbnVtYmVyO1xuXHR1c2VMZWdhY3k/OiBib29sZWFuO1xuXHRsYWJDb2xvck9ubHk/OiBib29sZWFuO1xuXHRhdXRvPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMZXZlbHNBZGp1c3RtZW50Q2hhbm5lbCB7XG5cdHNoYWRvd0lucHV0OiBudW1iZXI7XG5cdGhpZ2hsaWdodElucHV0OiBudW1iZXI7XG5cdHNoYWRvd091dHB1dDogbnVtYmVyO1xuXHRoaWdobGlnaHRPdXRwdXQ6IG51bWJlcjtcblx0bWlkdG9uZUlucHV0OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJlc2V0SW5mbyB7XG5cdHByZXNldEtpbmQ/OiBudW1iZXI7XG5cdHByZXNldEZpbGVOYW1lPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExldmVsc0FkanVzdG1lbnQgZXh0ZW5kcyBQcmVzZXRJbmZvIHtcblx0dHlwZTogJ2xldmVscyc7XG5cdHJnYj86IExldmVsc0FkanVzdG1lbnRDaGFubmVsO1xuXHRyZWQ/OiBMZXZlbHNBZGp1c3RtZW50Q2hhbm5lbDtcblx0Z3JlZW4/OiBMZXZlbHNBZGp1c3RtZW50Q2hhbm5lbDtcblx0Ymx1ZT86IExldmVsc0FkanVzdG1lbnRDaGFubmVsO1xufVxuXG5leHBvcnQgdHlwZSBDdXJ2ZXNBZGp1c3RtZW50Q2hhbm5lbCA9IHsgaW5wdXQ6IG51bWJlcjsgb3V0cHV0OiBudW1iZXI7IH1bXTtcblxuZXhwb3J0IGludGVyZmFjZSBDdXJ2ZXNBZGp1c3RtZW50IGV4dGVuZHMgUHJlc2V0SW5mbyB7XG5cdHR5cGU6ICdjdXJ2ZXMnO1xuXHRyZ2I/OiBDdXJ2ZXNBZGp1c3RtZW50Q2hhbm5lbDtcblx0cmVkPzogQ3VydmVzQWRqdXN0bWVudENoYW5uZWw7XG5cdGdyZWVuPzogQ3VydmVzQWRqdXN0bWVudENoYW5uZWw7XG5cdGJsdWU/OiBDdXJ2ZXNBZGp1c3RtZW50Q2hhbm5lbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFeHBvc3VyZUFkanVzdG1lbnQgZXh0ZW5kcyBQcmVzZXRJbmZvIHtcblx0dHlwZTogJ2V4cG9zdXJlJztcblx0ZXhwb3N1cmU/OiBudW1iZXI7XG5cdG9mZnNldD86IG51bWJlcjtcblx0Z2FtbWE/OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVmlicmFuY2VBZGp1c3RtZW50IHtcblx0dHlwZTogJ3ZpYnJhbmNlJztcblx0dmlicmFuY2U/OiBudW1iZXI7XG5cdHNhdHVyYXRpb24/OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSHVlU2F0dXJhdGlvbkFkanVzdG1lbnRDaGFubmVsIHtcblx0YTogbnVtYmVyO1xuXHRiOiBudW1iZXI7XG5cdGM6IG51bWJlcjtcblx0ZDogbnVtYmVyO1xuXHRodWU6IG51bWJlcjtcblx0c2F0dXJhdGlvbjogbnVtYmVyO1xuXHRsaWdodG5lc3M6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBIdWVTYXR1cmF0aW9uQWRqdXN0bWVudCBleHRlbmRzIFByZXNldEluZm8ge1xuXHR0eXBlOiAnaHVlL3NhdHVyYXRpb24nO1xuXHRtYXN0ZXI/OiBIdWVTYXR1cmF0aW9uQWRqdXN0bWVudENoYW5uZWw7XG5cdHJlZHM/OiBIdWVTYXR1cmF0aW9uQWRqdXN0bWVudENoYW5uZWw7XG5cdHllbGxvd3M/OiBIdWVTYXR1cmF0aW9uQWRqdXN0bWVudENoYW5uZWw7XG5cdGdyZWVucz86IEh1ZVNhdHVyYXRpb25BZGp1c3RtZW50Q2hhbm5lbDtcblx0Y3lhbnM/OiBIdWVTYXR1cmF0aW9uQWRqdXN0bWVudENoYW5uZWw7XG5cdGJsdWVzPzogSHVlU2F0dXJhdGlvbkFkanVzdG1lbnRDaGFubmVsO1xuXHRtYWdlbnRhcz86IEh1ZVNhdHVyYXRpb25BZGp1c3RtZW50Q2hhbm5lbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb2xvckJhbGFuY2VWYWx1ZXMge1xuXHRjeWFuUmVkOiBudW1iZXI7XG5cdG1hZ2VudGFHcmVlbjogbnVtYmVyO1xuXHR5ZWxsb3dCbHVlOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29sb3JCYWxhbmNlQWRqdXN0bWVudCB7XG5cdHR5cGU6ICdjb2xvciBiYWxhbmNlJztcblx0c2hhZG93cz86IENvbG9yQmFsYW5jZVZhbHVlcztcblx0bWlkdG9uZXM/OiBDb2xvckJhbGFuY2VWYWx1ZXM7XG5cdGhpZ2hsaWdodHM/OiBDb2xvckJhbGFuY2VWYWx1ZXM7XG5cdHByZXNlcnZlTHVtaW5vc2l0eT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQmxhY2tBbmRXaGl0ZUFkanVzdG1lbnQgZXh0ZW5kcyBQcmVzZXRJbmZvIHtcblx0dHlwZTogJ2JsYWNrICYgd2hpdGUnO1xuXHRyZWRzPzogbnVtYmVyO1xuXHR5ZWxsb3dzPzogbnVtYmVyO1xuXHRncmVlbnM/OiBudW1iZXI7XG5cdGN5YW5zPzogbnVtYmVyO1xuXHRibHVlcz86IG51bWJlcjtcblx0bWFnZW50YXM/OiBudW1iZXI7XG5cdHVzZVRpbnQ/OiBib29sZWFuO1xuXHR0aW50Q29sb3I/OiBDb2xvcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQaG90b0ZpbHRlckFkanVzdG1lbnQge1xuXHR0eXBlOiAncGhvdG8gZmlsdGVyJztcblx0Y29sb3I/OiBDb2xvcjtcblx0ZGVuc2l0eT86IG51bWJlcjtcblx0cHJlc2VydmVMdW1pbm9zaXR5PzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDaGFubmVsTWl4ZXJDaGFubmVsIHtcblx0cmVkOiBudW1iZXI7XG5cdGdyZWVuOiBudW1iZXI7XG5cdGJsdWU6IG51bWJlcjtcblx0Y29uc3RhbnQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDaGFubmVsTWl4ZXJBZGp1c3RtZW50IGV4dGVuZHMgUHJlc2V0SW5mbyB7XG5cdHR5cGU6ICdjaGFubmVsIG1peGVyJztcblx0bW9ub2Nocm9tZT86IGJvb2xlYW47XG5cdHJlZD86IENoYW5uZWxNaXhlckNoYW5uZWw7XG5cdGdyZWVuPzogQ2hhbm5lbE1peGVyQ2hhbm5lbDtcblx0Ymx1ZT86IENoYW5uZWxNaXhlckNoYW5uZWw7XG5cdGdyYXk/OiBDaGFubmVsTWl4ZXJDaGFubmVsO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbG9yTG9va3VwQWRqdXN0bWVudCB7XG5cdHR5cGU6ICdjb2xvciBsb29rdXAnO1xuXHRsb29rdXBUeXBlPzogJzNkbHV0JyB8ICdhYnN0cmFjdFByb2ZpbGUnIHwgJ2RldmljZUxpbmtQcm9maWxlJztcblx0bmFtZT86IHN0cmluZztcblx0ZGl0aGVyPzogYm9vbGVhbjtcblx0cHJvZmlsZT86IFVpbnQ4QXJyYXk7XG5cdGx1dEZvcm1hdD86ICdsb29rJyB8ICdjdWJlJyB8ICczZGwnO1xuXHRkYXRhT3JkZXI/OiAncmdiJyB8ICdiZ3InO1xuXHR0YWJsZU9yZGVyPzogJ3JnYicgfCAnYmdyJztcblx0bHV0M0RGaWxlRGF0YT86IFVpbnQ4QXJyYXk7XG5cdGx1dDNERmlsZU5hbWU/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW52ZXJ0QWRqdXN0bWVudCB7XG5cdHR5cGU6ICdpbnZlcnQnO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBvc3Rlcml6ZUFkanVzdG1lbnQge1xuXHR0eXBlOiAncG9zdGVyaXplJztcblx0bGV2ZWxzPzogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRocmVzaG9sZEFkanVzdG1lbnQge1xuXHR0eXBlOiAndGhyZXNob2xkJztcblx0bGV2ZWw/OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29sb3JTdG9wIHtcblx0Y29sb3I6IENvbG9yO1xuXHRsb2NhdGlvbjogbnVtYmVyO1xuXHRtaWRwb2ludDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE9wYWNpdHlTdG9wIHtcblx0b3BhY2l0eTogbnVtYmVyO1xuXHRsb2NhdGlvbjogbnVtYmVyO1xuXHRtaWRwb2ludDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEdyYWRpZW50TWFwQWRqdXN0bWVudCB7XG5cdHR5cGU6ICdncmFkaWVudCBtYXAnO1xuXHRuYW1lPzogc3RyaW5nO1xuXHRncmFkaWVudFR5cGU6ICdzb2xpZCcgfCAnbm9pc2UnO1xuXHRkaXRoZXI/OiBib29sZWFuO1xuXHRyZXZlcnNlPzogYm9vbGVhbjtcblx0Ly8gc29saWRcblx0c21vb3RobmVzcz86IG51bWJlcjtcblx0Y29sb3JTdG9wcz86IENvbG9yU3RvcFtdO1xuXHRvcGFjaXR5U3RvcHM/OiBPcGFjaXR5U3RvcFtdO1xuXHQvLyBub2lzZVxuXHRyb3VnaG5lc3M/OiBudW1iZXI7XG5cdGNvbG9yTW9kZWw/OiAncmdiJyB8ICdoc2InIHwgJ2xhYic7XG5cdHJhbmRvbVNlZWQ/OiBudW1iZXI7XG5cdHJlc3RyaWN0Q29sb3JzPzogYm9vbGVhbjtcblx0YWRkVHJhbnNwYXJlbmN5PzogYm9vbGVhbjtcblx0bWluPzogbnVtYmVyW107XG5cdG1heD86IG51bWJlcltdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNlbGVjdGl2ZUNvbG9yQWRqdXN0bWVudCB7XG5cdHR5cGU6ICdzZWxlY3RpdmUgY29sb3InO1xuXHRtb2RlPzogJ3JlbGF0aXZlJyB8ICdhYnNvbHV0ZSc7XG5cdHJlZHM/OiBDTVlLO1xuXHR5ZWxsb3dzPzogQ01ZSztcblx0Z3JlZW5zPzogQ01ZSztcblx0Y3lhbnM/OiBDTVlLO1xuXHRibHVlcz86IENNWUs7XG5cdG1hZ2VudGFzPzogQ01ZSztcblx0d2hpdGVzPzogQ01ZSztcblx0bmV1dHJhbHM/OiBDTVlLO1xuXHRibGFja3M/OiBDTVlLO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExpbmtlZEZpbGUge1xuXHRpZDogc3RyaW5nO1xuXHRuYW1lOiBzdHJpbmc7XG5cdHR5cGU/OiBzdHJpbmc7XG5cdGNyZWF0b3I/OiBzdHJpbmc7XG5cdGRhdGE/OiBVaW50OEFycmF5O1xuXHR0aW1lPzogRGF0ZTsgLy8gZm9yIGV4dGVybmFsIGZpbGVzXG5cdGRlc2NyaXB0b3I/OiB7XG5cdFx0Y29tcEluZm86IHsgY29tcElEOiBudW1iZXI7IG9yaWdpbmFsQ29tcElEOiBudW1iZXI7IH07XG5cdH07XG5cdGNoaWxkRG9jdW1lbnRJRD86IHN0cmluZztcblx0YXNzZXRNb2RUaW1lPzogbnVtYmVyO1xuXHRhc3NldExvY2tlZFN0YXRlPzogbnVtYmVyO1xufVxuXG5leHBvcnQgdHlwZSBQbGFjZWRMYXllclR5cGUgPSAndW5rbm93bicgfCAndmVjdG9yJyB8ICdyYXN0ZXInIHwgJ2ltYWdlIHN0YWNrJztcblxuZXhwb3J0IGludGVyZmFjZSBQbGFjZWRMYXllciB7XG5cdGlkOiBzdHJpbmc7IC8vIGlkIG9mIGxpbmtlZCBpbWFnZSBmaWxlIChwc2QubGlua2VkRmlsZXMpXG5cdHBsYWNlZD86IHN0cmluZzsgLy8gPz8/XG5cdHR5cGU6IFBsYWNlZExheWVyVHlwZTtcblx0Ly8gcGFnZU51bWJlcjogbnVtYmVyOyAvLyA/Pz9cblx0Ly8gdG90YWxQYWdlczogbnVtYmVyOyAvLyA/Pz9cblx0Ly8gZnJhbWVTdGVwPzogeyBudW1lcmF0b3I6IG51bWJlcjsgZGVub21pbmF0b3I6IG51bWJlcjsgfTtcblx0Ly8gZHVyYXRpb24/OiB7IG51bWVyYXRvcjogbnVtYmVyOyBkZW5vbWluYXRvcjogbnVtYmVyOyB9O1xuXHQvLyBmcmFtZUNvdW50PzogbnVtYmVyOyAvLyA/Pz9cblx0dHJhbnNmb3JtOiBudW1iZXJbXTsgLy8geCwgeSBvZiA0IGNvcm5lcnMgb2YgdGhlIHRyYW5zZm9ybVxuXHR3aWR0aD86IG51bWJlcjtcblx0aGVpZ2h0PzogbnVtYmVyO1xuXHRyZXNvbHV0aW9uPzogVW5pdHNWYWx1ZTtcblx0Ly8gYW50aWFsaWFzID9cblx0d2FycD86IFdhcnA7XG5cdGNyb3A/OiBudW1iZXI7XG5cdGNvbXA/OiBudW1iZXI7XG5cdGNvbXBJbmZvPzogeyBjb21wSUQ6IG51bWJlcjsgb3JpZ2luYWxDb21wSUQ6IG51bWJlcjsgfTtcbn1cblxuZXhwb3J0IHR5cGUgQWRqdXN0bWVudExheWVyID0gQnJpZ2h0bmVzc0FkanVzdG1lbnQgfCBMZXZlbHNBZGp1c3RtZW50IHwgQ3VydmVzQWRqdXN0bWVudCB8XG5cdEV4cG9zdXJlQWRqdXN0bWVudCB8IFZpYnJhbmNlQWRqdXN0bWVudCB8IEh1ZVNhdHVyYXRpb25BZGp1c3RtZW50IHwgQ29sb3JCYWxhbmNlQWRqdXN0bWVudCB8XG5cdEJsYWNrQW5kV2hpdGVBZGp1c3RtZW50IHwgUGhvdG9GaWx0ZXJBZGp1c3RtZW50IHwgQ2hhbm5lbE1peGVyQWRqdXN0bWVudCB8IENvbG9yTG9va3VwQWRqdXN0bWVudCB8XG5cdEludmVydEFkanVzdG1lbnQgfCBQb3N0ZXJpemVBZGp1c3RtZW50IHwgVGhyZXNob2xkQWRqdXN0bWVudCB8IEdyYWRpZW50TWFwQWRqdXN0bWVudCB8XG5cdFNlbGVjdGl2ZUNvbG9yQWRqdXN0bWVudDtcblxuZXhwb3J0IHR5cGUgTGF5ZXJDb2xvciA9ICdub25lJyB8ICdyZWQnIHwgJ29yYW5nZScgfCAneWVsbG93JyB8ICdncmVlbicgfCAnYmx1ZScgfCAndmlvbGV0JyB8ICdncmF5JztcblxuZXhwb3J0IGludGVyZmFjZSBLZXlEZXNjcmlwdG9ySXRlbSB7XG5cdGtleVNoYXBlSW52YWxpZGF0ZWQ/OiBib29sZWFuO1xuXHRrZXlPcmlnaW5UeXBlPzogbnVtYmVyO1xuXHRrZXlPcmlnaW5SZXNvbHV0aW9uPzogbnVtYmVyO1xuXHRrZXlPcmlnaW5SUmVjdFJhZGlpPzoge1xuXHRcdHRvcFJpZ2h0OiBVbml0c1ZhbHVlO1xuXHRcdHRvcExlZnQ6IFVuaXRzVmFsdWU7XG5cdFx0Ym90dG9tTGVmdDogVW5pdHNWYWx1ZTtcblx0XHRib3R0b21SaWdodDogVW5pdHNWYWx1ZTtcblx0fTtcblx0a2V5T3JpZ2luU2hhcGVCb3VuZGluZ0JveD86IHtcblx0XHR0b3A6IFVuaXRzVmFsdWU7XG5cdFx0bGVmdDogVW5pdHNWYWx1ZTtcblx0XHRib3R0b206IFVuaXRzVmFsdWU7XG5cdFx0cmlnaHQ6IFVuaXRzVmFsdWU7XG5cdH07XG5cdGtleU9yaWdpbkJveENvcm5lcnM/OiB7IHg6IG51bWJlcjsgeTogbnVtYmVyOyB9W107XG5cdHRyYW5zZm9ybT86IG51bWJlcltdOyAvLyBbeHgsIHh5LCB5eCwgeXksIHR4LCB0eV1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBMYXllckFkZGl0aW9uYWxJbmZvIHtcblx0bmFtZT86IHN0cmluZzsgLy8gbGF5ZXIgbmFtZVxuXHRuYW1lU291cmNlPzogc3RyaW5nOyAvLyBsYXllciBuYW1lIHNvdXJjZVxuXHRpZD86IG51bWJlcjsgLy8gbGF5ZXIgaWRcblx0dmVyc2lvbj86IG51bWJlcjsgLy8gbGF5ZXIgdmVyc2lvblxuXHRtYXNrPzogTGF5ZXJNYXNrRGF0YTtcblx0YmxlbmRDbGlwcGVuZEVsZW1lbnRzPzogYm9vbGVhbjtcblx0YmxlbmRJbnRlcmlvckVsZW1lbnRzPzogYm9vbGVhbjtcblx0a25vY2tvdXQ/OiBib29sZWFuO1xuXHRwcm90ZWN0ZWQ/OiB7XG5cdFx0dHJhbnNwYXJlbmN5PzogYm9vbGVhbjtcblx0XHRjb21wb3NpdGU/OiBib29sZWFuO1xuXHRcdHBvc2l0aW9uPzogYm9vbGVhbjtcblx0XHRhcnRib2FyZHM/OiBib29sZWFuO1xuXHR9O1xuXHRsYXllckNvbG9yPzogTGF5ZXJDb2xvcjtcblx0cmVmZXJlbmNlUG9pbnQ/OiB7XG5cdFx0eDogbnVtYmVyO1xuXHRcdHk6IG51bWJlcjtcblx0fTtcblx0c2VjdGlvbkRpdmlkZXI/OiB7XG5cdFx0dHlwZTogU2VjdGlvbkRpdmlkZXJUeXBlO1xuXHRcdGtleT86IHN0cmluZztcblx0XHRzdWJUeXBlPzogbnVtYmVyO1xuXHR9O1xuXHRmaWx0ZXJNYXNrPzoge1xuXHRcdGNvbG9yU3BhY2U6IENvbG9yO1xuXHRcdG9wYWNpdHk6IG51bWJlcjtcblx0fTtcblx0ZWZmZWN0cz86IExheWVyRWZmZWN0c0luZm87XG5cdHRleHQ/OiBMYXllclRleHREYXRhO1xuXHRwYXR0ZXJucz86IFBhdHRlcm5JbmZvW107IC8vIG5vdCBzdXBwb3J0ZWQgeWV0XG5cdHZlY3RvckZpbGw/OiBWZWN0b3JDb250ZW50O1xuXHR2ZWN0b3JTdHJva2U/OiB7XG5cdFx0c3Ryb2tlRW5hYmxlZD86IGJvb2xlYW47XG5cdFx0ZmlsbEVuYWJsZWQ/OiBib29sZWFuO1xuXHRcdGxpbmVXaWR0aD86IFVuaXRzVmFsdWU7XG5cdFx0bGluZURhc2hPZmZzZXQ/OiBVbml0c1ZhbHVlO1xuXHRcdG1pdGVyTGltaXQ/OiBudW1iZXI7XG5cdFx0bGluZUNhcFR5cGU/OiBMaW5lQ2FwVHlwZTtcblx0XHRsaW5lSm9pblR5cGU/OiBMaW5lSm9pblR5cGU7XG5cdFx0bGluZUFsaWdubWVudD86IExpbmVBbGlnbm1lbnQ7XG5cdFx0c2NhbGVMb2NrPzogYm9vbGVhbjtcblx0XHRzdHJva2VBZGp1c3Q/OiBib29sZWFuO1xuXHRcdGxpbmVEYXNoU2V0PzogVW5pdHNWYWx1ZVtdO1xuXHRcdGJsZW5kTW9kZT86IEJsZW5kTW9kZTtcblx0XHRvcGFjaXR5PzogbnVtYmVyO1xuXHRcdGNvbnRlbnQ/OiBWZWN0b3JDb250ZW50O1xuXHRcdHJlc29sdXRpb24/OiBudW1iZXI7XG5cdH07XG5cdHZlY3Rvck1hc2s/OiB7XG5cdFx0aW52ZXJ0PzogYm9vbGVhbjtcblx0XHRub3RMaW5rPzogYm9vbGVhbjtcblx0XHRkaXNhYmxlPzogYm9vbGVhbjtcblx0XHRmaWxsU3RhcnRzV2l0aEFsbFBpeGVscz86IGJvb2xlYW47XG5cdFx0Y2xpcGJvYXJkPzoge1xuXHRcdFx0dG9wOiBudW1iZXI7XG5cdFx0XHRsZWZ0OiBudW1iZXI7XG5cdFx0XHRib3R0b206IG51bWJlcjtcblx0XHRcdHJpZ2h0OiBudW1iZXI7XG5cdFx0XHRyZXNvbHV0aW9uOiBudW1iZXI7XG5cdFx0fTtcblx0XHRwYXRoczogQmV6aWVyUGF0aFtdO1xuXHR9O1xuXHR1c2luZ0FsaWduZWRSZW5kZXJpbmc/OiBib29sZWFuO1xuXHR0aW1lc3RhbXA/OiBudW1iZXI7IC8vIHNlY29uZHNcblx0cGF0aExpc3Q/OiB7XG5cdH1bXTtcblx0YWRqdXN0bWVudD86IEFkanVzdG1lbnRMYXllcjtcblx0cGxhY2VkTGF5ZXI/OiBQbGFjZWRMYXllcjtcblx0dmVjdG9yT3JpZ2luYXRpb24/OiB7XG5cdFx0a2V5RGVzY3JpcHRvckxpc3Q6IEtleURlc2NyaXB0b3JJdGVtW107XG5cdH07XG5cdGNvbXBvc2l0b3JVc2VkPzoge1xuXHRcdGRlc2NyaXB0aW9uOiBzdHJpbmc7XG5cdFx0cmVhc29uOiBzdHJpbmc7XG5cdFx0ZW5naW5lOiBzdHJpbmc7XG5cdFx0ZW5hYmxlQ29tcENvcmU6IHN0cmluZztcblx0XHRlbmFibGVDb21wQ29yZUdQVTogc3RyaW5nO1xuXHRcdGNvbXBDb3JlU3VwcG9ydDogc3RyaW5nO1xuXHRcdGNvbXBDb3JlR1BVU3VwcG9ydDogc3RyaW5nO1xuXHR9O1xuXHRhcnRib2FyZD86IHtcblx0XHRyZWN0OiB7IHRvcDogbnVtYmVyOyBsZWZ0OiBudW1iZXI7IGJvdHRvbTogbnVtYmVyOyByaWdodDogbnVtYmVyOyB9O1xuXHRcdGd1aWRlSW5kaWNlcz86IGFueVtdO1xuXHRcdHByZXNldE5hbWU/OiBzdHJpbmc7XG5cdFx0Y29sb3I/OiBDb2xvcjtcblx0XHRiYWNrZ3JvdW5kVHlwZT86IG51bWJlcjtcblx0fTtcblxuXHQvLyBCYXNlNjQgZW5jb2RlZCByYXcgRW5naW5lRGF0YSwgY3VycmVudGx5IGp1c3Qga2VwdCBpbiBvcmlnaW5hbCBzdGF0ZSB0byBzdXBwb3J0XG5cdC8vIGxvYWRpbmcgYW5kIG1vZGlmeWluZyBQU0QgZmlsZSB3aXRob3V0IGJyZWFraW5nIHRleHQgbGF5ZXJzLlxuXHRlbmdpbmVEYXRhPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEltYWdlUmVzb3VyY2VzIHtcblx0bGF5ZXJTdGF0ZT86IG51bWJlcjtcblx0bGF5ZXJzR3JvdXA/OiBudW1iZXJbXTtcblx0bGF5ZXJTZWxlY3Rpb25JZHM/OiBudW1iZXJbXTtcblx0bGF5ZXJHcm91cHNFbmFibGVkSWQ/OiBudW1iZXJbXTtcblx0dmVyc2lvbkluZm8/OiB7XG5cdFx0aGFzUmVhbE1lcmdlZERhdGE6IGJvb2xlYW47XG5cdFx0d3JpdGVyTmFtZTogc3RyaW5nO1xuXHRcdHJlYWRlck5hbWU6IHN0cmluZztcblx0XHRmaWxlVmVyc2lvbjogbnVtYmVyO1xuXHR9O1xuXHRhbHBoYUlkZW50aWZpZXJzPzogbnVtYmVyW107XG5cdGFscGhhQ2hhbm5lbE5hbWVzPzogc3RyaW5nW107XG5cdGdsb2JhbEFuZ2xlPzogbnVtYmVyO1xuXHRnbG9iYWxBbHRpdHVkZT86IG51bWJlcjtcblx0cGl4ZWxBc3BlY3RSYXRpbz86IHtcblx0XHRhc3BlY3Q6IG51bWJlcjtcblx0fTtcblx0dXJsc0xpc3Q/OiBhbnlbXTtcblx0Z3JpZEFuZEd1aWRlc0luZm9ybWF0aW9uPzoge1xuXHRcdGdyaWQ/OiB7XG5cdFx0XHRob3Jpem9udGFsOiBudW1iZXI7XG5cdFx0XHR2ZXJ0aWNhbDogbnVtYmVyO1xuXHRcdH0sXG5cdFx0Z3VpZGVzPzoge1xuXHRcdFx0bG9jYXRpb246IG51bWJlcjtcblx0XHRcdGRpcmVjdGlvbjogJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJztcblx0XHR9W107XG5cdH07XG5cdHJlc29sdXRpb25JbmZvPzoge1xuXHRcdGhvcml6b250YWxSZXNvbHV0aW9uOiBudW1iZXI7XG5cdFx0aG9yaXpvbnRhbFJlc29sdXRpb25Vbml0OiAnUFBJJyB8ICdQUENNJztcblx0XHR3aWR0aFVuaXQ6ICdJbmNoZXMnIHwgJ0NlbnRpbWV0ZXJzJyB8ICdQb2ludHMnIHwgJ1BpY2FzJyB8ICdDb2x1bW5zJztcblx0XHR2ZXJ0aWNhbFJlc29sdXRpb246IG51bWJlcjtcblx0XHR2ZXJ0aWNhbFJlc29sdXRpb25Vbml0OiAnUFBJJyB8ICdQUENNJztcblx0XHRoZWlnaHRVbml0OiAnSW5jaGVzJyB8ICdDZW50aW1ldGVycycgfCAnUG9pbnRzJyB8ICdQaWNhcycgfCAnQ29sdW1ucyc7XG5cdH07XG5cdHRodW1ibmFpbD86IEhUTUxDYW52YXNFbGVtZW50O1xuXHR0aHVtYm5haWxSYXc/OiB7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyOyBkYXRhOiBVaW50OEFycmF5OyB9O1xuXHRjYXB0aW9uRGlnZXN0Pzogc3RyaW5nO1xuXHR4bXBNZXRhZGF0YT86IHN0cmluZztcblx0cHJpbnRTY2FsZT86IHtcblx0XHRzdHlsZT86ICdjZW50ZXJlZCcgfCAnc2l6ZSB0byBmaXQnIHwgJ3VzZXIgZGVmaW5lZCc7XG5cdFx0eD86IG51bWJlcjtcblx0XHR5PzogbnVtYmVyO1xuXHRcdHNjYWxlPzogbnVtYmVyO1xuXHR9O1xuXHRwcmludEluZm9ybWF0aW9uPzoge1xuXHRcdHByaW50ZXJNYW5hZ2VzQ29sb3JzPzogYm9vbGVhbjtcblx0XHRwcmludGVyTmFtZT86IHN0cmluZztcblx0XHRwcmludGVyUHJvZmlsZT86IHN0cmluZztcblx0XHRwcmludFNpeHRlZW5CaXQ/OiBib29sZWFuO1xuXHRcdHJlbmRlcmluZ0ludGVudD86IFJlbmRlcmluZ0ludGVudDtcblx0XHRoYXJkUHJvb2Y/OiBib29sZWFuO1xuXHRcdGJsYWNrUG9pbnRDb21wZW5zYXRpb24/OiBib29sZWFuO1xuXHRcdHByb29mU2V0dXA/OiB7XG5cdFx0XHRidWlsdGluOiBzdHJpbmc7XG5cdFx0fSB8IHtcblx0XHRcdHByb2ZpbGU6IHN0cmluZztcblx0XHRcdHJlbmRlcmluZ0ludGVudD86IFJlbmRlcmluZ0ludGVudDtcblx0XHRcdGJsYWNrUG9pbnRDb21wZW5zYXRpb24/OiBib29sZWFuO1xuXHRcdFx0cGFwZXJXaGl0ZT86IGJvb2xlYW47XG5cdFx0fTtcblx0fTtcblx0YmFja2dyb3VuZENvbG9yPzogQ29sb3I7XG5cdGlkc1NlZWROdW1iZXI/OiBudW1iZXI7XG5cdHByaW50RmxhZ3M/OiB7XG5cdFx0bGFiZWxzPzogYm9vbGVhbjtcblx0XHRjcm9wTWFya3M/OiBib29sZWFuO1xuXHRcdGNvbG9yQmFycz86IGJvb2xlYW47XG5cdFx0cmVnaXN0cmF0aW9uTWFya3M/OiBib29sZWFuO1xuXHRcdG5lZ2F0aXZlPzogYm9vbGVhbjtcblx0XHRmbGlwPzogYm9vbGVhbjtcblx0XHRpbnRlcnBvbGF0ZT86IGJvb2xlYW47XG5cdFx0Y2FwdGlvbj86IGJvb2xlYW47XG5cdFx0cHJpbnRGbGFncz86IGJvb2xlYW47XG5cdH07XG5cdGljY1VudGFnZ2VkUHJvZmlsZT86IGJvb2xlYW47XG5cdHBhdGhTZWxlY3Rpb25TdGF0ZT86IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEdsb2JhbExheWVyTWFza0luZm8ge1xuXHRvdmVybGF5Q29sb3JTcGFjZTogbnVtYmVyO1xuXHRjb2xvclNwYWNlMTogbnVtYmVyO1xuXHRjb2xvclNwYWNlMjogbnVtYmVyO1xuXHRjb2xvclNwYWNlMzogbnVtYmVyO1xuXHRjb2xvclNwYWNlNDogbnVtYmVyO1xuXHRvcGFjaXR5OiBudW1iZXI7XG5cdGtpbmQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBbm5vdGF0aW9uIHtcblx0dHlwZTogJ3RleHQnIHwgJ3NvdW5kJztcblx0b3BlbjogYm9vbGVhbjtcblx0aWNvbkxvY2F0aW9uOiB7IGxlZnQ6IG51bWJlcjsgdG9wOiBudW1iZXI7IHJpZ2h0OiBudW1iZXI7IGJvdHRvbTogbnVtYmVyIH07XG5cdHBvcHVwTG9jYXRpb246IHsgbGVmdDogbnVtYmVyOyB0b3A6IG51bWJlcjsgcmlnaHQ6IG51bWJlcjsgYm90dG9tOiBudW1iZXIgfTtcblx0Y29sb3I6IENvbG9yO1xuXHRhdXRob3I6IHN0cmluZztcblx0bmFtZTogc3RyaW5nO1xuXHRkYXRlOiBzdHJpbmc7XG5cdGRhdGE6IHN0cmluZyB8IFVpbnQ4QXJyYXk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTGF5ZXIgZXh0ZW5kcyBMYXllckFkZGl0aW9uYWxJbmZvIHtcblx0dG9wPzogbnVtYmVyO1xuXHRsZWZ0PzogbnVtYmVyO1xuXHRib3R0b20/OiBudW1iZXI7XG5cdHJpZ2h0PzogbnVtYmVyO1xuXHRibGVuZE1vZGU/OiBCbGVuZE1vZGU7XG5cdG9wYWNpdHk/OiBudW1iZXI7XG5cdHRyYW5zcGFyZW5jeVByb3RlY3RlZD86IGJvb2xlYW47XG5cdGhpZGRlbj86IGJvb2xlYW47XG5cdGNsaXBwaW5nPzogYm9vbGVhbjtcblx0Y2FudmFzPzogSFRNTENhbnZhc0VsZW1lbnQ7XG5cdGltYWdlRGF0YT86IEltYWdlRGF0YTtcblx0Y2hpbGRyZW4/OiBMYXllcltdO1xuXHQvKiogYXBwbGllcyBvbmx5IGZvciBsYXllciBncm91cHMgKi9cblx0b3BlbmVkPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQc2QgZXh0ZW5kcyBMYXllckFkZGl0aW9uYWxJbmZvIHtcblx0d2lkdGg6IG51bWJlcjtcblx0aGVpZ2h0OiBudW1iZXI7XG5cdGNoYW5uZWxzPzogbnVtYmVyO1xuXHRiaXRzUGVyQ2hhbm5lbD86IG51bWJlcjtcblx0Y29sb3JNb2RlPzogQ29sb3JNb2RlO1xuXHRjaGlsZHJlbj86IExheWVyW107XG5cdGNhbnZhcz86IEhUTUxDYW52YXNFbGVtZW50O1xuXHRpbWFnZURhdGE/OiBJbWFnZURhdGE7XG5cdGltYWdlUmVzb3VyY2VzPzogSW1hZ2VSZXNvdXJjZXM7XG5cdGxpbmtlZEZpbGVzPzogTGlua2VkRmlsZVtdOyAvLyB1c2VkIGluIHNtYXJ0IG9iamVjdHNcblx0YXJ0Ym9hcmRzPzoge1xuXHRcdGNvdW50OiBudW1iZXI7XG5cdFx0YXV0b0V4cGFuZE9mZnNldD86IHsgaG9yaXpvbnRhbDogbnVtYmVyOyB2ZXJ0aWNhbDogbnVtYmVyOyB9O1xuXHRcdG9yaWdpbj86IHsgaG9yaXpvbnRhbDogbnVtYmVyOyB2ZXJ0aWNhbDogbnVtYmVyOyB9O1xuXHRcdGF1dG9FeHBhbmRFbmFibGVkPzogYm9vbGVhbjtcblx0XHRhdXRvTmVzdEVuYWJsZWQ/OiBib29sZWFuO1xuXHRcdGF1dG9Qb3NpdGlvbkVuYWJsZWQ/OiBib29sZWFuO1xuXHRcdHNocmlua3dyYXBPblNhdmVFbmFibGVkPzogYm9vbGVhbjtcblx0XHRkb2NEZWZhdWx0TmV3QXJ0Ym9hcmRCYWNrZ3JvdW5kQ29sb3I/OiBDb2xvcjtcblx0XHRkb2NEZWZhdWx0TmV3QXJ0Ym9hcmRCYWNrZ3JvdW5kVHlwZT86IG51bWJlcjtcblx0fTtcblx0Z2xvYmFsTGF5ZXJNYXNrSW5mbz86IEdsb2JhbExheWVyTWFza0luZm87XG5cdGFubm90YXRpb25zPzogQW5ub3RhdGlvbltdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlYWRPcHRpb25zIHtcblx0LyoqIERvZXMgbm90IGxvYWQgbGF5ZXIgaW1hZ2UgZGF0YS4gKi9cblx0c2tpcExheWVySW1hZ2VEYXRhPzogYm9vbGVhbjtcblx0LyoqIERvZXMgbm90IGxvYWQgY29tcG9zaXRlIGltYWdlIGRhdGEuICovXG5cdHNraXBDb21wb3NpdGVJbWFnZURhdGE/OiBib29sZWFuO1xuXHQvKiogRG9lcyBub3QgbG9hZCB0aHVtYm5haWwuICovXG5cdHNraXBUaHVtYm5haWw/OiBib29sZWFuO1xuXHQvKiogRG9lcyBub3QgbG9hZCBsaW5rZWQgZmlsZXMgKHVzZWQgaW4gc21hcnQtb2JqZWN0cykuICovXG5cdHNraXBMaW5rZWRGaWxlc0RhdGE/OiBib29sZWFuO1xuXHQvKiogVGhyb3dzIGV4Y2VwdGlvbiBpZiBmZWF0dXJlcyBhcmUgbWlzc2luZy4gKi9cblx0dGhyb3dGb3JNaXNzaW5nRmVhdHVyZXM/OiBib29sZWFuO1xuXHQvKiogTG9ncyBpZiBmZWF0dXJlcyBhcmUgbWlzc2luZy4gKi9cblx0bG9nTWlzc2luZ0ZlYXR1cmVzPzogYm9vbGVhbjtcblx0LyoqIEtlZXAgaW1hZ2UgZGF0YSBhcyBieXRlIGFycmF5IGluc3RlYWQgb2YgY2FudmFzLlxuXHQgKiAoaW1hZ2UgZGF0YSB3aWxsIGFwcGVhciBpbiBgaW1hZ2VEYXRhYCBmaWVsZHMgaW5zdGVhZCBvZiBgY2FudmFzYCBmaWVsZHMpXG5cdCAqIFRoaXMgYXZvaWRzIGlzc3VlcyB3aXRoIGNhbnZhcyBwcmVtdWx0aXBsaWVkIGFscGhhIGNvcnJ1cHRpbmcgaW1hZ2UgZGF0YS4gKi9cblx0dXNlSW1hZ2VEYXRhPzogYm9vbGVhbjtcblx0LyoqIExvYWRzIHRodW1ibmFpbCByYXcgZGF0YSBpbnN0ZWFkIG9mIGRlY29kaW5nIGl0J3MgY29udGVudCBpbnRvIGNhbnZhcy5cblx0ICogYHRodW1uYWlsUmF3YCBmaWVsZCBpcyB1c2VkIGluc3RlYWQuICovXG5cdHVzZVJhd1RodW1ibmFpbD86IGJvb2xlYW47XG5cdC8qKiBVc2VuZCBvbmx5IGZvciBkZXZlbG9wbWVudCAqL1xuXHRsb2dEZXZGZWF0dXJlcz86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgV3JpdGVPcHRpb25zIHtcblx0LyoqIEF1dG9tYXRpY2FsbHkgZ2VuZXJhdGVzIHRodW1ibmFpbCBmcm9tIGNvbXBvc2l0ZSBpbWFnZS4gKi9cblx0Z2VuZXJhdGVUaHVtYm5haWw/OiBib29sZWFuO1xuXHQvKiogVHJpbXMgdHJhbnNwYXJlbnQgcGl4ZWxzIGZyb20gbGF5ZXIgaW1hZ2UgZGF0YS4gKi9cblx0dHJpbUltYWdlRGF0YT86IGJvb2xlYW47XG5cdC8qKiBJbnZhbGlkYXRlcyB0ZXh0IGxheWVyIGRhdGEsIGZvcmNpbmcgUGhvdG9zaG9wIHRvIHJlZHJhdyB0aGVtIG9uIGxvYWQuXG5cdCAqICBVc2UgdGhpcyBvcHRpb24gaWYgeW91J3JlIHVwZGF0aW5nIGxvYWRlZCB0ZXh0IGxheWVyIHByb3BlcnRpZXMuICovXG5cdGludmFsaWRhdGVUZXh0TGF5ZXJzPzogYm9vbGVhbjtcblx0LyoqIExvZ3MgaWYgZmVhdHVyZXMgYXJlIG1pc3NpbmcuICovXG5cdGxvZ01pc3NpbmdGZWF0dXJlcz86IGJvb2xlYW47XG5cdC8qKiBGb3JjZXMgYm90dG9tIGxheWVyIHRvIGJlIHRyZWF0ZWQgYXMgbGF5ZXIgYW5kIG5vdCBiYWNrZ3JvdW5kIGV2ZW4gd2hlbiBpdCdzIG1pc3NpbmcgYW55IHRyYW5zcGFyZW5jeVxuXHQgKiBcdChieSBkZWZhdWx0IFBob3Rvc2hvcCB0cmVhdHMgYm90dG9tIGxheWVyIGFzIGJhY2tncm91bmQgaXQgaXQgZG9lc24ndCBoYXZlIGFueSB0cmFuc3BhcmVudCBwaXhlbHMpICovXG5cdG5vQmFja2dyb3VuZD86IGJvb2xlYW47XG5cdC8qKiBTYXZlcyBkb2N1bWVudCBhcyBQU0IgKExhcmdlIERvY3VtZW50IEZvcm1hdCkgZmlsZSAqL1xuXHRwc2I/OiBib29sZWFuO1xufVxuIl0sInNvdXJjZVJvb3QiOiIvaG9tZS9tYW5oL2thb3Bpei9lZWwvYWctcHNkL3NyYyJ9
