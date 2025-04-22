export class FullscreenEngine {

    public static init() {

        /* Get the documentElement (<html>) to display the page in fullscreen */
        const documentElement = document.documentElement;

        const fullscreenButton = document.getElementById('fullscreenBtn');

        let fs = false;

        if (fullscreenButton != null) {
            // Add a button click listener
            fullscreenButton.addEventListener('click', async () => {
                if (!fs)
                    openFullscreen();
                else
                    closeFullscreen()
            });
        }

        /* View in fullscreen */
        function openFullscreen() {

            fs = true;
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
            fs = false;
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

// const preventDefault = (e: Event) => {
//     e.preventDefault();
//     e.stopPropagation();
// };