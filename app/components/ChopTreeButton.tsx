import Image from "next/image";
import { useCallback, useState } from "react";
import { Button, HStack, VStack } from "@chakra-ui/react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useSessionWallet } from "@magicblock-labs/gum-react-sdk";
import { useGameState } from "@/contexts/GameStateProvider";
import {
  GAME_DATA_SEED,
  gameDataPDA,
  getProgram,
  useAnchorProvider,
} from "@/utils/anchor";
import { SystemProgram } from "@solana/web3.js";

const ChopTreeButton = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const sessionWallet = useSessionWallet();
  const { gameState, playerDataPDA } = useGameState();
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoadingMainWallet, setIsLoadingMainWallet] = useState(false);
  const [transactionCounter, setTransactionCounter] = useState(0);

  const provider = useAnchorProvider();
  var program = getProgram(provider);

  const onChopClick = useCallback(async () => {
    setIsLoadingSession(true);
    if (!playerDataPDA || !sessionWallet) return;
    setTransactionCounter(transactionCounter + 1);

    try {
      const transaction = await program.methods
        .click(GAME_DATA_SEED, transactionCounter)
        .accountsPartial({
          player: playerDataPDA,
          gameData: gameDataPDA,
          signer: sessionWallet.publicKey!,
          sessionToken: sessionWallet.sessionToken,
        })
        .transaction();

      const txids = await sessionWallet.signAndSendTransaction!(transaction);

      if (txids && txids.length > 0) {
        console.log("Transaction sent:", txids);
      } else {
        console.error("Failed to send transaction");
      }
    } catch (error: any) {
      console.log("error", `Chopping failed! ${error?.message}`);
    } finally {
      setIsLoadingSession(false);
    }
  }, [sessionWallet]);

  const onChopMainWalletClick = useCallback(async () => {
    if (!publicKey || !playerDataPDA) return;

    setIsLoadingMainWallet(true);

    try {
      const transaction = await program.methods
        .click(GAME_DATA_SEED, transactionCounter)
        .accountsPartial({
          player: playerDataPDA,
          gameData: gameDataPDA,
          signer: publicKey,
          sessionToken: null,
        })
        .transaction();

      const txSig = await sendTransaction(transaction, connection, {
        skipPreflight: true,
      });
      console.log(`https://explorer.solana.com/tx/${txSig}?cluster=devnet`);
    } catch (error: any) {
      console.log("error", `Chopping failed! ${error?.message}`);
    } finally {
      setIsLoadingMainWallet(false);
    }
  }, [publicKey, playerDataPDA, connection]);

  return (
    <>
      {publicKey && gameState && (
        <VStack>
          <HStack>
            {sessionWallet && sessionWallet.sessionToken != null && (
              <Button
                isLoading={isLoadingSession}
                onClick={onChopClick}
                width="175px"
              >
                Click
              </Button>
            )}
          </HStack>
        </VStack>
      )}
    </>
  );
};

export default ChopTreeButton;
