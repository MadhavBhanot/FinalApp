import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DirectMessageSettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
  currentValue: string;
  onValueChange: (value: string) => void;
}

export function DirectMessageSettingsModal({ 
  isVisible, 
  onClose, 
  currentValue,
  onValueChange
}: DirectMessageSettingsModalProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        mass: 0.6,
        stiffness: 250,
        velocity: 8
      }).start();
    } else {
      Animated.spring(translateY, {
        toValue: SCREEN_HEIGHT,
        useNativeDriver: true,
        damping: 20,
        mass: 0.6,
        stiffness: 250,
        velocity: 8
      }).start();
    }
  }, [isVisible]);

  const options = [
    {
      value: 'everyone',
      label: 'Everyone',
      description: 'Anyone can send you messages',
      icon: 'globe-outline',
      color: '#2196F3',
      bgColor: 'rgba(33, 150, 243, 0.1)'
    },
    {
      value: 'followers',
      label: 'Followers',
      description: 'Only your followers can message you',
      icon: 'people-outline',
      color: '#FF5252',
      bgColor: 'rgba(255, 82, 82, 0.1)'
    },
    {
      value: 'following',
      label: 'People You Follow',
      description: 'Only people you follow back can message you',
      icon: 'person-add-outline',
      color: '#4CAF50',
      bgColor: 'rgba(76, 175, 80, 0.1)'
    }
  ];

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY }],
            }
          ]}
        >
          <View style={styles.content}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={styles.title}>Direct Messages</Text>
            </View>
            <ScrollView style={styles.optionsList}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionItem,
                    currentValue === option.value && {
                      backgroundColor: option.bgColor,
                      borderColor: option.color,
                      borderWidth: 1,
                    }
                  ]}
                  onPress={() => {
                    onValueChange(option.value);
                  }}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.optionHeader}>
                      <Ionicons 
                        name={option.icon as any} 
                        size={24} 
                        color={currentValue === option.value ? option.color : '#fff'} 
                      />
                      <Text style={[
                        styles.optionLabel,
                        currentValue === option.value && { color: option.color }
                      ]}>
                        {option.label}
                      </Text>
                    </View>
                    <Text style={[
                      styles.optionDescription,
                      currentValue === option.value && { color: 'rgba(255, 255, 255, 0.7)' }
                    ]}>
                      {option.description}
                    </Text>
                  </View>
                  {currentValue === option.value && (
                    <Ionicons name="checkmark" size={24} color={option.color} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    padding: 20,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  optionsList: {
    maxHeight: 400,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  selectedOption: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  optionContent: {
    flex: 1,
    marginRight: 16,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    marginLeft: 36,
    marginTop: 2,
  },
}); 