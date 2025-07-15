import { Box, Flex, Heading, Spacer, VStack, Text } from "@chakra-ui/react"
import { useWallet } from "@solana/wallet-adapter-react"
import WalletMultiButton from "@/components/WalletMultiButton"
import DisplayGameState from "@/components/DisplayGameState"
import InitPlayerButton from "@/components/InitPlayerButton"
import SessionKeyButton from "@/components/SessionKeyButton"
import ClickButton from "@/components/ClickButton"
import Leaderboard from "@/components/Leaderboard"

export default function Home() {
  const { publicKey } = useWallet()

  return (
    <Box
      minH="100vh"
      bgImage="url('/pf_background_large.png')"
      bgSize="cover"
      bgPosition="center"
      bgRepeat="no-repeat"
    >
      <Flex px={4} py={4}>
        <Spacer />
        <WalletMultiButton />
      </Flex>
      <VStack>
        {!publicKey && <Text>Connect to wallet!</Text>}
        <InitPlayerButton />
        <ClickButton />
        <DisplayGameState />
        <SessionKeyButton />
        <Leaderboard />
      </VStack>
    </Box>
  )
}
