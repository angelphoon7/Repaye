import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  Textarea,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  HStack,
  Icon
} from '@chakra-ui/react';
import NextLink from 'next/link';
import Head from 'next/head';
import { StarIcon } from '@chakra-ui/icons'; // Using Chakra's StarIcon
import { toaster } from '../components/ui/toaster'; // Assuming you have a toaster setup

export default function SubmitReviewPage() {
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState<string | undefined>(undefined);
  const [txSig, setTxSig] = useState<string | undefined>(undefined);
  const [rating, setRating] = useState<number>(0); // 0 for no rating initially
  const [reviewText, setReviewText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (router.isReady) {
      const { restaurantName: queryRestaurantName, txSig: queryTxSig } = router.query;
      setRestaurantName(Array.isArray(queryRestaurantName) ? queryRestaurantName[0] : queryRestaurantName);
      setTxSig(Array.isArray(queryTxSig) ? queryTxSig[0] : queryTxSig);
    }
  }, [router.isReady, router.query]);

  const handleRatingChange = (valueAsString: string, valueAsNumber: number) => {
    setRating(valueAsNumber);
  };

  const handleSubmitReview = async () => {
    if (!restaurantName || !txSig) {
      toaster.create({
        title: 'Error',
        description: 'Missing restaurant name or transaction ID.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    if (rating === 0) {
        toaster.create({
            title: 'Missing Rating',
            description: 'Please provide a star rating.',
            status: 'warning',
            duration: 3000,
            isClosable: true,
        });
        return;
    }

    setIsSubmitting(true);
    // TODO: Implement actual on-chain review submission here
    // For now, we'll simulate a delay and show a success message
    try {
      console.log('Submitting review:', { restaurantName, txSig, rating, reviewText });
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500)); 

      toaster.create({
        title: 'Review Submitted!',
        description: `Thanks for reviewing ${restaurantName}. Rating: ${rating}, Review: ${reviewText}`,
        status: 'success',
        duration: 7000,
        isClosable: true,
      });
      // Optionally, redirect the user or clear the form
      router.push('/'); // Redirect to home page after review
    } catch (error: any) {
      toaster.create({
        title: 'Submission Failed',
        description: error.message || 'Could not submit review.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!restaurantName) {
    return (
      <Container centerContent py={10}>
        <Text>Loading review details or invalid link...</Text>
      </Container>
    );
  }

  return (
    <>
      <Head>
        <title>Submit Review for {restaurantName} - Repaye</title>
      </Head>
      <Container maxW="container.md" py={10}>
        <VStack spacing={6} align="stretch">
          <Heading as="h1" size="xl" textAlign="center">
            Rate & Review: {restaurantName}
          </Heading>
          
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
            <FormControl isRequired mb={4}>
              <FormLabel htmlFor='rating'>Your Rating (1-5 Stars)</FormLabel>
              <HStack spacing={1}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Icon 
                    key={star}
                    as={StarIcon} 
                    w={8} h={8} 
                    color={star <= rating ? "yellow.400" : "gray.300"}
                    onClick={() => setRating(star)}
                    cursor="pointer"
                  />
                ))}
              </HStack>
            </FormControl>

            <FormControl mb={4}>
              <FormLabel htmlFor='reviewText'>Your Review (Optional)</FormLabel>
              <Textarea
                id='reviewText'
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={`What did you think of your visit to ${restaurantName}?`}
                size='lg'
                minHeight="150px"
              />
            </FormControl>

            <Button 
              colorScheme="teal" 
              size="lg" 
              w="full" 
              onClick={handleSubmitReview}
              isLoading={isSubmitting}
              disabled={rating === 0}
            >
              Submit Review
            </Button>
          </Box>

          <NextLink href="/" passHref>
            <Button as="a" variant="outline" size="md" w="full" mt={2}>
              Maybe Later
            </Button>
          </NextLink>

        </VStack>
      </Container>
    </>
  );
} 