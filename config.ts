/** @format */

export const plasmidServer = {
  host: process.env.PLASMID_SERVER_HOST ?? '127.0.0.1',
  port: Number.parseInt(process.env.PLASMID_SERVER_PORT ?? '8081'),
};

export const dntp = process.env.DNTP_ADDRESS ?? 'http://144.126.145.172:3000';
export const mapDir = process.env.ENGINE_MAP_DIR ?? 'engine/maps';
