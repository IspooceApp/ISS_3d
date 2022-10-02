import axios from "axios";
import * as Cheerio from "cheerio";

main();

async function getConnections() {
    let connectionConfig = {
        method: 'get',
        url: 'https://www.n2yo.com/satellite/?s=25544',
        headers: {}
    };

    const resConnection = await axios(connectionConfig);
    const resConnectionData = await (resConnection).data;
    const $ = Cheerio.load(resConnectionData);
    const resCon = (parseHTML($('#satinfo div'))).text()



    console.log(resCon.length)

    console.log(resCon)
}

async function main() {
    await getConnections();
}