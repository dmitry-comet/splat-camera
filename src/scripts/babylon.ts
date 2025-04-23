import {
    AbstractMesh,
    ArcRotateCamera,
    Color4,
    Constants,
    Engine, HtmlElementTexture,
    ImportMeshAsync,
    Mesh,
    MeshBuilder, Quaternion,
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
import {InputEngine} from "./input.ts";

let videoEngine: VideoEngine | null = null;

let videoTexture: HtmlElementTexture | null = null;

const renderCanvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

let engine: Engine | null = null;

let scene: Scene | null = null;

let sceneToRender: Scene | null = null;

let splat: AbstractMesh | null;

let inputEngine : InputEngine | null = null;

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
        splat.rotationQuaternion = Quaternion.FromEulerVector(new Vector3(0, 0, 0));


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

        scene.onDispose = function () {
            inputEngine?.dispose()
        };

        inputEngine = new InputEngine(splat!);

        inputEngine.attachToCanvas(renderCanvas);

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

