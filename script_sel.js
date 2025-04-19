// import * as BABYLON from 'babylonjs';

// script.js
// Wait for DOM + dependencies to load
document.addEventListener('DOMContentLoaded', () => {
    console.log('jQuery is ready!', window.$);  // Test global access
    // Your code here...
});

var canvas = document.getElementById("renderCanvas");

var startRenderLoop = function (engine, canvas) {
    engine.runRenderLoop(function () {
        if (sceneToRender && sceneToRender.activeCamera) {
            sceneToRender.render();
        }
    });
};

var engine = null;
var scene = null;
var sceneToRender = null;
var splat = null;

var loadingScreenDiv = window.document.getElementById("loadingScreen");

function customLoadingScreen() {
    console.log("customLoadingScreen creation");
}
customLoadingScreen.prototype.displayLoadingUI = function () {
    console.log("customLoadingScreen loading");

    if (loadingScreenDiv != null) {
        loadingScreenDiv.innerHTML = "loading...";
    }
};
customLoadingScreen.prototype.hideLoadingUI = function () {
    console.log("customLoadingScreen loaded");

    if (loadingScreenDiv != null) {
        loadingScreenDiv.style.display = "none";
    }
};

var loadingScreen = new customLoadingScreen();

var createDefaultEngine = function () {
    return new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        disableWebGL2Support: false,
    });
};
var createScene = function () {
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    var camera = new BABYLON.ArcRotateCamera(
        "camera",
        0,
        1,
        10,
        BABYLON.Vector3.Zero(),
        scene
    );
    camera.speed = 0.1;

    // Reduce wheel sensitivity
    camera.wheelPrecision = 30; // Default is 3 (lower = more sensitive, higher = less sensitive)
    // Optional: Add inertia for smoother zoom
    camera.inertia = 0; // 0-1 range (1 = no inertia)

    camera.pinchPrecision = 100; // Default is 1000 (higher = less sensitive)

    // Optional: Add limits to zoom
    camera.lowerRadiusLimit = 3;  // Minimum zoom distance
    camera.upperRadiusLimit = 20; // Maximum zoom distance

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    BABYLON.ImportMeshAsync(
        "https://cdn.glitch.me/af6af8b8-f22f-47a4-8b6e-ce50adfcfd0c/BlytheCleaned_mid.splat?v=1745067789706",
        scene,
    ).then((result) => {
        splat = result.meshes[0];

        engine.hideLoadingUI();
    });

    const screenshotButton = document.getElementById("screenshotBtn");

    if (screenshotButton != null) {
        // Add a button click listener
        screenshotButton.addEventListener("click", () => {
            if (splat) {
                // Assuming you have a scene and a mesh you want to capture
                captureSplatExactly(scene, splat, "splat.png");
            }

            // if (engine && camera) {
            //     // Capture screenshot
            //     BABYLON.Tools.CreateScreenshot(engine, camera, { precision: 1 }, (data) => {
            //         // `data` is a base64-encoded image (PNG by default)
            //         downloadScreenshot(data);
            //     });
            // }
        });
    }
    // // Function to download the screenshot
    // function downloadScreenshot(dataUrl) {
    //     const link = document.createElement("a");
    //     link.href = dataUrl;
    //     link.download = "screenshot.png"; // Filename
    //     link.click(); // Trigger download
    // }

    return scene;
};
window.initFunction = async function () {
    var asyncEngineCreation = async function () {
        try {
            return createDefaultEngine();
        } catch (e) {
            console.log(
                "the available createEngine function failed. Creating the default engine instead"
            );
            return createDefaultEngine();
        }
    };

    window.engine = await asyncEngineCreation();
    engine.loadingScreen = loadingScreen;
    engine.displayLoadingUI();


    const engineOptions = window.engine.getCreationOptions?.();
    if (!engineOptions || engineOptions.audioEngine !== false) {
    }
    if (!engine) throw "engine should not be null.";
    startRenderLoop(engine, canvas);
    window.scene = createScene();
    window.scene.clearColor = new BABYLON.Color4(0, 0, 0, 1.0); // RGBA (0-1 range)
};
initFunction().then(() => {
    sceneToRender = scene;
});

// Resize
window.addEventListener("resize", function () {
    engine.resize();
});

