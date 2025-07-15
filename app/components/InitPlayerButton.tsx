import { useCallback, useState } from "react";
import { Button } from "@chakra-ui/react";
import { SystemProgram } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useGameState } from "@/contexts/GameStateProvider";
import {
  GAME_DATA_SEED,
  gameDataPDA,
  getProgram,
  useAnchorProvider,
} from "@/utils/anchor";

const InitPlayerButton = () => {
  const { publicKey, wallet } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const { gameState, playerDataPDA } = useGameState();

  const provider = useAnchorProvider();
  const program = getProgram(provider);

  const handleClick = useCallback(async () => {
    if (!publicKey || !playerDataPDA || typeof window === "undefined") return;

    setIsLoading(true);

    try {
      console.log("[InitPlayer] Using publicKey:", publicKey.toBase58());

      // Create transaction
      const transaction = await program.methods
        .initPlayer(GAME_DATA_SEED)
        .accountsStrict({
          player: playerDataPDA,
          gameData: gameDataPDA,
          signer: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      // Set recent blockhash & feePayer
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;
      transaction.feePayer = publicKey;

      // Sign transaction using Phantom's deep link provider
      const signedTx = await window.phantom.solana.signTransaction(transaction);

      // Send the signed transaction
      const txSig = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: true,
      });

    } catch (error: any) {
      console.error("[InitPlayer] Transaction failed:", error);
      try {
        console.error("[InitPlayer] Full Error (JSON):", JSON.stringify(error, null, 2));
      } catch (e) {}
      try {
        console.error("[InitPlayer] Full Error (toString):", error.toString());
      } catch (e) {}
      console.log("[InitPlayer] Connection endpoint:", connection?.rpcEndpoint);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, playerDataPDA, connection]);

  return (
    <>
      {!gameState && publicKey && (
        <Button onClick={handleClick} isLoading={isLoading}>
          Init Player
        </Button>
      )}
    </>
  );
};

export default InitPlayerButton;
