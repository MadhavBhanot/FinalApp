import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useUser } from '@clerk/clerk-expo';

export const UserDebug = () => {
  const { user: backendUser, loading, error } = useCurrentUser();
  const { user: clerkUser } = useUser();

  const formatDate = (date: string | number | Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading user data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Error loading user</Text>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>User Debug Info</Text>
      
      <Text style={styles.sectionTitle}>Backend User Data:</Text>
      {backendUser ? (
        <View style={styles.dataContainer}>
          <Text>ID: {backendUser._id}</Text>
          <Text>Email: {backendUser.email}</Text>
          <Text>Username: {backendUser.username}</Text>
          <Text>Name: {backendUser.firstName} {backendUser.lastName}</Text>
          <Text>Clerk ID: {backendUser.clerkId}</Text>
          <Text>Bio: {backendUser.bio || 'No bio'}</Text>
          <Text>Followers: {backendUser.followers?.length || 0}</Text>
          <Text>Following: {backendUser.following?.length || 0}</Text>
          <Text>Posts: {backendUser.posts?.length || 0}</Text>
          <Text>Saved Posts: {backendUser.savedPosts?.length || 0}</Text>
        </View>
      ) : (
        <Text style={styles.noData}>No backend user data</Text>
      )}

      <Text style={styles.sectionTitle}>Clerk User Data:</Text>
      {clerkUser ? (
        <View style={styles.dataContainer}>
          <Text>ID: {clerkUser.id}</Text>
          <Text>Email: {clerkUser.primaryEmailAddress?.emailAddress}</Text>
          <Text>Username: {clerkUser.username}</Text>
          <Text>First Name: {clerkUser.firstName}</Text>
          <Text>Last Name: {clerkUser.lastName}</Text>
          <Text>Created: {formatDate(clerkUser.createdAt)}</Text>
          <Text>Last Updated: {formatDate(clerkUser.updatedAt)}</Text>
          {clerkUser.publicMetadata && (
            <View>
              <Text style={styles.subTitle}>Public Metadata:</Text>
              <Text>{JSON.stringify(clerkUser.publicMetadata, null, 2)}</Text>
            </View>
          )}
        </View>
      ) : (
        <Text style={styles.noData}>No Clerk user data</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#444',
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
    color: '#666',
  },
  dataContainer: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  noData: {
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  error: {
    color: 'red',
    marginBottom: 16,
  },
}); 