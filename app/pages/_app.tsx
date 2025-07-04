import { ChakraProvider } from "@chakra-ui/react"
import theme from "../theme"
import WalletContextProvider from "../contexts/WalletContextProvider"
import SessionProvider from "@/contexts/SessionProvider"
import { GameStateProvider } from "@/contexts/GameStateProvider"
import type { AppProps } from "next/app"
import { NftProvider } from "@/contexts/NftProvider"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <WalletContextProvider>
        <SessionProvider>
        <GameStateProvider>
          <NftProvider>
            <Component {...pageProps} />
          </NftProvider>
          </GameStateProvider>
        </SessionProvider>
      </WalletContextProvider>
    </ChakraProvider>
  )
}
