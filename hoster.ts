import { EngineListener } from "./lib/listener";
import { EngineBridger, Player } from "./lib/engine";
import {parentPort} from 'worker_threads'
import {AIHoster} from './lib/aiHoster';

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
    const aiHoster = new AIHoster('127.0.0.1', battlePort, 'aiHoster', '');
    const title = parameters.title;

    const aiHosterIndex = Object.keys(parameters.team).length;
    const aiHosterPlayer: Player = {
        index: aiHosterIndex,
        isAI: false,
        isChicken: false,
        isSpectator: true,
        team: 0
    }

    parameters.team['aiHoster'] = aiHosterPlayer;
    parameters.aiHosters.push(aiHosterIndex);

    listener.on('autohostMsg', (msg: {
        action: string,
        parameters: { [key: string]: any }
    }) => {
        if(msg.action === 'autohostStarted') {
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
        msg.parameters.title = title;

        switch(msg.action) {
            case 'serverStarted': {
                msg.parameters.port = battlePort;
                parentPort?.postMessage(msg);
                aiHoster.scripGenNStart();
                break;
            }
            case 'serverEnding': {
                parentPort?.postMessage(msg);
                listener.close();
                break;
            }
        }

    })
})


