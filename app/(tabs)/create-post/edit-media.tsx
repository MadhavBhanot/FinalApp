import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ScrollView } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useState, useRef } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import Slider from '@react-native-community/slider'
import * as ImageManipulator from 'expo-image-manipulator';

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface Filter {
  name: string
  icon: keyof typeof Ionicons.glyphMap
  value: number
  min: number
  max: number
  defaultValue: number
}

export default function EditMedia() {
  const params = useLocalSearchParams()
  const imageUri = decodeURIComponent(params.imageUri as string)
  const [editedImage, setEditedImage] = useState(imageUri)
  const [selectedFilterId, setSelectedFilterId] = useState<number | null>(null)

  const [filters, setFilters] = useState<Filter[]>([
    { name: 'Brightness', icon: 'sunny', value: 100, min: 0, max: 200, defaultValue: 100 },
    { name: 'Contrast', icon: 'contrast', value: 100, min: 0, max: 200, defaultValue: 100 },
    { name: 'Saturation', icon: 'color-palette', value: 100, min: 0, max: 200, defaultValue: 100 },
    { name: 'Exposure', icon: 'flashlight', value: 100, min: 0, max: 200, defaultValue: 100 },
    { name: 'Vibrance', icon: 'color-wand', value: 100, min: 0, max: 200, defaultValue: 100 },
    { name: 'Temperature', icon: 'thermometer', value: 0, min: -100, max: 100, defaultValue: 0 },
    { name: 'Tint', icon: 'color-filter', value: 0, min: -100, max: 100, defaultValue: 0 },
    { name: 'Highlights', icon: 'sunny-outline', value: 100, min: 0, max: 200, defaultValue: 100 },
    { name: 'Shadows', icon: 'moon', value: 100, min: 0, max: 200, defaultValue: 100 },
  ])

  const handleAdjustment = (index: number, value: number) => {
    setFilters(prev => {
      const newFilters = [...prev]
      newFilters[index].value = value
      return newFilters
    })
  }

  const getFilterStyle = () => ({
    filter: [
      `brightness(${filters[0].value / 100})`,
      `contrast(${filters[1].value}%)`,
      `saturate(${filters[2].value}%)`,
      `opacity(${filters[3].value / 100})`,
      `saturate(${filters[4].value}%)`,
      `sepia(${filters[5].value > 0 ? filters[5].value / 100 : 0})`,
      `hue-rotate(${filters[5].value < 0 ? '180deg' : '0deg'})`,
      `saturate(${filters[5].value < 0 ? Math.abs(filters[5].value) + 100 : 100}%)`,
      `hue-rotate(${filters[6].value}deg)`,
      `brightness(${filters[7].value / 100})`,
      `contrast(${filters[8].value}%)`
    ].join(' ')
  })

  const getDisplayValue = (filter: Filter) => {
    if (filter.name === 'Temperature' || filter.name === 'Tint') {
      return `${filter.value > 0 ? '+' : ''}${Math.round(filter.value)}`;
    }
    return `${Math.round(filter.value)}%`;
  }

  const handleNext = async () => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: SCREEN_WIDTH } }],
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG
        }
      );

      // Navigate to add-details within create-post
      router.push({
        pathname: "/(tabs)/create-post/add-details",  // Full path to add-details
        params: { 
          imageUri: result.uri,
          cssFilters: getFilterStyle().filter
        }
      });
    } catch (error) {
      console.error('Error saving edited image:', error);
      alert('Failed to process image. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Photo</Text>
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: editedImage }}
            style={[styles.previewImage, getFilterStyle()]}
            resizeMode="contain"
          />
        </View>

        <View style={styles.editControls}>
          {selectedFilterId !== null && (
            <View style={styles.sliderContainer}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>{filters[selectedFilterId].name}</Text>
                <Text style={styles.sliderValue}>
                  {getDisplayValue(filters[selectedFilterId])}
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={filters[selectedFilterId].min}
                maximumValue={filters[selectedFilterId].max}
                value={filters[selectedFilterId].value}
                onValueChange={(value) => handleAdjustment(selectedFilterId, value)}
                minimumTrackTintColor="#6C63FF"
                maximumTrackTintColor="#333"
                thumbTintColor="#6C63FF"
              />
            </View>
          )}
        </View>

        <View style={styles.bottomControls}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterIconsContainer}
          >
            {filters.map((filter, index) => (
              <TouchableOpacity
                key={filter.name}
                style={[
                  styles.filterIcon,
                  selectedFilterId === index && styles.filterIconActive
                ]}
                onPress={() => setSelectedFilterId(selectedFilterId === index ? null : index)}
              >
                <Ionicons 
                  name={filter.icon} 
                  size={24} 
                  color={selectedFilterId === index ? '#6C63FF' : '#fff'} 
                />
                <Text style={styles.filterIconText}>{filter.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  nextButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  editControls: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  sliderContainer: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    margin: 16,
    marginBottom: 8,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  sliderValue: {
    color: '#6C63FF',
    fontSize: 14,
  },
  bottomControls: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingVertical: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  filterIconsContainer: {
    paddingHorizontal: 16,
    gap: 24,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  filterIcon: {
    alignItems: 'center',
    opacity: 0.7,
    width: 60,
  },
  filterIconActive: {
    opacity: 1,
  },
  filterIconText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
})