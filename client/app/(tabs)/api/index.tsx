// just here for testing the api component
// app/(tabs)/test/index.tsx - API Test Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import api from '@/components/utility/api';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  data?: any;
  error?: string;
  duration?: number;
}

const ApiTestScreen: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setResults([]);
  };

  // Your API Tests
  const testAPI = async () => {
    setLoading(true);
    clearResults();
    
    console.log('🧪 Starting API Tests...\n');

    try {
      // Test 1: Simple GET request
      const startTime1 = Date.now();
      addResult({ test: 'GET /', status: 'pending' });
      
      try {
        console.log('📡 Test 1: GET Request');
        const response1 = await api.get('/');
        
        addResult({
          test: 'GET /',
          status: 'success',
          data: response1.data,
          duration: Date.now() - startTime1
        });
        
        console.log('✅ Success:', response1.data);
        console.log('Status:', response1.status);
        console.log('---');
      } catch (error: any) {
        addResult({
          test: 'GET /',
          status: 'error',
          error: error.message,
          duration: Date.now() - startTime1
        });
        console.error('❌ Test 1 failed:', error.message);
      }

      // Test 2: Register Resident POST Request
      const startTime2 = Date.now();
      addResult({ test: 'Register Resident', status: 'pending' });
      
      try {
        console.log('📡 Test 2: Register Resident POST Request');
        const response2 = await api.post('/authentication/register/resident', {
          "userName": "Mashallah Inshallah (test)",
          "plainPassword": "ilovedinosaur123",
          "dateOfBirth": "2005-01-01 00:00:00",
          "dateOfAdmission": "2025-07-05 03:59:08.770374",
          "lastAbscondence": null
        });
        
        addResult({
          test: 'Register Resident',
          status: 'success',
          data: response2.data,
          duration: Date.now() - startTime2
        });
        
        console.log('✅ Success:', response2.data);
        console.log('---');
      } catch (error: any) {
        addResult({
          test: 'Register Resident',
          status: 'error',
          error: error.message,
          duration: Date.now() - startTime2
        });
        console.error('❌ Test 2 failed:', error.message);
      }

      // Test 3: Login as Officer
      const startTime3 = Date.now();
      addResult({ test: 'Officer Login', status: 'pending' });
      
      try {
        console.log('📡 Test 3: Login as Officer POST request');
        const response3 = await api.post('/authentication/login/officer', {
          "officerEmail": "superOfficer@gmail.com",
          "plainPassword": "ilovedinosaur123"
        });
        
        addResult({
          test: 'Officer Login',
          status: 'success',
          data: response3.data,
          duration: Date.now() - startTime3
        });
        
        console.log('✅ Success:', response3.data);
        console.log('---');
      } catch (error: any) {
        addResult({
          test: 'Officer Login',
          status: 'error',
          error: error.message,
          duration: Date.now() - startTime3
        });
        console.error('❌ Test 3 failed:', error.message);
      }

      console.log('🎉 All tests completed!');
      Alert.alert('Tests Complete', 'Check the results below and console logs');

    } catch (error: any) {
      console.error('💥 Test runner failed:', error.message);
      Alert.alert('Test Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Individual test functions
  const testGetRoot = async () => {
    const startTime = Date.now();
    addResult({ test: 'GET / (Individual)', status: 'pending' });
    
    try {
      const response = await api.get('/');
      addResult({
        test: 'GET / (Individual)',
        status: 'success',
        data: response.data,
        duration: Date.now() - startTime
      });
      Alert.alert('Success', 'GET / test passed!');
    } catch (error: any) {
      addResult({
        test: 'GET / (Individual)',
        status: 'error',
        error: error.message,
        duration: Date.now() - startTime
      });
      Alert.alert('Error', `GET / failed: ${error.message}`);
    }
  };

  const testRegisterResident = async () => {
    const startTime = Date.now();
    addResult({ test: 'Register (Individual)', status: 'pending' });
    
    try {
      const response = await api.post('/authentication/register/resident', {
        "userName": "Test User " + Date.now(),
        "plainPassword": "ilovedinosaur123",
        "dateOfBirth": "2005-01-01 00:00:00",
        "dateOfAdmission": new Date().toISOString(),
        "lastAbscondence": null
      });
      
      addResult({
        test: 'Register (Individual)',
        status: 'success',
        data: response.data,
        duration: Date.now() - startTime
      });
      Alert.alert('Success', 'Register test passed!');
    } catch (error: any) {
      addResult({
        test: 'Register (Individual)',
        status: 'error',
        error: error.message,
        duration: Date.now() - startTime
      });
      Alert.alert('Error', `Register failed: ${error.message}`);
    }
  };

  const testOfficerLogin = async () => {
    const startTime = Date.now();
    addResult({ test: 'Officer Login (Individual)', status: 'pending' });
    
    try {
      const response = await api.post('/authentication/login/officer', {
        "officerEmail": "superOfficer@gmail.com",
        "plainPassword": "ilovedinosaur123"
      });
      
      addResult({
        test: 'Officer Login (Individual)',
        status: 'success',
        data: response.data,
        duration: Date.now() - startTime
      });
      Alert.alert('Success', 'Officer login test passed!');
    } catch (error: any) {
      addResult({
        test: 'Officer Login (Individual)',
        status: 'error',
        error: error.message,
        duration: Date.now() - startTime
      });
      Alert.alert('Error', `Officer login failed: ${error.message}`);
    }
  };

  const renderResult = (result: TestResult, index: number) => {
    const getStatusColor = () => {
      switch (result.status) {
        case 'success': return '#28a745';
        case 'error': return '#dc3545';
        case 'pending': return '#ffc107';
        default: return '#6c757d';
      }
    };

    const getStatusIcon = () => {
      switch (result.status) {
        case 'success': return '✅';
        case 'error': return '❌';
        case 'pending': return '⏳';
        default: return '⚪';
      }
    };

    return (
      <View key={index} style={[styles.resultCard, { borderLeftColor: getStatusColor() }]}>
        <View style={styles.resultHeader}>
          <Text style={styles.testName}>
            {getStatusIcon()} {result.test}
          </Text>
          <Text style={[styles.status, { color: getStatusColor() }]}>
            {result.status.toUpperCase()}
          </Text>
        </View>
        
        {result.duration && (
          <Text style={styles.duration}>{result.duration}ms</Text>
        )}
        
        {result.error && (
          <Text style={styles.error}>{result.error}</Text>
        )}
        
        {result.data && (
          <ScrollView style={styles.dataContainer} horizontal>
            <Text style={styles.data}>
              {JSON.stringify(result.data, null, 2)}
            </Text>
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🧪 API Testing Dashboard</Text>
      
      {/* Main Test Button */}
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={testAPI} 
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? '🔄 Running All Tests...' : '🚀 Run All API Tests'}
        </Text>
      </TouchableOpacity>
      
      {/* Individual Test Buttons */}
      <View style={styles.individualTests}>
        <Text style={styles.sectionTitle}>Individual Tests</Text>
        
        <TouchableOpacity style={styles.buttonSecondary} onPress={testGetRoot}>
          <Text style={styles.buttonTextSecondary}>Test GET /</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.buttonSecondary} onPress={testRegisterResident}>
          <Text style={styles.buttonTextSecondary}>Test Register Resident</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.buttonSecondary} onPress={testOfficerLogin}>
          <Text style={styles.buttonTextSecondary}>Test Officer Login</Text>
        </TouchableOpacity>
      </View>

      {/* Clear Results */}
      {results.length > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={clearResults}>
          <Text style={styles.clearButtonText}>🗑️ Clear Results</Text>
        </TouchableOpacity>
      )}

      {/* Results */}
      <View style={styles.resultsContainer}>
        <Text style={styles.sectionTitle}>
          📊 Test Results ({results.length})
        </Text>
        {results.length === 0 ? (
          <Text style={styles.noResults}>No tests run yet. Click a button above to start testing!</Text>
        ) : (
          results.map(renderResult)
        )}
      </View>

      {/* API Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>📋 API Information</Text>
        <Text style={styles.infoText}>
          Base URL: Check your api.ts file{'\n'}
          Tests: GET /, Register Resident, Officer Login{'\n'}
          Results: Check console logs and results above
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  individualTests: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  buttonSecondary: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonTextSecondary: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsContainer: {
    marginBottom: 20,
  },
  noResults: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
  resultCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  duration: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  error: {
    color: '#dc3545',
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  dataContainer: {
    maxHeight: 150,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    padding: 8,
  },
  data: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
  },
  infoContainer: {
    backgroundColor: '#e9ecef',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default ApiTestScreen;