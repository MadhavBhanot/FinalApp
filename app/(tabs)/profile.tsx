import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, ScrollView, Dimensions, Modal, TextInput, Alert } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

const WINDOW_WIDTH = Dimensions.get('window').width;

export default function Profile() {
  const { user, isLoaded } = useUser();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isInterestsModalVisible, setIsInterestsModalVisible] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState(['Tech', 'Productivity']);
  const [isEditBioModalVisible, setIsEditBioModalVisible] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const AVAILABLE_INTERESTS = [
    { id: '1', name: 'Tech', icon: 'laptop-outline' },
    { id: '2', name: 'Productivity', icon: 'trending-up-outline' },
    { id: '3', name: 'Reading', icon: 'book-outline' },
    { id: '4', name: 'Fitness', icon: 'fitness-outline' },
    { id: '5', name: 'Coding', icon: 'code-slash-outline' },
    { id: '6', name: 'Design', icon: 'color-palette-outline' },
    { id: '7', name: 'Business', icon: 'briefcase-outline' },
    { id: '8', name: 'Writing', icon: 'create-outline' },
    { id: '9', name: 'Music', icon: 'musical-notes-outline' },
    { id: '10', name: 'Art', icon: 'brush-outline' },
  ];

  const handleUpdateBio = async () => {
    if (!user) return;
    
    try {
      await user.update({
        unsafeMetadata: { bio: newBio.trim() },
      });
      
      Alert.alert(
        'Success',
        'Bio updated successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              setIsEditBioModalVisible(false);
            },
          },
        ],
      );
    } catch (error: any) {
      console.error('Bio update error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to update bio. Please try again.'
      );
    }
  };

  const handleProfileImagePress = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploadingImage(true);
        try {
          const manipulatedImage = await ImageManipulator.manipulateAsync(
            result.assets[0].uri,
            [
              { resize: { width: 500, height: 500 } }
            ],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
          );

          await user?.setProfileImage({
            file: {
              name: 'profile-image.jpg',
              uri: manipulatedImage.uri,
              type: 'image/jpeg',
            }
          });

          Alert.alert('Success', 'Profile photo updated successfully');
        } catch (error: any) {
          console.error('Image upload error:', error);
          Alert.alert('Error', 'Failed to update profile photo');
        } finally {
          setIsUploadingImage(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setIsMenuVisible(true)}
          >
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.profileContent}>
            <View style={styles.profileImageContainer}>
              <TouchableOpacity 
                style={styles.profileImageContainer}
                onPress={handleProfileImagePress}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator color="#fff" size="small" />
                  </View>
                ) : (
                  <>
                    {user?.imageUrl ? (
                      <Image 
                        source={{ uri: user.imageUrl }} 
                        style={styles.profileImage}
                      />
                    ) : (
                      <View style={styles.profileImagePlaceholder}>
                        <Text style={styles.profileImagePlaceholderText}>
                          {user?.firstName?.[0] || user?.username?.[0] || '?'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.editImageOverlay}>
                      <Ionicons name="camera" size={20} color="#fff" />
                    </View>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.username}>
              {user?.username || 'Username'}
            </Text>
            <Text style={styles.bio}>
              {user?.unsafeMetadata?.bio || 'No bio yet'}
              <TouchableOpacity 
                onPress={() => {
                  setNewBio(user?.unsafeMetadata?.bio as string || '');
                  setIsEditBioModalVisible(true);
                }}
                style={styles.editBioButton}
              >
                <Ionicons name="pencil" size={14} color="#6C63FF" style={styles.editBioIcon} />
              </TouchableOpacity>
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>247</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1.2K</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>4.5K</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
        </View>

        {/* Activity Section */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <Ionicons name="create-outline" size={24} color="#6C63FF" />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Started learning React Native</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <Ionicons name="trophy-outline" size={24} color="#4CAF50" />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Completed 30 day coding challenge</Text>
                <Text style={styles.activityTime}>2 days ago</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Interests Section */}
        <View style={styles.interestsSection}>
          <View style={styles.interestsHeader}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <TouchableOpacity 
              style={styles.editInterests}
              onPress={() => setIsInterestsModalVisible(true)}
            >
              <Ionicons name="pencil" size={20} color="#6C63FF" />
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.interestsScroll}
          >
            {selectedInterests.map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <HamburgerMenu 
        isVisible={isMenuVisible} 
        onClose={() => setIsMenuVisible(false)} 
      />

      <Modal
        visible={isInterestsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsInterestsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Interests</Text>
              <TouchableOpacity 
                onPress={() => setIsInterestsModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.interestsList}>
              {AVAILABLE_INTERESTS.map((interest) => (
                <TouchableOpacity
                  key={interest.id}
                  style={[
                    styles.interestOption,
                    selectedInterests.includes(interest.name) && styles.selectedInterest
                  ]}
                  onPress={() => {
                    if (selectedInterests.includes(interest.name)) {
                      setSelectedInterests(selectedInterests.filter(i => i !== interest.name));
                    } else {
                      setSelectedInterests([...selectedInterests, interest.name]);
                    }
                  }}
                >
                  <Ionicons 
                    name={interest.icon as any} 
                    size={24} 
                    color={selectedInterests.includes(interest.name) ? '#fff' : '#6C63FF'} 
                  />
                  <Text style={[
                    styles.interestOptionText,
                    selectedInterests.includes(interest.name) && styles.selectedInterestText
                  ]}>
                    {interest.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isEditBioModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditBioModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Bio</Text>
              <TouchableOpacity 
                onPress={() => setIsEditBioModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.bioInputContainer}>
              <TextInput
                style={styles.bioInput}
                multiline
                maxLength={150}
                placeholder="Write something about yourself..."
                placeholderTextColor="#666"
                value={newBio}
                onChangeText={setNewBio}
              />
              <Text style={styles.bioCharCount}>
                {newBio.length}/150
              </Text>
            </View>

            <View style={styles.bioButtonContainer}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setIsEditBioModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.updateButton}
                onPress={handleUpdateBio}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    paddingTop: 50,
  },
  menuButton: {
    padding: 8,
    alignSelf: 'flex-end',
  },
  profileContent: {
    alignItems: 'center',
    marginTop: 10,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#6C63FF',
    overflow: 'hidden',
    marginBottom: 20,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    color: '#fff',
    fontSize: 42,
    fontWeight: 'bold',
  },
  username: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  bio: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.8,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: '#1E1E1E',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 14,
    marginTop: 5,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#333',
    alignSelf: 'center',
  },
  activitySection: {
    padding: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  activityList: {
    gap: 15,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 12,
  },
  activityContent: {
    marginLeft: 15,
    flex: 1,
  },
  activityText: {
    color: '#fff',
    fontSize: 16,
  },
  activityTime: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  interestsSection: {
    padding: 20,
  },
  interestsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  editInterests: {
    padding: 8,
  },
  interestsScroll: {
    flexDirection: 'row',
  },
  interestTag: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  interestText: {
    color: '#fff',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
  },
  modalBlur: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: WINDOW_WIDTH * 0.75,
    height: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  interestsList: {
    paddingBottom: 20,
  },
  interestOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#2A2A2A',
  },
  selectedInterest: {
    backgroundColor: '#6C63FF',
  },
  interestOptionText: {
    color: '#6C63FF',
    fontSize: 16,
    marginLeft: 15,
  },
  selectedInterestText: {
    color: '#fff',
  },
  editBioButton: {
    marginLeft: 8,
  },
  editBioIcon: {
    marginTop: 2,
  },
  bioInputContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  bioInput: {
    color: '#fff',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  bioCharCount: {
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
  bioButtonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#444',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButton: {
    flex: 1,
    backgroundColor: '#6C63FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 