import React, { useCallback, useMemo } from 'react';
import { List, ListItem, IconButton, ButtonGroup, Text, Flex } from '@chakra-ui/react';
import { filter, flatMap, map } from 'lodash';
import { t } from '@lingui/macro';
import { CheckIcon, CloseIcon, PlusSquareIcon } from '@chakra-ui/icons';

import ListHeader from './ListHeader';
import { UserInfoFragment, UserProfileFragment } from '../generated/graphql/apollo-schema';
import useFirebaseFunction from '../lib/useFirebaseFunction';
import FriendSearch from './FriendSearch';


interface Props {
  profile?: UserProfileFragment;
  removeIds?: string[];
  refreshProfile: () => void;
  friendActions?: FriendAction[];
}

export interface FriendAction {
  title: string;
  icon: 'check' | 'remove' | 'add';
  onPress: (userId: string) => void;
}

function FriendActionButton({ userId, action: { onPress, title, icon } }: { userId: string; action: FriendAction }) {
  const onClick = useCallback(() => onPress(userId), [onPress, userId]);
  const icons = {
    check: <CheckIcon />,
    remove: <CloseIcon />,
    add: <PlusSquareIcon />,
  }
  return (
    <IconButton aria-label={title} onClick={onClick} icon={icons[icon]} />
  );
}

export interface BasicUser {
  id: string;
  handle?: string;
}

export function FriendLine({ user, actions }: { user: BasicUser | UserInfoFragment; actions: FriendAction[]; }) {
  return (
    <ListItem paddingTop={2} paddingBottom={2} borderBottomWidth="1px" borderBottomColor="gray.100">
      <Flex direction="row" justifyContent="space-between">
        <Text padding={2}>{user.handle || user.id}</Text>
        <ButtonGroup>
          { map(actions, (a, idx) => <FriendActionButton key={idx} userId={user.id} action={a} /> ) }
        </ButtonGroup>
      </Flex>
    </ListItem>
  );
}

function FriendSection({ users, title, actions, removeIds, children }: {
  users: UserInfoFragment[];
  title: string;
  actions: FriendAction[];
  removeIds?: string[];
  children?: React.ReactNode;
}) {
  const theUsers = useMemo(() => {
    if (!removeIds) {
      return users;
    }
    const removeSet = new Set(removeIds);
    return filter(users, u => !removeSet.has(u.id));
  }, [users, removeIds]);
  if (!theUsers.length && !children) {
    return null;
  }
  return (
    <List>
      <ListHeader title={title} />
      { map(theUsers, user => <FriendLine key={user.id} user={user} actions={actions} />) }
      { children }
    </List>
  )
}

export default function FriendRequestsComponent({
  profile,
  refreshProfile,
  removeIds,
  friendActions,
}: Props) {
  const [updateFriendRequest, error] = useFirebaseFunction('social-updateFriendRequest');
  const onSubmit = useCallback(async (userId: string, action: 'request' | 'revoke') => {
    await updateFriendRequest({ userId, action });
    refreshProfile();
    return undefined;
  }, [updateFriendRequest, refreshProfile]);
  const sendFriendRequest = useCallback((userId: string) => {
    return onSubmit(userId, 'request');
  }, [onSubmit]);
  const revokeFriendRequest = useCallback((userId: string) => {
    return onSubmit(userId, 'revoke');
  }, [onSubmit]);
  const [receivedRequests, sentRequests, friends] = useMemo(() => {
    if (!profile || !profile.friends) {
      return [[], [], [], []];
    }
    const received = flatMap(profile.received_requests, friend => {
      if (friend.user) {
        return [friend.user];
      }
      return [];
    });
    const sent = flatMap(profile.sent_requests, friend => {
      if (friend.user) {
        return [friend.user];
      }
      return [];
    });
    const friends= flatMap(profile.friends, friend => {
      if (friend.user) {
        return [friend.user];
      }
      return [];
    });
    return [received, sent, friends];
  }, [profile]);
  if (!profile) {
    return null;
  }
  return (
    <List>
      <FriendSection
        key="received"
        title={t`Friend Requests`}
        users={receivedRequests}
        actions={[
          {
            title: t`Accept`,
            onPress: sendFriendRequest,
            icon: 'check',
          },
          {
            title: t`Reject`,
            onPress: revokeFriendRequest,
            icon: 'remove',
          },
        ]}
      />
      <FriendSection
        key="sent"
        title={t`Pending Requests`}
        users={sentRequests}
        actions={[{
          title: t`Revoke`,
          onPress: revokeFriendRequest,
          icon: 'remove',
        }]}
      />
      <FriendSection
        key="friends"
        title={t`Friends`}
        users={friends}
        removeIds={removeIds}
        actions={friendActions || [{
          title: t`Revoke`,
          onPress: revokeFriendRequest,
          icon: 'remove',
        }]}
      />
      <FriendSearch sendFriendRequest={sendFriendRequest} />
    </List>
  );
}
