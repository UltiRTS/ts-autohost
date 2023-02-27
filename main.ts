// sample input
// {
//   id: 0,
//   title: 'test',
//   mgr: '::ffff:127.0.0.1',
//   team: {
//     test: {
//       index: 0,
//       isAI: false,
//       isChicken: false,
//       isSpectator: false,
//       team: 0
//     },
//     AI01: {
//       index: 1,
//       isAI: true,
//       isChicken: false,
//       isSpectator: false,
//       team: 1
//     }
//   },
//   mapId: 1,
//   aiHosters: [],
//   map: 'Red Comet Remake 1.7'
// }

import { dntp, mapDir, plasmidServer } from "./config";
import { PlasmidCommunicator } from "./lib/network";
import {Worker} from 'worker_threads'
import {downloadMap} from './lib/network';
import { DntpCommunicator } from "./lib/dntp";

const dntpComm = new DntpCommunicator(dntp, 'engine/maps');
const plmComm = new PlasmidCommunicator({
    host: plasmidServer.host,
    port: plasmidServer.port
});

const workerPool: {
    [key: number]: Worker
} = {}

const infoPool: {
    [key: number]: any
} = {};

// example request
// {
//   action: 'startGame',
//   parameters: {
//     id: 0,
//     title: 'test',
//     mgr: '::ffff:127.0.0.1',
//     team: { test: [Object], AI01: [Object] },
//     mapId: 1,
//     aiHosters: []
//   }
// }
plmComm.on('plasmidRequest', async (msg: {
    action: string
    parameters: {
        [key: string]: any
    }
}) => {
    switch(msg.action) {
        case 'startGame': {
            const parameters = msg.parameters;
            if(workerPool[parameters.id]) {
                plmComm.send2plasmid({
                    action: 'workerExists',
                    parameters: {
                        title: parameters.title,
                    }
                })
                return;
            }
            infoPool[parameters.id] = msg;

            const mapId = parameters.mapId;
            const mapInfo = await dntpComm.getMapUrlById(mapId);
            if(mapInfo.map === '') {
                plmComm.send2plasmid({
                    action: 'mapNotFound',
                    parameters: {
                        title: parameters.title,
                    }
                })
                return; 
            }
            const downloadStatus = await downloadMap(mapInfo, mapDir)
            if(downloadStatus === false) {
                console.log('map download failed');
                return;
            }
            parameters.map = mapInfo.map.map_name;

            newGame(msg);
            break;
        }
        case 'midJoin': {
            const workerId = msg.parameters.id;
            if(workerPool[workerId]) workerPool[workerId].postMessage(msg);
            else {
                plmComm.send2plasmid({
                    action: 'joinRejected', 
                    parameters: {
                        title: msg.parameters.title,
                        player: msg.parameters.playerName
                    }
                }) 
            }
            break;
        }

        case 'killEngine': {
            const workerId = msg.parameters.id;
            if(workerPool[workerId]) {
                workerPool[workerId].postMessage(msg);
            } else {
                plmComm.send2plasmid({
                    action: 'killEngineRejected', 
                    parameters: {
                        title: msg.parameters.title,
                    }
                }) 
            }
            break;
        }
    }
})

const newGame = (msg: {[key: string]: any}) => {
    console.log(msg)
    const parameters = msg.parameters;
    const id = parameters.id;
    const workerPath = process.env.NODE_ENV === "development" ? './hoster.ts' : './hoster.js'

    const worker = process.env.NODE_ENV === "development" ? new Worker("./hoster.ts", {
        execArgv: ['-r', 'ts-node/register/transpile-only']
    }): new Worker('./hoster.js');
    workerPool[id] = worker;

    worker.on('online', () => {
        worker.postMessage(msg)
    })

    worker.on('message', async (msg: {
        action: string,
        parameters: { [key: string]: any }
    }) => {
        console.log('worker message', msg);
        switch(msg.action) {
            case 'serverEnding': {
                // worker.emit('exit');
                await worker.terminate();
                break;
            }
        }

        plmComm.send2plasmid(msg)
    })

    worker.on('exit', () => {
        delete workerPool[id];
        delete infoPool[id];
    })
} 