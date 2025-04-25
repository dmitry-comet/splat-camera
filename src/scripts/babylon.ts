import {
	AbstractMesh,
	ArcRotateCamera,
	Color4,
	Constants,
	Engine,
	ImportMeshAsync,
	ISceneLoaderAsyncResult,
	Mesh,
	MeshBuilder,
	Quaternion,
	Scene,
	StandardMaterial,
	Vector3,
	VideoTexture,
} from '@babylonjs/core';

import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic';

import { DateTime } from 'luxon';

import { DefaultLoadingScreen } from '@babylonjs/core/Loading/loadingScreen';
import { VideoEngine } from './video.ts';
import { FullscreenEngine } from './fullscreen.ts';
import { InputEngine } from './input.ts';
import { log } from './log.ts';

class BabylonEngine {
	private videoEngine: VideoEngine | null = null;

	private videoTexture: VideoTexture | null = null;

	private readonly renderCanvas: HTMLCanvasElement;

	private readonly engine: Engine | null = null;

	private scene: Scene | null = null;

	private splat: AbstractMesh | null = null;

	private inputEngine: InputEngine | null = null;

	private readonly loadingScreen: DefaultLoadingScreen;

	private plane: Mesh | null = null;

	private splat_frame_id: number | null = null;

	constructor() {
		registerBuiltInLoaders();

		this.renderCanvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
		this.loadingScreen = new DefaultLoadingScreen(this.renderCanvas, 'Loading', 'black');

		this.engine = new Engine(this.renderCanvas, false, {
			preserveDrawingBuffer: true,
			stencil: true,
			disableWebGL2Support: false,
		});

		this.createScene();

		this.engine.loadingScreen = this.loadingScreen;

		this.engine.displayLoadingUI();

		this.scene!.autoClearDepthAndStencil = true;

		// scene.useOrderIndependentTransparency = true;
		this.scene!.clearColor = new Color4(0, 0, 0, 0); // RGBA (0-1 range)

		FullscreenEngine.init();

		const engine = this.engine;

		const ap = (tag: string) => {
			this.alignPlane(tag);
		};

		// Resize
		window.addEventListener('resize', function () {
			engine?.resize();
			ap('resize');
		});
	}

	private renderScene() {
		if (this.splat_frame_id != null) {
			cancelAnimationFrame(this.splat_frame_id);
		}

		this.splat_frame_id = requestAnimationFrame(() => {
			this.videoTexture?.update();
			this.renderFrame();
		});
	}

	private renderFrame() {
		if (this.scene != null && this.scene.activeCamera) {
			this.scene.render(false, true);
		}
	}

	private async captureSplat(scene: Scene) {
		const backup = {
			width: this.renderCanvas.width,
			height: this.renderCanvas.height,
		};

		const renderSize = this.screenshotSize(this.renderCanvas.width, this.renderCanvas.height);

		this.renderCanvas.width = renderSize.width;
		this.renderCanvas.height = renderSize.height;

		scene.render(false, true);

		this.renderCanvas.toBlob(
			(blob) => {
				const a = document.createElement('a');
				a.href = URL.createObjectURL(blob!);
				a.download = `splat_${DateTime.now().toFormat('yyyy_LL_dd_HH_mm_ss')}.jpg`;
				a.click();
			},
			'image/jpeg',
			1,
		);

		this.renderCanvas.width = backup.width;
		this.renderCanvas.height = backup.height;
	}

	private createScene() {
		// This creates a basic Babylon Scene object (non-mesh)
		this.scene = new Scene(this.engine!);

		const camera = new ArcRotateCamera(
			'Camera',
			-Math.PI / 2,
			Math.PI / 2,
			20,
			new Vector3(0, 0, 0),
			this.scene,
		);

		camera.useFramingBehavior = true;

		ImportMeshAsync(
			(document.getElementById('splat_url') as HTMLInputElement).value,
			this.scene,
		).then((result) => {
			this.onSceneLoaded(result);
		});

		const screenshotButton = document.getElementById('screenshotBtn') as HTMLButtonElement;

		if (screenshotButton != null) {
			// Add a button click listener
			screenshotButton.addEventListener('click', async () => {
				if (this.splat != null) {
					// Assuming you have a scene and a mesh you want to capture
					await this.captureSplat(this.scene!);
				}
			});
		}
	}

