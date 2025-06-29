import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const Header: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { name: 'Catalogue', route: '/catalogue' },
    { name: 'Leaderboard', route: '/leaderboard' },
    { name: 'Feedback', route: '/feedback' },
    { name: 'Profile', route: '/profile' },
  ];

  const isActiveTab = (route: string) => {
    return pathname.startsWith(route);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My App</Text>
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.route}
            style={[
              styles.tab,
              isActiveTab(tab.route) && styles.activeTab,
            ]}
            onPress={() => router.push(tab.route as any)}
          >
            <Text
              style={[
                styles.tabText,
                isActiveTab(tab.route) && styles.activeTabText,
              ]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default Header;