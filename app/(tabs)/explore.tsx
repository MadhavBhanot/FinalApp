import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { JobDetailsModal } from '@/components/JobDetailsModal';

const categories = [
  { id: '1', name: 'DESIGN', icon: 'brush-outline' },
  { id: '2', name: 'DEVELOPMENT', icon: 'code-slash-outline' },
  { id: '3', name: 'MARKETING', icon: 'trending-up-outline' },
  { id: '4', name: 'WRITING', icon: 'create-outline' },
  { id: '5', name: 'VIDEO', icon: 'videocam-outline' },
  { id: '6', name: 'MUSIC', icon: 'musical-notes-outline' },
  { id: '7', name: 'BUSINESS', icon: 'briefcase-outline' },
  { id: '8', name: 'LIFESTYLE', icon: 'heart-outline' },
];

const featuredJobs = [
  {
    id: '1',
    title: 'UI/UX Designer',
    company: 'Design Studio Inc.',
    salary: '$80k - $100k',
    postedAt: '5 weeks ago',
    logo: 'https://picsum.photos/100',
  },
  {
    id: '2',
    title: 'Frontend Developer',
    company: 'Tech Solutions Ltd.',
    salary: '$90k - $120k',
    postedAt: '2 weeks ago',
    logo: 'https://picsum.photos/101',
  },
  {
    id: '3',
    title: 'Product Manager',
    company: 'Innovation Labs',
    salary: '$110k - $140k',
    postedAt: '1 week ago',
    logo: 'https://picsum.photos/102',
  },
  {
    id: '4',
    title: 'Senior Backend Developer',
    company: 'Cloud Systems',
    salary: '$130k - $160k',
    postedAt: '3 days ago',
    logo: 'https://picsum.photos/103',
  },
  {
    id: '5',
    title: 'Mobile App Developer',
    company: 'App Innovators',
    salary: '$95k - $125k',
    postedAt: '1 day ago',
    logo: 'https://picsum.photos/104',
  },
  {
    id: '6',
    title: 'DevOps Engineer',
    company: 'Tech Giants Inc.',
    salary: '$120k - $150k',
    postedAt: '4 days ago',
    logo: 'https://picsum.photos/105',
  },
  {
    id: '7',
    title: 'Data Scientist',
    company: 'Data Analytics Co.',
    salary: '$115k - $145k',
    postedAt: '2 days ago',
    logo: 'https://picsum.photos/106',
  },
  {
    id: '8',
    title: 'Full Stack Developer',
    company: 'Web Solutions',
    salary: '$100k - $130k',
    postedAt: '6 days ago',
    logo: 'https://picsum.photos/107',
  },
];

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [selectedJob, setSelectedJob] = useState<typeof featuredJobs[0] | null>(null);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
  };

  const toggleSaveJob = (jobId: string) => {
    setSavedJobs(prev => {
      const newSaved = new Set(prev);
      if (newSaved.has(jobId)) {
        newSaved.delete(jobId);
      } else {
        newSaved.add(jobId);
      }
      return newSaved;
    });
  };

  const handleJobPress = (job: typeof featuredJobs[0]) => {
    setSelectedJob(job);
  };

  const filteredJobs = featuredJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || job.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Fixed Header */}
        <View style={styles.fixedHeader}>
          <Text style={styles.title}>JOBS</Text>
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#fff" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for jobs.."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={handleSearch}
              />
              <TouchableOpacity style={styles.filterButton}>
                <Ionicons name="filter" size={20} color="#6C63FF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}
        >
          {/* Categories Section */}
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Categories:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            >
              {categories.map((category) => (
                <TouchableOpacity 
                  key={category.id} 
                  style={[
                    styles.categoryCard,
                    selectedCategory === category.id && styles.selectedCategoryCard
                  ]}
                  onPress={() => handleCategorySelect(category.id)}
                >
                  <View style={styles.iconCircle}>
                    <Ionicons name={category.icon as any} size={24} color="#fff" />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Featured Jobs Section */}
          <View style={styles.featuredSection}>
            <Text style={styles.sectionTitle}>Featured Jobs:</Text>
            <View style={styles.jobsList}>
              {filteredJobs.map((job) => (
                <TouchableOpacity 
                  key={job.id} 
                  style={styles.jobCard}
                  onPress={() => handleJobPress(job)}
                >
                  <View style={styles.jobLogoContainer}>
                    <Image 
                      source={{ uri: job.logo }} 
                      style={styles.jobLogo}
                    />
                  </View>
                  <View style={styles.jobDetails}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <Text style={styles.companyName}>{job.company}</Text>
                    <Text style={styles.salary}>{job.salary}</Text>
                    <Text style={styles.postedTime}>{job.postedAt}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={() => toggleSaveJob(job.id)}
                  >
                    <Ionicons 
                      name={savedJobs.has(job.id) ? "bookmark" : "bookmark-outline"} 
                      size={24} 
                      color={savedJobs.has(job.id) ? "#6C63FF" : "#fff"} 
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Add Job Details Modal */}
      {selectedJob && (
        <JobDetailsModal
          isVisible={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          job={selectedJob}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
  },
  fixedHeader: {
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  searchBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 50,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: '100%',
  },
  filterButton: {
    padding: 8,
  },
  categoriesSection: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  categoriesContainer: {
    paddingRight: 32,
    gap: 12,
    flexDirection: 'row',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    marginTop: 8,
  },
  categoryCard: {
    width: 110,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    minHeight: 100,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  categoryName: {
    color: '#6C63FF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
    width: '100%',
    flexShrink: 1,
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },
  featuredSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    marginTop: 24,
  },
  jobsList: {
    gap: 12,
  },
  jobCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  jobLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  jobLogo: {
    width: '100%',
    height: '100%',
  },
  jobDetails: {
    flex: 1,
    marginLeft: 16,
  },
  jobTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  companyName: {
    color: '#999',
    fontSize: 14,
    marginBottom: 4,
  },
  salary: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  postedTime: {
    color: '#666',
    fontSize: 12,
  },
  saveButton: {
    padding: 8,
  },
  selectedCategoryCard: {
    backgroundColor: '#2a2a2a',
    borderColor: '#6C63FF',
    borderWidth: 1,
  },
}); 