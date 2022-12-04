import React from 'react';
import { Box, Text } from '@chakra-ui/react';

import CardList from '../../components/CardList';

export default function CardPage() {
  return (
    <Box
      maxW="64rem"
      marginX="auto"
      py={{ base: "3rem", lg: "4rem" }}
      px={{ base: "1rem", lg: "0" }}
    >
      <Text>Coming soon</Text>
    </Box>
  );
}