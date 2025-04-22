import * as SPLAT from "gsplat";
import {VideoEngine} from "./video.ts";

let videoEngine: VideoEngine | null = null;

class SplatEngine {
    private static splatRenderer: SPLAT.WebGLRenderer;
    public static splatScene: SPLAT.Scene;
    public static splatCamera: SPLAT.Camera;
    public static splat: SPLAT.Splat;
    public static originalRotation: SPLAT.Quaternion;
    public static declare renderCanvas: HTMLCanvasElement;
    private static splat_frame_id: number | null = null

    public static async init() {
        this.renderCanvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

        this.splatRenderer = new SPLAT.WebGLRenderer(this.renderCanvas);

        this.splatScene = new SPLAT.Scene();
        this.splatCamera = new SPLAT.Camera();
        // this.splatCamera.rotation = SPLAT.Quaternion.FromAxisAngle(new SPLAT.Vector3(0, 0, 1), 0);

        this.splatRenderer.backgroundColor = new SPLAT.Color32(0, 0, 0, 0);
        const url = (document.getElementById('splat_url') as HTMLInputElement).value;

        const progressIndicator = document.getElementById('progress-indicator') as HTMLProgressElement;

        this.splat = await SPLAT.Loader.LoadAsync(url, this.splatScene, (progress) => progressIndicator.value = progress * 100);

        this.originalRotation = this.splat.rotation;

        const progressDialog = document.getElementById('progress-dialog') as HTMLDialogElement;
        progressDialog.close();

        const handleResize = () => {
            this.splatRenderer.setSize(window.innerWidth, window.innerHeight);
        };

        const frame = () => {

            if (this.splat_frame_id != null) {
                cancelAnimationFrame(this.splat_frame_id);
            }

            this.renderFrame();

            setTimeout(() => {
                this.splat_frame_id = requestAnimationFrame(frame);
            }, 100);

        };

        handleResize();
        window.addEventListener('resize', handleResize);

        requestAnimationFrame(frame);
    }

    public static renderFrame() {
        this.splatRenderer.render(this.splatScene, this.splatCamera);
    }
}

class FullscreenEngine {

    static fs = false;

    public static init() {

        const fullscreenButton = document.getElementById('fullscreenBtn') as HTMLButtonElement;

        if (fullscreenButton != null) {
            // Add a button click listener
            fullscreenButton.addEventListener('click', async (ev: Event) => {
                preventDefault(ev);

                if (!this.fs) {
                    this.openFullscreen();
                } else {
                    this.closeFullscreen()
                }
            });
        }

        const facingModeButton = document.getElementById('facingModeButton') as HTMLButtonElement;

        if (facingModeButton != null) {
            // Add a button click listener
            facingModeButton.addEventListener('click', async (ev: Event) => {
                preventDefault(ev);

                const tracks = (videoEngine!.video.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());

                videoEngine!.facingMode = videoEngine!.facingMode === 'user' ? 'environment' : 'user';

                const constraints = {
                    audio: false,
                    video: videoEngine!.supports!['facingMode'] ? {
                        facingMode: {exact: videoEngine!.facingMode},
                    } : {}
                };

                const stream = await navigator.mediaDevices.getUserMedia(constraints);

                videoEngine!.video!.srcObject = null;
                videoEngine!.video!.srcObject = stream;
                videoEngine!.video!.play().then();
            });
        }
    }


    // @ts-ignore
    private static openFullscreen() {

        const documentElement = document.getElementById('viewElement')!;
        this.fs = true;
        if (documentElement.requestFullscreen) {
            documentElement.requestFullscreen().then();
        } else { // @ts-ignore
            if (documentElement.webkitRequestFullscreen) { /* Safari */
                // @ts-ignore
                documentElement.webkitRequestFullscreen();
            } else { // @ts-ignore
                if (documentElement.msRequestFullscreen) { /* IE11 */
                    // @ts-ignore
                    documentElement.msRequestFullscreen();
                }
            }
        }
    }

    /* Close fullscreen */

    // @ts-ignore
    private static closeFullscreen() {
        this.fs = false;

        if (document.exitFullscreen) {
            document.exitFullscreen().then();
        } else { // @ts-ignore
            if (document.webkitExitFullscreen) { /* Safari */
                // @ts-ignore
                document.webkitExitFullscreen();
            } else { // @ts-ignore
                if (document.msExitFullscreen) { /* IE11 */
                    // @ts-ignore
                    document.msExitFullscreen();
                }
            }
        }
    }
}

//////////////

enum ButtonClickState {
    left,
    middle,
    right,
    none
}

let buttonState: ButtonClickState = ButtonClickState.none;

let startPointerX = 0, startPointerY = 0;
let lastPointerX = 0, lastPointerY = 0;

