import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router'; // Import useRouter
// import { Star, MapPin, Clock, Phone, Calendar, Wallet } from 'lucide-react'; // Lucide icons not used in this version
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
// import BookingModal from '../components/BookingModal'; // BookingModal not used for now
// import { format } from 'date-fns'; // format not used for now
import { Box, Container, Heading, Stack, Text, Button, Image, SimpleGrid, ButtonGroup, useDisclosure } from "@chakra-ui/react"; // Added Text, Button, Image, SimpleGrid, ButtonGroup, useDisclosure
import { RestaurantStats } from "../components/RestaurantStats";
import { useSolana } from '../contexts/SolanaContext'; // For program instance and refreshUserData
import { recordVisitOnChain } from '../utils/solana'; // The new function
import { PublicKey } from '@solana/web3.js'; // For creating PublicKey instances
import { toaster } from '../components/ui/toaster'; // Import the custom toaster
import BookingModal, { Dish } from '../components/BookingModal'; // Import BookingModal and Dish type

// Import Card components using the new pattern
import { Card } from "@chakra-ui/react";

// const PROGRAM_ID = "6JQHXDZMwJ6JQHXDZMwJ6JQHXDZMwJ6JQHXDZMwJ"; // Removed this unused constant
// Dynamically import the wallet button component
const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

// Custom styles for the wallet button (can be kept or removed if not specifically styled here)
// const walletButtonStyles = { ... };

// Define a type for our restaurant structure more explicitly
interface DishData {
  name: string;
  publicKey: string;
  price: number;
}
interface RestaurantData {
  id: number;
  name: string;
  publicKey: string;
  dishes: DishData[];
  description: string;
  rating: number;
  reviews: number;
  cuisine: string;
  address: string;
  hours: string;
  phone: string;
  image: string;
  individualReviews: any[]; // Keep general for now
}

// Sample restaurant data (already updated with publicKey and dishes)
const restaurants: RestaurantData[] = [
  {
    id: 1,
    name: "Sushi Master",
    publicKey: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    dishes: [{ name: "Tuna Roll", publicKey: "MemoSq4gqABAXKb96qnH8TysNcVtrpQDMJEhHXGUxb", price: 8 }],
    description: "Authentic Japanese cuisine with fresh ingredients and masterful preparation.",
    rating: 4.8,
    reviews: 234,
    cuisine: "Japanese",
    address: "123 Ocean Drive, San Francisco",
    hours: "11:00 AM - 10:00 PM",
    phone: "(555) 123-4567",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop&q=60",
    individualReviews: []
  },
  {
    id: 2,
    name: "Pasta Paradise",
    publicKey: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
    dishes: [{ name: "Carbonara", publicKey: "11111111111111111111111111111111", price: 15 }],
    description: "Traditional Italian pasta dishes made with homemade pasta and secret family recipes.",
    rating: 4.6,
    reviews: 189,
    cuisine: "Italian",
    address: "456 Main Street, San Francisco",
    hours: "12:00 PM - 11:00 PM",
    phone: "(555) 234-5678",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=60",
    individualReviews: []
  },
  {
    id: 3,
    name: "Burger Haven",
    publicKey: "ANCMYVnDzXJ28wYk5j27U3eg74S3V1C159GH5z8YtUfS",
    dishes: [{ name: "Classic Burger", publicKey: "B2aB9LqdQZ4a7X5zepWvA3E9ZaaJGsF1J3FqX8yP9zHa", price: 12 }],
    description: "Gourmet burgers with locally sourced beef and artisanal buns.",
    rating: 4.5,
    reviews: 312,
    cuisine: "American",
    address: "789 Market Street, San Francisco",
    hours: "10:00 AM - 9:00 PM",
    phone: "(555) 345-6789",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60",
    individualReviews: []
  },
  {
    id: 4,
    name: "Spice Garden",
    publicKey: "C7g7Z2jS3d2yA1fX8nXsW5kHgP9vDqF3gV1LkJzPqYtR",
    dishes: [{ name: "Chicken Tikka Masala", publicKey: "D9fW2kPqrS3a8Z6xJ4nBcW1gHtY5vLpQ2eF7jX3mY9sA", price: 14 }],
    description: "Authentic Indian cuisine with a modern twist and extensive vegetarian options.",
    rating: 4.7,
    reviews: 156,
    cuisine: "Indian",
    address: "321 Curry Lane, San Francisco",
    hours: "11:30 AM - 10:30 PM",
    phone: "(555) 456-7890",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&auto=format&fit=crop&q=60",
    individualReviews: []
  }
];

