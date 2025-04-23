import {AbstractMesh, Quaternion, Vector3} from "@babylonjs/core";

enum ButtonClickState {
    left,
    middle,
    right,
    none
}

export class InputEngine {

    buttonState: ButtonClickState = ButtonClickState.none;

    startPointerX = 0;
    startPointerY = 0;
    lastPointerX = 0;
    lastPointerY = 0;

    mesh: AbstractMesh;

    originalRotation: Quaternion;

    constructor(mesh: AbstractMesh) {
        this.mesh = mesh;
        this.originalRotation = mesh.rotationQuaternion ?? Quaternion.FromEulerVector(new Vector3(0, 0, 0));
    }

    onPointerMove(ev: PointerEvent) {

        const diffX = ev.clientX - this.lastPointerX;
        const diffY = ev.clientY - this.lastPointerY;

        switch (this.buttonState) {
            case ButtonClickState.left:

                this.mesh.position = this.mesh.position.add(new Vector3(diffX * 0.01, -diffY * 0.01, 0));

                break;
            case ButtonClickState.right:

                console.log(`this.mesh.rotationQuaternion: ${this.mesh.rotationQuaternion}`);

                this.mesh.rotationQuaternion = new Quaternion(
                        (this.startPointerY - ev.clientY) * 0.005, (this.startPointerX - ev.clientX) * 0.005, 0, 1).multiply(this.originalRotation).normalize()
                break;

            case ButtonClickState.middle:
                this.mesh.scaling = this.mesh.scaling.add(
                    new Vector3(-diffY * 0.01, -diffY * 0.01, -diffY * 0.01));

                break;
        }

        this.lastPointerX = ev.clientX;
        this.lastPointerY = ev.clientY;
    }


    onPointerDown(ev: PointerEvent) {
        switch (ev.button) {
            case 0:
                this.buttonState = ButtonClickState.left;
                break;
            case 1:
                this.buttonState = ButtonClickState.middle;
                break;
            case 2:
                this.buttonState = ButtonClickState.right;
                break;
        }
    }

    onPointerUp() {
        this.originalRotation = this.mesh.rotationQuaternion ?? Quaternion.Zero();
        this.buttonState = ButtonClickState.none;
    }


//////////////
// Global vars to cache event state
    evCache: PointerEvent[] = [];

    prevDiff = -1;

    pointerdown_handler(ev: PointerEvent) {

        console.log('pointerdown_handler', ev);

        this.evCache.push(ev);

        if (this.evCache.length == 1) {
            this.startPointerX = this.lastPointerX = ev.clientX;
            this.startPointerY = this.lastPointerY = ev.clientY;
            this.onPointerDown(ev);
        } else if (this.evCache.length == 3) {
            this.startPointerX = this.lastPointerX = (this.evCache[2].clientX + this.evCache[1].clientX + this.evCache[0].clientX) / 2;
            this.startPointerY = this.lastPointerY = (this.evCache[2].clientY + this.evCache[1].clientY + this.evCache[0].clientY) / 2;
        }

        this.preventDefault(ev);
    }

    pointermove_handler(ev: PointerEvent) {
        for (let i = 0; i < this.evCache.length; i++) {
            if (ev.pointerId == this.evCache[i].pointerId) {
                this.evCache[i] = ev;
                break;
            }
        }

        if (this.evCache.length == 1) {
            this.onPointerMove(this.evCache[0]);
        }
        // If 3 pointers are down, check for pinch gestures
        else if (this.evCache.length == 3) {

            const centerX = (this.evCache[2].clientX + this.evCache[1].clientX + this.evCache[0].clientX) / 2;
            const centerY = (this.evCache[2].clientY + this.evCache[1].clientY + this.evCache[0].clientY) / 2;

            this.mesh.rotationQuaternion = this.originalRotation.multiply(
                new Quaternion(
                    (this.startPointerY - centerY) * 0.005, (this.startPointerX - centerX) * 0.005, 0, 1)).normalize()
        } else if (this.evCache.length == 2) {
            // Calculate the distance between the two pointers
            const curDiff = Math.sqrt(
                Math.pow(this.evCache[1].clientX - this.evCache[0].clientX, 2) +
                Math.pow(this.evCache[1].clientY - this.evCache[0].clientY, 2)
            );

            if (this.prevDiff > 0) {
                const scale = (curDiff - this.prevDiff) * 0.005;

                this.mesh.scaling = this.mesh.scaling.add(
                    new Vector3(scale, scale, scale));
            }

            // Cache the distance for the next move event
            this.prevDiff = curDiff;
        }

        this.preventDefault(ev);
    }

    pointerup_handler(ev: PointerEvent) {

        this.remove_event(ev);

        // If the number of pointers down is less than two then reset diff tracker
        if (this.evCache.length < 3) this.prevDiff = -1;

        if (this.evCache.length == 0) {
            this.onPointerUp();
        }

        this.preventDefault(ev);
    }

    remove_event(ev: PointerEvent) {
        // Remove this event from the target's cache
        for (let i = 0; i < this.evCache.length; i++) {
            if (this.evCache[i].pointerId == ev.pointerId) {
                this.evCache.splice(i, 1);
                break;
            }
        }
    }

    preventDefault = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
    };

    canvas:HTMLCanvasElement | null = null;

    public attachToCanvas(canvas:HTMLCanvasElement) {
        this.canvas = canvas;
        // Install event handlers for the pointer target
        canvas.onpointerdown = ev => this.pointerdown_handler(ev);
        canvas.onpointermove = ev => this.pointermove_handler(ev);

        canvas.onpointerup = ev => this.pointerup_handler(ev);
        canvas.onpointercancel = ev => this.pointerup_handler(ev);
        canvas.onpointerout = ev => this.pointerup_handler(ev);
        canvas.onpointerleave = ev => this.pointerup_handler(ev);

        canvas.oncontextmenu = ev => this.preventDefault(ev);
        canvas.ondragover = ev => this.preventDefault(ev);
        canvas.ondragenter = ev => this.preventDefault(ev);
        canvas.ondragleave = ev => this.preventDefault(ev);
    }

    public dispose() {

        if (this.canvas != null) {
            this.canvas.onpointerdown = null;
            this.canvas.onpointermove = null;

            this.canvas.onpointerup = null;
            this.canvas.onpointercancel = null;
            this.canvas.onpointerout = null;
            this.canvas.onpointerleave = null;
        }
    }
    
    
}