	private onSceneLoaded(result: ISceneLoaderAsyncResult) {
		this.splat = result.meshes[0];

		this.engine?.hideLoadingUI();

		this.splat.position.set(0, 0, -10);
		this.splat.scaling.set(1, 1, 1);
		this.splat.rotationQuaternion = Quaternion.FromEulerVector(new Vector3(0, 0, 0));

		this.videoEngine = new VideoEngine(() => {
			this.alignPlane('video engine callback');
		});

		this.videoTexture = new VideoTexture(
			'vt',
			this.videoEngine!.video,
			this.scene,
			false,
			false,
			Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
			{
				autoPlay: true,
				independentVideoSource: true,
				autoUpdateTexture: true,
			},
		);

		// this is the plane that will show the RTT.
		this.plane = MeshBuilder.CreatePlane('plane', { width: 1, height: 1 }, this.scene);
		this.plane.billboardMode = AbstractMesh.BILLBOARDMODE_ALL;

		// create a material for the RTT and apply it to the plane
		const rttMaterial = new StandardMaterial('rtt', this.scene!);
		rttMaterial.transparencyMode = 3;
		rttMaterial.alphaMode = Constants.ALPHA_COMBINE;
		rttMaterial.emissiveTexture = this.videoTexture;
		rttMaterial.disableLighting = true;
		this.plane.material = rttMaterial;

		this.inputEngine = new InputEngine(this.splat!, () => {
			this.renderScene();
		});

		const inputEngine = this.inputEngine;

		this.scene!.onDispose = function () {
			inputEngine?.dispose();
		};

		this.inputEngine.attachToCanvas(this.renderCanvas);

		if (this.engine != null) {
			this.engine.runRenderLoop(() => this.renderFrame());
		}
	}

	private alignPlane(tag: string) {
		if (
			this.scene != null &&
			this.engine != null &&
			this.plane != null &&
			this.videoEngine != null
		) {
			const activeCamera = this.scene!.activeCamera;
			if (activeCamera != null) {
				const fov = activeCamera.fov;
				const aspectRatio = this.engine.getAspectRatio(activeCamera);
				const distance = activeCamera.position.length();
				const outputH = 2 * distance * Math.tan(fov / 2);
				const outputW = outputH * aspectRatio;

				const videoSize = this.videoSize(
					this.videoEngine.video.videoWidth,
					this.videoEngine.video.videoHeight,
					outputW,
					outputH,
				);

				log(`on video resize (${tag}): ${JSON.stringify(videoSize)}`);

				this.plane.scaling.set(videoSize.width, videoSize.height, 1);
			}
		} else {
			// log(`${tag} NO VIDEO`);
		}
	}

	private videoSize(srcW: number, srcH: number, dstW: number, dstH: number) {
		const srcAspect = srcW / srcH;
		const dstAspect = dstW / dstH;
		let offsetX: number;
		let offsetY: number;
		let width: number;
		let height: number;

		if (srcAspect > dstAspect) {
			width = dstH * srcAspect;
			height = dstH;
			offsetX = (dstW - width) / 2;
			offsetY = 0;
		} else {
			width = dstW;
			height = dstW / srcAspect;
			offsetX = 0;
			offsetY = (dstH - height) / 2;
		}

		return { x: offsetX, y: offsetY, width: width, height: height };
	}

	private screenshotSize(srcW: number, srcH: number, size: number = 2160) {
		return srcW > srcH
			? {
					width: size,
					height: (srcH * size) / srcW,
				}
			: {
					width: (srcW * size) / srcH,
					height: size,
				};
	}
}

new BabylonEngine();
