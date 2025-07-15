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
  const { publicKey, sendTransaction, wallet } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const { gameState, playerDataPDA } = useGameState();

  const provider = useAnchorProvider();
  var program = getProgram(provider);

  // Init player button click handler
  const handleClick = useCallback(async () => {
    if (!publicKey || !playerDataPDA) return;

    setIsLoading(true);

    try {
      console.log("[InitPlayer] Using publicKey:", publicKey?.toBase58());
      const transaction = await program.methods
        .initPlayer(GAME_DATA_SEED)
        .accountsStrict({
          player: playerDataPDA,
          gameData: gameDataPDA,
          signer: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const txSig = await sendTransaction(transaction, connection, {
        skipPreflight: true,
      });

      console.log(`https://explorer.solana.com/tx/${txSig}`);
    } catch (error: any) {
      console.error("[InitPlayer] Transaction failed:", error);
      if (error?.response) console.error("[InitPlayer] Error Response:", error.response);
      if (error?.message) console.error("[InitPlayer] Error Message:", error.message);
      if (error?.stack) console.error("[InitPlayer] Error Stack:", error.stack);
      if (error?.cause) console.error("[InitPlayer] Error Cause:", error.cause);
      try { console.error("[InitPlayer] Full Error (JSON):", JSON.stringify(error, null, 2)); } catch (e) {}
      try { console.error("[InitPlayer] Full Error (toString):", error.toString()); } catch (e) {}
      // Log the connection endpoint
      console.log("[InitPlayer] Connection endpoint:", connection?.rpcEndpoint);
    } finally {
      setIsLoading(false); // set loading state back to false
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
