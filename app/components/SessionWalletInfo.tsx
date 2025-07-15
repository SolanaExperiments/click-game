import { useEffect, useState } from "react";
import { Box, Text, Code, Spinner, VStack } from "@chakra-ui/react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useSessionWallet } from "@magicblock-labs/gum-react-sdk";

const SessionWalletInfo = () => {
  const { connection } = useConnection();
  const sessionWallet = useSessionWallet();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (sessionWallet?.publicKey) {
        try {
          const lamports = await connection.getBalance(sessionWallet.publicKey);
          setBalance(lamports / 1e9);
        } catch (err) {
          console.error("Failed to fetch session wallet balance", err);
        }
      }
    };

    fetchBalance();
  }, [sessionWallet, connection]);

  if (!sessionWallet?.publicKey) return null;

  return (
    <Box mt={4} p={4} bg="blackAlpha.700" borderRadius="lg" color="white" w="100%" maxW="lg">
      <VStack align="start" spacing={2}>
        <Text fontWeight="bold">Session Wallet</Text>
        <Code wordBreak="break-all" whiteSpace="normal">
          {sessionWallet.publicKey.toBase58()}
        </Code>
        <Text>
          Balance:{" "}
          {balance !== null ? (
            <Text as="span" color={balance > 0 ? "green.300" : "red.400"}>
              {balance.toFixed(4)} SOL
            </Text>
          ) : (
            <Spinner size="sm" />
          )}
        </Text>
      </VStack>
    </Box>
  );
};

export default SessionWalletInfo;
