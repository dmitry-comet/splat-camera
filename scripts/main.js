var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ArcRotateCamera, Color4, Engine, ImportMeshAsync, RenderTargetTexture, Scene, Vector3 } from "@babylonjs/core";
import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
registerBuiltInLoaders();
import { DefaultLoadingScreen } from "@babylonjs/core/Loading/loadingScreen";
let videoCanvas;
{
    const video = window.video = document.createElement('video');
    video.setAttribute('autoplay', String(true));
    video.setAttribute('playsinline', String(true));
    document.body.appendChild(video);
    const canvas = document.createElement('canvas');
    const videoScreenDiv = window.document.getElementById("videoScreen");
    videoScreenDiv.appendChild(canvas);
    canvas.width = 360;
    canvas.height = 480;
    videoCanvas = canvas;
    const constraints = {
        audio: false,
        video: true
    };
    function frame() {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(() => {
            frame();
        });
    }
    function handleSuccess(stream) {
        window.stream = stream;
        video.srcObject = stream;
        requestAnimationFrame(() => {
            frame();
        });
    }
    function handleError(error) {
        console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
    }
    navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);
}
const loadingScreenDiv = window.document.getElementById("loadingScreen");
loadingScreenDiv.style.display = "none";
const canvas = document.getElementById("renderCanvas");
let engine = null;
let scene = null;
let sceneToRender = null;
let splat;
const startRenderLoop = function (engine, _canvas) {
    engine.runRenderLoop(function () {
        if (sceneToRender && sceneToRender.activeCamera) {
            sceneToRender.render();
        }
    });
};
const loadingScreen = new DefaultLoadingScreen(canvas, "Loading", "black");
const createDefaultEngine = function () {
    return new Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        disableWebGL2Support: false,
    });
};
const createScene = function () {
    const scene = new Scene(engine);
    const camera = new ArcRotateCamera("camera", 0, 1, 10, Vector3.Zero(), scene);
    camera.speed = 0.1;
    camera.wheelPrecision = 30;
    camera.inertia = 0;
    camera.pinchPrecision = 100;
    camera.lowerRadiusLimit = 3;
    camera.upperRadiusLimit = 20;
    camera.attachControl(canvas, true);
    ImportMeshAsync(document.getElementById("splat_url").value, scene).then((result) => {
        splat = result.meshes[0];
        engine.hideLoadingUI();
    });
    const screenshotButton = document.getElementById("screenshotBtn");
    if (screenshotButton != null) {
        screenshotButton.addEventListener("click", () => {
            if (splat) {
                captureSplatExactly(scene, splat, "splat.png");
            }
        });
    }
    return scene;
};
function initFunction() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const asyncEngineCreation = function () {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    return createDefaultEngine();
                }
                catch (e) {
                    console.log("the available createEngine function failed. Creating the default engine instead");
                    return createDefaultEngine();
                }
            });
        };
        engine = yield asyncEngineCreation();
        engine.loadingScreen = loadingScreen;
        engine.displayLoadingUI();
        const engineOptions = (_a = engine.getCreationOptions) === null || _a === void 0 ? void 0 : _a.call(engine);
        if (!engineOptions || engineOptions.audioEngine !== false) {
        }
        if (!engine)
            throw "engine should not be null.";
        startRenderLoop(engine, canvas);
        scene = createScene();
        scene.clearColor = new Color4(0, 0, 0, 0.0);
    });
}
initFunction().then(() => {
    sceneToRender = scene;
});
window.addEventListener("resize", function () {
    engine === null || engine === void 0 ? void 0 : engine.resize();
});
function getSplatScreenBounds(scene, splatMesh) {
    const engine = scene.getEngine();
    const camera = scene.activeCamera;
    if (camera != null) {
        const viewport = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
        const boundingInfo = splatMesh.getBoundingInfo();
        const min = boundingInfo.boundingBox.minimumWorld;
        const max = boundingInfo.boundingBox.maximumWorld;
        const corners = [
            new Vector3(min.x, min.y, min.z),
            new Vector3(min.x, min.y, max.z),
            new Vector3(min.x, max.y, min.z),
            new Vector3(min.x, max.y, max.z),
            new Vector3(max.x, min.y, min.z),
            new Vector3(max.x, min.y, max.z),
            new Vector3(max.x, max.y, min.z),
            new Vector3(max.x, max.y, max.z)
        ];
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        corners.forEach(corner => {
            const projected = Vector3.Project(corner, camera.getViewMatrix(), camera.getProjectionMatrix(), viewport);
            minX = Math.min(minX, projected.x);
            minY = Math.min(minY, projected.y);
            maxX = Math.max(maxX, projected.x);
            maxY = Math.max(maxY, projected.y);
        });
        const padding = 4;
        return {
            x: Math.max(0, minX - padding),
            y: Math.max(0, minY - padding),
            width: Math.min(engine.getRenderWidth(), maxX + padding) - Math.max(0, minX - padding),
            height: Math.min(engine.getRenderHeight(), maxY + padding) - Math.max(0, minY - padding)
        };
    }
    else {
        return {
            x: 0,
            y: 0,
            width: engine.getRenderWidth(),
            height: engine.getRenderHeight()
        };
    }
}
function captureSplatExactly(scene_1, splatMesh_1) {
    return __awaiter(this, arguments, void 0, function* (scene, splatMesh, fileName = "splat-capture.png") {
        const engine = scene.getEngine();
        const camera = scene.activeCamera;
        let renderTarget = null;
        try {
            console.log('[1/4] Calculating precise splat bounds...');
            const bounds = getSplatScreenBounds(scene, splatMesh);
            const intBounds = {
                x: Math.max(0, Math.floor(bounds.x)),
                y: Math.max(0, Math.floor(bounds.y)),
                width: Math.min(engine.getRenderWidth(), Math.ceil(bounds.width)),
                height: Math.min(engine.getRenderHeight(), Math.ceil(bounds.height))
            };
            console.log('Absolute crop bounds:', intBounds);
            console.log('[2/4] Creating render target...');
            renderTarget = new RenderTargetTexture("splatCapture", { width: engine.getRenderWidth(), height: engine.getRenderHeight() }, scene, false, true, Engine.TEXTURETYPE_UNSIGNED_BYTE);
            renderTarget.renderList = [splatMesh];
            scene.customRenderTargets.push(renderTarget);
            console.log('[3/4] Creating temporary canvas...');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = intBounds.width;
            canvas.height = intBounds.height;
            console.log('[4/4] Rendering and cropping...');
            yield new Promise((resolve) => {
                renderTarget === null || renderTarget === void 0 ? void 0 : renderTarget.onAfterRenderObservable.addOnce(() => __awaiter(this, void 0, void 0, function* () {
                    console.log('Bounds:', intBounds);
                    if (intBounds.width <= 0 || intBounds.height <= 0) {
                        console.error('Invalid bounds dimensions!');
                    }
                    console.log('Active camera:', camera.position);
                    let pixels = yield engine.readPixels(intBounds.x, engine.getRenderHeight() - intBounds.y - intBounds.height, intBounds.width, intBounds.height);
                    const imgContext = videoCanvas.getContext('2d');
                    const imgPixels = imgContext.getImageData(0, 0, videoCanvas.width, videoCanvas.height).data;
                    console.log("W: " + videoCanvas.width + ", H: " + videoCanvas.height + ", 1: " + intBounds.width + ", 2: " + intBounds.height);
                    const pixelsBlended = flipPixelsVertical(pixels, intBounds.width, intBounds.height);
                    for (let y = 0; y < 565; y++) {
                        for (let x = 0; x < 428; x++) {
                            const r = pixelsBlended[y * intBounds.width * 4 + x * 4];
                            const g = pixelsBlended[y * intBounds.width * 4 + x * 4 + 1];
                            const b = pixelsBlended[y * intBounds.width * 4 + x * 4 + 2];
                            const a = pixelsBlended[y * intBounds.width * 4 + x * 4 + 3];
                            const r2 = imgPixels[y * videoCanvas.width * 4 + x * 4];
                            const g2 = imgPixels[y * videoCanvas.width * 4 + x * 4 + 1];
                            const b2 = imgPixels[y * videoCanvas.width * 4 + x * 4 + 2];
                            pixelsBlended[y * intBounds.width * 4 + x * 4] = (r2 * (255.0 - a) + r * a) / 256;
                            pixelsBlended[y * intBounds.width * 4 + x * 4 + 1] = (g2 * (255.0 - a) + g * a) / 256;
                            pixelsBlended[y * intBounds.width * 4 + x * 4 + 2] = (b2 * (255.0 - a) + b * a) / 256;
                            pixelsBlended[y * intBounds.width * 4 + x * 4 + 3] = 255;
                        }
                    }
                    const imageData = new ImageData(new Uint8ClampedArray(pixelsBlended), intBounds.width, intBounds.height);
                    ctx.putImageData(imageData, 0, 0);
                    resolve(null);
                }));
                scene.render();
            });
            canvas.toBlob(blob => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = fileName;
                a.click();
                console.log(`Success! Saved cropped splat as ${fileName}`);
            }, 'image/png', 1);
            return canvas.toDataURL();
        }
        catch (error) {
            console.error('CAPTURE FAILED:', error);
            throw error;
        }
        finally {
            if (renderTarget != null) {
                renderTarget.dispose();
                const index = scene.customRenderTargets.indexOf(renderTarget);
                if (index > -1)
                    scene.customRenderTargets.splice(index, 1);
            }
        }
    });
}
function flipPixelsVertical(pixelData, width, height) {
    const flipped = new Uint8Array(pixelData.byteLength);
    const rowSize = width * 4;
    const source = new Uint8Array(pixelData.buffer);
    for (let y = 0; y < height; y++) {
        const srcOffset = y * rowSize;
        const destOffset = (height - 1 - y) * rowSize;
        flipped.set(source.subarray(srcOffset, srcOffset + rowSize), destOffset);
    }
    return flipped;
}
