import { log } from './log.ts';

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
			video: {
				facingMode: 'environment',  // This specifies the rear camera
			},
		};

		navigator.mediaDevices
			.getUserMedia(constraints)
			.then((value) => this.handleSuccess(value))
			.catch((reason) => this.handleError(reason));

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
				tracks.forEach((track) => track.stop());

				this.facingMode =
					this.facingMode === 'user' || this.facingMode == null ? 'environment' : 'user';

				const constraints = {
					audio: false,
					video: this.supports!['facingMode']
						? {
							facingMode: { exact: this.facingMode },
						}
						: {},
				};

				const stream = await navigator.mediaDevices.getUserMedia(constraints).catch(() =>
					navigator.mediaDevices.getUserMedia({
						audio: false,
						video: true,
					}),
				);

				this.video!.srcObject = null;
				this.video!.srcObject = stream;
				this.video!.play().then(() => {
					this.onVideoResize();
				});
			});
		}
	}

	private handleSuccess(stream: MediaStream) {
		this.video.srcObject = stream;

		this.video!.play().then(() => {
			this.onVideoResize();
		});
	}

	private handleError(error: unknown) {
		log(
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			`navigator.MediaDevices.getUserMedia error: ${error.message}, ${error.name}$, {error.stack}`,
		);
	}
}
