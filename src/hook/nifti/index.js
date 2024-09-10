/* eslint-disable */

// import { showInfoWindow } from '@/hook/window';
import * as nifti from '@/lib/nifti-reader';

const params = {
    _canvasId: 'nifti-canvas',
    _sliderId: 'nifti-slider',
    _imageId: 'nifti-image',
    _readniiCallback: () => {},
    _current_sliceCallback: () => {},
    _display_max_height: 300,
    _display_max_width: 300,
    _max_slice: 0,
    _current_slice: 0,
    _canvas: null,
    _slider: null,
    _nifti_image: null,
    _nifti_header: null
}

/**
 * 
 * @param {number} dataTypeCode 
 * @param {ArrayBuffer} niftiImage 
 * @returns {Uint8Array | Int16Array | Int32Array | Float32Array | Float64Array | Uint16Array | Uint32Array | null}
 */
function niftiDataType2RawDataType(dataTypeCode, niftiImage) {
    switch (dataTypeCode) {
        case nifti.NIFTI1.TYPE_UINT8: return new Uint8Array(niftiImage);
        case nifti.NIFTI1.TYPE_INT16: return new Int16Array(niftiImage);
        case nifti.NIFTI1.TYPE_INT32: return new Int32Array(niftiImage);
        case nifti.NIFTI1.TYPE_FLOAT32: return new Float32Array(niftiImage);
        case nifti.NIFTI1.TYPE_FLOAT64: return new Float64Array(niftiImage);
        case nifti.NIFTI1.TYPE_INT8: return new Int8Array(niftiImage);
        case nifti.NIFTI1.TYPE_UINT16: return new Uint16Array(niftiImage);
        case nifti.NIFTI1.TYPE_UINT32: return new Uint32Array(niftiImage);
        default: return null;
    }
}

/**
 * 
 * @param {HTMLCanvasElement} canvas 绘制的 canvas 元素的 id
 * @param {number} slice CT 影像的层 ID 
 * @param {nifti.NIFTI1 | nifti.NIFTI2} niftiHeader nii 图像元信息
 * @param {ArrayBuffer} niftiImage nii 图像数据
 */
function drawCanvas(canvas, slice, niftiHeader, niftiImage) {
    const width = niftiHeader.dims[1];
    const height = niftiHeader.dims[2];

    canvas.width = width;
    canvas.height = height;

    const typedImageData = niftiDataType2RawDataType(niftiHeader.datatypeCode, niftiImage);
    if (typedImageData === null) {
        // showInfoWindow('发生错误！', '你传入的 CT 图像数据类型异常！');
        return;
    }

    const sliceSize = height * width;
    const sliceOffset = sliceSize * slice;

    let p_min = typedImageData[sliceOffset], p_max = typedImageData[sliceOffset];
    
    for (let row = 0; row < height; row ++) {
        const rowOffset = row * width;
        for (let col = 0; col < width; col ++) {
            const offset = sliceOffset + rowOffset + col;
            const pixel = typedImageData[offset];
            p_min = Math.min(pixel, p_min);
            p_max = Math.max(pixel, p_max);
        }
    } 

    // create image to be filled with pixel
    const ctx = canvas.getContext('2d');
    const canvasImageData = ctx.createImageData(width, height);

    for (let row = 0; row < canvasImageData.height; row ++) {
        const rowOffset = row * width;
        for (let col = 0; col < canvas.width; col ++) {
            const offset = sliceOffset + rowOffset + col;
            const f_pixel = (typedImageData[offset] - p_min) / (p_max - p_min);
            const pixel = parseInt(f_pixel * 255);
            // rgba
            canvasImageData.data[(rowOffset + col) * 4] = pixel;
            canvasImageData.data[(rowOffset + col) * 4 + 1] = pixel;
            canvasImageData.data[(rowOffset + col) * 4 + 2] = pixel;
            canvasImageData.data[(rowOffset + col) * 4 + 3] = 0xFF;
        }
    }

    ctx.putImageData(canvasImageData, 0, 0);

    const image = document.getElementById(params._imageId);
    image.height = 800;
    image.width = 800;
    image.src = canvas.toDataURL();
}


