import { fetch4 } from "../utils.js";


export class Mentions {
    constructor(cs) {
        this.cs = cs;
    }

    get count() {
        return 0;
    }

    async update() {
        return fetch4('https://4pda.to/forum/index.php?act=inspector&CODE=mentions-list')
            .then(data => {
                console.debug('Mentions:', data);
            });
    }
}
