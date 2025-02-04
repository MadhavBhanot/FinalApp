import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  ScrollView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface JobDetailsModalProps {
  isVisible: boolean;
  onClose: () => void;
  job: {
    title: string;
    company: string;
    salary: string;
    postedAt: string;
    logo: string;
    description?: string;
  };
}

export function JobDetailsModal({ isVisible, onClose, job }: JobDetailsModalProps) {
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Job Header */}
          <View style={styles.jobHeader}>
            <View style={styles.companyLogo}>
              <Image 
                source={{ uri: job.logo }} 
                style={styles.logo}
              />
            </View>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text style={styles.companyName}>{job.company}</Text>
            <Text style={styles.salary}>{job.salary}</Text>
            <Text style={styles.postedTime}>Posted at: {job.postedAt}</Text>
          </View>

          {/* Job Description */}
          <ScrollView style={styles.descriptionContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Job Description:</Text>
              <Text style={styles.description}>
                {job.description || 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard.'}
              </Text>
            </View>
          </ScrollView>

          {/* Apply Button */}
          <TouchableOpacity style={styles.applyButton}>
            <Text style={styles.applyButtonText}>APPLY NOW</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '70%',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: Platform.OS === 'ios' ? 40 : 20,
    zIndex: 1,
  },
  jobHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  companyLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
    overflow: 'hidden',
    marginBottom: 16,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  companyName: {
    fontSize: 16,
    color: '#999',
    marginBottom: 8,
  },
  salary: {
    fontSize: 18,
    color: '#6C63FF',
    fontWeight: '600',
    marginBottom: 8,
  },
  postedTime: {
    fontSize: 14,
    color: '#666',
  },
  descriptionContainer: {
    flex: 1,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#999',
    lineHeight: 24,
  },
  applyButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 