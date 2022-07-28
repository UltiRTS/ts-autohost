import EventEmitter from "events";
import fs from "fs";
import axios from 'axios';

export class DntpCommunicator {
    server_addr: string
    mapDir: string
    emitter: EventEmitter

  constructor(addr: string, mapDir: string) {
    if (!fs.existsSync(mapDir)) fs.mkdirSync(mapDir);

    this.server_addr = addr;
    this.mapDir = mapDir;
    this.emitter = new EventEmitter();
    this.emitter.on('mapStored', (mapFileName) => {
      console.log(mapFileName, ' is stored');
    });
  }

  async getMapUrlById(id: string) {
    const resp = await axios.get(`${this.server_addr}/maps/${id}`);

    return resp.data;
  }
}