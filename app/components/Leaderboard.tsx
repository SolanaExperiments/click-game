import React, { useEffect, useState } from "react";
import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Spinner, Text } from "@chakra-ui/react";
import { useAnchorProvider } from "../utils/anchor";
import { getProgram } from "../utils/anchor";

type LeaderboardEntry = {
  authority: string;
  click: string;
  name: string;
};

// Utility to shorten a Solana address (e.g., Abcd...Wxyz)
function shortAddress(addr: string) {
  if (!addr || addr.length <= 8) return addr;
  return addr.slice(0, 4) + '...' + addr.slice(-4);
}

const Leaderboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Move hook call here
  const provider = useAnchorProvider();
  const program = getProgram(provider);

  // Helper to fetch leaderboard from chain and cache
  const fetchAndCacheLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const allPlayers = await program.account.playerData.all();
      const sorted = allPlayers
        .map((acc: any) => ({
          name: acc.account.name,
          click: acc.account.click?.toString?.() ?? acc.account.click,
          authority: acc.account.authority?.toBase58?.() ?? acc.account.authority?.toString?.() ?? acc.account.authority,
        }))
        .sort((a: LeaderboardEntry, b: LeaderboardEntry) => Number(b.click) - Number(a.click))
        .slice(0, 10);
      setPlayers(sorted);
      // Cache the result with timestamp
      const now = Date.now();
      localStorage.setItem('leaderboard-cache-v1', JSON.stringify({ data: sorted, timestamp: now }));
    } catch (e: any) {
      setError(e.message || "Failed to fetch leaderboard");
    } finally {
      setLoading(false);
    }
  };

  // On mount, load from cache if available
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cacheKey = 'leaderboard-cache-v1';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data } = JSON.parse(cached);
      if (Array.isArray(data)) {
        setPlayers(data);
        setLoading(false);
        return;
      }
    }
    // If no cache, fetch once
    fetchAndCacheLeaderboard();
  }, []); // Only run on mount

  // Auto-refresh leaderboard every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAndCacheLeaderboard();
    }, 60000); // 60,000 ms = 1 minute
    return () => clearInterval(interval);
  }, []);

  return (
    <Box mt={8}>
      <Heading size="md" mb={4}>Leaderboard (Top 10)</Heading>

      {loading ? (
        <Spinner />
      ) : error ? (
        <Text color="red.500">{error}</Text>
      ) : (
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Rank</Th>
              <Th>Name</Th>
              <Th>Score</Th>
            </Tr>
          </Thead>
          <Tbody>
            {players.map((player, idx) => (
              <Tr key={player.authority}>
                <Td>{idx + 1}</Td>
                <Td>{player.name || shortAddress(player.authority)}</Td>
                <Td>{player.click?.toString?.() ?? player.click}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

export default Leaderboard;
