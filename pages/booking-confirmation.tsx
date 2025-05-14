import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Box, Container, Heading, Text, Button, VStack, Link as ChakraLink, Divider, Spinner } from '@chakra-ui/react';
import NextLink from 'next/link';
import Head from 'next/head';

interface BookingDetails {
  restaurantName?: string;
  date?: string;
  time?: string;
  guests?: string; // guests will be a string from query params
  txSig?: string;
}

const REDIRECT_DELAY = 3000; // Changed to 3 seconds

export default function BookingConfirmationPage() {
  const router = useRouter();
  const [details, setDetails] = useState<BookingDetails>({});
  const [countdown, setCountdown] = useState<number>(REDIRECT_DELAY / 1000);

  useEffect(() => {
    if (router.isReady) {
      const { restaurantName, date, time, guests, txSig } = router.query;
      const currentDetails = {
        restaurantName: Array.isArray(restaurantName) ? restaurantName[0] : restaurantName,
        date: Array.isArray(date) ? date[0] : date,
        time: Array.isArray(time) ? time[0] : time,
        guests: Array.isArray(guests) ? guests[0] : guests,
        txSig: Array.isArray(txSig) ? txSig[0] : txSig,
      };
      setDetails(currentDetails);

      if (currentDetails.restaurantName && currentDetails.txSig) {
        const timer = setTimeout(() => {
          router.push({
            pathname: '/submit-review',
            query: { 
              restaurantName: currentDetails.restaurantName,
              txSig: currentDetails.txSig 
            }
          });
        }, REDIRECT_DELAY);

        const interval = setInterval(() => {
          setCountdown((prevCountdown) => prevCountdown - 1);
        }, 1000);

        // Clear timeout and interval on component unmount or if navigation happens sooner
        return () => {
          clearTimeout(timer);
          clearInterval(interval);
        };
      }
    }
  }, [router.isReady, router.query, router]); // Added router to dependency array

  return (
    <>
      <Head>
        <title>Booking Confirmation - Repaye</title>
      </Head>
      <Container maxW="container.md" py={10}>
        <VStack spacing={6} align="stretch">
          <Heading as="h1" size="xl" textAlign="center">
            Booking Confirmed!
          </Heading>

          {details.restaurantName && (
            <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
              <Heading as="h2" size="lg" mb={3}>
                {details.restaurantName}
              </Heading>
              <Text fontSize="lg">
                <strong>Date:</strong> {details.date ? new Date(details.date).toLocaleDateString() : 'N/A'}
              </Text>
              <Text fontSize="lg">
                <strong>Time:</strong> {details.time || 'N/A'}
              </Text>
              <Text fontSize="lg">
                <strong>Guests:</strong> {details.guests || 'N/A'}
              </Text>
            </Box>
          )}

          {details.txSig && (
            <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
              <Heading as="h3" size="md" mb={2}>
                Transaction Details
              </Heading>
              <Text fontSize="sm" wordBreak="break-all">
                <strong>Transaction ID:</strong> {details.txSig}
              </Text>
              <Text fontSize="xs" mt={2}>
                You can view this transaction on the Solana explorer.
              </Text>
            </Box>
          )}

          {details.restaurantName && details.txSig && (
            <VStack mt={6} p={4} bg="blue.50" borderRadius="md" spacing={3}>
              <Spinner size="md" color="blue.500" />
              <Text textAlign="center" fontWeight="medium">
                Taking you to rate & review in {countdown} seconds...
              </Text>
            </VStack>
          )}

          <Divider mt={details.restaurantName && details.txSig ? 2 : 0} />

          <NextLink href="/" passHref>
            <Button as="a" colorScheme="teal" size="lg" w="full">
              Back to Home
            </Button>
          </NextLink>

          {details.restaurantName && details.txSig && (
            <NextLink 
              href={{
                pathname: '/submit-review',
                query: { 
                  restaurantName: details.restaurantName,
                  txSig: details.txSig 
                }
              }}
              passHref
            >
              <Button as="a" colorScheme="blue" variant="outline" size="lg" w="full" mt={2}>
                Rate & Review Now
              </Button>
            </NextLink>
          )}

        </VStack>
      </Container>
    </>
  );
} 