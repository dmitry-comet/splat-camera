import { Scene } from "@babylonjs/core";
import { AbstractMesh } from "@babylonjs/core";
import { ArcRotateCamera } from "@babylonjs/core";
import { Vector3 } from "@babylonjs/core";
import { Matrix } from "@babylonjs/core";
import { Quaternion } from "@babylonjs/core";

export class Control {
    /**
     * @param {Scene} scene
     * @param {AbstractMesh} mesh
     * @param {number} moveSpeed
     * @param {number} rotateSpeed
     * @param {number} zoomSpeed
     * @param {number} initialAlpha
     * @param {number} initialBeta
     * @param {number} initialRadius
     * @param {Vector3} initialTarget
     */
    constructor(
        scene: Scene,
        mesh: AbstractMesh,
        moveSpeed: number = 0.03,
        rotateSpeed: number = 0.1,
        zoomSpeed: number = 0.2,
        initialAlpha: number = -Math.PI / 2,
        initialBeta: number = Math.PI / 2,
        initialRadius: number = 20,
        initialTarget: Vector3 = Vector3.Zero(),
    ) {
        const toggleControlsButton = document.getElementById("toggleControlsButton");
        const resetButton = document.getElementById("resetButton");

        const controlButtons = document.getElementById('controlButtons');

        const moveLeftButton = document.getElementById('moveLeftButton');
        const moveRightButton = document.getElementById('moveRightButton');
        const moveTopButton = document.getElementById('moveTopButton');
        const moveBottomButton = document.getElementById('moveBottomButton');
        const rotateTopButton = document.getElementById('rotateTopButton');
        const rotateBottomButton = document.getElementById('rotateBottomButton');
        const rotateLeftButton = document.getElementById('rotateLeftButton');
        const rotateRightButton = document.getElementById('rotateRightButton');
        const rotateFrontButton = document.getElementById('rotateFrontButton');
        const rotateBackButton = document.getElementById('rotateBackButton');
        const zoomInButton = document.getElementById('zoomInButton');
        const zoomOutButton = document.getElementById('zoomOutButton');

        let showControls = false;

        if (toggleControlsButton != null) {
            toggleControlsButton.style.display = "block";

            toggleControlsButton.addEventListener('click', () => {
                showControls = !showControls;

                toggleControlsButton.style.filter = showControls ? "grayscale(100%)" : "none";

                if (controlButtons) { controlButtons.style.display = showControls ? "block" : "none"; }
                if (resetButton) resetButton.style.display = showControls ? "block" : "none";
            });
        }

        mesh.rotation = mesh.rotation;

        // Reset

        if (resetButton != null) {
            resetButton.addEventListener('click', () => {
                if (confirm("Reset layout to default?")) {
                    if (scene && scene.activeCamera instanceof ArcRotateCamera) {
                        scene.activeCamera.alpha = initialAlpha;
                        scene.activeCamera.beta = initialBeta;
                        scene.activeCamera.radius = initialRadius;
                        scene.activeCamera.target = initialTarget;
                    }

                    if (mesh) {
                        mesh.setPivotMatrix(Matrix.Identity());
                        mesh.position = new Vector3(0, 0, -10);
                        mesh.rotationQuaternion = Quaternion.FromEulerVector(Vector3.Zero());
                        mesh.scaling = new Vector3(1, 1, 1);
                        mesh.computeWorldMatrix(true);
                    }
                }
            });
        }

        // Move

        if (moveLeftButton != null) {
            moveLeftButton.addEventListener('click', () => { mesh.position.x -= moveSpeed; });
        }

        if (moveRightButton != null) {
            moveRightButton.addEventListener('click', () => { mesh.position.x += moveSpeed; });
        }

        if (moveTopButton != null) {
            moveTopButton.addEventListener('click', () => { mesh.position.y += moveSpeed; });
        }

        if (moveBottomButton != null) {
            moveBottomButton.addEventListener('click', () => { mesh.position.y -= moveSpeed; });
        }

        // Rotate

        if (rotateTopButton != null) {
            rotateTopButton.addEventListener('click', () => {
                mesh.rotationQuaternion = new Quaternion(rotateSpeed, 0, 0, 1)
                    .multiply(mesh.rotationQuaternion ?? Quaternion.FromEulerVector(Vector3.Zero()))
                    .normalize();
            });
        }

        if (rotateBottomButton != null) {
            rotateBottomButton.addEventListener('click', () => {
                mesh.rotationQuaternion = new Quaternion(-rotateSpeed, 0, 0, 1)
                    .multiply(mesh.rotationQuaternion ?? Quaternion.FromEulerVector(Vector3.Zero()))
                    .normalize();
            });
        }

        if (rotateLeftButton != null) {
            rotateLeftButton.addEventListener('click', () => {
                mesh.rotationQuaternion = new Quaternion(0, rotateSpeed, 0, 1)
                    .multiply(mesh.rotationQuaternion ?? Quaternion.FromEulerVector(Vector3.Zero()))
                    .normalize();
            });
        }

        if (rotateRightButton != null) {
            rotateRightButton.addEventListener('click', () => {
                mesh.rotationQuaternion = new Quaternion(0, -rotateSpeed, 0, 1)
                    .multiply(mesh.rotationQuaternion ?? Quaternion.FromEulerVector(Vector3.Zero()))
                    .normalize();
            });
        }

        if (rotateFrontButton != null) {
            rotateFrontButton.addEventListener('click', () => {
                mesh.rotationQuaternion = new Quaternion(0, 0, rotateSpeed, 1)
                    .multiply(mesh.rotationQuaternion ?? Quaternion.FromEulerVector(Vector3.Zero()))
                    .normalize();
            });
        }

        if (rotateBackButton != null) {
            rotateBackButton.addEventListener('click', () => {
                mesh.rotationQuaternion = new Quaternion(0, 0, -rotateSpeed, 1)
                    .multiply(mesh.rotationQuaternion ?? Quaternion.FromEulerVector(Vector3.Zero()))
                    .normalize();
            });
        }

        // Zoom

        if (zoomInButton != null) {
            zoomInButton.addEventListener('click', () => { mesh.position.z -= zoomSpeed; });
        }

        if (zoomOutButton != null) {
            zoomOutButton.addEventListener('click', () => { mesh.position.z += zoomSpeed; });
        }
    }
}



