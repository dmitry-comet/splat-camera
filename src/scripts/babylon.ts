import {
    AbstractMesh,
    ArcRotateCamera,
    Color4,
    Constants,
    Engine, HtmlElementTexture,
    ImportMeshAsync,
    Mesh,
    MeshBuilder,
    Scene,
    StandardMaterial,
    Vector3,
} from '@babylonjs/core';

import {registerBuiltInLoaders} from '@babylonjs/loaders/dynamic';

import {DateTime} from 'luxon';

registerBuiltInLoaders();

import {DefaultLoadingScreen} from '@babylonjs/core/Loading/loadingScreen';
import {screenshotSize, VideoEngine} from "./video.ts";
import {FullscreenEngine} from "./fullscreen.ts";
import {log} from "./log.ts";

let videoEngine: VideoEngine | null = null;

let videoTexture: HtmlElementTexture | null = null;

const renderCanvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

let engine: Engine | null = null;

let scene: Scene | null = null;

let sceneToRender: Scene | null = null;

let splat: AbstractMesh | null;

//let splat_frame_id: number | null = null;

function renderScene() {

    // engine?.stopRenderLoop();
    //
    // if (splat_frame_id != null) {
    //     cancelAnimationFrame(splat_frame_id);
    // }
    //
    // splat_frame_id = requestAnimationFrame(() => {
    //     if (sceneToRender != null && sceneToRender.activeCamera) {
    //         sceneToRender.render(false, true);
    //     }
    // });
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

async function captureSplat(scene: Scene, _splat: AbstractMesh) {

    const backup = {width: renderCanvas.width, height: renderCanvas.height};

    let renderSize = screenshotSize(renderCanvas.width, renderCanvas.height);

    renderCanvas.width = renderSize.width;
    renderCanvas.height = renderSize.height;


    scene.render(false, true);

    log(`VIDEO: ${renderCanvas!.width} x ${renderCanvas!.height}`);

    renderCanvas.toBlob(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob!);
        a.download = `splat_${DateTime.now().toFormat('yyyy_LL_dd_HH_mm_ss')}.jpg`;
        a.click();
        console.log(`Success! Saved cropped splat as splat.png`);
    }, 'image/jpeg', 1);

    renderCanvas.width = backup.width;
    renderCanvas.height = backup.height;
}

let plane: Mesh;

const createScene = function () {
    // This creates a basic Babylon Scene object (non-mesh)
    const scene = new Scene(engine!);

    const camera = new ArcRotateCamera('Camera', -Math.PI / 2, Math.PI / 2, 20, new Vector3(0, 0, 0), scene)

    camera.useFramingBehavior = true;

    ImportMeshAsync(
        (document.getElementById('splat_url') as HTMLInputElement).value,
        scene,
    ).then((result) => {
        splat = result.meshes[0];

        engine?.hideLoadingUI();

        splat.position.set(0, 0, -3);
        splat.scaling.set(1, 1, 1);
        splat.rotation.set(0, 0, 0);


        videoTexture = new HtmlElementTexture('vt', videoEngine?.videoCanvas!,
            {
                scene: scene,
                engine: engine,
                samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
                generateMipMaps: false,
            });

        window.setInterval(() => {
            videoTexture?.update();
        }, 50);

        // this is the plane that will show the RTT.
        plane = MeshBuilder.CreatePlane("plane", {width: 1, height: 1}, scene);
        plane.billboardMode = AbstractMesh.BILLBOARDMODE_ALL;

        // create a material for the RTT and apply it to the plane
        const rttMaterial = new StandardMaterial("RTT material", scene);
        rttMaterial.transparencyMode = 3;
        rttMaterial.alphaMode = Constants.ALPHA_COMBINE;
        rttMaterial.emissiveTexture = videoTexture;
        rttMaterial.disableLighting = true;
        plane.material = rttMaterial;

        scalePlane();

        engine?.runRenderLoop(renderLoopFunc);
    });

    const screenshotButton = document.getElementById('screenshotBtn');

    if (screenshotButton != null) {
        // Add a button click listener
        screenshotButton.addEventListener('click', async () => {
            if (splat) {
                // Assuming you have a scene and a mesh you want to capture
                await captureSplat(scene, splat);
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

function scalePlane() {
    const c = sceneToRender?.activeCamera!;
    const fov = c.fov;
    const aspectRatio = engine!.getAspectRatio(c);
    const d = c.position.length();
    const y = 2 * d * Math.tan(fov / 2);
    const x = y * aspectRatio;
    plane.scaling.set(x, y, 1);
}

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
    scalePlane();
});

