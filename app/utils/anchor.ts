import { Program, IdlAccounts, BN, AnchorProvider } from "@coral-xyz/anchor";
import IDL from "../idl/click-game.json";
import { ClickGame } from "@/idl/click-game";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js"
import { WrappedConnection } from "./wrappedConnection";
import {
  AnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";

export const CONNECTION = new WrappedConnection(
  process.env.NEXT_PUBLIC_RPC
    ? process.env.NEXT_PUBLIC_RPC
    : "https://mainnet.helius-rpc.com/?api-key=",
  {
    wsEndpoint: process.env.NEXT_PUBLIC_WSS_RPC
      ? process.env.NEXT_PUBLIC_WSS_RPC
      : "wss://mainnet.helius-rpc.com/?api-key=",
    commitment: "confirmed",
  }
);

export const METAPLEX_READAPI = "https://mainnet.helius-rpc.com/?api-key=";

// Here you can basically use what ever seed you want. For example one per level or city or whatever.
export const GAME_DATA_SEED = "level_2";

// ClickGame game program ID
export const PROGRAM_ID = new PublicKey(IDL.address);

export function getProgram(provider: AnchorProvider) {
  return new Program(IDL as ClickGame, provider);
}

export function useAnchorProvider() {
  const { connection } = useConnection();
  const wallet = useWallet();

  return new AnchorProvider(connection, wallet as AnchorWallet, {
    commitment: "confirmed",
  });
}

export const [gameDataPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from(GAME_DATA_SEED, "utf8")],
  PROGRAM_ID
)

// Player Data Account Type from Idl
export type PlayerData = IdlAccounts<ClickGame>["playerData"]
export type GameData = IdlAccounts<ClickGame>["gameData"]

// Constants for the game
export const TIME_TO_REFILL_ENERGY: BN = new BN(60)
export const MAX_ENERGY = 100
export const ENERGY_PER_TICK: BN = new BN(1)
export const TOTAL_WOOD_AVAILABLE: BN = new BN(100000)