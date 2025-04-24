import {log} from "./log.ts";

export class VideoEngine {
    public readonly video: HTMLVideoElement;
    public supports: MediaTrackSupportedConstraints | null = null;
    public facingMode: string | null = null;
    private onVideoResize: () => void;

    constructor(onVideoResize: () => void) {
        this.onVideoResize = onVideoResize;

        this.video = document.createElement('video') as HTMLVideoElement;
        this.video.disablePictureInPicture = true;
        this.video.autoplay = false;
        this.video.controls = false;
        this.video.playsInline = true;

        document.body.appendChild(this.video);
        this.video.style.display = 'none';

        this.supports = navigator.mediaDevices.getSupportedConstraints();

        const constraints = {
            audio: false,
            video: true,
        };

        const t = this;
        navigator.mediaDevices.getUserMedia(constraints).then(value => t.handleSuccess(value)).catch(reason => t.handleError(reason));

        const facingModeButton = document.getElementById('facingModeButton') as HTMLButtonElement;

        if (facingModeButton != null) {
            const preventDefault = (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
            };

            // Add a button click listener
            facingModeButton.addEventListener('click', async (ev: Event) => {
                preventDefault(ev);

                const tracks = (t.video.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());

                t.facingMode = (t.facingMode === 'user' || t.facingMode == null) ? 'environment' : 'user';

                const constraints = {
                    audio: false,
                    video: t.supports!['facingMode'] ? {
                        facingMode: {exact: t.facingMode},
                    } : {}
                };

                const stream = await navigator.mediaDevices.getUserMedia(constraints).catch(_reason => navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: true,
                }));

                t.video!.srcObject = null;
                t.video!.srcObject = stream;
                t.video!.play().then(_value => {
                    t.onVideoResize();
                });

            });
        }


    }


    private handleSuccess(stream: MediaStream) {
        this.video.srcObject = stream;

        const t = this;
        this.video!.play().then(_value => {
            t.onVideoResize();
        });
    }

    private handleError(error: any) {
        log(`navigator.MediaDevices.getUserMedia error: ${error.message}, ${error.name}$, {error.stack}`);
    }

}
