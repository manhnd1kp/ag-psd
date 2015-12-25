/// <reference path="../../typings/mkdirp/mkdirp.d.ts" />

import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import { expect } from 'chai';
import { loadCanvasFromFile, toBuffer, compareBuffers, readPSD } from './common';
import { Psd, Layer } from '../psd';
import ArrayBufferPsdWriter from '../arrayBufferPsdWriter';
import BufferPsdWriter from '../bufferPsdWriter';
import BufferPsdReader from '../bufferPsdReader';
import PsdWriter from '../psdWriter';

const writeFilesPath = path.join(__dirname, '..', '..', 'test', 'write');
const resultsFilesPath = path.join(__dirname, '..', '..', 'results');

function loadPsdFromFile(basePath: string) {
	let psd: Psd = JSON.parse(fs.readFileSync(path.join(basePath, 'data.json'), 'utf8'));
	psd.canvas = loadCanvasFromFile(path.join(basePath, 'canvas.png'));
	psd.children.forEach((l, i) => {
		if (!l.children)
			l.canvas = loadCanvasFromFile(path.join(basePath, `layer-${i}.png`));
	});
	return psd;
}

function nullCanvas(obj: Psd | Layer) {
	if (obj.canvas)
		obj.canvas = null;
	if (obj.children)
		obj.children.forEach(nullCanvas);
}

describe('PsdWriter', function () {
	it('should throw exceptions for all read methods in base class', function () {
		let writer = new PsdWriter();
		expect(() => writer.writeInt8(0), 'writeInt8').throw('Not implemented');
		expect(() => writer.writeUint8(0), 'writeUint8').throw('Not implemented');
		expect(() => writer.writeInt16(0), 'writeInt16').throw('Not implemented');
		expect(() => writer.writeUint16(0), 'writeUint16').throw('Not implemented');
		expect(() => writer.writeInt32(0), 'writeInt32').throw('Not implemented');
		expect(() => writer.writeUint32(0), 'writeUint32').throw('Not implemented');
		expect(() => writer.writeFloat32(0), 'writeFloat32').throw('Not implemented');
		expect(() => writer.writeFloat64(0), 'writeFloat64').throw('Not implemented');
		expect(() => writer.writeBytes(null), 'writeBytes').throw('Not implemented');
	});

	[ArrayBufferPsdWriter, BufferPsdWriter].forEach(Writer => {
		it(`should work for all overloaded methods (${(<any>Writer).name})`, function () {
			let writer = new Writer();
			writer.writeInt8(0);
			writer.writeUint8(0);
			writer.writeInt16(0);
			writer.writeUint16(0);
			writer.writeInt32(0);
			writer.writeUint32(0);
			writer.writeFloat32(0);
			writer.writeFloat64(0);
			writer.writeBytes(null);
			writer.writeBytes(new Uint8Array([1, 2, 3, 4]));
		});
	});

	it('should not throw if passed null buffer', function () {
		let writer = new PsdWriter();
		writer.writeBuffer(null);
	});

	it('should throw if passed invalid signature', function () {
		let writer = new PsdWriter();

		for (var s of [undefined, null, 'a', 'ab', 'abcde'])
			expect(() => writer.writeSignature(s), s).throw(`Invalid signature: '${s}'`);
	});

	it('should throw exception if has layer with both children and canvas properties set');

	it('should throw if psd has invalid width or height', function () {
		let writer = new PsdWriter();
		let psd: Psd = {
			width: -5,
			height: 0,
		};

		expect(() => writer.writePsd(psd)).throw(`Invalid document size`);
	});

	fs.readdirSync(writeFilesPath).forEach(f => {
		it(`should properly write PSD file (${f})`, function () {
			let basePath = path.join(writeFilesPath, f);
			let psd = loadPsdFromFile(basePath);

			let writer1 = new ArrayBufferPsdWriter(2048);
			let writer2 = new BufferPsdWriter(2048);

			writer1.writePsd(psd);
			writer2.writePsd(psd);

			let buffer1 = toBuffer(writer1.getBuffer());
			let buffer2 = writer2.getBuffer();

			mkdirp.sync(resultsFilesPath);
			fs.writeFileSync(path.join(resultsFilesPath, f + '-arrayBuffer.psd'), buffer1);
			fs.writeFileSync(path.join(resultsFilesPath, f + '-buffer.psd'), buffer2);

			let expected = fs.readFileSync(path.join(basePath, 'expected.psd'));
			compareBuffers(buffer1, expected, `${f} [ArrayBufferPsdWriter]`);
			compareBuffers(buffer2, expected, `${f} [BufferPsdWriter]`);
		});
	});
});