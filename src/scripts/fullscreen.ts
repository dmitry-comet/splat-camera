export class FullscreenEngine {
	public static init() {
		/* Get the documentElement (<html>) to display the page in fullscreen */
		const documentElement = document.documentElement;

		const fullscreenButton = document.getElementById('fullscreenBtn') as HTMLButtonElement;
		const fullscreenOffButton = document.getElementById('fullscreenOffBtn') as HTMLButtonElement;

		fullscreenButton.addEventListener('click', async () => {
			fullscreenButton.style.display = 'none';
			fullscreenOffButton.style.display = 'inline';
			openFullscreen();
		});

		fullscreenOffButton.addEventListener('click', async () => {
			fullscreenButton.style.display = 'inline';
			fullscreenOffButton.style.display = 'none';
			closeFullscreen();
		});

		/* View in fullscreen */
		function openFullscreen() {
			if (documentElement.requestFullscreen) {
				documentElement.requestFullscreen({ navigationUI: 'hide' }).then();
			} else {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				if (documentElement.webkitRequestFullscreen) {
					/* Safari */
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					documentElement.webkitRequestFullscreen();
				} else {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					if (documentElement.msRequestFullscreen) {
						/* IE11 */
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						documentElement.msRequestFullscreen();
					}
				}
			}
		}

		/* Close fullscreen */
		function closeFullscreen() {
			if (document.exitFullscreen) {
				document.exitFullscreen().then();
			} else {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				if (document.webkitExitFullscreen) {
					/* Safari */
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					document.webkitExitFullscreen();
				} else {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					if (document.msExitFullscreen) {
						/* IE11 */
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						document.msExitFullscreen();
					}
				}
			}
		}
	}
}
