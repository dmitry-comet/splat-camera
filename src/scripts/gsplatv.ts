import * as SPLAT from "gsplat";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const progressDialog = document.getElementById("progress-dialog") as HTMLDialogElement;
const progressIndicator = document.getElementById("progress-indicator") as HTMLProgressElement;

const renderer = new SPLAT.WebGLRenderer(canvas);
renderer.addProgram(new SPLAT.VideoRenderProgram(renderer));

const scene = new SPLAT.Scene();
renderer.backgroundColor = new SPLAT.Color32(0, 0, 0, 0);
const camera = new SPLAT.Camera();
const controls = new SPLAT.OrbitControls(camera, canvas);

let loading = false;

async function selectFile(file: File) {
    if (loading) return;
    loading = true;
    // Check if .splatv file
    if (file.name.endsWith(".splatv")) {
        scene.reset();
        progressDialog.showModal();
        await SPLAT.SplatvLoader.LoadFromFileAsync(file, scene, camera, (progress: number) => {
            progressIndicator.value = progress * 100;
        });
        progressDialog.close();
    }
    loading = false;
}

async function main() {
    const url = (document.getElementById('splat_url') as HTMLInputElement).value;

    await SPLAT.SplatvLoader.LoadAsync(url, scene, camera, (progress) => (progressIndicator.value = progress * 100));
    controls.setCameraTarget(camera.position.add(camera.forward.multiply(5)));
    progressDialog.close();

    const handleResize = () => {
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };

    const frame = () => {
        controls.update();
        renderer.render(scene, camera);

        requestAnimationFrame(frame);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    requestAnimationFrame(frame);

    // Listen for file drops
    document.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer != null) {
            scene.reset();
            selectFile(e.dataTransfer.files[0]);
        }
    });
}

main();