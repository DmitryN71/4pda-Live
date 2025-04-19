const PARSE_STRING_REGEXP = /([^\s"']+|"([^"]*)"|'([^']*)')/g

const decoder = new TextDecoder('windows-1251');


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

/**
 * @param {string} string 
 * @returns {string} 
 */
export function decode_special_chars(string) {
    // let txt = document.createElement("textarea");
    // txt.innerHTML = string;
    // return txt.value
    return string.replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
}


let myHeaders = new Headers();
myHeaders.append('Content-Type','text/plain; charset=windows-1251');

export function fetch4(url) {
    return fetch(url, myHeaders)
        .then(response => {
            if (response.ok) {
                return response.arrayBuffer()
                    .then(buffer => decoder.decode(buffer));
            } else {
                throw 'Bad request: ' + response.status;
            }
        })
}