function onPointerMove(ev: PointerEvent) {

    const diffX = ev.clientX - lastPointerX;
    const diffY = ev.clientY - lastPointerY;

    switch (buttonState) {
        case ButtonClickState.left:


            SplatEngine.splat.position = SplatEngine.splat.position.add(new SPLAT.Vector3(diffX * 0.01, diffY * 0.01, 0));

            console.log('position', SplatEngine.splat.position);
            break;
        case ButtonClickState.right:
            SplatEngine.splat.rotation =
                new SPLAT.Quaternion(
                    -(startPointerY - ev.clientY) * 0.005, (startPointerX - ev.clientX) * 0.005, 0, 1).multiply(SplatEngine.originalRotation).normalize();

            break;

        case ButtonClickState.middle:
            SplatEngine.splat.scale = SplatEngine.splat.scale.add(
                new SPLAT.Vector3(-diffY * 0.01, -diffY * 0.01, -diffY * 0.01));

            break;
    }

    lastPointerX = ev.clientX;
    lastPointerY = ev.clientY;

    SplatEngine.renderFrame();
}


function onPointerDown(ev: PointerEvent) {
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
    SplatEngine.originalRotation = SplatEngine.splat.rotation;

    buttonState = ButtonClickState.none;
}


//////////////
// Global vars to cache event state
let evCache: PointerEvent[] = [];

let prevDiff = -1;

function pointerdown_handler(ev: PointerEvent) {

    console.log('pointerdown_handler', ev);

    evCache.push(ev);

    if (evCache.length == 1) {
        startPointerX = lastPointerX = ev.clientX;
        startPointerY = lastPointerY = ev.clientY;
        onPointerDown(ev);
    } else if (evCache.length == 3) {
        startPointerX = lastPointerX = (evCache[2].clientX + evCache[1].clientX + evCache[0].clientX) / 2;
        startPointerY = lastPointerY = (evCache[2].clientY + evCache[1].clientY + evCache[0].clientY) / 2;
    }

    preventDefault(ev);
}

function pointermove_handler(ev: PointerEvent) {
    for (let i = 0; i < evCache.length; i++) {
        if (ev.pointerId == evCache[i].pointerId) {
            evCache[i] = ev;
            break;
        }
    }

    if (evCache.length == 1) {
        onPointerMove(evCache[0]);
    }
    // If 3 pointers are down, check for pinch gestures
    else if (evCache.length == 3) {

        const centerX = (evCache[2].clientX + evCache[1].clientX + evCache[0].clientX) / 2;
        const centerY = (evCache[2].clientY + evCache[1].clientY + evCache[0].clientY) / 2;

        SplatEngine.splat.rotation = SplatEngine.originalRotation.multiply(
            new SPLAT.Quaternion(
                (startPointerY - centerY) * 0.005, (startPointerX - centerX) * 0.005, 0, 1)).normalize()

        SplatEngine.renderFrame();
    } else if (evCache.length == 2) {
        // Calculate the distance between the two pointers
        const curDiff = Math.sqrt(
            Math.pow(evCache[1].clientX - evCache[0].clientX, 2) +
            Math.pow(evCache[1].clientY - evCache[0].clientY, 2)
        );

        if (prevDiff > 0) {
            const scale = (curDiff - prevDiff) * 0.005;

            SplatEngine.splat.scale = SplatEngine.splat.scale.add(
                new SPLAT.Vector3(scale, scale, scale));
        }

        SplatEngine.renderFrame();

        // Cache the distance for the next move event
        prevDiff = curDiff;
    }

    preventDefault(ev);
}

function pointerup_handler(ev: PointerEvent) {

    // Remove this pointer from the cache and reset the target's
    // background and border
    remove_event(ev);

    // If the number of pointers down is less than two then reset diff tracker
    if (evCache.length < 3) prevDiff = -1;

    if (evCache.length == 0) {
        onPointerUp();
    }

    preventDefault(ev);
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

const preventDefault = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
};

function initGestures() {
    // Install event handlers for the pointer target
    SplatEngine.renderCanvas.onpointerdown = pointerdown_handler;
    SplatEngine.renderCanvas.onpointermove = pointermove_handler;

    SplatEngine.renderCanvas.onpointerup = pointerup_handler;
    SplatEngine.renderCanvas.onpointercancel = pointerup_handler;
    SplatEngine.renderCanvas.onpointerout = pointerup_handler;
    SplatEngine.renderCanvas.onpointerleave = pointerup_handler;

    SplatEngine.renderCanvas.oncontextmenu = preventDefault;
    SplatEngine.renderCanvas.ondragover = preventDefault;
    SplatEngine.renderCanvas.ondragenter = preventDefault;
    SplatEngine.renderCanvas.ondragleave = preventDefault;
}

///////////////

async function main() {
    await SplatEngine.init();

    videoEngine = new VideoEngine(SplatEngine.renderCanvas);

    FullscreenEngine.init();

    initGestures();
}

main().then();
