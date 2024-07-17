import http from 'node:http';
import fs from 'node:fs';

const port = 10000;

let listenHost = "0.0.0.0";
let jsReportHostname = "localhost";
let httpServerHostname = 'localhost'

if(process.env.JSREPORT_HOSTNAME)
    jsReportHostname = process.env.JSREPORT_HOSTNAME;
if(process.env.HTTP_SERVER_HOSTNAME)
    httpServerHostname = process.env.HTTP_SERVER_HOSTNAME;

console.log('js report hostname is ', jsReportHostname);
console.log('http server hostname is ', httpServerHostname);

const styles = fs.readFileSync('styles.css', 'utf8');
const toRender = fs.readFileSync('toRender.html', 'utf8');


const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.writeHead(200);
    res.end(styles);
});
server.listen(port, listenHost, () => {
    console.log(`Server is running on http://${listenHost}:${port}`);
});

const toPost = JSON.stringify({
    "template": { 
        "content": toRender,
        "recipe": "chrome-pdf",
        "engine": "none"
    },
    "options": {
      "base": `http://${httpServerHostname}:${port}`
    }
});

var options = {
    hostname: jsReportHostname,
    port: 5488,
    path: '/api/report',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(toPost),
    }
};

var req = http.request(options, (res) => {
    console.log('response statusCode:', res.statusCode);

    res.on('data', (d) => {
        fs.writeFileSync('./result.pdf', d);
        server.close();
    });
});

req.on('error', (e) => {
    console.error('error with request');
    console.error(e);
    server.close();
});

console.log('sending request: ', options);
req.write(toPost);
req.end();