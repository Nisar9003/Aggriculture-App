import { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/components/AuthContext';
import { Leaf, ArrowLeft } from 'lucide-react-native';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('خرابی', 'براہ کرم تمام فیلڈ بھریں');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('خرابی', 'پاس ورڈ مماثل نہیں ہیں');
      return;
    }

    if (password.length < 6) {
      Alert.alert('خرابی', 'پاس ورڈ کم از کم 6 حروف ہونا چاہیے');
      return;
    }

    try {
      setLoading(true);
      await signUp(email, password);
      Alert.alert('کامیابی', 'اکاؤنٹ تخلیق ہو گیا! براہ کرم لاگ ان کریں', [
        { text: 'ٹھیک ہے', onPress: () => router.push('/auth/login') },
      ]);
    } catch (error: any) {
      Alert.alert('خرابی', error.message || 'سائن اپ میں ناکام');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboard}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1B5E20" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Leaf size={48} color="#1B5E20" />
            </View>
            <Text style={styles.appName}>نیا اکاؤنٹ بنائیں</Text>
            <Text style={styles.subtitle}>اپنے کھیتی کے سفر کا آغاز کریں</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>ای میل</Text>
            <TextInput
              style={styles.input}
              placeholder="آپ کی ای میل درج کریں"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />

            <Text style={styles.label}>پاس ورڈ</Text>
            <TextInput
              style={styles.input}
              placeholder="محفوظ پاس ورڈ بنائیں"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />

            <Text style={styles.label}>پاس ورڈ کی تصدیق</Text>
            <TextInput
              style={styles.input}
              placeholder="پاس ورڈ دوبارہ درج کریں"
              placeholderTextColor="#999"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.signupButton, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.signupButtonText}>اکاؤنٹ بنائیں</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>پہلے سے اکاؤنٹ ہے؟</Text>
              <TouchableOpacity onPress={() => router.push('/auth/login')} disabled={loading}>
                <Text style={styles.loginLink}>لاگ ان کریں</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>آپ کا ڈیٹا محفوظ ہے</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  keyboard: {
    flex: 1,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  form: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#F9F9F9',
  },
  signupButton: {
    backgroundColor: '#1B5E20',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 4,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#1B5E20',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});
