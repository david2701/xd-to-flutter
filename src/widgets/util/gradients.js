/*
Copyright 2020 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it. If you have received this file from a source other than Adobe,
then your use, modification, or distribution of it requires the prior
written permission of Adobe. 
*/

// Serialization methods related to gradients

const xd = require("scenegraph");
const assets = require("assets");

const { getColor } = require("./color");
const { xdAlignmentToDartAlignment } = require("./xd_alignment_to_dart_alignment");

function getGradientParam(fill, opacity) {
	let gradient = getGradient(fill, opacity);
	return gradient ? `gradient: ${gradient}, ` : '';
}
exports.getGradientParam = getGradientParam;

function getGradient(fill, opacity) {
	// Note: XD API docs say this should be called `LinearGradientFill`
	return fill instanceof xd.LinearGradient ? _getLinearGradient(fill, opacity) :
		fill instanceof xd.RadialGradient ? _getRadialGradient(fill, opacity) :
			'';
}
exports.getGradient = getGradient;

function getGradientFromAsset(xdColorAsset) {
	return `const ${getGradientTypeFromAsset(xdColorAsset)}(` +
		_getColorsParam(xdColorAsset.colorStops) +
		')';
}
exports.getGradientFromAsset = getGradientFromAsset;

function getGradientTypeFromAsset(xdColorAsset) {
	return xdColorAsset.gradientType === assets.RADIAL ? "RadialGradient" : "LinearGradient";
}
exports.getGradientTypeFromAsset = getGradientTypeFromAsset;

function _getLinearGradient(fill, opacity = 1) {
	return 'LinearGradient(' +
		`begin: ${xdAlignmentToDartAlignment(fill.startX, fill.startY)},` +
		`end: ${xdAlignmentToDartAlignment(fill.endX, fill.endY)},` +
		_getColorsParam(fill.colorStops, opacity) +
		')';
}

function _getRadialGradient(fill, opacity = 1) {
	// RadialGradient is currently undocumented. It has the following properties:
	// startX/Y/R, endX/Y/R, colorStops, gradientTransform
	// XD currently does not seem to utilize endX/Y or startR, but basic support is included here.

	// Flutter always draws relative to the shortest edge, whereas XD draws the gradient
	// stretched to the aspect ratio of its container.
	const { fix } = require("../../util");
	return 'RadialGradient(' +
		`center: ${xdAlignmentToDartAlignment(fill.startX, fill.startY)}, ` +
		(fill.startX === fill.endX && fill.startY === fill.endY ? '' :
			`focal: ${xdAlignmentToDartAlignment(fill.endX, fill.endY)}, `) +
		(fill.startR === 0 ? '' : `focalRadius: ${fix(fill.startR, 3)}, `) +
		`radius: ${fix(fill.endR, 3)}, ` +
		_getColorsParam(fill.colorStops, opacity) +
		_getTransformParam(fill) +
		')';
}

function _getColorsParam(arr, opacity) {
	const { fix } = require("../../util");
	let l = arr.length, stops = [], colors = [];
	for (let i = 0; i < l; i++) {
		let s = arr[i];
		stops.push(fix(s.stop, 3));
		colors.push(getColor(s.color, opacity));
	}
	const stopsS = stops.length > 2 ? `stops: [${stops.join(", ")}],` : '';
	return `colors: [${colors.join(", ")}], ${stopsS}`;
}

function _getTransformParam(fill) {
	const { fix } = require("../../util");
	// The GradientXDTransform is needed even if there is no transformation in order to fix the aspect ratio.
	let o = fill.gradientTransform;
	return 'transform: GradientXDTransform(' +
		`${fix(o.a, 3)}, ${fix(o.b, 3)}, ${fix(o.c, 3)}, ` +
		`${fix(o.d, 3)}, ${fix(o.e, 3)}, ${fix(o.f, 3)}, ` +
		`${xdAlignmentToDartAlignment(fill.startX, fill.startY)}), `;
}
