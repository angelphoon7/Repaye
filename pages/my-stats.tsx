import Head from 'next/head';
import dynamic from 'next/dynamic';
import { Box, Container, Heading, Stack } from "@chakra-ui/react";
import { RestaurantStats } from "../components/RestaurantStats";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function MyStatsPage() {
  return (
    <>
      <Head>
        <title>My Booking Stats - Repaye</title>
      </Head>
      <Container maxW="container.xl" py={8}>
        <Stack direction="column">
          <Box w="full" display="flex" justifyContent="flex-end" mb={4}>
            <WalletMultiButton />
          </Box>
          <Heading mb={6}>My Restaurant Booking Statistics</Heading>
          <RestaurantStats />
        </Stack>
      </Container>
    </>
  );
} 