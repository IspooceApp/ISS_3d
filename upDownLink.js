import axios from "axios";
import * as Cheerio from "cheerio";

main();

async function getConnections() {
    let connectionConfig = {
        method: 'get',
        url: 'https://www.ariss.org/current-status-of-iss-stations.html',
        headers: {}
    };

    const resConnection = await axios(connectionConfig);
    const resConnectionData = await (resConnection).data;

    const $ = Cheerio.load(resConnectionData);
    const resCon = (parseHTML($('#content .paragraph ul'))).text()


    console.log(resConnectionData)
}

async function main() {
    await getConnections();
}