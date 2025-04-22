import {
    AbstractMesh,
    ArcRotateCamera, Color4, Engine, ImportMeshAsync, RenderTargetTexture,
    Scene, Vector3
} from '@babylonjs/core';

import {registerBuiltInLoaders} from '@babylonjs/loaders/dynamic';

registerBuiltInLoaders();

import {DefaultLoadingScreen} from '@babylonjs/core/Loading/loadingScreen';
import {VideoEngine} from "./video.ts";
import {FullscreenEngine} from "./fullscreen.ts";

let videoEngine: VideoEngine | null = null;

const renderCanvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

let engine: Engine | null = null;

let scene: Scene | null = null;

let sceneToRender: Scene | null = null;

let splat: AbstractMesh | null;

let splat_frame_id: number | null = null;

function renderScene() {

    engine?.stopRenderLoop();

    if (splat_frame_id != null) {
        cancelAnimationFrame(splat_frame_id);
    }

    splat_frame_id = requestAnimationFrame(() => {
        if (sceneToRender != null && sceneToRender.activeCamera) {
            sceneToRender.render(false, true);
        }
    });
}


const loadingScreen = new DefaultLoadingScreen(renderCanvas, 'Loading', 'black');

const createDefaultEngine = () =>
    new Engine(renderCanvas, false, {
        preserveDrawingBuffer: true,
        stencil: true,
        disableWebGL2Support: false,
    });

function renderLoopFunc() {
    if (sceneToRender != null && sceneToRender.activeCamera) {
        sceneToRender.render(false, true);
    }
}

const createScene = function () {
    // This creates a basic Babylon Scene object (non-mesh)
    const scene = new Scene(engine!);

    /*
        const camera = new ArcRotateCamera(
            'camera',
            0,
            1,
            10,
            Vector3.Zero(),
            scene
        );

        camera.speed = 0.1;

        // Reduce wheel sensitivity
        camera.wheelPrecision = 10; // Default is 3 (lower = more sensitive, higher = less sensitive)
        // Optional: Add inertia for smoother zoom
        camera.inertia = 0; // 0-1 range (1 = no inertia)

        camera.pinchPrecision = 100; // Default is 1000 (higher = less sensitive)

        // Optional: Add limits to zoom
        camera.lowerRadiusLimit = 3;  // Minimum zoom distance
        camera.upperRadiusLimit = 20; // Maximum zoom distance

        // This attaches the camera to the canvas
        camera.attachControl(canvas, true);

    */

    const camera = new ArcRotateCamera('Camera', -Math.PI / 2, Math.PI / 2, 10, new Vector3(0, 0, 0), scene)

//    camera.attachControl(canvas, true);

    camera.useFramingBehavior = false;
//
//     if (camera.framingBehavior != null) {
//         camera.framingBehavior.framingTime = 0;
//         camera.framingBehavior.autoCorrectCameraLimitsAndSensibility = false;
//     }

    // camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
    // autoResizeOrthographicCamera();
    //
    //
    // function autoResizeOrthographicCamera() {
    //
    //     // get the canvas size
    //     const canvasSize = scene.getEngine().getInputElementClientRect();
    //
    //     // retrieve orthographic value from canvas size
    //     const orthoHeightValue = canvasSize!.height / 100;
    //     const orthoWidthValue = canvasSize!.width / 100;
    //
    //     // set the orthographic values to the camera
    //     camera.orthoBottom = -orthoHeightValue;
    //     camera.orthoTop = orthoHeightValue;
    //     camera.orthoLeft = -orthoWidthValue;
    //     camera.orthoRight = orthoWidthValue;
    // }

    ImportMeshAsync(
        (document.getElementById('splat_url') as HTMLInputElement).value,
        scene,
    ).then((result) => {
        splat = result.meshes[0];

        engine?.hideLoadingUI();

        splat.position.set(0, 0, 0);
        splat.scaling.set(1, 1, 1);
        splat.rotation.set(0, 0, 0);


        // // videoTexture = new VideoTexture('vt', video, scene, false, true, Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
        // //     {
        // //         autoUpdateTexture: true, independentVideoSource: true
        // //     });
        //
        // var renderTarget = new RenderTargetTexture(
        //     'render to texture', // name
        //     1024, // texture size
        //     scene,
        //     {
        //
        //         generateMipMaps: false
        //     }// the scene
        // );
        // renderTarget.clearColor = new Color4(1, 1, 1, 0);
        // scene.customRenderTargets.push(renderTarget); // add RTT to the scene
        // renderTarget.renderList!.push(splat);
        //
        // // this is the plane that will show the RTT.
        // var plane = MeshBuilder.CreatePlane("plane", {width: 4, height: 4}, scene);
        // plane.billboardMode = AbstractMesh.BILLBOARDMODE_ALL;
        //
        // // create a material for the RTT and apply it to the plane
        // var rttMaterial = new StandardMaterial("RTT material", scene);
        // rttMaterial.transparencyMode = 3;
        // rttMaterial.opacityTexture = renderTarget;
        // rttMaterial.alphaMode = Constants.ALPHA_COMBINE;
        // rttMaterial.emissiveTexture = videoTexture;
        // rttMaterial.disableLighting = true;
        // plane.material = rttMaterial;

        engine?.runRenderLoop(renderLoopFunc);
    });

    const screenshotButton = document.getElementById('screenshotBtn');

    if (screenshotButton != null) {
        // Add a button click listener
        screenshotButton.addEventListener('click', async () => {
            if (splat) {
                // Assuming you have a scene and a mesh you want to capture
                await captureSplatExactly(scene, splat, 'splat.png');
            }
        });
    }




    scene.onDispose = function () {
        renderCanvas.onpointerdown = null;
        renderCanvas.onpointermove = null;

        renderCanvas.onpointerup = null;
        renderCanvas.onpointercancel = null;
        renderCanvas.onpointerout = null;
        renderCanvas.onpointerleave = null;
    };

    init_gestures();

    return scene;
};

