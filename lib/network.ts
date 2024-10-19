/** @format */

import { WebSocket } from "ws";
import fs from "fs";
import fetch from "node-fetch";
import path from "path";
import crypto from "crypto";
import { EventEmitter } from "./events";
import axios from "axios";
import { PlasmidEventsMap, PlasmidMessage } from "./typings";

export class PlasmidCommunicator extends EventEmitter<PlasmidEventsMap> {
  ws: WebSocket | null = null;

  constructor(target: { host: string; port: number }) {
    super();
    this.initNetwork(target);
  }

  initNetwork(target: { host: string; port: number }) {
    this.ws = new WebSocket("ws://" + target.host + ":" + target.port);
    const mgrSelf = this;
    const ws = this.ws;
    this.ws.on("open", function open() {
      ws.send(JSON.stringify({ action: "autohostRegister" }));
      console.log("connected to plasmid");
    });
    this.ws.on("error", function message(err) {
      console.log("network exiting:", err);
    });

    this.ws.on("message", function message(data) {
      console.log("received message from plasmid:", data.toString());
      // mgrSelf.emit('plasmidRequest', JSON.parse(data.toString()));
      const msg = JSON.parse(data.toString()) as PlasmidMessage;
      switch (msg.action) {
        case "startGame": {
          mgrSelf.emit("startGame", msg);
          break;
        }
        case "midJoin": {
          mgrSelf.emit("midJoin", msg);
          break;
        }
        case "killEngine": {
          mgrSelf.emit("killEngine", msg);
          break;
        }
        case "error": {
          mgrSelf.emit("error", msg);
          break;
        }
        case "cmd": {
          mgrSelf.emit("cmd", msg);
          break
        }

        default: {
          const exhaustiveCheck: never = msg;
          console.error("Unknown message from plasmid: ", msg);
        }
      }
    });

    this.ws.on("close", function message(event) {
      console.log("closeEvent", event);
      setTimeout(() => {
        mgrSelf.initNetwork(target);
      }, 2000);
    });
  }

  /**
   *
   * @param {String} msg2send
   */
  send2plasmid(msg2send: any) {
    if (this.ws) this.ws.send(JSON.stringify(msg2send));
  }
}

export const downloadMap = async (
  mapInfo: {
    prefix: string;
    url: string;
    map: {
      map_filename: string;
      map_hash: string;
      map_name: string;
    };
  },
  mapDir: string
) => {
  const prefix = mapInfo.prefix;
  const mapFileName = mapInfo.map.map_filename;
  const absoluteUrl = prefix + mapFileName;
  const storePath = path.join(mapDir, mapFileName);

  if (fs.existsSync(storePath) === true) return true;

  let retry = 3;
  while (retry > 0) {
    try {
      console.log("downloading map:", absoluteUrl);
      const resp = await axios(absoluteUrl, {
        method: "GET",
        responseType: "arraybuffer",
        headers: {
          "Content-Type": "application/gzip",
        },
      });
      // const buffer = await data.arrayBuffer();
      // const bufferView = new Uint8Array(buffer);
      const data = resp.data;
      fs.writeFileSync(storePath, data);

      const hashSum = crypto.createHash("md5").update(data).digest("hex");
      if (hashSum === mapInfo.map.map_hash) break;

      console.log("retrying, ", retry);
    } catch (e) {
      console.log("download failed with", e, "retrying", retry);
    }
    retry--;
  }

  if (retry === 0) return false;
  else return true;
};
