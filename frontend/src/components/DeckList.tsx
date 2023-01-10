import React, { useCallback, useMemo } from 'react';
import { Box, Icon, Text, Link, ButtonGroup, Flex, IconButton, List, ListItem, SimpleGrid, useBreakpointValue, useColorMode, Tooltip, GridItem, Grid } from '@chakra-ui/react';
import { map } from 'lodash';
import { t } from '@lingui/macro';
import NextLink from 'next/link';
import { FaComment, FaEdit, FaHeart, FaShareAlt, FaTrash } from 'react-icons/fa';
import { SlCalender } from 'react-icons/sl';

import { DeckFragment, DeckWithCampaignFragment, SearchDeckFragment, useDeleteDeckMutation } from '../generated/graphql/apollo-schema';
import { CardsMap } from '../lib/hooks';
import { useAuth } from '../lib/AuthContext';
import { RoleImage } from './CardImage';
import { DeckDescription, MiniAspect } from './Deck';
import DeckProblemComponent from './DeckProblemComponent';
import CoreIcon from '../icons/CoreIcon';
import { DeckError } from '../types/types';
import useDeleteDialog from './useDeleteDialog';
import { useTheme } from '../lib/ThemeContext';
import { useLocale } from '../lib/TranslationProvider';
import UserLink from './UserLink';

export function DeckRow({ deck, roleCards, onDelete }: {
  deck: DeckWithCampaignFragment;
  roleCards: CardsMap;
  onDelete: (deck: DeckFragment) => void;
}) {
  const { colorMode } = useColorMode();
  const { authUser } = useAuth();
  const doDelete = useCallback(() => {
    onDelete(deck);
  }, [onDelete, deck]);
  const buttonOrientation = useBreakpointValue<'vertical' | 'horizontal'>(['vertical', 'vertical', 'horizontal']);
  const problem = !!deck.meta.problem && Array.isArray(deck.meta.problem) ? (deck.meta.problem as DeckError[])  : undefined;
  const role = useMemo(() => {
    return typeof deck.meta.role === 'string' && roleCards[deck.meta.role];
  }, [deck.meta, roleCards]);
  const { colors } = useTheme();

  return (
    <ListItem paddingTop={3} paddingBottom={3} borderBottomColor={colors.divider} borderBottomWidth="1px">
      <Flex direction="column">
        <Flex direction="row">
          <Flex flex={[1.2, 1.25, 1.5, 2]} direction="row" alignItems="flex-start" as={NextLink} href={`/decks/view/${deck.id}`}>
            { !!role && !!role.imagesrc && <RoleImage size="large" name={role.name} url={role.imagesrc} /> }
            <SimpleGrid columns={2} marginRight={2} width="80px" minWidth="80px">
              <MiniAspect aspect="AWA" value={deck.awa} />
              <MiniAspect aspect="SPI" value={deck.spi} />
              <MiniAspect aspect="FIT" value={deck.fit} />
              <MiniAspect aspect="FOC" value={deck.foc} />
            </SimpleGrid>
            <Flex direction="column">
              <Text fontSize={['md', 'lg']}>{deck.name}</Text>
              <Flex direction="column" display={['none', 'block']}>
                { !!deck.campaign && <Flex direction="row" alignItems="center"><CoreIcon icon="guide" size={18} /><Link marginLeft={1} as={NextLink} href={`/campaigns/${deck.campaign.id}`}>{deck.campaign.name}</Link></Flex>}
                <DeckDescription fontSize={['xs', 'sm']}deck={deck} roleCards={roleCards} />
                { !!problem && <DeckProblemComponent errors={problem} limit={1} />}
              </Flex>
            </Flex>
          </Flex>
          <Flex marginLeft={1} direction="row" alignItems="flex-start" justifyContent="space-between">
            { authUser?.uid === deck.user_id && (
              <ButtonGroup marginLeft={[1, 2, "2em"]} orientation={buttonOrientation || 'horizontal'}>
                <IconButton aria-label={t`Edit`} color={`${colorMode}.lightText`} icon={<FaEdit />} as={NextLink} href={`/decks/edit/${deck.id}`} />
                <IconButton aria-label={t`Delete`} color="red.400" icon={<FaTrash />} onClick={doDelete} />
              </ButtonGroup>
            )}
          </Flex>
        </Flex>
        <Flex direction="column" display={['block', 'none']}>
          { !!deck.campaign && <Flex direction="row" alignItems="center"><CoreIcon icon="guide" size={18} /><Link marginLeft={1} as={NextLink} href={`/campaigns/${deck.campaign.id}`}>{deck.campaign.name}</Link></Flex>}
          <DeckDescription fontSize={['xs', 's', 'm']}deck={deck} roleCards={roleCards} />
          { !!problem && <DeckProblemComponent errors={problem} limit={1} />}
        </Flex>
      </Flex>
    </ListItem>
  );
}

function deleteDeckMessage(d: DeckFragment) {
  return t`Are you sure you want to delete the "${d.name}" deck?`;
}

