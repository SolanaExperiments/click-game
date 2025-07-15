import { useCallback, useState } from "react";
import { Box, VStack, Text, Image } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useSessionWallet } from "@magicblock-labs/gum-react-sdk";
import { useGameState } from "@/contexts/GameStateProvider";
import {
  GAME_DATA_SEED,
  gameDataPDA,
  getProgram,
  useAnchorProvider,
} from "@/utils/anchor";
import { PublicKey } from "@solana/web3.js";

const MotionBox = motion(Box);
const MotionImage = motion(Image);

const ClickButton = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const sessionWallet = useSessionWallet();
  const { gameState, playerDataPDA } = useGameState();

  const [isLoading, setIsLoading] = useState(false);
  const [transactionCounter, setTransactionCounter] = useState(0);
  const provider = useAnchorProvider();
  const program = getProgram(provider);

    // Verify session token account exists on-chain
  const handleClick = useCallback(async () => {
      if (!playerDataPDA || !sessionWallet) return;
    
      if (!sessionWallet.sessionToken) {
        alert("Please start a session first by clicking 'Start Clicking'");
        return;
      }
    
      // Convert sessionToken string to PublicKey for getAccountInfo
      const tokenAccountInfo = await connection.getAccountInfo(
        new PublicKey(sessionWallet.sessionToken)
      );
      if (!tokenAccountInfo) {
        alert("Session token account not found on-chain. Please create/start a session first.");
        return;
      }
    
      setTransactionCounter((prev) => prev + 1);
      setIsLoading(true);
    
      try {
        const tx = await program.methods
          .click(GAME_DATA_SEED, transactionCounter)
          .accountsPartial({
            player: playerDataPDA,
            gameData: gameDataPDA,
            signer: sessionWallet.publicKey!,
            sessionToken: new PublicKey(sessionWallet.sessionToken),
          })
          .transaction();
    
        const txids = await sessionWallet.signAndSendTransaction!(tx);
        if (txids?.length) console.log("Tx sent:", txids);
      } catch (err: any) {
        if (err.getLogs) {
          try {
            const logs = await err.getLogs();
            console.error("Transaction error logs:", logs);
          } catch (logErr) {
            console.error("Failed to get transaction logs:", logErr);
          }
        }
        console.error("Error:", err.message);
      } finally {
        setIsLoading(false);
      }
    }, [sessionWallet, playerDataPDA, transactionCounter, connection]);
  
  

  return (
    publicKey && gameState && (
      <VStack spacing={4} mt={4} align="center">
        <MotionBox
          as="button"
          onClick={handleClick}
          cursor="pointer"
          initial={{ scale: 1 }}
          whileHover={{
            scale: 1.05,
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          outline="none"
          border="none"
          bg="transparent"
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={2} // spacing between image and text box
          maxW="320px"
          w="100%"
          userSelect="none"
        >
          <MotionImage
            src="/PixelfuelLogo.png"
            alt="Pixel Logo"
            boxSize={{ base: "120px", md: "160px" }}
            objectFit="contain"
            pointerEvents="none"
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            zIndex={1}
          />

          <Box
            bg="rgba(14, 116, 144, 0.6)"
            backdropFilter="blur(10px)"
            px={8}
            py={4}
            w="100%"
            mb={4}
            textAlign="center"
            borderRadius="lg"
            boxShadow="0 8px 32px 0 rgba(31, 38, 135, 0.37)"
            color="white"
            fontWeight="bold"
            fontSize={{ base: "md", md: "lg" }}
            zIndex={0}
          >
            {isLoading ? "Loading..." : "Get Pixels"}
          </Box>
        </MotionBox>
      </VStack>
    )
  );
};

export default ClickButton;
