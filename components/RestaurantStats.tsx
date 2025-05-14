import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useSolana } from "../contexts/SolanaContext";
import { useWallet } from "@solana/wallet-adapter-react";
// import { PublicKey } from "@solana/web3.js";
import { toaster } from "./ui/toaster";

export const RestaurantStats = () => {
  const { userData, loading, error, program, refreshUserData } = useSolana();
  const { publicKey } = useWallet();

  if (!publicKey) {
    return (
      <Box textAlign="center" p={4}>
        <Text>Please connect your wallet to view your restaurant stats</Text>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box textAlign="center" p={4}>
        <Text>Loading your restaurant stats...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" p={4}>
        <Text color="red.500">Error: {error}</Text>
      </Box>
    );
  }

  if (!userData || Object.keys(userData.restaurants).length === 0) {
    return (
      <Box textAlign="center" p={4}>
        <Text>No restaurant visits found</Text>
      </Box>
    );
  }

  return (
    <Stack>
      <Button onClick={async () => {
        await refreshUserData();
        toaster.create({
          title: "Data refresh requested",
          description: "Your restaurant data is being updated.",
          type: "info",
        });
      }} colorScheme="blue">
        Refresh Data
      </Button>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }}>
        {Object.entries(userData.restaurants).map(([restaurantKey, data]) => (
          <Card.Root key={restaurantKey}>
            <Card.Header>
              <Heading size="md">Restaurant {restaurantKey.slice(0, 8)}...</Heading>
            </Card.Header>
            <Card.Body>
              <Stack>
                <Text>Visit Count: {data.visitCount}</Text>
                <Text fontWeight="bold">Dishes:</Text>
                {Object.entries(data.dishes).map(([dishName, dishData]) => (
                  <Box key={dishName} pl={4}>
                    <Text>
                      {dishName}: {dishData.count} orders
                    </Text>
                  </Box>
                ))}
              </Stack>
            </Card.Body>
          </Card.Root>
        ))}
      </SimpleGrid>
    </Stack>
  );
}; 