export default function DeckList({
  roleCards,
  decks,
  refetch,
}: {
  decks: DeckWithCampaignFragment[] | undefined;
  roleCards: CardsMap;
  refetch: () => void;
}) {
  const [doDelete] = useDeleteDeckMutation();
  const deleteDeck = useCallback(async(d: DeckFragment) => {
    const r = await doDelete({
      variables: {
        id: d.id,
      },
    });
    if (r.errors?.length) {
      return r.errors[0].message;
    }
    refetch();
    return undefined;
  }, [doDelete, refetch]);
  const [onDelete, deleteDialog] = useDeleteDialog(
    t`Delete deck?`,
    deleteDeckMessage,
    deleteDeck
  );
  if (!decks?.length) {
    return <Text>{t`You don't seem to have any decks.`}</Text>
  }
  return (
    <>
      <List>
        { map(decks, deck => (
          <DeckRow
            key={deck.id}
            deck={deck}
            roleCards={roleCards}
            onDelete={onDelete}
          />
        )) }
      </List>
      { deleteDialog }
    </>
  );
}


export function SearchDeckRow({ deck, roleCards, last }: {
  deck: SearchDeckFragment;
  roleCards: CardsMap;
  last?: boolean;
}) {
  const { i18n } = useLocale();
  const role = useMemo(() => {
    return typeof deck.meta.role === 'string' && roleCards[deck.meta.role];
  }, [deck.meta, roleCards]);
  const { colors } = useTheme();
  const socialProof = useMemo(() => {
    return (
      <Flex direction="row" justifyContent="flex-end">
        <SimpleGrid columns={[1, 3]} marginLeft={2} marginRight={2} spacingX={2} spacingY={1}>
          <Box>
            <Tooltip label={t`Likes`}>
              <Flex direction="row" alignItems="center" minWidth="45px" justifyContent="flex-end">
                <Icon as={FaHeart} size={24} color="red.500" />
                <Text marginLeft={1}>{deck.like_count || 0}</Text>
              </Flex>
            </Tooltip>
          </Box>
          <Box>
            <Tooltip label={t`Comments`}>
              <Flex direction="row" alignItems="center" minWidth="45px" justifyContent="flex-end">
                <Icon as={FaComment} size={24} color="blue.500" />
                <Text marginLeft={1}>{deck.comment_count || 0}</Text>
              </Flex>
            </Tooltip>
          </Box>
          <Box>
            <Tooltip label={t`Copies`}>
              <Flex direction="row" alignItems="center" minWidth="45px" justifyContent="flex-end">
                <Icon as={FaShareAlt} size={24} color="yellow.500" />
                <Text marginLeft={1}>{deck.copy_count || 0}</Text>
              </Flex>
            </Tooltip>
          </Box>
        </SimpleGrid>
      </Flex>
    );
  }, [deck.like_count, deck.copy_count, deck.comment_count]);
  return (
    <ListItem paddingTop={3} paddingBottom={3} borderBottomColor={colors.divider} borderBottomWidth={last ? undefined : '1px'}>
      <Flex direction="column">
        <Flex display={['block', 'none']}>
          <Grid templateColumns="repeat(6, 1fr)">
            <GridItem colSpan={5}>
              <Text fontSize="lg">{deck.name}</Text>
            </GridItem>
            <GridItem colSpan={1}>
              { !!deck.created_at && (
                <Flex direction="row" alignItems="center" justifyContent="flex-end">
                  <Icon as={SlCalender} size="20" />
                  <Text fontSize="sm" marginLeft={1}>
                    { i18n?.date(deck.created_at, { dateStyle: 'short' }) }
                  </Text>
                </Flex>
              ) }
            </GridItem>
          </Grid>
        </Flex>
        <Flex direction="row" alignItems="flex-start">
          <Flex flex={4} direction="row" alignItems="flex-start" as={NextLink} href={`/decks/view/${deck.id}`}>
            { !!role && !!role.imagesrc && <RoleImage name={role.name} url={role.imagesrc} size="large" /> }
            <SimpleGrid columns={2} width="80px" minWidth="80px">
              <MiniAspect aspect="AWA" value={deck.awa} />
              <MiniAspect aspect="SPI" value={deck.spi} />
              <MiniAspect aspect="FIT" value={deck.fit} />
              <MiniAspect aspect="FOC" value={deck.foc} />
            </SimpleGrid>
            <Flex direction="column" marginLeft={2}>
              <Text display={['none', 'block']} fontSize="md">{deck.name}</Text>
              <DeckDescription fontSize="xs" deck={deck} roleCards={roleCards} />
              <UserLink user={deck.user} />
            </Flex>
          </Flex>
          <Flex flex={[0.6, 1.5, 1]} direction="column">
            { !!deck.created_at && (
              <Flex display={['none', 'flex']} direction="row" alignItems="center" justifyContent="flex-end" marginBottom={1}>
                <Icon as={SlCalender} size="20" />
                <Text fontSize="sm" marginLeft={1}>
                  { i18n?.date(deck.created_at, { dateStyle: 'short' }) }
                </Text>
              </Flex>
            ) }
            { socialProof }
          </Flex>
        </Flex>
      </Flex>
    </ListItem>
  );
}

interface SearchDeckListProps {
  decks: SearchDeckFragment[] | undefined;
  roleCards: CardsMap;
  emptyMessage: string;
}
export function SearchDeckList({ roleCards, decks, emptyMessage }: SearchDeckListProps) {
  if (!decks?.length) {
    return <Text>{emptyMessage}</Text>
  }
  return (
    <List>
      { map(decks, (deck, index) => (
        <SearchDeckRow
          key={deck.id}
          deck={deck}
          roleCards={roleCards}
          last={index === decks.length - 1}
        />
      )) }
    </List>
  );
}