// First include the bounds calculation function
function getSplatScreenBounds(scene, splatMesh) {
    const engine = scene.getEngine();
    const camera = scene.activeCamera;
    const viewport = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());

    // Get all 8 corners of the bounding box
    const boundingInfo = splatMesh.getBoundingInfo();
    const min = boundingInfo.boundingBox.minimumWorld;
    const max = boundingInfo.boundingBox.maximumWorld;

    const corners = [
        new BABYLON.Vector3(min.x, min.y, min.z),
        new BABYLON.Vector3(min.x, min.y, max.z),
        new BABYLON.Vector3(min.x, max.y, min.z),
        new BABYLON.Vector3(min.x, max.y, max.z),
        new BABYLON.Vector3(max.x, min.y, min.z),
        new BABYLON.Vector3(max.x, min.y, max.z),
        new BABYLON.Vector3(max.x, max.y, min.z),
        new BABYLON.Vector3(max.x, max.y, max.z)
    ];

    // Project to screen space
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    corners.forEach(corner => {
        const projected = BABYLON.Vector3.Project(
            corner,
            camera.getViewMatrix(),
            camera.getProjectionMatrix(),
            viewport
        );

        minX = Math.min(minX, projected.x);
        minY = Math.min(minY, projected.y);
        maxX = Math.max(maxX, projected.x);
        maxY = Math.max(maxY, projected.y);
    });

    // Add 4px padding
    const padding = 4;
    return {
        x: Math.max(0, minX - padding),
        y: Math.max(0, minY - padding),
        width: Math.min(engine.getRenderWidth(), maxX + padding) - Math.max(0, minX - padding),
        height: Math.min(engine.getRenderHeight(), maxY + padding) - Math.max(0, minY - padding)
    };
}

// Main capture function
async function captureSplatExactly(scene, splatMesh, fileName = "splat-capture.png") {
    const engine = scene.getEngine();
    const camera = scene.activeCamera;

    let renderTarget;

    try {
        console.log('[1/4] Calculating precise splat bounds...');
        const bounds = getSplatScreenBounds(scene, splatMesh);
        const intBounds = {
            x: Math.max(0, Math.floor(bounds.x)),
            y: Math.max(0, Math.floor(bounds.y)),
            width: Math.min(engine.getRenderWidth(), Math.ceil(bounds.width)),
            height: Math.min(engine.getRenderHeight(), Math.ceil(bounds.height))
        };
        console.log('Absolute crop bounds:', intBounds);

        console.log('[2/4] Creating render target...');
        renderTarget = new BABYLON.RenderTargetTexture(
            "splatCapture",
            { width: engine.getRenderWidth(), height: engine.getRenderHeight() },
            scene,
            false,
            true, // Enable depth buffer
            BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT // Ensure correct texture type
        );
        renderTarget.renderList = [splatMesh];
        scene.customRenderTargets.push(renderTarget);

        console.log('[3/4] Creating temporary canvas...');
        const canvas = document.createElement('canvas');
        canvas.width = intBounds.width;
        canvas.height = intBounds.height;
        const ctx = canvas.getContext('2d');

        console.log('[4/4] Rendering and cropping...');

        await /** @type {Promise<void>} */(new Promise((resolve) => {
            renderTarget.onAfterRenderObservable.addOnce(async () => {
                // Verify bounds are reasonable
                console.log('Bounds:', intBounds);
                if (intBounds.width <= 0 || intBounds.height <= 0) {
                    console.error('Invalid bounds dimensions!');
                }

                // Verify camera is correct
                console.log('Active camera:', camera.position);

                var pixels = new Uint8Array(4 * intBounds.width * intBounds.height);

                pixels = await engine.readPixels(
                    intBounds.x,
                    engine.getRenderHeight() - intBounds.y - intBounds.height,
                    intBounds.width,
                    intBounds.height,
                    pixels,
                );

                const imageData = new ImageData(
                    new Uint8ClampedArray(flipPixelsVertical(pixels, intBounds.width, intBounds.height)),
                    intBounds.width,
                    intBounds.height
                );
                ctx.putImageData(imageData, 0, 0);
                resolve();
            });
            scene.render();
        }));

        // Final download
        canvas.toBlob(blob => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            a.click();
            console.log(`Success! Saved cropped splat as ${fileName}`);
        }, 'image/png', 1);

        return canvas.toDataURL();

    } catch (error) {
        console.error('CAPTURE FAILED:', error);
        throw error;
    } finally {
        // Cleanup
        if (renderTarget) {
            renderTarget.dispose();
            const index = scene.customRenderTargets.indexOf(renderTarget);
            if (index > -1) scene.customRenderTargets.splice(index, 1);
        }
    }
}

function flipPixelsVertical(pixelData, width, height) {
    // Create new array for flipped result
    const flipped = new Uint8Array(pixelData.byteLength);
    const rowSize = width * 4; // 4 bytes per pixel (RGBA)

    // Ensure we're working with a Uint8Array view of the pixelData
    const source = new Uint8Array(pixelData);

    for (let y = 0; y < height; y++) {
        const srcOffset = y * rowSize;
        const destOffset = (height - 1 - y) * rowSize;

        // Copy one full row at a time
        flipped.set(
            source.subarray(srcOffset, srcOffset + rowSize),
            destOffset
        );
    }
    return flipped;
}

