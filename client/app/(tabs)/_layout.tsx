import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function TabLayout() {
  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <View style={styles.content}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' }, // Hide default tab bar since we have custom footer
          }}
        >
          <Tabs.Screen name="catalogue" />
          <Tabs.Screen name="leaderboard" />
          <Tabs.Screen name="feedback" />
          <Tabs.Screen name="profile" />
        </Tabs>
      </View>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
});