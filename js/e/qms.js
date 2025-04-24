import { fetch4 } from "../utils.js";


export class QMS {
    constructor(cs) {
        this.cs = cs;
    }

    get count() {
        return 0;
    }

    async update() {
        return fetch4('https://4pda.to/forum/index.php?act=inspector&CODE=qms')
            .then(data => {
                console.debug('QMS:', data);
                // let lines = data.split(/\r\n|\n/);
                // this.cs.qms = lines.map(line => line.trim());
            });
    }
}
