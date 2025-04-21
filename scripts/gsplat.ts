import * as SPLAT from "gsplat";

class SplatEngine {
    private static splatRenderer: SPLAT.WebGLRenderer;
    static splatScene: SPLAT.Scene;
    private static splatCamera: SPLAT.Camera;

    public static async init() {
        const canvas = document.getElementById("canvas") as HTMLCanvasElement;
        this.splatRenderer = new SPLAT.WebGLRenderer(canvas);
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
}

main().then();
