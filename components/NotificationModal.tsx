import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity,
  ScrollView,
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Notification {
  id: string;
  type: 'post' | 'job';
  title: string;
  subtitle: string;
  time: string;
  read: boolean;
}

interface NotificationModalProps {
  isVisible: boolean;
  onClose: () => void;
}

type TabType = 'ALL' | 'JOBS' | 'POSTS';

export function NotificationModal({ isVisible, onClose }: NotificationModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('ALL');

  // Dummy notifications data
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'post',
      title: 'John Doe liked your post',
      subtitle: 'Status Update: xxxxx',
      time: '20 sec',
      read: false
    },
    {
      id: '2',
      type: 'job',
      title: 'Company Name • Job Posting',
      subtitle: 'Status Update: xxxxx',
      time: '2h ago',
      read: false
    },
    // Add more notifications...
  ];

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'JOBS') return notification.type === 'job';
    if (activeTab === 'POSTS') return notification.type === 'post';
    return true;
  });

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {(['ALL', 'JOBS', 'POSTS'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today Section */}
        <ScrollView style={styles.notificationsContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TODAY</Text>
            {filteredNotifications.map(notification => (
              <TouchableOpacity 
                key={notification.id} 
                style={styles.notificationItem}
              >
                <View style={styles.notificationIcon}>
                  <View style={styles.iconCircle} />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>
                    {notification.title}
                  </Text>
                  <Text style={styles.notificationSubtitle}>
                    {notification.subtitle}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {notification.time}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Yesterday Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>YESTERDAY</Text>
            {/* Similar notification items */}
          </View>

          {/* 7 Days Ago Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7 DAYS AGO</Text>
            {/* Similar notification items */}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
  },
  tabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  notificationsContainer: {
    flex: 1,
  },
  section: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 12,
    paddingLeft: 4,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#222',
    borderRadius: 12,
    marginBottom: 8,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  notificationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  notificationTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  notificationSubtitle: {
    color: '#666',
    fontSize: 13,
    marginBottom: 4,
  },
  notificationTime: {
    color: '#666',
    fontSize: 12,
  },
}); 