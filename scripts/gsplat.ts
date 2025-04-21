import * as SPLAT from "gsplat";


class VideoEngine {
    private videoCanvas: HTMLCanvasElement;
    private renderCanvas: HTMLCanvasElement;
    private video: HTMLVideoElement;
    private video_frame_id: number | null = null;

    constructor(renderCanvas: HTMLCanvasElement) {
        this.renderCanvas = renderCanvas;
        this.video = document.createElement('video') as HTMLVideoElement;
        this.video.disablePictureInPicture = true;
        this.video.autoplay = true;
        this.video.controls = false;
        this.video.playsInline = true;

        document.body.appendChild(this.video);
        this.video.style.display = 'none';

        this.videoCanvas = document.createElement('canvas');

        const videoScreenDiv = window.document.getElementById('videoScreen')!;

        videoScreenDiv.appendChild(this.videoCanvas);

        const constraints = {
            audio: false,
            video: true
        };

        navigator.mediaDevices.getUserMedia(constraints).then(value => this.handleSuccess(value)).catch(reason => this.handleError(reason));
    }

    private videoFrame() {
        let srcW = this.video.videoWidth;
        let srcH = this.video.videoHeight;
        const dstW = this.renderCanvas.width;
        const dstH = this.renderCanvas.height;

        const srcAspect = srcW / srcH;
        const dstAspect = dstW / dstH;
        let offsetX = 0;
        let offsetY = 0;

        if (srcAspect < dstAspect) {
            offsetY = (srcH - srcW / dstAspect) / 2;
            srcH = srcW / dstAspect;
            offsetX = 0;
            console.log(`1: srcW = ${srcW}, srcH = ${srcH}, dstW = ${dstW}, dstH = ${dstH}, offsetX = ${offsetX}, offsetY = ${offsetY}`);
        } else {
            offsetX = (srcW - srcH * dstAspect) / 2;
            srcW = srcH * dstAspect;
            offsetY = 0;
            //console.log(`2: srcAspect = ${srcAspect}, dstAspect = ${dstAspect} srcW = ${srcW}, srcH = ${srcH}, dstW = ${dstW}, dstH = ${dstH}`);
            console.log(`2: srcW = ${srcW}, srcH = ${srcH}, dstW = ${dstW}, dstH = ${dstH}, offsetX = ${offsetX}, offsetY = ${offsetY}`);
        }

        this.videoCanvas!.width = dstW;
        this.videoCanvas!.height = dstH;

        this.videoCanvas!.getContext('2d')!.drawImage(this.video,
            offsetX, offsetY, srcW, srcH,
            0,//(srcW - dstW) / 2,
            0,//(srcH - dstH) / 2,
            dstW,
            dstH);

        if (this.video_frame_id != null) {
            cancelAnimationFrame(this.video_frame_id);
        }

        this.video_frame_id = requestAnimationFrame(() => {
            this.videoFrame();
        });
    }

    private handleSuccess(stream: MediaProvider) {

        this.video.srcObject = stream;

        if (this.video_frame_id != null) {
            cancelAnimationFrame(this.video_frame_id);
        }

        this.video_frame_id = requestAnimationFrame(() => {
            this.videoFrame();
        })
    }

    private handleError(error: any) {
        console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name, error.stack);
    }

}

class SplatEngine {
    private static splatRenderer: SPLAT.WebGLRenderer;
    static splatScene: SPLAT.Scene;
    private static splatCamera: SPLAT.Camera;
    public static declare renderCanvas: HTMLCanvasElement;

    public static async init() {
        this.renderCanvas = document.getElementById("canvas") as HTMLCanvasElement;
        this.splatRenderer = new SPLAT.WebGLRenderer(this.renderCanvas);
        this.splatScene = new SPLAT.Scene();
        this.splatCamera = new SPLAT.Camera();


        this.splatRenderer.backgroundColor = new SPLAT.Color32(0, 0, 0, 0);
        const url = (document.getElementById('splat_url') as HTMLInputElement).value;

        const progressIndicator = document.getElementById("progress-indicator") as HTMLProgressElement;

        await SPLAT.Loader.LoadAsync(url, this.splatScene, (progress) => progressIndicator.value = progress * 100);

        const progressDialog = document.getElementById("progress-dialog") as HTMLDialogElement;
        progressDialog.close();

        const handleResize = () => {
            this.splatRenderer.setSize(window.innerWidth, window.innerHeight);
        };

        const frame = () => {
            this.splatRenderer.render(this.splatScene, this.splatCamera);
            requestAnimationFrame(frame);
        };

        handleResize();
        window.addEventListener("resize", handleResize);

        requestAnimationFrame(frame);
    }
}

async function main() {
    await SplatEngine.init();

    new VideoEngine(SplatEngine.renderCanvas);
}

main().then();
