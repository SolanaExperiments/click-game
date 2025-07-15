import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Text,
  Button,
  useToast,
} from "@chakra-ui/react";
import { useAnchorProvider } from "../utils/anchor";
import { getProgram } from "../utils/anchor";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  getAssociatedTokenAddressSync,
  createTransferCheckedInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";
import { PublicKey, Transaction } from "@solana/web3.js";
import type { ParsedAccountData } from "@solana/web3.js";

type LeaderboardEntry = {
  authority: string;
  click: string;
  name: string;
};

const ADMIN_PUBKEY = "EfXKCqyaUNyYoqzDgcfm8ZvckLotkZ8dz4yGcR4ZEqjB";
const DISTRIBUTOR_PUBKEY = "5yDAFUqw6pGTjSctiUkx4kF71goGUnAGcQF2EWBVQdfU";
const TOKEN_MINT = new PublicKey("Cy8tMvKfMeGhYxnMKd85D2axDawfeMFoCyauEE3zXZRs");
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

function shortAddress(addr: string) {
  return addr.length <= 8 ? addr : addr.slice(0, 4) + "..." + addr.slice(-4);
}

const Leaderboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toast = useToast();
  const provider = useAnchorProvider();
  const program = getProgram(provider);
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const fetchAndCacheLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const allPlayers = await program.account.playerData.all();
      const sorted = allPlayers
        .map((acc: any) => ({
          name: acc.account.name,
          click: acc.account.click?.toString?.() ?? acc.account.click,
          authority:
            acc.account.authority?.toBase58?.() ??
            acc.account.authority?.toString?.() ??
            acc.account.authority,
        }))
        .sort((a, b) => Number(b.click) - Number(a.click))
        .slice(0, 10);

      setPlayers(sorted);
      localStorage.setItem(
        "leaderboard-cache-v1",
        JSON.stringify({ data: sorted, timestamp: Date.now() })
      );
    } catch (e: any) {
      setError(e.message || "Failed to fetch leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cacheKey = "leaderboard-cache-v1";
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data } = JSON.parse(cached);
      if (Array.isArray(data)) {
        setPlayers(data);
        setLoading(false);
        return;
      }
    }
    fetchAndCacheLeaderboard();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchAndCacheLeaderboard, 60000);
    return () => clearInterval(interval);
  }, []);

  const distributeRewards = async () => {
    if (!publicKey || !sendTransaction) {
      toast({
        title: "Connect your wallet.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (publicKey.toBase58() !== DISTRIBUTOR_PUBKEY) {
      toast({
        title: "Only the distributor can distribute rewards.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const mintInfoRaw = await connection.getParsedAccountInfo(TOKEN_MINT);
      let decimals = 9;
      if (mintInfoRaw.value && "parsed" in mintInfoRaw.value.data) {
        const parsedData = mintInfoRaw.value.data as ParsedAccountData;
        decimals = parsedData.parsed.info.decimals;
      }

      const senderTokenAccount = getAssociatedTokenAddressSync(
        TOKEN_MINT,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const senderATAInfo = await connection.getAccountInfo(senderTokenAccount);
      if (!senderATAInfo) {
        toast({
          title: "Sender ATA missing.",
          description: "Please create your associated token account for this mint.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      for (let i = 0; i < Math.min(players.length, 5); i++) {
        const player = players[i];
        const recipient = new PublicKey(player.authority);
        const score = Number(player.click);
        if (isNaN(score) || score <= 0) continue;

        const amount = BigInt(Math.floor(score * 10 ** decimals));
        const recipientTokenAccount = getAssociatedTokenAddressSync(
          TOKEN_MINT,
          recipient,
          false,
          TOKEN_2022_PROGRAM_ID
        );

        const ataIx = createAssociatedTokenAccountIdempotentInstruction(
          publicKey,
          recipientTokenAccount,
          recipient,
          TOKEN_MINT,
          TOKEN_2022_PROGRAM_ID
        );

        const transferIx = createTransferCheckedInstruction(
          senderTokenAccount,
          TOKEN_MINT,
          recipientTokenAccount,
          publicKey,
          amount,
          decimals,
          [],
          TOKEN_2022_PROGRAM_ID
        );

        const tx = new Transaction().add(ataIx, transferIx);
        tx.feePayer = publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        const sig = await sendTransaction(tx, connection);
        await connection.confirmTransaction(sig, "confirmed");

        console.log(
          `[distributeRewards] Sent ${amount} tokens to ${recipient.toBase58()} (tx: ${sig})`
        );
      }

      toast({
        title: "Rewards distributed!",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
    } catch (e: any) {
      console.error("Reward error:", e);
      toast({
        title: "Distribution failed",
        description: e.message || "Unknown error",
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    }
  };

  const resetLeaderboard = async () => {
    if (!publicKey || !sendTransaction) {
      toast({ title: "Connect your wallet", status: "error" });
      return;
    }
  
    if (publicKey.toBase58() !== ADMIN_PUBKEY) {
      toast({ title: "Only the admin can reset the leaderboard", status: "error" });
      return;
    }
  
    try {
      for (const player of players) {
        const authority = new PublicKey(player.authority);
  
        const [playerPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("player"), authority.toBuffer()],
          program.programId
        );
  
        const tx = await program.methods
        .resetPlayer()
        .accounts({
          playerData: playerPDA,
          authority,
        } as any)
        .transaction();
      
  
        tx.feePayer = publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  
        const sig = await sendTransaction(tx, connection);
        await connection.confirmTransaction(sig, "confirmed");
  
        console.log(`Reset ${authority.toBase58()} with tx ${sig}`);
      }
  
      toast({ title: "Leaderboard reset!", status: "success" });
      fetchAndCacheLeaderboard();
    } catch (e: any) {
      console.error("Transaction error:", e);
      toast({
        title: "Reset failed",
        description: e.message ?? "Unknown error",
        status: "error",
      });
    }
  };
  

  return (
    <Box mt={8}>
      <Heading size="md" mb={4}>
        Leaderboard (Top 10)
      </Heading>

      {loading ? (
        <Spinner />
      ) : error ? (
        <Text color="red.500">{error}</Text>
      ) : (
        <>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th color="#6C29D1">Rank</Th>
                <Th color="#6C29D1">Name</Th>
                <Th color="#6C29D1">Score</Th>
              </Tr>
            </Thead>
            <Tbody>
              {players.map((player, idx) => (
                <Tr key={player.authority}>
                  <Td>{idx + 1}</Td>
                  <Td>{player.name || shortAddress(player.authority)}</Td>
                  <Td>{player.click}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          <>
            {publicKey?.toBase58() === DISTRIBUTOR_PUBKEY && (
              <Button mt={4} colorScheme="purple" onClick={distributeRewards}>
                Distribute Rewards
              </Button>
            )}

            {publicKey?.toBase58() === ADMIN_PUBKEY && (
              <Button mt={4} ml={4} colorScheme="red" onClick={resetLeaderboard}>
                Reset Leaderboard
              </Button>
            )}
          </>
        </>
      )}
    </Box>
  );
};

export default Leaderboard;