enum ButtonClickState {
    left,
    middle,
    right,
    none
}

let buttonState: ButtonClickState = ButtonClickState.none;

let lastPointerX = 0, lastPointerY = 0;

function onPointerMove() {

    const diffX = scene!.pointerX - lastPointerX;
    const diffY = scene!.pointerY - lastPointerY;

    switch (buttonState) {
        case ButtonClickState.left:
            splat!.position.x -= -diffX * 0.01;
            splat!.position.y -= diffY * 0.01;
            break;
        case ButtonClickState.right:
            splat!.rotation.y -= diffX * 0.01;
            splat!.rotation.x -= diffY * 0.01;
            break;

        case ButtonClickState.middle:
            splat!.scaling.y -= diffY * 0.01;
            splat!.scaling.x -= diffY * 0.01;
            splat!.scaling.z -= diffY * 0.01;
            break;
    }

    lastPointerX = scene!.pointerX;
    lastPointerY = scene!.pointerY;

    renderScene();
}


function onPointerDown(ev: PointerEvent) {
    lastPointerX = scene!.pointerX;
    lastPointerY = scene!.pointerY;

    switch (ev.button) {
        case 0:
            buttonState = ButtonClickState.left;
            break;
        case 1:
            buttonState = ButtonClickState.middle;
            break;
        case 2:
            buttonState = ButtonClickState.right;
            break;
    }
}

function onPointerUp() {
    buttonState = ButtonClickState.none;
}


//////////////
// Global vars to cache event state
let evCache: PointerEvent[] = [];

let prevDiff = -1;

function pointerdown_handler(ev: PointerEvent) {
    evCache.push(ev);

    if (evCache.length == 1) {
        onPointerDown(ev);
    } else if (evCache.length == 3) {
        lastPointerX = (evCache[2].clientX + evCache[1].clientX + evCache[0].clientX) / 2;
        lastPointerY = (evCache[2].clientY + evCache[1].clientY + evCache[0].clientY) / 2;
    }
}

function pointermove_handler(ev: PointerEvent) {
    // This function implements a 2-pointer horizontal pinch/zoom gesture.
    //
    // If the distance between the two pointers has increased (zoom in),
    // the taget element's background is changed to 'pink' and if the
    // distance is decreasing (zoom out), the color is changed to 'lightblue'.
    //
    // This function sets the target element's border to 'dashed' to visually
    // indicate the pointer's target received a move event.

    // Find this event in the cache and update its record with this event
    for (let i = 0; i < evCache.length; i++) {
        if (ev.pointerId == evCache[i].pointerId) {
            evCache[i] = ev;
            break;
        }
    }

    if (evCache.length == 1) {
        onPointerMove();
    }
    // If 3 pointers are down, check for pinch gestures
    else if (evCache.length == 3) {

        const centerX = (evCache[2].clientX + evCache[1].clientX + evCache[0].clientX) / 2;
        const centerY = (evCache[2].clientY + evCache[1].clientY + evCache[0].clientY) / 2;

        const diffX = centerX - lastPointerX;
        const diffY = centerY - lastPointerY;

        splat!.rotation.y -= diffX * 0.001;
        splat!.rotation.x -= diffY * 0.001;

        renderScene();
    } else if (evCache.length == 2) {
        // Calculate the distance between the two pointers
        const curDiff = Math.sqrt(
            Math.pow(evCache[1].clientX - evCache[0].clientX, 2) +
            Math.pow(evCache[1].clientY - evCache[0].clientY, 2)
        );

        if (prevDiff > 0) {
            splat!.scaling.y += (curDiff - prevDiff) * 0.01;
            splat!.scaling.x += (curDiff - prevDiff) * 0.01;
            splat!.scaling.z += (curDiff - prevDiff) * 0.01;
        }

        renderScene();

        // Cache the distance for the next move event
        prevDiff = curDiff;
    }
}

