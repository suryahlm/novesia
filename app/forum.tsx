import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ForumScreen() {
  const router = useRouter();
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Discussion Forum</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <Ionicons name="chatbubbles-outline" size={80} color="#1e1e2e" />
        <Text style={styles.heading}>Coming Soon!</Text>
        <Text style={styles.desc}>
          Forum feature is under development. Coming soon for the Novesia community.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: { 
    paddingTop: 60, 
    paddingBottom: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: '#fff' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  heading: { fontSize: 24, fontWeight: '800', color: '#d4a843', marginTop: 24 },
  desc: { fontSize: 14, color: '#475569', marginTop: 12, textAlign: 'center', lineHeight: 22 },
});
