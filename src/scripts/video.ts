
export class VideoEngine {
    public readonly videoCanvas: HTMLCanvasElement;
    private renderCanvas: HTMLCanvasElement;
    public video: HTMLVideoElement;
    private video_frame_id: number | null = null;
    public supports: MediaTrackSupportedConstraints | null = null;
    public facingMode : string | null = null;

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

        this.supports = navigator.mediaDevices.getSupportedConstraints();

        const constraints = {
            audio: false,
            video: true,
        };

        navigator.mediaDevices.getUserMedia(constraints).then(value => this.handleSuccess(value)).catch(reason => this.handleError(reason));

        const facingModeButton = document.getElementById('facingModeButton') as HTMLButtonElement;

        if (facingModeButton != null) {
            const preventDefault = (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
            };

            // Add a button click listener
            facingModeButton.addEventListener('click', async (ev: Event) => {
                preventDefault(ev);

                const tracks = (this.video.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());

                this.facingMode = (this.facingMode === 'user' || this.facingMode == null) ? 'environment' : 'user';

                const constraints = {
                    audio: false,
                    video: this.supports!['facingMode'] ? {
                        facingMode: {exact: this.facingMode},
                    } : {}
                };

                const stream = await navigator.mediaDevices.getUserMedia(constraints).catch(_reason => navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: true,
                }));

                this.video!.srcObject = null;
                this.video!.srcObject = stream;
                this.video!.play().then();
            });
        }
    }

    private videoFrame() {
        let srcW = this.video.videoWidth;
        let srcH = this.video.videoHeight;
        let dstW = this.renderCanvas.width;
        let dstH = this.renderCanvas.height;

        const srcAspect = srcW / srcH;
        const dstAspect = dstW / dstH;
        let offsetX: number;
        let offsetY: number;

        if (srcAspect < dstAspect) {
            offsetX = 0;
            offsetY = (srcH - srcW / dstAspect) / 2;
            srcH = srcW / dstAspect;
        } else {
            offsetX = (srcW - srcH * dstAspect) / 2;
            offsetY = 0;
            srcW = srcH * dstAspect;
        }

        const dstSize = screenshotSize(dstH, dstH);

        dstW = dstSize.width;
        dstH  = dstSize.height;


        this.videoCanvas!.width = dstW;
        this.videoCanvas!.height = dstH;

        this.videoCanvas!.getContext('2d')!.drawImage(this.video,
            offsetX, offsetY, srcW, srcH,
            0,
            0,
            dstW,
            dstH);

        if (this.video_frame_id != null) {
            cancelAnimationFrame(this.video_frame_id);
        }

        setTimeout(() => {
            this.video_frame_id = requestAnimationFrame(() => {
                this.videoFrame();
            });
        }, 50);
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

export function screenshotSize(srcW: number, srcH: number, size: number = 2160) {
    return srcW > srcH ?
        {
            width: size,
            height: srcH * size / srcW
        } :
        {
            width: srcW * size / srcH,
            height: size
        };
}