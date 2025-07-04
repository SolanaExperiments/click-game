import { Box, Flex, Heading, Spacer, VStack, Text } from "@chakra-ui/react"
import { useWallet } from "@solana/wallet-adapter-react"
import WalletMultiButton from "@/components/WalletMultiButton"
import DisplayGameState from "@/components/DisplayGameState"
import InitPlayerButton from "@/components/InitPlayerButton"
import SessionKeyButton from "@/components/SessionKeyButton"
import ChopTreeButton from "@/components/ChopTreeButton"
import RequestAirdrop from "@/components/RequestAirdrop"
import DisplayNfts from "@/components/DisplayNfts"
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
        <Heading color="#06F3C9">PixelFuel</Heading>
        {!publicKey && <Text>Connect to devnet wallet!</Text>}
        <DisplayGameState />
        <InitPlayerButton />
        <SessionKeyButton />
        <ChopTreeButton />
        <RequestAirdrop />
        <Leaderboard />
      </VStack>
    </Box>
  )
}
