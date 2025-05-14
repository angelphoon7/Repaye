import type { AppProps } from 'next/app';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';
import { SolanaProvider } from '../contexts/SolanaContext';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from '../styles/theme'; // Import the new system object
import { Toaster } from "../components/ui/toaster"; // Import the new Toaster
// import theme from '../styles/theme'; // Temporarily commenting out custom theme

// Import global styles
import '../styles/globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';

export default function App({ Component, pageProps }: AppProps) {
  // Set up network and endpoint
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Set up wallet adapters
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <SolanaProvider>
            <ChakraProvider value={system}> {/* Pass system to value prop */}
              <Component {...pageProps} />
              <Toaster /> {/* Add the Toaster component here */}
            </ChakraProvider>
          </SolanaProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
} 