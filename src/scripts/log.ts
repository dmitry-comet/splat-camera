export function log(text: string) {

    (document.getElementById('log') as HTMLSpanElement).innerText = text;

}