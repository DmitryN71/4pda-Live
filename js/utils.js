const PARSE_STRING_REGEXP = /([^\s"']+|"([^"]*)"|'([^']*)')/g


export function parse_response(str) {
    let parsed = str.match(PARSE_STRING_REGEXP);
    for (let i = 0; i < parsed.length; i++) {
        let pq = parsed[i].match(/"(.*)"/);
        if (pq) {
            parsed[i] = pq[1];
        }
    }
    return parsed;
}
