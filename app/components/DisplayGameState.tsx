import Image from "next/image"
import { HStack, VStack, Text } from "@chakra-ui/react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useGameState } from "@/contexts/GameStateProvider"
import { TOTAL_WOOD_AVAILABLE } from "@/utils/anchor"

const DisplayPlayerData = () => {
  const { publicKey } = useWallet()
  const { gameState, nextEnergyIn, totalWoodAvailable } = useGameState()

  return (
    <>
      {gameState && publicKey && (
        <HStack justifyContent="center" spacing={4}>
          <HStack>
            <Text>Pixels: {Number(gameState.click)}</Text>
          </HStack>
          <HStack>
            <VStack>
              <Text>Fuel: {Number(gameState.energy)}</Text>
              <Text>Next in: {nextEnergyIn}</Text>
            </VStack>
          </HStack>
        </HStack>
      )}
    </>
  )
}

export default DisplayPlayerData
