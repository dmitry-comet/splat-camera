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
            closeFullscreen()
        });


        /* View in fullscreen */
        function openFullscreen() {

            if (documentElement.requestFullscreen) {
                documentElement.requestFullscreen({navigationUI: 'hide'}).then();
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
        function closeFullscreen() {
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
}