/**
 * 
 * @param {File} file 
 * @param {number} start 
 * @param {number} length 
 * @returns {Blob}
 */
function makeSlice(file, start, length) {
    const fileType = (typeof File);

    if (fileType === 'undefined') {
        return function () {};
    }

    if (File.prototype.slice) {
        return file.slice(start, start + length);
    }

    if (File.prototype.mozSlice) {
        return file.mozSlice(start, length);
    }

    if (File.prototype.webkitSlice) {
        return file.webkitSlice(start, length);
    }

    return null;
}

/**
 * 
 * @param {File} file 
 */
function readFile(file) {
    const blob = makeSlice(file, 0, file.size);
    if (!blob) {
        // showInfoWindow('error happen!');
        return;
    }

    const reader = new FileReader();
    reader.onloadend = ( e ) => {
        if (e.target.readyState === FileReader.DONE) {
            readNIFTI(file.name, e.target.result);
        }
    };

    reader.readAsArrayBuffer(blob);
}

function moveNext() {
    if (params._current_slice >= params._max_slice - 1) {
        return;
    }
    params._current_slice ++;
    params._current_sliceCallback(params._current_slice);
    params._slider.value = params._current_slice;
    drawCanvas(
        params._canvas,
        params._current_slice,
        params._nifti_header,
        params._nifti_image
    );
}

function movePrev() {
    if (params._current_slice <= 0) {
        return;
    }
    params._current_slice --;
    params._current_sliceCallback(params._current_slice);
    params._slider.value = params._current_slice;
    drawCanvas(
        params._canvas,
        params._current_slice,
        params._nifti_header,
        params._nifti_image
    );
}



async function onmousewheel(e) {
    e.preventDefault();
    if (e.wheelDelta < 0) {
        // 往下滚动
        moveNext();
    } else {
        // 往上滚动
        movePrev();
    }
}

async function onmousewheelFirefox(e) {
    e.preventDefault();
    if (e.detail > 0) {
        // 往下滚动
        moveNext();
    } else {
        // 往上滚动
        movePrev();
    }
}


/**
 * 
 * @param {*} name 
 * @param {*} data 
 */
function readNIFTI(name, data) {
    const canvas = document.getElementById(params._canvasId);
    const slider = document.getElementById(params._sliderId);
    const image = document.getElementById(params._imageId);

    params._canvas = canvas;
    params._slider = slider;

    console.log(params._canvasId, canvas);
    

    // for firefox
    canvas.addEventListener('DOMMouseScroll', onmousewheelFirefox, false);
    image.addEventListener('DOMMouseScroll', onmousewheelFirefox, false);
    // for chrome like browse
    canvas.onmousewheel = onmousewheel;
    image.onmousewheel = onmousewheel;

    let niftiHeader, niftiImage;

    // parse nifti
    if (nifti.isCompressed(data)) {
        data = nifti.decompress(data);
    }


    if (nifti.isNIFTI(data)) {
        params._current_slice = 0;

        niftiHeader = nifti.readHeader(data);
        niftiImage = nifti.readImage(niftiHeader, data);

        params._nifti_header = niftiHeader;
        params._nifti_image = niftiImage;

        // set up slider
        const slices = niftiHeader.dims[3];
        slider.max = slices - 1;
        slider.value = 0;
        slider.oninput = () => {
            drawCanvas(canvas, slider.value, niftiHeader, niftiImage);
        };

        // draw slice
        drawCanvas(canvas, slider.value, niftiHeader, niftiImage);
        params._max_slice = niftiHeader.dims[3];
        params._readniiCallback(niftiHeader);
        // showInfoWindow('成功展示 CT 图像', `基本信息：height=${niftiHeader.dims[2]}, width=${niftiHeader.dims[1]}, slices=${niftiHeader.dims[3]}`);
    } else {
        // showInfoWindow('数据格式存在错误！我无法读取！');
    }
}
/**
 * 
 * @param { Event } e
 */
function handleFileSelect(e) {
    const files = e.target.files;
    readFile(files[0]);
}

function setCanvasId(name) {
    params._canvasId = name;
}

function setSliderId(name) {
    params._sliderId = name;
}

export {
    drawCanvas,
    handleFileSelect,
    setCanvasId,
    setSliderId,
    params,
    readFile
};