import { EngineListener } from "./lib/listener";
import { EngineBridger, Player } from "./lib/engine";
import {parentPort} from 'worker_threads'

function getAllyTeamCount(parameters: {[key: string]: any}) {
    const teams= new Set();
    // eslint-disable-next-line guard-for-in
    for (const player in parameters.team) {
    teams.add(parameters.team[player].team);
    }
    return teams.size;
}

parentPort?.on('message', (parameters: {
    id: number,
    title: string,
    mgr: string,
    team: { [key: string]: Player },
    mapId: number,
    aiHosters: number[],
    map: string
}) => {
    const battlePort = 6000 + parameters.id;
    const listenerPort = 2000 + parameters.id;

    const listener = new EngineListener(listenerPort);
    const engine = new EngineBridger(process.cwd(), [])

    listener.on('autohostMsg', (msg: {
        action: string,
        parameters: { [key: string]: any }
    }) => {
        if(msg.action === 'autohostStarted') {
            parameters.aiHosters = [0];
            console.log(parameters.map);
            engine.scriptGen(listenerPort, battlePort, parameters.team, getAllyTeamCount(parameters), parameters.map, parameters.aiHosters);
            engine.launchGame()
        }
    })

    listener.on('engineMsg', (msg: {
        action: string,
        parameters: { [key: string]: any }
    }) => {
        console.log(msg);
        // preprocessing
        switch(msg.action) {
            case 'serverStarted': {
                msg.parameters.port = battlePort;
                break;
            }
        }

        parentPort?.postMessage(msg);
    })
})


