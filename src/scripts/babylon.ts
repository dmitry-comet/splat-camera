import {
    AbstractMesh,
    ArcRotateCamera,
    Color4,
    Constants,
    Engine, HtmlElementTexture,
    ImportMeshAsync, ISceneLoaderAsyncResult,
    Mesh,
    MeshBuilder, Quaternion,
    Scene,
    StandardMaterial,
    Vector3,
} from '@babylonjs/core';

import {registerBuiltInLoaders} from '@babylonjs/loaders/dynamic';

import {DateTime} from 'luxon';

import {DefaultLoadingScreen} from '@babylonjs/core/Loading/loadingScreen';
import {screenshotSize, VideoEngine} from "./video.ts";
import {FullscreenEngine} from "./fullscreen.ts";
import {InputEngine} from "./input.ts";

class BabylonEngine {
    videoEngine: VideoEngine | null = null;

    videoTexture: HtmlElementTexture | null = null;

    readonly renderCanvas : HTMLCanvasElement;

    engine: Engine | null = null;

    scene: Scene | null = null;

    sceneToRender: Scene | null = null;

    splat: AbstractMesh | null = null;

    inputEngine: InputEngine | null = null;

    readonly loadingScreen : DefaultLoadingScreen;

    plane: Mesh | null = null;

    constructor() {
        registerBuiltInLoaders();

        this.renderCanvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
        this.loadingScreen = new DefaultLoadingScreen(this.renderCanvas, 'Loading', 'black')

        this.engine = new Engine(this.renderCanvas, false, {
            preserveDrawingBuffer: true,
            stencil: true,
            disableWebGL2Support: false,
        })

        this.createScene();

        this.engine.loadingScreen = this.loadingScreen;

        this.engine.displayLoadingUI();

        this.scene!.autoClearDepthAndStencil = true;

        // scene.useOrderIndependentTransparency = true;
        this.scene!.clearColor = new Color4(0, 0, 0, 0); // RGBA (0-1 range)

        this.sceneToRender = this.scene;

        this.videoEngine = new VideoEngine(this.renderCanvas);

        FullscreenEngine.init();

        const t = this;

        // Resize
        window.addEventListener('resize', function () {
            t.engine?.resize();
            t.scalePlane();
        });
    }

    renderLoopFunc() {
        if (this.sceneToRender != null && this.sceneToRender.activeCamera) {
            this.sceneToRender.render(false, true);
        }
    }

    async captureSplat(scene: Scene, _splat: AbstractMesh) {

        const backup = {width: this.renderCanvas.width, height: this.renderCanvas.height};

        let renderSize = screenshotSize(this.renderCanvas.width, this.renderCanvas.height);

        this.renderCanvas.width = renderSize.width;
        this.renderCanvas.height = renderSize.height;


        scene.render(false, true);

        this.renderCanvas.toBlob(blob => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob!);
            a.download = `splat_${DateTime.now().toFormat('yyyy_LL_dd_HH_mm_ss')}.jpg`;
            a.click();
            console.log(`Success! Saved cropped splat as splat.png`);
        }, 'image/jpeg', 1);

        this.renderCanvas.width = backup.width;
        this.renderCanvas.height = backup.height;
    }


    createScene() {
        // This creates a basic Babylon Scene object (non-mesh)
        this.scene = new Scene(this.engine!);

        const camera = new ArcRotateCamera('Camera', -Math.PI / 2, Math.PI / 2, 20, new Vector3(0, 0, 0), this.scene)

        camera.useFramingBehavior = true;

        const t = this;
        ImportMeshAsync(
            (document.getElementById('splat_url') as HTMLInputElement).value,
            this.scene,
        ).then((result) => {
            t.onSceneLoaded(result);
        });

        const screenshotButton = document.getElementById('screenshotBtn') as HTMLButtonElement;

        if (screenshotButton != null) {

            // Add a button click listener
            screenshotButton.addEventListener('click', async () => {
                if (t.splat != null) {
                    // Assuming you have a scene and a mesh you want to capture
                    await t.captureSplat(t.scene!, t.splat);
                }
            });
        }
    }


    onSceneLoaded(result: ISceneLoaderAsyncResult) {
        this.splat = result.meshes[0];

        this.engine?.hideLoadingUI();

        this.splat.position.set(0, 0, -3);
        this.splat.scaling.set(1, 1, 1);
        this.splat.rotationQuaternion = Quaternion.FromEulerVector(new Vector3(0, 0, 0));


        this.videoTexture = new HtmlElementTexture('vt', this.videoEngine?.videoCanvas!,
            {
                scene: this.scene,
                engine: this.engine,
                samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
                generateMipMaps: false,
            });

        const t = this;

        window.setInterval(() => {
            t.videoTexture?.update();
        }, 50);

        // this is the plane that will show the RTT.
        this.plane = MeshBuilder.CreatePlane('plane', {width: 1, height: 1}, this.scene);
        this.plane.billboardMode = AbstractMesh.BILLBOARDMODE_ALL;

        // create a material for the RTT and apply it to the plane
        const rttMaterial = new StandardMaterial("rtt", this.scene!);
        rttMaterial.transparencyMode = 3;
        rttMaterial.alphaMode = Constants.ALPHA_COMBINE;
        rttMaterial.emissiveTexture = this.videoTexture;
        rttMaterial.disableLighting = true;
        this.plane.material = rttMaterial;

        this.scalePlane();

        this.scene!.onDispose = function () {
            t.inputEngine?.dispose()
        };

        this.inputEngine = new InputEngine(this.splat!);

        this.inputEngine.attachToCanvas(this.renderCanvas);

        this.engine?.runRenderLoop(this.renderLoopFunc);
    }

    scalePlane() {
        const c = this.sceneToRender?.activeCamera!;
        const fov = c.fov;
        const aspectRatio = this.engine!.getAspectRatio(c);
        const d = c.position.length();
        const y = 2 * d * Math.tan(fov / 2);
        const x = y * aspectRatio;
        this.plane?.scaling.set(x, y, 1);
    }
}

new BabylonEngine();