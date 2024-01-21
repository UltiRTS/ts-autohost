/** @format */

export interface PlasmidStartGameMessage {
  action: 'startGame';
  parameters: {
    id: number;
    mapId: string;
    title: string;
    map: string;
    [key: string]: any;
  };
}

export interface PlasmidMidJoinMessage {
  action: 'midJoin';
  parameters: {
    id: number;
    title: string;
    playerName: string;
    [key: string]: any;
  };
}

export interface PlasmidKillEngineMessage {
  action: 'killEngine';
  parameters: {
    id: number;
    title: string;
    [key: string]: any;
  };
}
export interface PlasmidErrorMessage {
  action: 'error';
  message: string;
}

export type PlasmidMessage =
  | PlasmidStartGameMessage
  | PlasmidMidJoinMessage
  | PlasmidKillEngineMessage
  | PlasmidErrorMessage;

export type PlasmidEventsMap = {
  [K in PlasmidMessage as K['action']]: K;
};
