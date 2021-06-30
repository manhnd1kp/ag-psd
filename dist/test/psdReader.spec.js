"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var chai_1 = require("chai");
var common_1 = require("./common");
var index_1 = require("../index");
var psdReader_1 = require("../psdReader");
var testFilesPath = path.join(__dirname, '..', '..', 'test');
var readFilesPath = path.join(testFilesPath, 'read');
var readWriteFilesPath = path.join(testFilesPath, 'read-write');
var resultsFilesPath = path.join(__dirname, '..', '..', 'results');
var opts = {
    throwForMissingFeatures: true,
    logMissingFeatures: true,
};
describe('PsdReader', function () {
    it('reads width and height properly', function () {
        var psd = common_1.readPsdFromFile(path.join(readFilesPath, 'blend-mode', 'src.psd'), __assign({}, opts));
        chai_1.expect(psd.width).equal(300);
        chai_1.expect(psd.height).equal(200);
    });
    it('skips composite image data', function () {
        var psd = common_1.readPsdFromFile(path.join(readFilesPath, 'layers', 'src.psd'), __assign(__assign({}, opts), { skipCompositeImageData: true }));
        chai_1.expect(psd.canvas).not.ok;
    });
    it('skips layer image data', function () {
        var psd = common_1.readPsdFromFile(path.join(readFilesPath, 'layers', 'src.psd'), __assign(__assign({}, opts), { skipLayerImageData: true }));
        chai_1.expect(psd.children[0].canvas).not.ok;
    });
    it('reads PSD from Buffer with offset', function () {
        var file = fs.readFileSync(path.join(readFilesPath, 'layers', 'src.psd'));
        var outer = Buffer.alloc(file.byteLength + 100);
        file.copy(outer, 100);
        var inner = Buffer.from(outer.buffer, 100, file.byteLength);
        var psd = index_1.readPsd(inner, opts);
        chai_1.expect(psd.width).equal(300);
    });
    it.skip('duplicate smart', function () {
        var psd = common_1.readPsdFromFile(path.join('resources', 'src.psd'), __assign({}, opts));
        var child = psd.children[1].children[0];
        psd.children[1].children.push(child);
        // const child = psd.children![0];
        // delete child.id;
        // psd.children!.push(child);
        fs.writeFileSync('output.psd', index_1.writePsdBuffer(psd, {
            trimImageData: false,
            generateThumbnail: true,
            noBackground: true
        }));
        var psd2 = common_1.readPsdFromFile(path.join('output.psd'), __assign({}, opts));
        console.log(psd2.width);
    });
    // skipping "pattern" test because it requires zip cimpression of patterns
    fs.readdirSync(readFilesPath).filter(function (f) { return !/pattern/.test(f); }).forEach(function (f) {
        // fs.readdirSync(readFilesPath).filter(f => /alias/.test(f)).forEach(f => {
        it("reads PSD file (" + f + ")", function () {
            var _a;
            var basePath = path.join(readFilesPath, f);
            var fileName = fs.existsSync(path.join(basePath, 'src.psb')) ? 'src.psb' : 'src.psd';
            var psd = common_1.readPsdFromFile(path.join(basePath, fileName), __assign({}, opts));
            var expected = common_1.importPSD(basePath);
            var images = common_1.loadImagesFromDirectory(basePath);
            var compare = [];
            var compareFiles = [];
            compare.push({ name: "canvas.png", canvas: psd.canvas });
            psd.canvas = undefined;
            delete psd.imageData;
            delete psd.imageResources.xmpMetadata;
            var i = 0;
            function pushLayerCanvases(layers) {
                for (var _i = 0, layers_1 = layers; _i < layers_1.length; _i++) {
                    var l = layers_1[_i];
                    if (l.children) {
                        pushLayerCanvases(l.children);
                    }
                    else {
                        var layerId = i++;
                        compare.push({ name: "layer-" + layerId + ".png", canvas: l.canvas });
                        l.canvas = undefined;
                        delete l.imageData;
                        if (l.mask) {
                            compare.push({ name: "layer-" + layerId + "-mask.png", canvas: l.mask.canvas });
                            delete l.mask.canvas;
                            delete l.mask.imageData;
                        }
                    }
                }
            }
            if (psd.linkedFiles) {
                for (var _i = 0, _b = psd.linkedFiles; _i < _b.length; _i++) {
                    var file = _b[_i];
                    if (file.data) {
                        compareFiles.push({ name: file.name, data: file.data });
                        delete file.data;
                    }
                }
            }
            pushLayerCanvases(psd.children || []);
            fs.mkdirSync(path.join(resultsFilesPath, f), { recursive: true });
            if ((_a = psd.imageResources) === null || _a === void 0 ? void 0 : _a.thumbnail) {
                compare.push({ name: 'thumb.png', canvas: psd.imageResources.thumbnail, skip: true });
                delete psd.imageResources.thumbnail;
            }
            if (psd.imageResources)
                delete psd.imageResources.thumbnailRaw;
            compare.forEach(function (i) { return common_1.saveCanvas(path.join(resultsFilesPath, f, i.name), i.canvas); });
            compareFiles.forEach(function (i) { return fs.writeFileSync(path.join(resultsFilesPath, f, i.name), i.data); });
            fs.writeFileSync(path.join(resultsFilesPath, f, 'data.json'), JSON.stringify(psd, null, 2), 'utf8');
            clearEmptyCanvasFields(psd);
            clearEmptyCanvasFields(expected);
            chai_1.expect(psd).eql(expected, f);
            compare.forEach(function (i) { return i.skip || common_1.compareCanvases(images[i.name], i.canvas, f + "/" + i.name); });
            compareFiles.forEach(function (i) { return common_1.compareTwoFiles(path.join(basePath, i.name), i.data, f + "/" + i.name); });
        });
    });
    fs.readdirSync(readWriteFilesPath).forEach(function (f) {
        // fs.readdirSync(readWriteFilesPath).filter(f => /annot/.test(f)).forEach(f => {
        it("reads-writes PSD file (" + f + ")", function () {
            var ext = fs.existsSync(path.join(readWriteFilesPath, f, 'src.psb')) ? 'psb' : 'psd';
            var psd = common_1.readPsdFromFile(path.join(readWriteFilesPath, f, "src." + ext), __assign(__assign({}, opts), { useImageData: true, useRawThumbnail: true, throwForMissingFeatures: true }));
            var actual = index_1.writePsdBuffer(psd, { logMissingFeatures: true, psb: ext === 'psb' });
            var expected = fs.readFileSync(path.join(readWriteFilesPath, f, "expected." + ext));
            fs.writeFileSync(path.join(resultsFilesPath, "read-write-" + f + "." + ext), actual);
            fs.writeFileSync(path.join(resultsFilesPath, "read-write-" + f + ".bin"), actual);
            // console.log(require('util').inspect(psd, false, 99, true));
            // const psd2 = readPsdFromFile(path.join(resultsFilesPath, `read-write-${f}.psd`), { ...opts, useImageData: true, useRawThumbnail: true });
            // fs.writeFileSync('temp.txt', require('util').inspect(psd, false, 99, false), 'utf8');
            // fs.writeFileSync('temp2.txt', require('util').inspect(psd2, false, 99, false), 'utf8');
            common_1.compareBuffers(actual, expected, "read-write-" + f, 0);
        });
    });
    it.skip('write text layer test', function () {
        var psd = {
            width: 200,
            height: 200,
            children: [
                {
                    name: 'text layer',
                    text: {
                        text: 'Hello World\n• c • tiny!\r\ntest',
                        // orientation: 'vertical',
                        transform: [1, 0, 0, 1, 70, 70],
                        style: {
                            font: { name: 'ArialMT' },
                            fontSize: 30,
                            fillColor: { r: 0, g: 128, b: 0 },
                        },
                        styleRuns: [
                            { length: 12, style: { fillColor: { r: 255, g: 0, b: 0 } } },
                            { length: 12, style: { fillColor: { r: 0, g: 0, b: 255 } } },
                            { length: 4, style: { underline: true } },
                        ],
                        paragraphStyle: {
                            justification: 'center',
                        },
                        warp: {
                            style: 'arc',
                            value: 50,
                            perspective: 0,
                            perspectiveOther: 0,
                            rotate: 'horizontal',
                        },
                    },
                },
                {
                    name: '2nd layer',
                    text: {
                        text: 'Aaaaa',
                        transform: [1, 0, 0, 1, 70, 70],
                    },
                },
            ],
        };
        fs.writeFileSync(path.join(resultsFilesPath, '_TEXT2.psd'), index_1.writePsdBuffer(psd, { logMissingFeatures: true }));
    });
    it.skip('read text layer test', function () {
        var psd = common_1.readPsdFromFile(path.join(testFilesPath, 'text-test.psd'), opts);
        // const layer = psd.children![1];
        // layer.text!.text = 'Foo bar';
        var buffer = index_1.writePsdBuffer(psd, { logMissingFeatures: true });
        fs.writeFileSync(path.join(resultsFilesPath, '_TEXT.psd'), buffer);
        // console.log(require('util').inspect(psd.children![0].text, false, 99, true));
        // console.log(require('util').inspect(psd.children![1].text, false, 99, true));
        // console.log(require('util').inspect(psd.engineData, false, 99, true));
    });
    it.skip('READ TEST', function () {
        var originalBuffer = fs.readFileSync(path.join(testFilesPath, 'test.psd'));
        console.log('READING ORIGINAL');
        var opts = {
            logMissingFeatures: true,
            throwForMissingFeatures: true,
            useImageData: true,
            useRawThumbnail: true,
            logDevFeatures: true,
        };
        var originalPsd = psdReader_1.readPsd(common_1.createReaderFromBuffer(originalBuffer), opts);
        console.log('WRITING');
        var buffer = index_1.writePsdBuffer(originalPsd, { logMissingFeatures: true });
        fs.writeFileSync('temp.psd', buffer);
        // fs.writeFileSync('temp.bin', buffer);
        // fs.writeFileSync('temp.json', JSON.stringify(originalPsd, null, 2), 'utf8');
        // fs.writeFileSync('temp.xml', originalPsd.imageResources?.xmpMetadata, 'utf8');
        console.log('READING WRITTEN');
        var psd = psdReader_1.readPsd(common_1.createReaderFromBuffer(buffer), { logMissingFeatures: true, throwForMissingFeatures: true });
        clearCanvasFields(originalPsd);
        clearCanvasFields(psd);
        delete originalPsd.imageResources.thumbnail;
        delete psd.imageResources.thumbnail;
        delete originalPsd.imageResources.thumbnailRaw;
        delete psd.imageResources.thumbnailRaw;
        // console.log(require('util').inspect(originalPsd, false, 99, true));
        // fs.writeFileSync('original.json', JSON.stringify(originalPsd, null, 2));
        // fs.writeFileSync('after.json', JSON.stringify(psd, null, 2));
        common_1.compareBuffers(buffer, originalBuffer, 'test');
        chai_1.expect(psd).eql(originalPsd);
    });
    it.skip('decode engine data 2', function () {
        // const fileData = fs.readFileSync(path.join(__dirname, '..', '..', 'resources', 'engineData2Vertical.txt'));
        var fileData = fs.readFileSync(path.join(__dirname, '..', '..', 'resources', 'engineData2Simple.txt'));
        var func = new Function("return " + fileData + ";");
        var data = func();
        var result = decodeEngineData2(data);
        fs.writeFileSync(path.join(__dirname, '..', '..', 'resources', 'temp.js'), 'var x = ' + require('util').inspect(result, false, 99, false), 'utf8');
    });
    it.skip('test.psd', function () {
        var buffer = fs.readFileSync('test.psd');
        var psd = psdReader_1.readPsd(common_1.createReaderFromBuffer(buffer), {
            skipCompositeImageData: true,
            skipLayerImageData: true,
            skipThumbnail: true,
            throwForMissingFeatures: true,
            logDevFeatures: true,
        });
        delete psd.engineData;
        psd.imageResources = {};
        console.log(require('util').inspect(psd, false, 99, true));
    });
    it.skip('test', function () {
        var psd = psdReader_1.readPsd(common_1.createReaderFromBuffer(fs.readFileSync("test/read-write/text-box/src.psd")), {
            // skipCompositeImageData: true,
            // skipLayerImageData: true,
            // skipThumbnail: true,
            throwForMissingFeatures: true,
            logDevFeatures: true,
            useRawThumbnail: true,
        });
        fs.writeFileSync('text_rect_out.psd', index_1.writePsdBuffer(psd, { logMissingFeatures: true }));
        fs.writeFileSync('text_rect_out.bin', index_1.writePsdBuffer(psd, { logMissingFeatures: true }));
        // const psd2 = readPsdInternal(createReaderFromBuffer(fs.readFileSync(`text_rect_out.psd`)), {
        // 	// skipCompositeImageData: true,
        // 	// skipLayerImageData: true,
        // 	// skipThumbnail: true,
        // 	throwForMissingFeatures: true,
        // 	logDevFeatures: true,
        // });
        // psd2;
        var original = fs.readFileSync("test/read-write/text-box/src.psd");
        var output = fs.readFileSync("text_rect_out.psd");
        common_1.compareBuffers(output, original, '-', 0x65d8); // , 0x8ce8, 0x8fca - 0x8ce8);
    });
    it.skip('compare test', function () {
        for (var _i = 0, _a = ['text_point', 'text_rect']; _i < _a.length; _i++) {
            var name_1 = _a[_i];
            var psd = psdReader_1.readPsd(common_1.createReaderFromBuffer(fs.readFileSync(name_1 + ".psd")), {
                skipCompositeImageData: true,
                skipLayerImageData: true,
                skipThumbnail: true,
                throwForMissingFeatures: true,
                logDevFeatures: true,
            });
            // psd.imageResources = {};
            fs.writeFileSync(name_1 + ".txt", require('util').inspect(psd, false, 99, false), 'utf8');
            // const engineData = parseEngineData(toByteArray(psd.engineData!));
            // fs.writeFileSync(`${name}_enginedata.txt`, require('util').inspect(engineData, false, 99, false), 'utf8');
        }
    });
    it.skip('text-replace.psd', function () {
        var _a, _b;
        {
            var buffer = fs.readFileSync('text-replace2.psd');
            var psd = psdReader_1.readPsd(common_1.createReaderFromBuffer(buffer), {});
            psd.children[1].text.text = 'Foo bar';
            var output = index_1.writePsdBuffer(psd, { invalidateTextLayers: true, logMissingFeatures: true });
            fs.writeFileSync('out.psd', output);
        }
        {
            var buffer = fs.readFileSync('text-replace.psd');
            var psd = psdReader_1.readPsd(common_1.createReaderFromBuffer(buffer), {
                skipCompositeImageData: true,
                skipLayerImageData: true,
                skipThumbnail: true,
                throwForMissingFeatures: true,
                logDevFeatures: true,
            });
            delete psd.engineData;
            psd.imageResources = {};
            (_a = psd.children) === null || _a === void 0 ? void 0 : _a.splice(0, 1);
            fs.writeFileSync('input.txt', require('util').inspect(psd, false, 99, false), 'utf8');
        }
        {
            var buffer = fs.readFileSync('out.psd');
            var psd = psdReader_1.readPsd(common_1.createReaderFromBuffer(buffer), {
                skipCompositeImageData: true,
                skipLayerImageData: true,
                skipThumbnail: true,
                throwForMissingFeatures: true,
                logDevFeatures: true,
            });
            delete psd.engineData;
            psd.imageResources = {};
            (_b = psd.children) === null || _b === void 0 ? void 0 : _b.splice(0, 1);
            fs.writeFileSync('output.txt', require('util').inspect(psd, false, 99, false), 'utf8');
        }
    });
});
function clearEmptyCanvasFields(layer) {
    var _a;
    if (layer) {
        if ('canvas' in layer && !layer.canvas)
            delete layer.canvas;
        if ('imageData' in layer && !layer.imageData)
            delete layer.imageData;
        (_a = layer.children) === null || _a === void 0 ? void 0 : _a.forEach(clearEmptyCanvasFields);
    }
}
function clearCanvasFields(layer) {
    var _a;
    if (layer) {
        delete layer.canvas;
        delete layer.imageData;
        if (layer.mask)
            delete layer.mask.canvas;
        if (layer.mask)
            delete layer.mask.imageData;
        (_a = layer.children) === null || _a === void 0 ? void 0 : _a.forEach(clearCanvasFields);
    }
}
/// Engine data 2 experiments
// /test/engineData2.json:1109 is character codes
var keysColor = {
    '0': {
        uproot: true,
        children: {
            '0': { name: 'Type' },
            '1': { name: 'Values' },
        },
    },
};
var keysStyleSheet = {
    '0': { name: 'Font' },
    '1': { name: 'FontSize' },
    '2': { name: 'FauxBold' },
    '3': { name: 'FauxItalic' },
    '4': { name: 'AutoLeading' },
    '5': { name: 'Leading' },
    '6': { name: 'HorizontalScale' },
    '7': { name: 'VerticalScale' },
    '8': { name: 'Tracking' },
    '9': { name: 'BaselineShift' },
    '11': { name: 'Kerning?' },
    '12': { name: 'FontCaps' },
    '13': { name: 'FontBaseline' },
    '15': { name: 'Strikethrough?' },
    '16': { name: 'Underline?' },
    '18': { name: 'Ligatures' },
    '19': { name: 'DLigatures' },
    '23': { name: 'Fractions' },
    '24': { name: 'Ordinals' },
    '28': { name: 'StylisticAlternates' },
    '30': { name: 'OldStyle?' },
    '35': { name: 'BaselineDirection' },
    '38': { name: 'Language' },
    '52': { name: 'NoBreak' },
    '53': { name: 'FillColor', children: keysColor },
};
var keysParagraph = {
    '0': { name: 'Justification' },
    '1': { name: 'FirstLineIndent' },
    '2': { name: 'StartIndent' },
    '3': { name: 'EndIndent' },
    '4': { name: 'SpaceBefore' },
    '5': { name: 'SpaceAfter' },
    '7': { name: 'AutoLeading' },
    '9': { name: 'AutoHyphenate' },
    '10': { name: 'HyphenatedWordSize' },
    '11': { name: 'PreHyphen' },
    '12': { name: 'PostHyphen' },
    '13': { name: 'ConsecutiveHyphens?' },
    '14': { name: 'Zone' },
    '15': { name: 'HypenateCapitalizedWords' },
    '17': { name: 'WordSpacing' },
    '18': { name: 'LetterSpacing' },
    '19': { name: 'GlyphSpacing' },
    '32': { name: 'StyleSheet', children: keysStyleSheet },
};
var keysStyleSheetData = {
    name: 'StyleSheetData',
    children: keysStyleSheet,
};
var keys = {
    '0': {
        name: 'ResourceDict',
        children: {
            '1': {
                name: 'FontSet',
                children: {
                    '0': {
                        uproot: true,
                        children: {
                            '0': {
                                uproot: true,
                                children: {
                                    '0': {
                                        uproot: true,
                                        children: {
                                            '0': { name: 'Name' },
                                            '2': { name: 'FontType' },
                                        },
                                    },
                                },
                            }
                        },
                    },
                },
            },
            '2': {
                name: '2',
                children: {},
            },
            '3': {
                name: 'MojiKumiSet',
                children: {
                    '0': {
                        uproot: true,
                        children: {
                            '0': {
                                uproot: true,
                                children: {
                                    '0': { name: 'InternalName' },
                                },
                            },
                        },
                    },
                },
            },
            '4': {
                name: 'KinsokuSet',
                children: {
                    '0': {
                        uproot: true,
                        children: {
                            '0': {
                                uproot: true,
                                children: {
                                    '0': { name: 'Name' },
                                    '5': {
                                        uproot: true,
                                        children: {
                                            '0': { name: 'NoStart' },
                                            '1': { name: 'NoEnd' },
                                            '2': { name: 'Keep' },
                                            '3': { name: 'Hanging' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '5': {
                name: 'StyleSheetSet',
                children: {
                    '0': {
                        uproot: true,
                        children: {
                            '0': {
                                uproot: true,
                                children: {
                                    '0': { name: 'Name' },
                                    '6': keysStyleSheetData,
                                },
                            },
                        },
                    },
                },
            },
            '6': {
                name: 'ParagraphSheetSet',
                children: {
                    '0': {
                        uproot: true,
                        children: {
                            '0': {
                                uproot: true,
                                children: {
                                    '0': { name: 'Name' },
                                    '5': {
                                        name: 'Properties',
                                        children: keysParagraph,
                                    },
                                    '6': { name: 'DefaultStyleSheet' },
                                },
                            },
                        },
                    },
                },
            },
            '8': {
                name: '8',
                children: {},
            },
            '9': {
                name: 'Predefined',
                children: {},
            },
        },
    },
    '1': {
        name: 'EngineDict',
        children: {
            '0': {
                name: '0',
                children: {
                    '0': {
                        name: '0',
                        children: {},
                    },
                    '3': { name: 'SuperscriptSize' },
                    '4': { name: 'SuperscriptPosition' },
                    '5': { name: 'SubscriptSize' },
                    '6': { name: 'SubscriptPosition' },
                    '7': { name: 'SmallCapSize' },
                    '8': { name: 'UseFractionalGlyphWidths' }, // ???
                },
            },
            '1': {
                name: 'Editors?',
                children: {
                    '0': {
                        name: 'Editor',
                        children: {
                            '0': { name: 'Text' },
                            '5': {
                                name: 'ParagraphRun',
                                children: {
                                    '0': {
                                        name: 'RunArray',
                                        children: {
                                            '0': {
                                                name: 'ParagraphSheet',
                                                children: {
                                                    '0': {
                                                        uproot: true,
                                                        children: {
                                                            '0': { name: '0' },
                                                            '5': {
                                                                name: '5',
                                                                children: keysParagraph,
                                                            },
                                                            '6': { name: '6' },
                                                        },
                                                    },
                                                },
                                            },
                                            '1': { name: 'RunLength' },
                                        },
                                    },
                                },
                            },
                            '6': {
                                name: 'StyleRun',
                                children: {
                                    '0': {
                                        name: 'RunArray',
                                        children: {
                                            '0': {
                                                name: 'StyleSheet',
                                                children: {
                                                    '0': {
                                                        uproot: true,
                                                        children: {
                                                            '6': keysStyleSheetData,
                                                        },
                                                    },
                                                },
                                            },
                                            '1': { name: 'RunLength' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '1': {
                        name: 'FontVectorData ???',
                    },
                },
            },
            '2': {
                name: 'StyleSheet',
                children: keysStyleSheet,
            },
            '3': {
                name: 'ParagraphSheet',
                children: keysParagraph,
            },
        },
    },
};
function decodeObj(obj, keys) {
    if (obj === null || !keys)
        return obj;
    if (Array.isArray(obj)) {
        return obj.map(function (x) { return decodeObj(x, keys); });
    }
    if (typeof obj !== 'object')
        return obj;
    var result = {};
    for (var _i = 0, _a = Object.keys(obj); _i < _a.length; _i++) {
        var key = _a[_i];
        if (keys[key]) {
            if (keys[key].uproot) {
                return decodeObj(obj[key], keys[key].children);
            }
            else {
                result[keys[key].name] = decodeObj(obj[key], keys[key].children);
            }
        }
        else {
            result[key] = obj[key];
        }
    }
    return result;
}
function decodeEngineData2(data) {
    return decodeObj(data, keys);
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,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ZmlsZSI6InRlc3QvcHNkUmVhZGVyLnNwZWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSAnY2hhaSc7XG5pbXBvcnQge1xuXHRyZWFkUHNkRnJvbUZpbGUsIGltcG9ydFBTRCwgbG9hZEltYWdlc0Zyb21EaXJlY3RvcnksIGNvbXBhcmVDYW52YXNlcywgc2F2ZUNhbnZhcyxcblx0Y3JlYXRlUmVhZGVyRnJvbUJ1ZmZlciwgY29tcGFyZUJ1ZmZlcnMsIGNvbXBhcmVUd29GaWxlc1xufSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQgeyBMYXllciwgUmVhZE9wdGlvbnMsIFBzZCB9IGZyb20gJy4uL3BzZCc7XG5pbXBvcnQgeyByZWFkUHNkLCB3cml0ZVBzZEJ1ZmZlciB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCB7IHJlYWRQc2QgYXMgcmVhZFBzZEludGVybmFsIH0gZnJvbSAnLi4vcHNkUmVhZGVyJztcblxuY29uc3QgdGVzdEZpbGVzUGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLicsICcuLicsICd0ZXN0Jyk7XG5jb25zdCByZWFkRmlsZXNQYXRoID0gcGF0aC5qb2luKHRlc3RGaWxlc1BhdGgsICdyZWFkJyk7XG5jb25zdCByZWFkV3JpdGVGaWxlc1BhdGggPSBwYXRoLmpvaW4odGVzdEZpbGVzUGF0aCwgJ3JlYWQtd3JpdGUnKTtcbmNvbnN0IHJlc3VsdHNGaWxlc1BhdGggPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAnLi4nLCAncmVzdWx0cycpO1xuY29uc3Qgb3B0czogUmVhZE9wdGlvbnMgPSB7XG5cdHRocm93Rm9yTWlzc2luZ0ZlYXR1cmVzOiB0cnVlLFxuXHRsb2dNaXNzaW5nRmVhdHVyZXM6IHRydWUsXG59O1xuXG5kZXNjcmliZSgnUHNkUmVhZGVyJywgKCkgPT4ge1xuXHRpdCgncmVhZHMgd2lkdGggYW5kIGhlaWdodCBwcm9wZXJseScsICgpID0+IHtcblx0XHRjb25zdCBwc2QgPSByZWFkUHNkRnJvbUZpbGUocGF0aC5qb2luKHJlYWRGaWxlc1BhdGgsICdibGVuZC1tb2RlJywgJ3NyYy5wc2QnKSwgeyAuLi5vcHRzIH0pO1xuXHRcdGV4cGVjdChwc2Qud2lkdGgpLmVxdWFsKDMwMCk7XG5cdFx0ZXhwZWN0KHBzZC5oZWlnaHQpLmVxdWFsKDIwMCk7XG5cdH0pO1xuXG5cdGl0KCdza2lwcyBjb21wb3NpdGUgaW1hZ2UgZGF0YScsICgpID0+IHtcblx0XHRjb25zdCBwc2QgPSByZWFkUHNkRnJvbUZpbGUocGF0aC5qb2luKHJlYWRGaWxlc1BhdGgsICdsYXllcnMnLCAnc3JjLnBzZCcpLCB7IC4uLm9wdHMsIHNraXBDb21wb3NpdGVJbWFnZURhdGE6IHRydWUgfSk7XG5cdFx0ZXhwZWN0KHBzZC5jYW52YXMpLm5vdC5vaztcblx0fSk7XG5cblx0aXQoJ3NraXBzIGxheWVyIGltYWdlIGRhdGEnLCAoKSA9PiB7XG5cdFx0Y29uc3QgcHNkID0gcmVhZFBzZEZyb21GaWxlKHBhdGguam9pbihyZWFkRmlsZXNQYXRoLCAnbGF5ZXJzJywgJ3NyYy5wc2QnKSwgeyAuLi5vcHRzLCBza2lwTGF5ZXJJbWFnZURhdGE6IHRydWUgfSk7XG5cdFx0ZXhwZWN0KHBzZC5jaGlsZHJlbiFbMF0uY2FudmFzKS5ub3Qub2s7XG5cdH0pO1xuXG5cdGl0KCdyZWFkcyBQU0QgZnJvbSBCdWZmZXIgd2l0aCBvZmZzZXQnLCAoKSA9PiB7XG5cdFx0Y29uc3QgZmlsZSA9IGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4ocmVhZEZpbGVzUGF0aCwgJ2xheWVycycsICdzcmMucHNkJykpO1xuXHRcdGNvbnN0IG91dGVyID0gQnVmZmVyLmFsbG9jKGZpbGUuYnl0ZUxlbmd0aCArIDEwMCk7XG5cdFx0ZmlsZS5jb3B5KG91dGVyLCAxMDApO1xuXHRcdGNvbnN0IGlubmVyID0gQnVmZmVyLmZyb20ob3V0ZXIuYnVmZmVyLCAxMDAsIGZpbGUuYnl0ZUxlbmd0aCk7XG5cblx0XHRjb25zdCBwc2QgPSByZWFkUHNkKGlubmVyLCBvcHRzKTtcblxuXHRcdGV4cGVjdChwc2Qud2lkdGgpLmVxdWFsKDMwMCk7XG5cdH0pO1xuXG5cdGl0LnNraXAoJ2R1cGxpY2F0ZSBzbWFydCcsICgpID0+IHtcblx0XHRjb25zdCBwc2QgPSByZWFkUHNkRnJvbUZpbGUocGF0aC5qb2luKCdyZXNvdXJjZXMnLCAnc3JjLnBzZCcpLCB7IC4uLm9wdHMgfSk7XG5cblx0XHRjb25zdCBjaGlsZCA9IHBzZC5jaGlsZHJlbiFbMV0uY2hpbGRyZW4hWzBdO1xuXHRcdHBzZC5jaGlsZHJlbiFbMV0uY2hpbGRyZW4hLnB1c2goY2hpbGQpO1xuXG5cdFx0Ly8gY29uc3QgY2hpbGQgPSBwc2QuY2hpbGRyZW4hWzBdO1xuXHRcdC8vIGRlbGV0ZSBjaGlsZC5pZDtcblx0XHQvLyBwc2QuY2hpbGRyZW4hLnB1c2goY2hpbGQpO1xuXG5cdFx0ZnMud3JpdGVGaWxlU3luYygnb3V0cHV0LnBzZCcsIHdyaXRlUHNkQnVmZmVyKHBzZCwge1xuXHRcdFx0dHJpbUltYWdlRGF0YTogZmFsc2UsXG5cdFx0XHRnZW5lcmF0ZVRodW1ibmFpbDogdHJ1ZSxcblx0XHRcdG5vQmFja2dyb3VuZDogdHJ1ZVxuXHRcdH0pKTtcblxuXHRcdGNvbnN0IHBzZDIgPSByZWFkUHNkRnJvbUZpbGUocGF0aC5qb2luKCdvdXRwdXQucHNkJyksIHsgLi4ub3B0cyB9KTtcblxuXHRcdGNvbnNvbGUubG9nKHBzZDIud2lkdGgpO1xuXHR9KTtcblxuXHQvLyBza2lwcGluZyBcInBhdHRlcm5cIiB0ZXN0IGJlY2F1c2UgaXQgcmVxdWlyZXMgemlwIGNpbXByZXNzaW9uIG9mIHBhdHRlcm5zXG5cdGZzLnJlYWRkaXJTeW5jKHJlYWRGaWxlc1BhdGgpLmZpbHRlcihmID0+ICEvcGF0dGVybi8udGVzdChmKSkuZm9yRWFjaChmID0+IHtcblx0XHQvLyBmcy5yZWFkZGlyU3luYyhyZWFkRmlsZXNQYXRoKS5maWx0ZXIoZiA9PiAvYWxpYXMvLnRlc3QoZikpLmZvckVhY2goZiA9PiB7XG5cdFx0aXQoYHJlYWRzIFBTRCBmaWxlICgke2Z9KWAsICgpID0+IHtcblx0XHRcdGNvbnN0IGJhc2VQYXRoID0gcGF0aC5qb2luKHJlYWRGaWxlc1BhdGgsIGYpO1xuXHRcdFx0Y29uc3QgZmlsZU5hbWUgPSBmcy5leGlzdHNTeW5jKHBhdGguam9pbihiYXNlUGF0aCwgJ3NyYy5wc2InKSkgPyAnc3JjLnBzYicgOiAnc3JjLnBzZCc7XG5cdFx0XHRjb25zdCBwc2QgPSByZWFkUHNkRnJvbUZpbGUocGF0aC5qb2luKGJhc2VQYXRoLCBmaWxlTmFtZSksIHsgLi4ub3B0cyB9KTtcblx0XHRcdGNvbnN0IGV4cGVjdGVkID0gaW1wb3J0UFNEKGJhc2VQYXRoKTtcblx0XHRcdGNvbnN0IGltYWdlcyA9IGxvYWRJbWFnZXNGcm9tRGlyZWN0b3J5KGJhc2VQYXRoKTtcblx0XHRcdGNvbnN0IGNvbXBhcmU6IHsgbmFtZTogc3RyaW5nOyBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50IHwgdW5kZWZpbmVkOyBza2lwPzogYm9vbGVhbjsgfVtdID0gW107XG5cdFx0XHRjb25zdCBjb21wYXJlRmlsZXM6IHsgbmFtZTogc3RyaW5nOyBkYXRhOiBVaW50OEFycmF5OyB9W10gPSBbXTtcblxuXHRcdFx0Y29tcGFyZS5wdXNoKHsgbmFtZTogYGNhbnZhcy5wbmdgLCBjYW52YXM6IHBzZC5jYW52YXMgfSk7XG5cdFx0XHRwc2QuY2FudmFzID0gdW5kZWZpbmVkO1xuXHRcdFx0ZGVsZXRlIHBzZC5pbWFnZURhdGE7XG5cdFx0XHRkZWxldGUgcHNkLmltYWdlUmVzb3VyY2VzIS54bXBNZXRhZGF0YTtcblxuXHRcdFx0bGV0IGkgPSAwO1xuXG5cdFx0XHRmdW5jdGlvbiBwdXNoTGF5ZXJDYW52YXNlcyhsYXllcnM6IExheWVyW10pIHtcblx0XHRcdFx0Zm9yIChjb25zdCBsIG9mIGxheWVycykge1xuXHRcdFx0XHRcdGlmIChsLmNoaWxkcmVuKSB7XG5cdFx0XHRcdFx0XHRwdXNoTGF5ZXJDYW52YXNlcyhsLmNoaWxkcmVuKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Y29uc3QgbGF5ZXJJZCA9IGkrKztcblx0XHRcdFx0XHRcdGNvbXBhcmUucHVzaCh7IG5hbWU6IGBsYXllci0ke2xheWVySWR9LnBuZ2AsIGNhbnZhczogbC5jYW52YXMgfSk7XG5cdFx0XHRcdFx0XHRsLmNhbnZhcyA9IHVuZGVmaW5lZDtcblx0XHRcdFx0XHRcdGRlbGV0ZSBsLmltYWdlRGF0YTtcblxuXHRcdFx0XHRcdFx0aWYgKGwubWFzaykge1xuXHRcdFx0XHRcdFx0XHRjb21wYXJlLnB1c2goeyBuYW1lOiBgbGF5ZXItJHtsYXllcklkfS1tYXNrLnBuZ2AsIGNhbnZhczogbC5tYXNrLmNhbnZhcyB9KTtcblx0XHRcdFx0XHRcdFx0ZGVsZXRlIGwubWFzay5jYW52YXM7XG5cdFx0XHRcdFx0XHRcdGRlbGV0ZSBsLm1hc2suaW1hZ2VEYXRhO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAocHNkLmxpbmtlZEZpbGVzKSB7XG5cdFx0XHRcdGZvciAoY29uc3QgZmlsZSBvZiBwc2QubGlua2VkRmlsZXMpIHtcblx0XHRcdFx0XHRpZiAoZmlsZS5kYXRhKSB7XG5cdFx0XHRcdFx0XHRjb21wYXJlRmlsZXMucHVzaCh7IG5hbWU6IGZpbGUubmFtZSwgZGF0YTogZmlsZS5kYXRhIH0pO1xuXHRcdFx0XHRcdFx0ZGVsZXRlIGZpbGUuZGF0YTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cHVzaExheWVyQ2FudmFzZXMocHNkLmNoaWxkcmVuIHx8IFtdKTtcblx0XHRcdGZzLm1rZGlyU3luYyhwYXRoLmpvaW4ocmVzdWx0c0ZpbGVzUGF0aCwgZiksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuXG5cdFx0XHRpZiAocHNkLmltYWdlUmVzb3VyY2VzPy50aHVtYm5haWwpIHtcblx0XHRcdFx0Y29tcGFyZS5wdXNoKHsgbmFtZTogJ3RodW1iLnBuZycsIGNhbnZhczogcHNkLmltYWdlUmVzb3VyY2VzLnRodW1ibmFpbCwgc2tpcDogdHJ1ZSB9KTtcblx0XHRcdFx0ZGVsZXRlIHBzZC5pbWFnZVJlc291cmNlcy50aHVtYm5haWw7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChwc2QuaW1hZ2VSZXNvdXJjZXMpIGRlbGV0ZSBwc2QuaW1hZ2VSZXNvdXJjZXMudGh1bWJuYWlsUmF3O1xuXG5cdFx0XHRjb21wYXJlLmZvckVhY2goaSA9PiBzYXZlQ2FudmFzKHBhdGguam9pbihyZXN1bHRzRmlsZXNQYXRoLCBmLCBpLm5hbWUpLCBpLmNhbnZhcykpO1xuXHRcdFx0Y29tcGFyZUZpbGVzLmZvckVhY2goaSA9PiBmcy53cml0ZUZpbGVTeW5jKHBhdGguam9pbihyZXN1bHRzRmlsZXNQYXRoLCBmLCBpLm5hbWUpLCBpLmRhdGEpKTtcblxuXHRcdFx0ZnMud3JpdGVGaWxlU3luYyhwYXRoLmpvaW4ocmVzdWx0c0ZpbGVzUGF0aCwgZiwgJ2RhdGEuanNvbicpLCBKU09OLnN0cmluZ2lmeShwc2QsIG51bGwsIDIpLCAndXRmOCcpO1xuXG5cdFx0XHRjbGVhckVtcHR5Q2FudmFzRmllbGRzKHBzZCk7XG5cdFx0XHRjbGVhckVtcHR5Q2FudmFzRmllbGRzKGV4cGVjdGVkKTtcblxuXHRcdFx0ZXhwZWN0KHBzZCkuZXFsKGV4cGVjdGVkLCBmKTtcblx0XHRcdGNvbXBhcmUuZm9yRWFjaChpID0+IGkuc2tpcCB8fCBjb21wYXJlQ2FudmFzZXMoaW1hZ2VzW2kubmFtZV0sIGkuY2FudmFzLCBgJHtmfS8ke2kubmFtZX1gKSk7XG5cdFx0XHRjb21wYXJlRmlsZXMuZm9yRWFjaChpID0+IGNvbXBhcmVUd29GaWxlcyhwYXRoLmpvaW4oYmFzZVBhdGgsIGkubmFtZSksIGkuZGF0YSwgYCR7Zn0vJHtpLm5hbWV9YCkpO1xuXHRcdH0pO1xuXHR9KTtcblxuXHRmcy5yZWFkZGlyU3luYyhyZWFkV3JpdGVGaWxlc1BhdGgpLmZvckVhY2goZiA9PiB7XG5cdFx0Ly8gZnMucmVhZGRpclN5bmMocmVhZFdyaXRlRmlsZXNQYXRoKS5maWx0ZXIoZiA9PiAvYW5ub3QvLnRlc3QoZikpLmZvckVhY2goZiA9PiB7XG5cdFx0aXQoYHJlYWRzLXdyaXRlcyBQU0QgZmlsZSAoJHtmfSlgLCAoKSA9PiB7XG5cdFx0XHRjb25zdCBleHQgPSBmcy5leGlzdHNTeW5jKHBhdGguam9pbihyZWFkV3JpdGVGaWxlc1BhdGgsIGYsICdzcmMucHNiJykpID8gJ3BzYicgOiAncHNkJztcblx0XHRcdGNvbnN0IHBzZCA9IHJlYWRQc2RGcm9tRmlsZShwYXRoLmpvaW4ocmVhZFdyaXRlRmlsZXNQYXRoLCBmLCBgc3JjLiR7ZXh0fWApLCB7XG5cdFx0XHRcdC4uLm9wdHMsIHVzZUltYWdlRGF0YTogdHJ1ZSwgdXNlUmF3VGh1bWJuYWlsOiB0cnVlLCB0aHJvd0Zvck1pc3NpbmdGZWF0dXJlczogdHJ1ZVxuXHRcdFx0fSk7XG5cdFx0XHRjb25zdCBhY3R1YWwgPSB3cml0ZVBzZEJ1ZmZlcihwc2QsIHsgbG9nTWlzc2luZ0ZlYXR1cmVzOiB0cnVlLCBwc2I6IGV4dCA9PT0gJ3BzYicgfSk7XG5cdFx0XHRjb25zdCBleHBlY3RlZCA9IGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4ocmVhZFdyaXRlRmlsZXNQYXRoLCBmLCBgZXhwZWN0ZWQuJHtleHR9YCkpO1xuXHRcdFx0ZnMud3JpdGVGaWxlU3luYyhwYXRoLmpvaW4ocmVzdWx0c0ZpbGVzUGF0aCwgYHJlYWQtd3JpdGUtJHtmfS4ke2V4dH1gKSwgYWN0dWFsKTtcblx0XHRcdGZzLndyaXRlRmlsZVN5bmMocGF0aC5qb2luKHJlc3VsdHNGaWxlc1BhdGgsIGByZWFkLXdyaXRlLSR7Zn0uYmluYCksIGFjdHVhbCk7XG5cdFx0XHQvLyBjb25zb2xlLmxvZyhyZXF1aXJlKCd1dGlsJykuaW5zcGVjdChwc2QsIGZhbHNlLCA5OSwgdHJ1ZSkpO1xuXG5cdFx0XHQvLyBjb25zdCBwc2QyID0gcmVhZFBzZEZyb21GaWxlKHBhdGguam9pbihyZXN1bHRzRmlsZXNQYXRoLCBgcmVhZC13cml0ZS0ke2Z9LnBzZGApLCB7IC4uLm9wdHMsIHVzZUltYWdlRGF0YTogdHJ1ZSwgdXNlUmF3VGh1bWJuYWlsOiB0cnVlIH0pO1xuXHRcdFx0Ly8gZnMud3JpdGVGaWxlU3luYygndGVtcC50eHQnLCByZXF1aXJlKCd1dGlsJykuaW5zcGVjdChwc2QsIGZhbHNlLCA5OSwgZmFsc2UpLCAndXRmOCcpO1xuXHRcdFx0Ly8gZnMud3JpdGVGaWxlU3luYygndGVtcDIudHh0JywgcmVxdWlyZSgndXRpbCcpLmluc3BlY3QocHNkMiwgZmFsc2UsIDk5LCBmYWxzZSksICd1dGY4Jyk7XG5cblx0XHRcdGNvbXBhcmVCdWZmZXJzKGFjdHVhbCwgZXhwZWN0ZWQsIGByZWFkLXdyaXRlLSR7Zn1gLCAwKTtcblx0XHR9KTtcblx0fSk7XG5cblx0aXQuc2tpcCgnd3JpdGUgdGV4dCBsYXllciB0ZXN0JywgKCkgPT4ge1xuXHRcdGNvbnN0IHBzZDogUHNkID0ge1xuXHRcdFx0d2lkdGg6IDIwMCxcblx0XHRcdGhlaWdodDogMjAwLFxuXHRcdFx0Y2hpbGRyZW46IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdG5hbWU6ICd0ZXh0IGxheWVyJyxcblx0XHRcdFx0XHR0ZXh0OiB7XG5cdFx0XHRcdFx0XHR0ZXh0OiAnSGVsbG8gV29ybGRcXG7igKIgYyDigKIgdGlueSFcXHJcXG50ZXN0Jyxcblx0XHRcdFx0XHRcdC8vIG9yaWVudGF0aW9uOiAndmVydGljYWwnLFxuXHRcdFx0XHRcdFx0dHJhbnNmb3JtOiBbMSwgMCwgMCwgMSwgNzAsIDcwXSxcblx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdGZvbnQ6IHsgbmFtZTogJ0FyaWFsTVQnIH0sXG5cdFx0XHRcdFx0XHRcdGZvbnRTaXplOiAzMCxcblx0XHRcdFx0XHRcdFx0ZmlsbENvbG9yOiB7IHI6IDAsIGc6IDEyOCwgYjogMCB9LFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdHN0eWxlUnVuczogW1xuXHRcdFx0XHRcdFx0XHR7IGxlbmd0aDogMTIsIHN0eWxlOiB7IGZpbGxDb2xvcjogeyByOiAyNTUsIGc6IDAsIGI6IDAgfSB9IH0sXG5cdFx0XHRcdFx0XHRcdHsgbGVuZ3RoOiAxMiwgc3R5bGU6IHsgZmlsbENvbG9yOiB7IHI6IDAsIGc6IDAsIGI6IDI1NSB9IH0gfSxcblx0XHRcdFx0XHRcdFx0eyBsZW5ndGg6IDQsIHN0eWxlOiB7IHVuZGVybGluZTogdHJ1ZSB9IH0sXG5cdFx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFx0cGFyYWdyYXBoU3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0anVzdGlmaWNhdGlvbjogJ2NlbnRlcicsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0d2FycDoge1xuXHRcdFx0XHRcdFx0XHRzdHlsZTogJ2FyYycsXG5cdFx0XHRcdFx0XHRcdHZhbHVlOiA1MCxcblx0XHRcdFx0XHRcdFx0cGVyc3BlY3RpdmU6IDAsXG5cdFx0XHRcdFx0XHRcdHBlcnNwZWN0aXZlT3RoZXI6IDAsXG5cdFx0XHRcdFx0XHRcdHJvdGF0ZTogJ2hvcml6b250YWwnLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bmFtZTogJzJuZCBsYXllcicsXG5cdFx0XHRcdFx0dGV4dDoge1xuXHRcdFx0XHRcdFx0dGV4dDogJ0FhYWFhJyxcblx0XHRcdFx0XHRcdHRyYW5zZm9ybTogWzEsIDAsIDAsIDEsIDcwLCA3MF0sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0fTtcblxuXHRcdGZzLndyaXRlRmlsZVN5bmMocGF0aC5qb2luKHJlc3VsdHNGaWxlc1BhdGgsICdfVEVYVDIucHNkJyksIHdyaXRlUHNkQnVmZmVyKHBzZCwgeyBsb2dNaXNzaW5nRmVhdHVyZXM6IHRydWUgfSkpO1xuXHR9KTtcblxuXHRpdC5za2lwKCdyZWFkIHRleHQgbGF5ZXIgdGVzdCcsICgpID0+IHtcblx0XHRjb25zdCBwc2QgPSByZWFkUHNkRnJvbUZpbGUocGF0aC5qb2luKHRlc3RGaWxlc1BhdGgsICd0ZXh0LXRlc3QucHNkJyksIG9wdHMpO1xuXHRcdC8vIGNvbnN0IGxheWVyID0gcHNkLmNoaWxkcmVuIVsxXTtcblxuXHRcdC8vIGxheWVyLnRleHQhLnRleHQgPSAnRm9vIGJhcic7XG5cdFx0Y29uc3QgYnVmZmVyID0gd3JpdGVQc2RCdWZmZXIocHNkLCB7IGxvZ01pc3NpbmdGZWF0dXJlczogdHJ1ZSB9KTtcblx0XHRmcy53cml0ZUZpbGVTeW5jKHBhdGguam9pbihyZXN1bHRzRmlsZXNQYXRoLCAnX1RFWFQucHNkJyksIGJ1ZmZlcik7XG5cblx0XHQvLyBjb25zb2xlLmxvZyhyZXF1aXJlKCd1dGlsJykuaW5zcGVjdChwc2QuY2hpbGRyZW4hWzBdLnRleHQsIGZhbHNlLCA5OSwgdHJ1ZSkpO1xuXHRcdC8vIGNvbnNvbGUubG9nKHJlcXVpcmUoJ3V0aWwnKS5pbnNwZWN0KHBzZC5jaGlsZHJlbiFbMV0udGV4dCwgZmFsc2UsIDk5LCB0cnVlKSk7XG5cdFx0Ly8gY29uc29sZS5sb2cocmVxdWlyZSgndXRpbCcpLmluc3BlY3QocHNkLmVuZ2luZURhdGEsIGZhbHNlLCA5OSwgdHJ1ZSkpO1xuXHR9KTtcblxuXHRpdC5za2lwKCdSRUFEIFRFU1QnLCAoKSA9PiB7XG5cdFx0Y29uc3Qgb3JpZ2luYWxCdWZmZXIgPSBmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKHRlc3RGaWxlc1BhdGgsICd0ZXN0LnBzZCcpKTtcblxuXHRcdGNvbnNvbGUubG9nKCdSRUFESU5HIE9SSUdJTkFMJyk7XG5cdFx0Y29uc3Qgb3B0cyA9IHtcblx0XHRcdGxvZ01pc3NpbmdGZWF0dXJlczogdHJ1ZSxcblx0XHRcdHRocm93Rm9yTWlzc2luZ0ZlYXR1cmVzOiB0cnVlLFxuXHRcdFx0dXNlSW1hZ2VEYXRhOiB0cnVlLFxuXHRcdFx0dXNlUmF3VGh1bWJuYWlsOiB0cnVlLFxuXHRcdFx0bG9nRGV2RmVhdHVyZXM6IHRydWUsXG5cdFx0fTtcblx0XHRjb25zdCBvcmlnaW5hbFBzZCA9IHJlYWRQc2RJbnRlcm5hbChjcmVhdGVSZWFkZXJGcm9tQnVmZmVyKG9yaWdpbmFsQnVmZmVyKSwgb3B0cyk7XG5cblx0XHRjb25zb2xlLmxvZygnV1JJVElORycpO1xuXHRcdGNvbnN0IGJ1ZmZlciA9IHdyaXRlUHNkQnVmZmVyKG9yaWdpbmFsUHNkLCB7IGxvZ01pc3NpbmdGZWF0dXJlczogdHJ1ZSB9KTtcblx0XHRmcy53cml0ZUZpbGVTeW5jKCd0ZW1wLnBzZCcsIGJ1ZmZlcik7XG5cdFx0Ly8gZnMud3JpdGVGaWxlU3luYygndGVtcC5iaW4nLCBidWZmZXIpO1xuXHRcdC8vIGZzLndyaXRlRmlsZVN5bmMoJ3RlbXAuanNvbicsIEpTT04uc3RyaW5naWZ5KG9yaWdpbmFsUHNkLCBudWxsLCAyKSwgJ3V0ZjgnKTtcblx0XHQvLyBmcy53cml0ZUZpbGVTeW5jKCd0ZW1wLnhtbCcsIG9yaWdpbmFsUHNkLmltYWdlUmVzb3VyY2VzPy54bXBNZXRhZGF0YSwgJ3V0ZjgnKTtcblxuXHRcdGNvbnNvbGUubG9nKCdSRUFESU5HIFdSSVRURU4nKTtcblx0XHRjb25zdCBwc2QgPSByZWFkUHNkSW50ZXJuYWwoXG5cdFx0XHRjcmVhdGVSZWFkZXJGcm9tQnVmZmVyKGJ1ZmZlciksIHsgbG9nTWlzc2luZ0ZlYXR1cmVzOiB0cnVlLCB0aHJvd0Zvck1pc3NpbmdGZWF0dXJlczogdHJ1ZSB9KTtcblxuXHRcdGNsZWFyQ2FudmFzRmllbGRzKG9yaWdpbmFsUHNkKTtcblx0XHRjbGVhckNhbnZhc0ZpZWxkcyhwc2QpO1xuXHRcdGRlbGV0ZSBvcmlnaW5hbFBzZC5pbWFnZVJlc291cmNlcyEudGh1bWJuYWlsO1xuXHRcdGRlbGV0ZSBwc2QuaW1hZ2VSZXNvdXJjZXMhLnRodW1ibmFpbDtcblx0XHRkZWxldGUgb3JpZ2luYWxQc2QuaW1hZ2VSZXNvdXJjZXMhLnRodW1ibmFpbFJhdztcblx0XHRkZWxldGUgcHNkLmltYWdlUmVzb3VyY2VzIS50aHVtYm5haWxSYXc7XG5cdFx0Ly8gY29uc29sZS5sb2cocmVxdWlyZSgndXRpbCcpLmluc3BlY3Qob3JpZ2luYWxQc2QsIGZhbHNlLCA5OSwgdHJ1ZSkpO1xuXG5cdFx0Ly8gZnMud3JpdGVGaWxlU3luYygnb3JpZ2luYWwuanNvbicsIEpTT04uc3RyaW5naWZ5KG9yaWdpbmFsUHNkLCBudWxsLCAyKSk7XG5cdFx0Ly8gZnMud3JpdGVGaWxlU3luYygnYWZ0ZXIuanNvbicsIEpTT04uc3RyaW5naWZ5KHBzZCwgbnVsbCwgMikpO1xuXG5cdFx0Y29tcGFyZUJ1ZmZlcnMoYnVmZmVyLCBvcmlnaW5hbEJ1ZmZlciwgJ3Rlc3QnKTtcblxuXHRcdGV4cGVjdChwc2QpLmVxbChvcmlnaW5hbFBzZCk7XG5cdH0pO1xuXG5cdGl0LnNraXAoJ2RlY29kZSBlbmdpbmUgZGF0YSAyJywgKCkgPT4ge1xuXHRcdC8vIGNvbnN0IGZpbGVEYXRhID0gZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICcuLicsICcuLicsICdyZXNvdXJjZXMnLCAnZW5naW5lRGF0YTJWZXJ0aWNhbC50eHQnKSk7XG5cdFx0Y29uc3QgZmlsZURhdGEgPSBmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJy4uJywgJ3Jlc291cmNlcycsICdlbmdpbmVEYXRhMlNpbXBsZS50eHQnKSk7XG5cdFx0Y29uc3QgZnVuYyA9IG5ldyBGdW5jdGlvbihgcmV0dXJuICR7ZmlsZURhdGF9O2ApO1xuXHRcdGNvbnN0IGRhdGEgPSBmdW5jKCk7XG5cdFx0Y29uc3QgcmVzdWx0ID0gZGVjb2RlRW5naW5lRGF0YTIoZGF0YSk7XG5cdFx0ZnMud3JpdGVGaWxlU3luYyhcblx0XHRcdHBhdGguam9pbihfX2Rpcm5hbWUsICcuLicsICcuLicsICdyZXNvdXJjZXMnLCAndGVtcC5qcycpLFxuXHRcdFx0J3ZhciB4ID0gJyArIHJlcXVpcmUoJ3V0aWwnKS5pbnNwZWN0KHJlc3VsdCwgZmFsc2UsIDk5LCBmYWxzZSksICd1dGY4Jyk7XG5cdH0pO1xuXG5cdGl0LnNraXAoJ3Rlc3QucHNkJywgKCkgPT4ge1xuXHRcdGNvbnN0IGJ1ZmZlciA9IGZzLnJlYWRGaWxlU3luYygndGVzdC5wc2QnKTtcblx0XHRjb25zdCBwc2QgPSByZWFkUHNkSW50ZXJuYWwoY3JlYXRlUmVhZGVyRnJvbUJ1ZmZlcihidWZmZXIpLCB7XG5cdFx0XHRza2lwQ29tcG9zaXRlSW1hZ2VEYXRhOiB0cnVlLFxuXHRcdFx0c2tpcExheWVySW1hZ2VEYXRhOiB0cnVlLFxuXHRcdFx0c2tpcFRodW1ibmFpbDogdHJ1ZSxcblx0XHRcdHRocm93Rm9yTWlzc2luZ0ZlYXR1cmVzOiB0cnVlLFxuXHRcdFx0bG9nRGV2RmVhdHVyZXM6IHRydWUsXG5cdFx0fSk7XG5cdFx0ZGVsZXRlIHBzZC5lbmdpbmVEYXRhO1xuXHRcdHBzZC5pbWFnZVJlc291cmNlcyA9IHt9O1xuXHRcdGNvbnNvbGUubG9nKHJlcXVpcmUoJ3V0aWwnKS5pbnNwZWN0KHBzZCwgZmFsc2UsIDk5LCB0cnVlKSk7XG5cdH0pO1xuXG5cdGl0LnNraXAoJ3Rlc3QnLCAoKSA9PiB7XG5cdFx0Y29uc3QgcHNkID0gcmVhZFBzZEludGVybmFsKGNyZWF0ZVJlYWRlckZyb21CdWZmZXIoZnMucmVhZEZpbGVTeW5jKGB0ZXN0L3JlYWQtd3JpdGUvdGV4dC1ib3gvc3JjLnBzZGApKSwge1xuXHRcdFx0Ly8gc2tpcENvbXBvc2l0ZUltYWdlRGF0YTogdHJ1ZSxcblx0XHRcdC8vIHNraXBMYXllckltYWdlRGF0YTogdHJ1ZSxcblx0XHRcdC8vIHNraXBUaHVtYm5haWw6IHRydWUsXG5cdFx0XHR0aHJvd0Zvck1pc3NpbmdGZWF0dXJlczogdHJ1ZSxcblx0XHRcdGxvZ0RldkZlYXR1cmVzOiB0cnVlLFxuXHRcdFx0dXNlUmF3VGh1bWJuYWlsOiB0cnVlLFxuXHRcdH0pO1xuXHRcdGZzLndyaXRlRmlsZVN5bmMoJ3RleHRfcmVjdF9vdXQucHNkJywgd3JpdGVQc2RCdWZmZXIocHNkLCB7IGxvZ01pc3NpbmdGZWF0dXJlczogdHJ1ZSB9KSk7XG5cdFx0ZnMud3JpdGVGaWxlU3luYygndGV4dF9yZWN0X291dC5iaW4nLCB3cml0ZVBzZEJ1ZmZlcihwc2QsIHsgbG9nTWlzc2luZ0ZlYXR1cmVzOiB0cnVlIH0pKTtcblx0XHQvLyBjb25zdCBwc2QyID0gcmVhZFBzZEludGVybmFsKGNyZWF0ZVJlYWRlckZyb21CdWZmZXIoZnMucmVhZEZpbGVTeW5jKGB0ZXh0X3JlY3Rfb3V0LnBzZGApKSwge1xuXHRcdC8vIFx0Ly8gc2tpcENvbXBvc2l0ZUltYWdlRGF0YTogdHJ1ZSxcblx0XHQvLyBcdC8vIHNraXBMYXllckltYWdlRGF0YTogdHJ1ZSxcblx0XHQvLyBcdC8vIHNraXBUaHVtYm5haWw6IHRydWUsXG5cdFx0Ly8gXHR0aHJvd0Zvck1pc3NpbmdGZWF0dXJlczogdHJ1ZSxcblx0XHQvLyBcdGxvZ0RldkZlYXR1cmVzOiB0cnVlLFxuXHRcdC8vIH0pO1xuXHRcdC8vIHBzZDI7XG5cdFx0Y29uc3Qgb3JpZ2luYWwgPSBmcy5yZWFkRmlsZVN5bmMoYHRlc3QvcmVhZC13cml0ZS90ZXh0LWJveC9zcmMucHNkYCk7XG5cdFx0Y29uc3Qgb3V0cHV0ID0gZnMucmVhZEZpbGVTeW5jKGB0ZXh0X3JlY3Rfb3V0LnBzZGApO1xuXHRcdGNvbXBhcmVCdWZmZXJzKG91dHB1dCwgb3JpZ2luYWwsICctJywgMHg2NWQ4KTsgLy8gLCAweDhjZTgsIDB4OGZjYSAtIDB4OGNlOCk7XG5cdH0pO1xuXG5cdGl0LnNraXAoJ2NvbXBhcmUgdGVzdCcsICgpID0+IHtcblx0XHRmb3IgKGNvbnN0IG5hbWUgb2YgWyd0ZXh0X3BvaW50JywgJ3RleHRfcmVjdCddKSB7XG5cdFx0XHRjb25zdCBwc2QgPSByZWFkUHNkSW50ZXJuYWwoY3JlYXRlUmVhZGVyRnJvbUJ1ZmZlcihmcy5yZWFkRmlsZVN5bmMoYCR7bmFtZX0ucHNkYCkpLCB7XG5cdFx0XHRcdHNraXBDb21wb3NpdGVJbWFnZURhdGE6IHRydWUsXG5cdFx0XHRcdHNraXBMYXllckltYWdlRGF0YTogdHJ1ZSxcblx0XHRcdFx0c2tpcFRodW1ibmFpbDogdHJ1ZSxcblx0XHRcdFx0dGhyb3dGb3JNaXNzaW5nRmVhdHVyZXM6IHRydWUsXG5cdFx0XHRcdGxvZ0RldkZlYXR1cmVzOiB0cnVlLFxuXHRcdFx0fSk7XG5cdFx0XHQvLyBwc2QuaW1hZ2VSZXNvdXJjZXMgPSB7fTtcblx0XHRcdGZzLndyaXRlRmlsZVN5bmMoYCR7bmFtZX0udHh0YCwgcmVxdWlyZSgndXRpbCcpLmluc3BlY3QocHNkLCBmYWxzZSwgOTksIGZhbHNlKSwgJ3V0ZjgnKTtcblxuXHRcdFx0Ly8gY29uc3QgZW5naW5lRGF0YSA9IHBhcnNlRW5naW5lRGF0YSh0b0J5dGVBcnJheShwc2QuZW5naW5lRGF0YSEpKTtcblx0XHRcdC8vIGZzLndyaXRlRmlsZVN5bmMoYCR7bmFtZX1fZW5naW5lZGF0YS50eHRgLCByZXF1aXJlKCd1dGlsJykuaW5zcGVjdChlbmdpbmVEYXRhLCBmYWxzZSwgOTksIGZhbHNlKSwgJ3V0ZjgnKTtcblx0XHR9XG5cdH0pO1xuXG5cdGl0LnNraXAoJ3RleHQtcmVwbGFjZS5wc2QnLCAoKSA9PiB7XG5cdFx0e1xuXHRcdFx0Y29uc3QgYnVmZmVyID0gZnMucmVhZEZpbGVTeW5jKCd0ZXh0LXJlcGxhY2UyLnBzZCcpO1xuXHRcdFx0Y29uc3QgcHNkID0gcmVhZFBzZEludGVybmFsKGNyZWF0ZVJlYWRlckZyb21CdWZmZXIoYnVmZmVyKSwge30pO1xuXHRcdFx0cHNkLmNoaWxkcmVuIVsxXSEudGV4dCEudGV4dCA9ICdGb28gYmFyJztcblx0XHRcdGNvbnN0IG91dHB1dCA9IHdyaXRlUHNkQnVmZmVyKHBzZCwgeyBpbnZhbGlkYXRlVGV4dExheWVyczogdHJ1ZSwgbG9nTWlzc2luZ0ZlYXR1cmVzOiB0cnVlIH0pO1xuXHRcdFx0ZnMud3JpdGVGaWxlU3luYygnb3V0LnBzZCcsIG91dHB1dCk7XG5cdFx0fVxuXG5cdFx0e1xuXHRcdFx0Y29uc3QgYnVmZmVyID0gZnMucmVhZEZpbGVTeW5jKCd0ZXh0LXJlcGxhY2UucHNkJyk7XG5cdFx0XHRjb25zdCBwc2QgPSByZWFkUHNkSW50ZXJuYWwoY3JlYXRlUmVhZGVyRnJvbUJ1ZmZlcihidWZmZXIpLCB7XG5cdFx0XHRcdHNraXBDb21wb3NpdGVJbWFnZURhdGE6IHRydWUsXG5cdFx0XHRcdHNraXBMYXllckltYWdlRGF0YTogdHJ1ZSxcblx0XHRcdFx0c2tpcFRodW1ibmFpbDogdHJ1ZSxcblx0XHRcdFx0dGhyb3dGb3JNaXNzaW5nRmVhdHVyZXM6IHRydWUsXG5cdFx0XHRcdGxvZ0RldkZlYXR1cmVzOiB0cnVlLFxuXHRcdFx0fSk7XG5cdFx0XHRkZWxldGUgcHNkLmVuZ2luZURhdGE7XG5cdFx0XHRwc2QuaW1hZ2VSZXNvdXJjZXMgPSB7fTtcblx0XHRcdHBzZC5jaGlsZHJlbj8uc3BsaWNlKDAsIDEpO1xuXHRcdFx0ZnMud3JpdGVGaWxlU3luYygnaW5wdXQudHh0JywgcmVxdWlyZSgndXRpbCcpLmluc3BlY3QocHNkLCBmYWxzZSwgOTksIGZhbHNlKSwgJ3V0ZjgnKTtcblx0XHR9XG5cblx0XHR7XG5cdFx0XHRjb25zdCBidWZmZXIgPSBmcy5yZWFkRmlsZVN5bmMoJ291dC5wc2QnKTtcblx0XHRcdGNvbnN0IHBzZCA9IHJlYWRQc2RJbnRlcm5hbChjcmVhdGVSZWFkZXJGcm9tQnVmZmVyKGJ1ZmZlciksIHtcblx0XHRcdFx0c2tpcENvbXBvc2l0ZUltYWdlRGF0YTogdHJ1ZSxcblx0XHRcdFx0c2tpcExheWVySW1hZ2VEYXRhOiB0cnVlLFxuXHRcdFx0XHRza2lwVGh1bWJuYWlsOiB0cnVlLFxuXHRcdFx0XHR0aHJvd0Zvck1pc3NpbmdGZWF0dXJlczogdHJ1ZSxcblx0XHRcdFx0bG9nRGV2RmVhdHVyZXM6IHRydWUsXG5cdFx0XHR9KTtcblx0XHRcdGRlbGV0ZSBwc2QuZW5naW5lRGF0YTtcblx0XHRcdHBzZC5pbWFnZVJlc291cmNlcyA9IHt9O1xuXHRcdFx0cHNkLmNoaWxkcmVuPy5zcGxpY2UoMCwgMSk7XG5cdFx0XHRmcy53cml0ZUZpbGVTeW5jKCdvdXRwdXQudHh0JywgcmVxdWlyZSgndXRpbCcpLmluc3BlY3QocHNkLCBmYWxzZSwgOTksIGZhbHNlKSwgJ3V0ZjgnKTtcblx0XHR9XG5cdH0pO1xufSk7XG5cbmZ1bmN0aW9uIGNsZWFyRW1wdHlDYW52YXNGaWVsZHMobGF5ZXI6IExheWVyIHwgdW5kZWZpbmVkKSB7XG5cdGlmIChsYXllcikge1xuXHRcdGlmICgnY2FudmFzJyBpbiBsYXllciAmJiAhbGF5ZXIuY2FudmFzKSBkZWxldGUgbGF5ZXIuY2FudmFzO1xuXHRcdGlmICgnaW1hZ2VEYXRhJyBpbiBsYXllciAmJiAhbGF5ZXIuaW1hZ2VEYXRhKSBkZWxldGUgbGF5ZXIuaW1hZ2VEYXRhO1xuXHRcdGxheWVyLmNoaWxkcmVuPy5mb3JFYWNoKGNsZWFyRW1wdHlDYW52YXNGaWVsZHMpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGNsZWFyQ2FudmFzRmllbGRzKGxheWVyOiBMYXllciB8IHVuZGVmaW5lZCkge1xuXHRpZiAobGF5ZXIpIHtcblx0XHRkZWxldGUgbGF5ZXIuY2FudmFzO1xuXHRcdGRlbGV0ZSBsYXllci5pbWFnZURhdGE7XG5cdFx0aWYgKGxheWVyLm1hc2spIGRlbGV0ZSBsYXllci5tYXNrLmNhbnZhcztcblx0XHRpZiAobGF5ZXIubWFzaykgZGVsZXRlIGxheWVyLm1hc2suaW1hZ2VEYXRhO1xuXHRcdGxheWVyLmNoaWxkcmVuPy5mb3JFYWNoKGNsZWFyQ2FudmFzRmllbGRzKTtcblx0fVxufVxuXG4vLy8gRW5naW5lIGRhdGEgMiBleHBlcmltZW50c1xuLy8gL3Rlc3QvZW5naW5lRGF0YTIuanNvbjoxMTA5IGlzIGNoYXJhY3RlciBjb2Rlc1xuXG5jb25zdCBrZXlzQ29sb3IgPSB7XG5cdCcwJzoge1xuXHRcdHVwcm9vdDogdHJ1ZSxcblx0XHRjaGlsZHJlbjoge1xuXHRcdFx0JzAnOiB7IG5hbWU6ICdUeXBlJyB9LFxuXHRcdFx0JzEnOiB7IG5hbWU6ICdWYWx1ZXMnIH0sXG5cdFx0fSxcblx0fSxcbn07XG5cbmNvbnN0IGtleXNTdHlsZVNoZWV0ID0ge1xuXHQnMCc6IHsgbmFtZTogJ0ZvbnQnIH0sXG5cdCcxJzogeyBuYW1lOiAnRm9udFNpemUnIH0sXG5cdCcyJzogeyBuYW1lOiAnRmF1eEJvbGQnIH0sXG5cdCczJzogeyBuYW1lOiAnRmF1eEl0YWxpYycgfSxcblx0JzQnOiB7IG5hbWU6ICdBdXRvTGVhZGluZycgfSxcblx0JzUnOiB7IG5hbWU6ICdMZWFkaW5nJyB9LFxuXHQnNic6IHsgbmFtZTogJ0hvcml6b250YWxTY2FsZScgfSxcblx0JzcnOiB7IG5hbWU6ICdWZXJ0aWNhbFNjYWxlJyB9LFxuXHQnOCc6IHsgbmFtZTogJ1RyYWNraW5nJyB9LFxuXHQnOSc6IHsgbmFtZTogJ0Jhc2VsaW5lU2hpZnQnIH0sXG5cblx0JzExJzogeyBuYW1lOiAnS2VybmluZz8nIH0sIC8vIGRpZmZlcmVudCB2YWx1ZSB0aGFuIEVuZ2luZURhdGFcblx0JzEyJzogeyBuYW1lOiAnRm9udENhcHMnIH0sXG5cdCcxMyc6IHsgbmFtZTogJ0ZvbnRCYXNlbGluZScgfSxcblxuXHQnMTUnOiB7IG5hbWU6ICdTdHJpa2V0aHJvdWdoPycgfSwgLy8gbnVtYmVyIGluc3RlYWQgb2YgYm9vbFxuXHQnMTYnOiB7IG5hbWU6ICdVbmRlcmxpbmU/JyB9LCAvLyBudW1iZXIgaW5zdGVhZCBvZiBib29sXG5cblx0JzE4JzogeyBuYW1lOiAnTGlnYXR1cmVzJyB9LFxuXHQnMTknOiB7IG5hbWU6ICdETGlnYXR1cmVzJyB9LFxuXG5cdCcyMyc6IHsgbmFtZTogJ0ZyYWN0aW9ucycgfSwgLy8gbm90IHByZXNlbnQgaW4gRW5naW5lRGF0YVxuXHQnMjQnOiB7IG5hbWU6ICdPcmRpbmFscycgfSwgLy8gbm90IHByZXNlbnQgaW4gRW5naW5lRGF0YVxuXG5cdCcyOCc6IHsgbmFtZTogJ1N0eWxpc3RpY0FsdGVybmF0ZXMnIH0sIC8vIG5vdCBwcmVzZW50IGluIEVuZ2luZURhdGFcblxuXHQnMzAnOiB7IG5hbWU6ICdPbGRTdHlsZT8nIH0sIC8vIE9wZW5UeXBlID4gT2xkU3R5bGUsIG51bWJlciBpbnN0ZWFkIG9mIGJvb2wsIG5vdCBwcmVzZW50IGluIEVuZ2luZURhdGFcblxuXHQnMzUnOiB7IG5hbWU6ICdCYXNlbGluZURpcmVjdGlvbicgfSxcblxuXHQnMzgnOiB7IG5hbWU6ICdMYW5ndWFnZScgfSxcblxuXHQnNTInOiB7IG5hbWU6ICdOb0JyZWFrJyB9LFxuXHQnNTMnOiB7IG5hbWU6ICdGaWxsQ29sb3InLCBjaGlsZHJlbjoga2V5c0NvbG9yIH0sXG59O1xuXG5jb25zdCBrZXlzUGFyYWdyYXBoID0ge1xuXHQnMCc6IHsgbmFtZTogJ0p1c3RpZmljYXRpb24nIH0sXG5cdCcxJzogeyBuYW1lOiAnRmlyc3RMaW5lSW5kZW50JyB9LFxuXHQnMic6IHsgbmFtZTogJ1N0YXJ0SW5kZW50JyB9LFxuXHQnMyc6IHsgbmFtZTogJ0VuZEluZGVudCcgfSxcblx0JzQnOiB7IG5hbWU6ICdTcGFjZUJlZm9yZScgfSxcblx0JzUnOiB7IG5hbWU6ICdTcGFjZUFmdGVyJyB9LFxuXG5cdCc3JzogeyBuYW1lOiAnQXV0b0xlYWRpbmcnIH0sXG5cblx0JzknOiB7IG5hbWU6ICdBdXRvSHlwaGVuYXRlJyB9LFxuXHQnMTAnOiB7IG5hbWU6ICdIeXBoZW5hdGVkV29yZFNpemUnIH0sXG5cdCcxMSc6IHsgbmFtZTogJ1ByZUh5cGhlbicgfSxcblx0JzEyJzogeyBuYW1lOiAnUG9zdEh5cGhlbicgfSxcblx0JzEzJzogeyBuYW1lOiAnQ29uc2VjdXRpdmVIeXBoZW5zPycgfSwgLy8gZGlmZmVyZW50IHZhbHVlIHRoYW4gRW5naW5lRGF0YVxuXHQnMTQnOiB7IG5hbWU6ICdab25lJyB9LFxuXHQnMTUnOiB7IG5hbWU6ICdIeXBlbmF0ZUNhcGl0YWxpemVkV29yZHMnIH0sIC8vIG5vdCBwcmVzZW50IGluIEVuZ2luZURhdGFcblxuXHQnMTcnOiB7IG5hbWU6ICdXb3JkU3BhY2luZycgfSxcblx0JzE4JzogeyBuYW1lOiAnTGV0dGVyU3BhY2luZycgfSxcblx0JzE5JzogeyBuYW1lOiAnR2x5cGhTcGFjaW5nJyB9LFxuXG5cdCczMic6IHsgbmFtZTogJ1N0eWxlU2hlZXQnLCBjaGlsZHJlbjoga2V5c1N0eWxlU2hlZXQgfSxcbn07XG5cbmNvbnN0IGtleXNTdHlsZVNoZWV0RGF0YSA9IHtcblx0bmFtZTogJ1N0eWxlU2hlZXREYXRhJyxcblx0Y2hpbGRyZW46IGtleXNTdHlsZVNoZWV0LFxufTtcblxuY29uc3Qga2V5cyA9IHtcblx0JzAnOiB7XG5cdFx0bmFtZTogJ1Jlc291cmNlRGljdCcsXG5cdFx0Y2hpbGRyZW46IHtcblx0XHRcdCcxJzoge1xuXHRcdFx0XHRuYW1lOiAnRm9udFNldCcsXG5cdFx0XHRcdGNoaWxkcmVuOiB7XG5cdFx0XHRcdFx0JzAnOiB7XG5cdFx0XHRcdFx0XHR1cHJvb3Q6IHRydWUsXG5cdFx0XHRcdFx0XHRjaGlsZHJlbjoge1xuXHRcdFx0XHRcdFx0XHQnMCc6IHtcblx0XHRcdFx0XHRcdFx0XHR1cHJvb3Q6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0Y2hpbGRyZW46IHtcblx0XHRcdFx0XHRcdFx0XHRcdCcwJzoge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR1cHJvb3Q6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGNoaWxkcmVuOiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0JzAnOiB7IG5hbWU6ICdOYW1lJyB9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdCcyJzogeyBuYW1lOiAnRm9udFR5cGUnIH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHQnMic6IHtcblx0XHRcdFx0bmFtZTogJzInLFxuXHRcdFx0XHRjaGlsZHJlbjoge30sXG5cdFx0XHR9LFxuXHRcdFx0JzMnOiB7XG5cdFx0XHRcdG5hbWU6ICdNb2ppS3VtaVNldCcsXG5cdFx0XHRcdGNoaWxkcmVuOiB7XG5cdFx0XHRcdFx0JzAnOiB7XG5cdFx0XHRcdFx0XHR1cHJvb3Q6IHRydWUsXG5cdFx0XHRcdFx0XHRjaGlsZHJlbjoge1xuXHRcdFx0XHRcdFx0XHQnMCc6IHtcblx0XHRcdFx0XHRcdFx0XHR1cHJvb3Q6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0Y2hpbGRyZW46IHtcblx0XHRcdFx0XHRcdFx0XHRcdCcwJzogeyBuYW1lOiAnSW50ZXJuYWxOYW1lJyB9LFxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0JzQnOiB7XG5cdFx0XHRcdG5hbWU6ICdLaW5zb2t1U2V0Jyxcblx0XHRcdFx0Y2hpbGRyZW46IHtcblx0XHRcdFx0XHQnMCc6IHtcblx0XHRcdFx0XHRcdHVwcm9vdDogdHJ1ZSxcblx0XHRcdFx0XHRcdGNoaWxkcmVuOiB7XG5cdFx0XHRcdFx0XHRcdCcwJzoge1xuXHRcdFx0XHRcdFx0XHRcdHVwcm9vdDogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0XHRjaGlsZHJlbjoge1xuXHRcdFx0XHRcdFx0XHRcdFx0JzAnOiB7IG5hbWU6ICdOYW1lJyB9LFxuXHRcdFx0XHRcdFx0XHRcdFx0JzUnOiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHVwcm9vdDogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y2hpbGRyZW46IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQnMCc6IHsgbmFtZTogJ05vU3RhcnQnIH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0JzEnOiB7IG5hbWU6ICdOb0VuZCcgfSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQnMic6IHsgbmFtZTogJ0tlZXAnIH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0JzMnOiB7IG5hbWU6ICdIYW5naW5nJyB9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdCc1Jzoge1xuXHRcdFx0XHRuYW1lOiAnU3R5bGVTaGVldFNldCcsXG5cdFx0XHRcdGNoaWxkcmVuOiB7XG5cdFx0XHRcdFx0JzAnOiB7XG5cdFx0XHRcdFx0XHR1cHJvb3Q6IHRydWUsXG5cdFx0XHRcdFx0XHRjaGlsZHJlbjoge1xuXHRcdFx0XHRcdFx0XHQnMCc6IHtcblx0XHRcdFx0XHRcdFx0XHR1cHJvb3Q6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0Y2hpbGRyZW46IHtcblx0XHRcdFx0XHRcdFx0XHRcdCcwJzogeyBuYW1lOiAnTmFtZScgfSxcblx0XHRcdFx0XHRcdFx0XHRcdCc2Jzoga2V5c1N0eWxlU2hlZXREYXRhLFxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0JzYnOiB7XG5cdFx0XHRcdG5hbWU6ICdQYXJhZ3JhcGhTaGVldFNldCcsXG5cdFx0XHRcdGNoaWxkcmVuOiB7XG5cdFx0XHRcdFx0JzAnOiB7XG5cdFx0XHRcdFx0XHR1cHJvb3Q6IHRydWUsXG5cdFx0XHRcdFx0XHRjaGlsZHJlbjoge1xuXHRcdFx0XHRcdFx0XHQnMCc6IHtcblx0XHRcdFx0XHRcdFx0XHR1cHJvb3Q6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0Y2hpbGRyZW46IHtcblx0XHRcdFx0XHRcdFx0XHRcdCcwJzogeyBuYW1lOiAnTmFtZScgfSxcblx0XHRcdFx0XHRcdFx0XHRcdCc1Jzoge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRuYW1lOiAnUHJvcGVydGllcycsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGNoaWxkcmVuOiBrZXlzUGFyYWdyYXBoLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdCc2JzogeyBuYW1lOiAnRGVmYXVsdFN0eWxlU2hlZXQnIH0sXG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHQnOCc6IHtcblx0XHRcdFx0bmFtZTogJzgnLFxuXHRcdFx0XHRjaGlsZHJlbjoge30sXG5cdFx0XHR9LFxuXHRcdFx0JzknOiB7XG5cdFx0XHRcdG5hbWU6ICdQcmVkZWZpbmVkJyxcblx0XHRcdFx0Y2hpbGRyZW46IHt9LFxuXHRcdFx0fSxcblx0XHR9LFxuXHR9LFxuXHQnMSc6IHtcblx0XHRuYW1lOiAnRW5naW5lRGljdCcsXG5cdFx0Y2hpbGRyZW46IHtcblx0XHRcdCcwJzoge1xuXHRcdFx0XHRuYW1lOiAnMCcsXG5cdFx0XHRcdGNoaWxkcmVuOiB7XG5cdFx0XHRcdFx0JzAnOiB7XG5cdFx0XHRcdFx0XHRuYW1lOiAnMCcsXG5cdFx0XHRcdFx0XHRjaGlsZHJlbjoge1xuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdCczJzogeyBuYW1lOiAnU3VwZXJzY3JpcHRTaXplJyB9LFxuXHRcdFx0XHRcdCc0JzogeyBuYW1lOiAnU3VwZXJzY3JpcHRQb3NpdGlvbicgfSxcblx0XHRcdFx0XHQnNSc6IHsgbmFtZTogJ1N1YnNjcmlwdFNpemUnIH0sXG5cdFx0XHRcdFx0JzYnOiB7IG5hbWU6ICdTdWJzY3JpcHRQb3NpdGlvbicgfSxcblx0XHRcdFx0XHQnNyc6IHsgbmFtZTogJ1NtYWxsQ2FwU2l6ZScgfSxcblx0XHRcdFx0XHQnOCc6IHsgbmFtZTogJ1VzZUZyYWN0aW9uYWxHbHlwaFdpZHRocycgfSwgLy8gPz8/XG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0JzEnOiB7XG5cdFx0XHRcdG5hbWU6ICdFZGl0b3JzPycsXG5cdFx0XHRcdGNoaWxkcmVuOiB7XG5cdFx0XHRcdFx0JzAnOiB7XG5cdFx0XHRcdFx0XHRuYW1lOiAnRWRpdG9yJyxcblx0XHRcdFx0XHRcdGNoaWxkcmVuOiB7XG5cdFx0XHRcdFx0XHRcdCcwJzogeyBuYW1lOiAnVGV4dCcgfSxcblx0XHRcdFx0XHRcdFx0JzUnOiB7XG5cdFx0XHRcdFx0XHRcdFx0bmFtZTogJ1BhcmFncmFwaFJ1bicsXG5cdFx0XHRcdFx0XHRcdFx0Y2hpbGRyZW46IHtcblx0XHRcdFx0XHRcdFx0XHRcdCcwJzoge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRuYW1lOiAnUnVuQXJyYXknLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRjaGlsZHJlbjoge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdCcwJzoge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bmFtZTogJ1BhcmFncmFwaFNoZWV0Jyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNoaWxkcmVuOiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCcwJzoge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHVwcm9vdDogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjaGlsZHJlbjoge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0JzAnOiB7IG5hbWU6ICcwJyB9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0JzUnOiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdG5hbWU6ICc1Jyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y2hpbGRyZW46IGtleXNQYXJhZ3JhcGgsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0JzYnOiB7IG5hbWU6ICc2JyB9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0JzEnOiB7IG5hbWU6ICdSdW5MZW5ndGgnIH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdCc2Jzoge1xuXHRcdFx0XHRcdFx0XHRcdG5hbWU6ICdTdHlsZVJ1bicsXG5cdFx0XHRcdFx0XHRcdFx0Y2hpbGRyZW46IHtcblx0XHRcdFx0XHRcdFx0XHRcdCcwJzoge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRuYW1lOiAnUnVuQXJyYXknLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRjaGlsZHJlbjoge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdCcwJzoge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bmFtZTogJ1N0eWxlU2hlZXQnLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y2hpbGRyZW46IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0JzAnOiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0dXByb290OiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNoaWxkcmVuOiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQnNic6IGtleXNTdHlsZVNoZWV0RGF0YSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdCcxJzogeyBuYW1lOiAnUnVuTGVuZ3RoJyB9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdCcxJzoge1xuXHRcdFx0XHRcdFx0bmFtZTogJ0ZvbnRWZWN0b3JEYXRhID8/PycsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHQnMic6IHtcblx0XHRcdFx0bmFtZTogJ1N0eWxlU2hlZXQnLFxuXHRcdFx0XHRjaGlsZHJlbjoga2V5c1N0eWxlU2hlZXQsXG5cdFx0XHR9LFxuXHRcdFx0JzMnOiB7XG5cdFx0XHRcdG5hbWU6ICdQYXJhZ3JhcGhTaGVldCcsXG5cdFx0XHRcdGNoaWxkcmVuOiBrZXlzUGFyYWdyYXBoLFxuXHRcdFx0fSxcblx0XHR9LFxuXHR9LFxufTtcblxuZnVuY3Rpb24gZGVjb2RlT2JqKG9iajogYW55LCBrZXlzOiBhbnkpOiBhbnkge1xuXHRpZiAob2JqID09PSBudWxsIHx8ICFrZXlzKSByZXR1cm4gb2JqO1xuXG5cdGlmIChBcnJheS5pc0FycmF5KG9iaikpIHtcblx0XHRyZXR1cm4gb2JqLm1hcCh4ID0+IGRlY29kZU9iaih4LCBrZXlzKSk7XG5cdH1cblxuXHRpZiAodHlwZW9mIG9iaiAhPT0gJ29iamVjdCcpIHJldHVybiBvYmo7XG5cblx0Y29uc3QgcmVzdWx0OiBhbnkgPSB7fTtcblxuXHRmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhvYmopKSB7XG5cdFx0aWYgKGtleXNba2V5XSkge1xuXHRcdFx0aWYgKGtleXNba2V5XS51cHJvb3QpIHtcblx0XHRcdFx0cmV0dXJuIGRlY29kZU9iaihvYmpba2V5XSwga2V5c1trZXldLmNoaWxkcmVuKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJlc3VsdFtrZXlzW2tleV0ubmFtZV0gPSBkZWNvZGVPYmoob2JqW2tleV0sIGtleXNba2V5XS5jaGlsZHJlbik7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlc3VsdFtrZXldID0gb2JqW2tleV07XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gZGVjb2RlRW5naW5lRGF0YTIoZGF0YTogYW55KSB7XG5cdHJldHVybiBkZWNvZGVPYmooZGF0YSwga2V5cyk7XG59XG4iXSwic291cmNlUm9vdCI6Ii9ob21lL21hbmgva2FvcGl6L2VlbC9hZy1wc2Qvc3JjIn0=
