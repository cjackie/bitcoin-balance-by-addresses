**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */

const https = require('https')
const ADDRESSES = [
  "TODO ENTER ADDRESSES HERE"
];
const KEY = "TODO YOUR KEY";


const SATOSHI_PER_BTC = 100000000;

const BLOCKSTREAM_INFO = "BLOCKSTREAM_INFO"
const BLOCKCAHIN_INFO = "BLOCKCAHIN_INFO"

const ENDPOINT = BLOCKSTREAM_INFO

function outputHtml(balance, usd, usd_per_btc) {
    return `<table style="font-size: 36px">
                <thead>
                    <tr>
                        <th></th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Balance:</td>
                        <td>${balance / SATOSHI_PER_BTC} BTC</td>
                    </tr>
                    <tr>
                        <td>USD Value:</td>
                        <td>${usd.toLocaleString("en-US")} USD</td>
                    </tr>
                    <tr>
                        <td>Exchange Rate:</td>
                        <td>${usd_per_btc.toLocaleString("en-US")} USD/BTC</td>
                    </tr>
                </tbody>
            </table>`
}

exports.helloWorld = (req, res) => {
    if (req.query.key === undefined || req.query.key !== KEY) {
        res.status(200).send("Why are you calling me?");
        return;
    }

    if (ENDPOINT == BLOCKSTREAM_INFO) {
        const addresses = ADDRESSES.map((addr) => https_get(`https://blockstream.info/api/address/${addr}`));
        // Using blockchain.info API for exchange rate, since blockstream does not have the market data.
        // The rate is the number of BTC for 1k USD.
        const exchange_rate = https_get("https://blockchain.info/tobtc?currency=USD&value=1000");
        const all_urls = addresses.concat([exchange_rate]);
        Promise.all(all_urls).then(result => {
            let balance = 0;
            for (let i = 0; i < result.length-1; i++) {
                // In Satoshi
                balance += result[i]["chain_stats"]["funded_txo_sum"] - result[i]["chain_stats"]["spent_txo_sum"];
            }
            const usd_per_btc = Math.round(1000 / parseFloat(result[result.length-1]));
            const usd = Math.round(balance / SATOSHI_PER_BTC * usd_per_btc);
            res.send(outputHtml(balance, usd, usd_per_btc));
        }, error => {
            console.log(error.toString());
            res.send("Oops");
        });

    } else {
        const active = ADDRESSES.join("|")
        const wallet_url = `https://blockchain.info/multiaddr?active=${active}&n=0`

        // Number of BTC for 10k USD
        const exchange_rate_url = "https://blockchain.info/tobtc?currency=USD&value=1000"

        Promise.all([https_get(wallet_url), https_get(exchange_rate_url)]).then(([wallet, exchange_rate]) => {
                const usd_per_btc = Math.round(1000 / exchange_rate);
                const balance = wallet["wallet"]["final_balance"];
                const usd = Math.round(balance / SATOSHI_PER_BTC * usd_per_btc);
                res.send(outputHtml(balance, usd, usd_per_btc));
            }, error => {
                res.send("Oops.");
            });
    }
};

function https_get(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error('statusCode=' + res.statusCode));
            }
            var body = [];
            res.on('data', function (chunk) {
                body.push(chunk);
            });
            res.on('end', function () {
                try {
                    body = JSON.parse(Buffer.concat(body).toString());
                } catch (e) {
                    reject(e);
                }
                resolve(body);
            });
        });
        req.on('error', (e) => {
            reject(e.message);
        });
        // send the request
        req.end();
    });
}


 /////////////////// blockstream.info API /////////////////

 //////////////////////////


 /////////////////////// blockchain.info API ///////////////////////
 // req: https://blockchain.info/multiaddr?active=3EYYejLzWErr5cnoZir5NRqoABFpRAma9V|36SNaac8ksmeUubBh4eaN1Wsne7ETr9cX8&n=0
 // response:
 // {
 //   "addresses": [
 //     {
 //       "address": "36SNaac8ksmeUubBh4eaN1Wsne7ETr9cX8",
 //       "final_balance": 17239378,
 //       "n_tx": 1,
 //       "total_received": 17239378,
 //       "total_sent": 0
 //     },
 //     {
 //       "address": "3EYYejLzWErr5cnoZir5NRqoABFpRAma9V",
 //       "final_balance": 4277169,
 //       "n_tx": 1,
 //       "total_received": 4277169,
 //       "total_sent": 0
 //     }
 //   ],
 //   "wallet": {
 //     "final_balance": 21516547,
 //     "n_tx": 0,
 //     "n_tx_filtered": 0,
 //     "total_received": 21516547,
 //     "total_sent": 0
 //   },
 //   "txs": [],
 //   "info": {
 //     "nconnected": 3,
 //     "conversion": 100000000,
 //     "symbol_local": {
 //       "code": "USD",
 //       "symbol": "$",
 //       "name": "U.S. dollar",
 //       "conversion": 2634.093119933157,
 //       "symbolAppearsAfter": false,
 //       "local": true
 //     },
 //     "symbol_btc": {
 //       "code": "BTC",
 //       "symbol": "BTC",
 //       "name": "Bitcoin",
 //       "conversion": 100000000,
 //       "symbolAppearsAfter": true,
 //       "local": false
 //     },
 //     "latest_block": {
 //       "hash": "0000000000000000000c440c7b49816ae9ff7fcf3f67d152aa44de104da60c3a",
 //       "height": 688025,
 //       "time": 1623992253,
 //       "block_index": 688025
 //     }
 //   },
 //   "recommend_include_fee": true
 // }