function pointerup_handler(ev: PointerEvent) {

    // Remove this pointer from the cache and reset the target's
    // background and border
    remove_event(ev);

    // If the number of pointers down is less than two then reset diff tracker
    if (evCache.length < 3) prevDiff = -1;

    if (evCache.length == 1) {
        onPointerUp();
    }
}

function remove_event(ev: PointerEvent) {
    // Remove this event from the target's cache
    for (let i = 0; i < evCache.length; i++) {
        if (evCache[i].pointerId == ev.pointerId) {
            evCache.splice(i, 1);
            break;
        }
    }
}


function init_gestures() {
    // Install event handlers for the pointer target
    renderCanvas.onpointerdown = pointerdown_handler;
    renderCanvas.onpointermove = pointermove_handler;

    renderCanvas.onpointerup = pointerup_handler;
    renderCanvas.onpointercancel = pointerup_handler;
    renderCanvas.onpointerout = pointerup_handler;
    renderCanvas.onpointerleave = pointerup_handler;
}

///////////////


async function initFunction() {
    const asyncEngineCreation = async function () {
        try {
            return createDefaultEngine();
        } catch (e) {
            console.log(
                'the available createEngine function failed. Creating the default engine instead'
            );
            return createDefaultEngine();
        }
    };

    engine = await asyncEngineCreation();
    engine.loadingScreen = loadingScreen;
    engine.displayLoadingUI();


    scene = createScene();

    scene.autoClearDepthAndStencil = true;

    // scene.useOrderIndependentTransparency = true;
    scene.clearColor = new Color4(0, 0, 0, 0); // RGBA (0-1 range)
}

initFunction().then(() => {
    sceneToRender = scene;

    videoEngine = new VideoEngine(renderCanvas);

    FullscreenEngine.init()
});

// Resize
window.addEventListener('resize', function () {
    engine?.resize();
});

// First include the bounds calculation function
function getSplatScreenBounds(scene: Scene, splatMesh: AbstractMesh) {
    const engine = scene.getEngine();
    const camera = scene.activeCamera;

    if (camera != null) {
        const viewport = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());

        // Get all 8 corners of the bounding box
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

        // Project to screen space
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        corners.forEach(corner => {
            const projected = Vector3.Project(
                corner,
                camera.getViewMatrix(),
                camera.getProjectionMatrix(),
                viewport
            );

            minX = Math.min(minX, projected.x);
            minY = Math.min(minY, projected.y);
            maxX = Math.max(maxX, projected.x);
            maxY = Math.max(maxY, projected.y);
        });

        // Add 4px padding
        const padding = 4;
        return {
            x: Math.max(0, minX - padding),
            y: Math.max(0, minY - padding),
            width: Math.min(engine.getRenderWidth(), maxX + padding) - Math.max(0, minX - padding),
            height: Math.min(engine.getRenderHeight(), maxY + padding) - Math.max(0, minY - padding)
        };
    } else {
        return {
            x: 0,
            y: 0,
            width: engine.getRenderWidth(),
            height: engine.getRenderHeight()
        };
    }
}