export default function Home() {
  const router = useRouter(); // Get router instance
  const { publicKey } = useWallet();
  const { program, refreshUserData } = useSolana();
  const { open, onOpen, onClose } = useDisclosure(); // Changed isOpen to open
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantData | null>(null);
  const [isProcessingOnChain, setIsProcessingOnChain] = useState(false); // Renamed from isBooking to avoid conflict

  // This function will be passed to the BookingModal to handle the on-chain part
  const handleBookingConfirmed = async (booking: {
    restaurantName: string;
    date: Date;
    time: string;
    guests: number;
    specialRequests: string; 
    selectedDishes: Dish[]; // Use imported Dish type
    primaryPreOrderedDish: Dish | null; // Use imported Dish type
    totalPrice: number; 
    transactionSignature?: string; 
  }) => {
    if (!publicKey || !program ) { 
      toaster.create({
        title: "Error",
        description: "Wallet or program not available.",
        status: "error", duration: 5000, isClosable: true,
      });
      return;
    }

    setIsProcessingOnChain(true);
    try {
      // Call recordVisitOnChain with restaurantName and the primaryPreOrderedDish object
      const txSig = await recordVisitOnChain(
        program, 
        booking.restaurantName, 
        booking.primaryPreOrderedDish // This is { name: string, price: number } | null
      );
      
      toaster.create({
        title: "Booking Recorded On-Chain!",
        description: `Transaction: ${txSig}. Restaurant: ${booking.restaurantName}, Date: ${booking.date.toLocaleDateString()}, Time: ${booking.time}, Guests: ${booking.guests}`,
        status: "success", duration: 7000, isClosable: true,
      });
      
      await refreshUserData(); // Refresh stats
      onClose(); // Close the booking modal

      // Navigate to a rating/review page immediately after successful on-chain recording
      // The transaction signature (txSig) from recordVisitOnChain can be used as an ID
      // The payment transaction signature (booking.transactionSignature) is also available if needed
      toaster.create({
        title: "Redirecting to Review Page",
        description: "Please wait while we take you to the review page.",
        status: "info",
        duration: 3000, // Give a moment for the user to see previous success toast
        isClosable: true,
      });
      
      // Using a timeout to allow the user to read the previous toasts before redirecting
      setTimeout(() => {
        router.push({
          pathname: `/review/${txSig}`, // Example: /review/[onChainRecordTxSig]
          query: {
            restaurantName: booking.restaurantName,
            dishName: booking.primaryPreOrderedDish ? booking.primaryPreOrderedDish.name : undefined,
            date: booking.date.toISOString(),
            time: booking.time,
            guests: booking.guests.toString(),
            paymentSignature: booking.transactionSignature, // SOL payment signature
          },
        });
      }, 2000); // Delay of 2 seconds before redirect

    } catch (error: any) {
      console.error("Detailed On-chain recording failed object:", error); // Log the whole object

      let userFriendlyMessage = "An unexpected error occurred. Please check console for details.";
      let technicalDetails = "";

      if (typeof error === 'string') {
        technicalDetails = error;
      } else if (error instanceof Error) {
        technicalDetails = error.message; // Main message from Error object
        if (error.stack) {
          console.error("Error Stack Trace:", error.stack); // Log stack for more context
        }
      } else {
        try {
          technicalDetails = JSON.stringify(error); // Fallback for other error types
        } catch (e) {
          technicalDetails = "Error object could not be stringified.";
        }
      }

      if (error && error.logs) {
        console.error("Transaction Logs from error object:", error.logs);
        const logsString = JSON.stringify(error.logs);
        technicalDetails += ` Logs: ${logsString.substring(0, 200)}${logsString.length > 200 ? '...' : ''}`;
      }
      
      // Try to get a more specific user-facing message for known error patterns
      if (error && typeof error.message === 'string') {
        if (error.message.includes("AccountNotSigner")) {
          userFriendlyMessage = "AccountNotSigner: A required account did not sign. Check program/client setup.";
        } else if (error.message.includes("custom program error")) {
          const errorCodeMatch = error.message.match(/custom program error: (0x[0-9a-fA-F]+)/);
          if (errorCodeMatch && errorCodeMatch[1]) {
            userFriendlyMessage = `Program Error: ${errorCodeMatch[1]}. Check console for logs.`;
          } else {
            userFriendlyMessage = "A custom program error occurred. Check console for logs.";
          }
        } else if (error.message.includes("Simulation failed")) {
            userFriendlyMessage = "Transaction simulation failed. Check console for details and logs.";
        } else if (technicalDetails && technicalDetails.trim() !== '') {
           // Use the extracted technical details if they are more specific than generic message
           userFriendlyMessage = technicalDetails.substring(0, 250) + (technicalDetails.length > 250 ? '...' : ''); 
        }
      } else if (technicalDetails && technicalDetails.trim() !== '') {
        // If no error.message but we have some technical details from stringifying the error
        userFriendlyMessage = technicalDetails.substring(0, 250) + (technicalDetails.length > 250 ? '...' : '');
      }

      toaster.create({
        title: "On-Chain Recording Failed",
        description: userFriendlyMessage,
        status: "error",
        duration: 9000,
        isClosable: true,
      });
      // Log the full technicalDetails for developer, as toast might truncate it.
      console.error("Full technical details for failed on-chain recording:", technicalDetails);

    } finally {
      setIsProcessingOnChain(false);
    }
  };

  const handleOpenBookingModal = (restaurant: RestaurantData) => {
    setSelectedRestaurant(restaurant);
    onOpen();
  };

  const handleReview = (restaurantName: string) => {
    toaster.create({
      title: "Review Feature",
      description: `Review button for ${restaurantName} clicked. Functionality to be implemented.`,
      status: "info", duration: 3000, isClosable: true,
    });
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Stack direction="column">
        <Box w="full" display="flex" justifyContent="flex-end" mb={4}>
          <WalletMultiButton />
        </Box>

        <Heading mb={6}>Explore & Book Restaurants</Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }}>
          {restaurants.map((restaurant) => (
            <Card.Root key={restaurant.id} overflow="hidden">
              <Image src={restaurant.image} alt={restaurant.name} h="200px" w="full" objectFit="cover" />
              <Card.Body>
                <Heading size="md" mb={2}>{restaurant.name}</Heading>
                <Text fontSize="sm" color="gray.600" mb={1}>{restaurant.cuisine} - {restaurant.address}</Text>
                <Text fontSize="sm" mb={3}>{restaurant.description}</Text>
                {restaurant.dishes.map(dish => (
                  <Text key={dish.publicKey} fontSize="xs">Sample Dish: {dish.name} (${dish.price})</Text>
                ))}
              </Card.Body>
              <Card.Footer>
                <ButtonGroup>
                  <Button 
                    colorScheme="teal"
                    onClick={() => handleOpenBookingModal(restaurant)} // Opens modal
                    disabled={isProcessingOnChain || !publicKey} // Use the new state variable
                  >
                    {/* Text changes if any on-chain op is happening */}
                    {isProcessingOnChain ? "Processing..." : "Book Table"} 
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleReview(restaurant.name)}
                  >
                    Write a Review
                  </Button>
                </ButtonGroup>
              </Card.Footer>
            </Card.Root>
          ))}
        </SimpleGrid>
      </Stack>

      {selectedRestaurant && (
        <BookingModal 
          isOpen={open} 
          onClose={onClose} 
          restaurant={{
            id: selectedRestaurant.id,
            name: selectedRestaurant.name,
            cuisine: selectedRestaurant.cuisine,
          }}
          onConfirm={handleBookingConfirmed} // Use the new handler
        />
      )}
    </Container>
  );
} 