import { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '@/utils/supabase';
import { getFarmAdvice } from '@/utils/farmAdvisor';
import { Send, Lightbulb } from 'lucide-react-native';

interface Message {
  id: string;
  type: 'user' | 'advisor';
  text: string;
  timestamp: Date;
  isAI: boolean;
}

export default function AdvisorScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'advisor',
      text: 'السلام علیکم! میں آپ کی کھیتوں کی دیکھ بھال میں آپ کی مدد کے لیے یہاں ہوں۔ آپ کے کھیتوں کے بارے میں کوئی سوال پوچھیں۔',
      timestamp: new Date(),
      isAI: false,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [crops, setCrops] = useState<any[]>([]);

  useState(() => {
    loadUserCrops();
  });

  const loadUserCrops = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: farm } = await supabase
        .from('farms')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (farm) {
        const { data: cropsData } = await supabase
          .from('crops')
          .select('id, crop_type')
          .eq('farm_id', farm.id);

        setCrops(cropsData || []);
        if (cropsData && cropsData.length > 0) {
          setSelectedCrop(cropsData[0].crop_type);
        }
      }
    } catch (error) {
      console.error('Error loading crops:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: inputText,
      timestamp: new Date(),
      isAI: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await getFarmAdvice(inputText, selectedCrop || undefined);

      const advisorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'advisor',
        text: response.advice,
        timestamp: new Date(),
        isAI: response.isAIGenerated,
      };

      setMessages((prev) => [...prev, advisorMessage]);
    } catch (error) {
      console.error('Error getting advice:', error);
    } finally {
      setLoading(false);
    }
  };

  const commonQuestions = [
    { question: 'پانی کب دینا چاہیے؟', icon: '💧' },
    { question: 'کھاد کیسے ڈالوں؟', icon: '🌾' },
    { question: 'پیدا وار بڑھانے کے طریقے؟', icon: '📈' },
    { question: 'کیڑوں سے بچاؤ کیسے؟', icon: '🐛' },
  ];

  const handleQuickQuestion = async (question: string) => {
    setInputText(question);
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: question,
      timestamp: new Date(),
      isAI: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await getFarmAdvice(question, selectedCrop || undefined);

      const advisorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'advisor',
        text: response.advice,
        timestamp: new Date(),
        isAI: response.isAIGenerated,
      };

      setMessages((prev) => [...prev, advisorMessage]);
    } catch (error) {
      console.error('Error getting advice:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <Lightbulb size={24} color="#FFF" />
        <Text style={styles.headerTitle}>ذہین مشیر</Text>
      </View>

      {crops.length > 0 && (
        <View style={styles.cropSelector}>
          <Text style={styles.cropLabel}>فصل منتخب کریں:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cropScroll}>
            {crops.map((crop) => (
              <TouchableOpacity
                key={crop.id}
                style={[styles.cropTag, selectedCrop === crop.crop_type && styles.cropTagActive]}
                onPress={() => setSelectedCrop(crop.crop_type)}
              >
                <Text
                  style={[styles.cropTagText, selectedCrop === crop.crop_type && styles.cropTagTextActive]}
                >
                  {crop.crop_type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
        {messages.map((message) => (
          <View key={message.id} style={[styles.messageWrapper, message.type === 'user' && styles.userMessage]}>
            <View style={[styles.messageBubble, message.type === 'user' && styles.userBubble]}>
              <Text style={[styles.messageText, message.type === 'user' && styles.userMessageText]}>
                {message.text}
              </Text>
              {message.isAI && <Text style={styles.aiLabel}>AI سے</Text>}
            </View>
          </View>
        ))}

        {loading && (
          <View style={styles.loadingMessage}>
            <ActivityIndicator size="small" color="#1B5E20" />
            <Text style={styles.loadingText}>جواب تیار ہو رہا ہے...</Text>
          </View>
        )}

        {messages.length === 1 && (
          <View style={styles.quickQuestionsContainer}>
            <Text style={styles.quickTitle}>عام سوالات</Text>
            {commonQuestions.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickQuestion}
                onPress={() => handleQuickQuestion(item.question)}
              >
                <Text style={styles.quickIcon}>{item.icon}</Text>
                <Text style={styles.quickText}>{item.question}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="اپنا سوال یہاں لکھیں..."
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={200}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage} disabled={loading}>
          <Send size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  cropSelector: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cropLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  cropScroll: {
    flexDirection: 'row',
  },
  cropTag: {
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  cropTagActive: {
    backgroundColor: '#1B5E20',
    borderColor: '#1B5E20',
  },
  cropTagText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  cropTagTextActive: {
    color: '#FFF',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageWrapper: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#1B5E20',
    borderRadius: 16,
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFF',
  },
  aiLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  loadingMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  quickQuestionsContainer: {
    marginVertical: 20,
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  quickQuestion: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#1B5E20',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  quickIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  quickText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#1B5E20',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