// Main capture function
async function captureSplatExactly(scene: Scene, splatMesh: AbstractMesh, fileName = 'splat-capture.png') {

    if (videoEngine?.videoCanvas == null) {
        return;
    }

    const engine = scene.getEngine();
    const camera = scene.activeCamera;

    let renderTarget: RenderTargetTexture | null = null;

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
        renderTarget = new RenderTargetTexture(
            'splatCapture',
            {width: engine.getRenderWidth(), height: engine.getRenderHeight()},
            scene,
            false,
            true, // Enable depth buffer
            Engine.TEXTURETYPE_UNSIGNED_BYTE // Ensure correct texture type
        )!;
        renderTarget.renderList = [splatMesh];
        scene.customRenderTargets.push(renderTarget);

        console.log('[3/4] Creating temporary canvas...');
        const canvas = document.createElement('canvas');

        const ctx = canvas.getContext('2d')!;

        // var img = new Image;
        // img.onload = function(){
        //   ctx.drawImage(img,0,0); // Or at whatever offset you like
        // };
        // img.src = 'https://foto-interiors.com/uploads/photo/8/7448_l.jpg';
        canvas.width = intBounds.width;
        canvas.height = intBounds.height;


        console.log('[4/4] Rendering and cropping...');

        await new Promise((resolve: (_: any) => void) => {
            renderTarget?.onAfterRenderObservable.addOnce(async () => {
                // Verify bounds are reasonable
                console.log('Bounds:', intBounds);
                if (intBounds.width <= 0 || intBounds.height <= 0) {
                    console.error('Invalid bounds dimensions!');
                }

                // Verify camera is correct
                console.log('Active camera:', camera!.position);

                let pixels: ArrayBufferView = await engine.readPixels(
                    intBounds.x,
                    engine.getRenderHeight() - intBounds.y - intBounds.height,
                    intBounds.width,
                    intBounds.height
                );

                //  var imgCanvas = document.createElement('canvas');
                // imgCanvas.width = img.width;
                // imgCanvas.height = img.height;
                const imgContext = videoEngine!.videoCanvas!.getContext('2d')!;
                // await imgContext.drawImage(videoCanvas, 0, 0);
                const imgPixels = imgContext.getImageData(0, 0, videoEngine!.videoCanvas.width, videoEngine!.videoCanvas.height).data;

                console.log(`W: ${videoEngine!.videoCanvas.width}, H: ${videoEngine!.videoCanvas.height}, 1: ${intBounds.width}, 2: ${intBounds.height}`);

                const pixelsBlended = flipPixelsVertical(pixels, intBounds.width, intBounds.height);

                for (let y = 0; y < 565; y++) {
                    for (let x = 0; x < 428; x++) {
                        const r = pixelsBlended[y * intBounds.width * 4 + x * 4];
                        const g = pixelsBlended[y * intBounds.width * 4 + x * 4 + 1];
                        const b = pixelsBlended[y * intBounds.width * 4 + x * 4 + 2];
                        const a = pixelsBlended[y * intBounds.width * 4 + x * 4 + 3];

                        const r2 = imgPixels[y * videoEngine!.videoCanvas.width * 4 + x * 4];
                        const g2 = imgPixels[y * videoEngine!.videoCanvas.width * 4 + x * 4 + 1];
                        const b2 = imgPixels[y * videoEngine!.videoCanvas.width * 4 + x * 4 + 2];

                        pixelsBlended[y * intBounds.width * 4 + x * 4] = (r2 * (255.0 - a) + r * a) / 256;
                        pixelsBlended[y * intBounds.width * 4 + x * 4 + 1] = (g2 * (255.0 - a) + g * a) / 256;
                        pixelsBlended[y * intBounds.width * 4 + x * 4 + 2] = (b2 * (255.0 - a) + b * a) / 256;
                        pixelsBlended[y * intBounds.width * 4 + x * 4 + 3] = 255;
                    }
                }

                const imageData = new ImageData(
                    new Uint8ClampedArray(pixelsBlended),
                    intBounds.width,
                    intBounds.height
                );
                //ctx.drawImage(img,0,0); // Or at whatever offset you like

                ctx.putImageData(imageData, 0, 0);
                resolve(null);
            });
            scene.render();
        });

        // Final download
        canvas.toBlob(blob => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob!);
            a.download = fileName;
            a.click();
            console.log(`Success! Saved cropped splat as ${fileName}`);
        }, 'image/png', 1);
    } catch (error) {
        console.error('CAPTURE FAILED:', error);
        throw error;
    } finally {
        // Cleanup
        if (renderTarget != null) {
            renderTarget.dispose();
            const index = scene.customRenderTargets.indexOf(renderTarget);
            if (index > -1) scene.customRenderTargets.splice(index, 1);
        }
    }
}

function flipPixelsVertical(pixelData: ArrayBufferView, width: number, height: number) {
    // Create new array for flipped result
    const flipped = new Uint8Array(pixelData.byteLength);
    const rowSize = width * 4; // 4 bytes per pixel (RGBA)

    // Ensure we're working with a Uint8Array view of the pixelData
    const source = new Uint8Array(pixelData.buffer);

    for (let y = 0; y < height; y++) {
        const srcOffset = y * rowSize;
        const destOffset = (height - 1 - y) * rowSize;

        // Copy one full row at a time
        flipped.set(
            source.subarray(srcOffset, srcOffset + rowSize),
            destOffset
        );
    }
    return flipped;
}

