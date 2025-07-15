import { useState } from "react";
import { Button } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSessionWallet } from "@magicblock-labs/gum-react-sdk";
import { useGameState } from "@/contexts/GameStateProvider";
import { PROGRAM_ID } from "@/utils/anchor";

const SessionKeyButton = () => {
  const { publicKey } = useWallet();
  const { gameState } = useGameState();
  const sessionWallet = useSessionWallet();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateSession = async () => {
    setIsLoading(true);
    const topUp = true;
    const expiryInMinutes = 600;

    try {
      const session = await sessionWallet.createSession(
        PROGRAM_ID,
        topUp ? 10000000 : 0,
        expiryInMinutes
      );
      console.log("Session created:", session, PROGRAM_ID.toBase58());
    } catch (error) {
      console.error("Failed to create session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = async () => {
    setIsLoading(true);
    try {
      await sessionWallet.revokeSession();
      console.log("Session revoked");
      console.log("Session revoked:", PROGRAM_ID.toBase58());
    } catch (error) {
      console.error("Failed to revoke session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {publicKey && gameState && (
        <Button
          isLoading={isLoading}
          onClick={
            sessionWallet && sessionWallet.sessionToken == null
              ? handleCreateSession
              : handleRevokeSession
          }
        >
          {sessionWallet && sessionWallet.sessionToken == null
            ? "Start Clicking"
            : "Stop Clicking"}
        </Button>
      )}
    </>
  );
};

export default SessionKeyButton;