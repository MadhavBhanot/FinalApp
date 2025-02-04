import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Platform,
  BackHandler,
  Keyboard,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';

interface SearchOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  searchValue: string;
  onSearchChange: (text: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function SearchOverlay({ 
  isVisible, 
  onClose, 
  searchValue, 
  onSearchChange 
}: SearchOverlayProps) {
  const { user } = useUser();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      translateY.setValue(-100);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          mass: 0.8,
          stiffness: 100,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isVisible]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        if (Platform.OS === 'android') {
          StatusBar.setHidden(true);
        }
        setIsKeyboardVisible(true);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        if (Platform.OS === 'android') {
          StatusBar.setHidden(false);
        }
        setIsKeyboardVisible(false);
      }
    );

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isVisible) {
        if (isKeyboardVisible) {
          Keyboard.dismiss();
          return true;
        } else {
          onClose();
          return true;
        }
      }
      return false;
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      backHandler.remove();
    };
  }, [isVisible, isKeyboardVisible]);

  if (!isVisible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }]
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.innerContainer} 
        activeOpacity={1}
        onPress={() => Keyboard.dismiss()}
      >
        <View style={styles.searchBar}>
          {/* Profile Picture */}
          <View style={styles.profileContainer}>
            {user?.imageUrl ? (
              <Image 
                source={{ uri: user.imageUrl }} 
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Text style={styles.profilePlaceholderText}>
                  {user?.firstName?.[0] || '?'}
                </Text>
              </View>
            )}
          </View>

          {/* Search Input Container */}
          <View style={styles.inputContainer}>
            <Ionicons 
              name="search" 
              size={20} 
              color="#666" 
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Search"
              placeholderTextColor="#666"
              value={searchValue}
              onChangeText={onSearchChange}
              autoFocus
            />
            {searchValue.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => onSearchChange('')}
              >
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    zIndex: 1000,
  },
  innerContainer: {
    paddingTop: Platform.OS === 'ios' ? 50 : 35,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileContainer: {
    width: 36,
    height: 36,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    backgroundColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePlaceholderText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    flex: 1,
    height: 36,
    backgroundColor: '#262626',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    padding: 0,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
}); 