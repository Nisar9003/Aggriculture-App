import { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '@/utils/supabase';
import { formatPKR, getCropColor } from '@/utils/farmCalculations';
import { Plus, Trash2 } from 'lucide-react-native';

interface Expense {
  id: string;
  crop_id: string;
  expense_type: string;
  amount_pkr: number;
  description: string;
  expense_date: string;
}

interface Crop {
  id: string;
  crop_type: string;
}

const EXPENSE_TYPES = ['seeds', 'fertilizer', 'labor', 'irrigation', 'machinery', 'other'];

const EXPENSE_LABELS: Record<string, string> = {
  seeds: 'بیج',
  fertilizer: 'کھاد',
  labor: 'مزدوری',
  irrigation: 'آبپاشی',
  machinery: 'مشینری',
  other: 'دیگر',
};

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [formData, setFormData] = useState({
    crop_id: '',
    expense_type: EXPENSE_TYPES[0],
    amount_pkr: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
  });

  useFocusEffect(() => {
    loadExpenses();
  });

  const loadExpenses = async () => {
    try {
      setLoading(true);
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
        setFarmId(farm.id);

        const { data: cropsData } = await supabase
          .from('crops')
          .select('id, crop_type')
          .eq('farm_id', farm.id);

        const { data: expensesData } = await supabase
          .from('expenses')
          .select('*')
          .in('crop_id', (cropsData || []).map((c) => c.id))
          .order('expense_date', { ascending: false });

        setCrops(cropsData || []);
        setExpenses(expensesData || []);

        if (cropsData && cropsData.length > 0) {
          setFormData((prev) => ({ ...prev, crop_id: cropsData[0].id }));
        }
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!formData.crop_id || !formData.amount_pkr || !formData.expense_type) {
      Alert.alert('خرابی', 'براہ کرم تمام معلومات بھریں');
      return;
    }

    try {
      const expenseData = {
        crop_id: formData.crop_id,
        expense_type: formData.expense_type,
        amount_pkr: parseFloat(formData.amount_pkr),
        description: formData.description,
        expense_date: formData.expense_date,
      };

      await supabase.from('expenses').insert(expenseData);
      loadExpenses();
      setModalVisible(false);
      resetForm();
      Alert.alert('کامیابی', 'اخراج محفوظ ہو گیا');
    } catch (error) {
      Alert.alert('خرابی', 'اخراج شامل کرتے وقت خرابی ہوئی');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    Alert.alert('تصدیق', 'کیا آپ یہ اخراج ڈیلیٹ کرنا چاہتے ہیں؟', [
      { text: 'منسوخ', onPress: () => {} },
      {
        text: 'ڈیلیٹ کریں',
        onPress: async () => {
          try {
            await supabase.from('expenses').delete().eq('id', id);
            loadExpenses();
          } catch (error) {
            Alert.alert('خرابی', 'اخراج ڈیلیٹ کرتے وقت خرابی ہوئی');
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setFormData({
      crop_id: crops.length > 0 ? crops[0].id : '',
      expense_type: EXPENSE_TYPES[0],
      amount_pkr: '',
      description: '',
      expense_date: new Date().toISOString().split('T')[0],
    });
  };

  const getCropName = (cropId: string): string => {
    return crops.find((c) => c.id === cropId)?.crop_type || 'نامعلوم';
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount_pkr || 0), 0);

  const expensesByType = EXPENSE_TYPES.reduce((acc, type) => {
    const sum = expenses
      .filter((e) => e.expense_type === type)
      .reduce((s, e) => s + (e.amount_pkr || 0), 0);
    return { ...acc, [type]: sum };
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>اخراجات</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Plus size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>کل اخراجات</Text>
          <Text style={styles.summaryValue}>{formatPKR(totalExpenses)}</Text>
        </View>

        <View style={styles.breakdownContainer}>
          <Text style={styles.breakdownTitle}>اخراجات کی تقسیم</Text>
          {EXPENSE_TYPES.map((type) => {
            const amount = expensesByType[type];
            const percentage = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(0) : '0';

            if (amount === 0) return null;

            return (
              <View key={type} style={styles.breakdownItem}>
                <View style={styles.breakdownLabel}>
                  <Text style={styles.breakdownType}>{EXPENSE_LABELS[type]}</Text>
                  <Text style={styles.breakdownPercent}>{percentage}%</Text>
                </View>
                <View style={styles.breakdownBar}>
                  <View
                    style={[styles.breakdownBarFill, { width: `${percentage}%`, backgroundColor: getExpenseColor(type) }]}
                  />
                </View>
                <Text style={styles.breakdownAmount}>{formatPKR(amount)}</Text>
              </View>
            );
          })}
        </View>

        {expenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>کوئی اخراج ریکارڈ نہیں</Text>
          </View>
        ) : (
          <View style={styles.expensesList}>
            <Text style={styles.listTitle}>تمام اخراجات</Text>
            {expenses.map((expense) => (
              <View key={expense.id} style={styles.expenseItem}>
                <View style={styles.expenseInfo}>
                  <View>
                    <Text style={styles.expenseName}>{EXPENSE_LABELS[expense.expense_type]}</Text>
                    <Text style={styles.expenseSubtext}>{getCropName(expense.crop_id)}</Text>
                    <Text style={styles.expenseDate}>{expense.expense_date}</Text>
                  </View>
                </View>
                <View style={styles.expenseActions}>
                  <Text style={styles.expenseAmount}>{formatPKR(expense.amount_pkr)}</Text>
                  <TouchableOpacity onPress={() => handleDeleteExpense(expense.id)}>
                    <Trash2 size={16} color="#E53935" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>نیا اخراج شامل کریں</Text>

            <Text style={styles.label}>فصل</Text>
            <View style={styles.cropPicker}>
              {crops.map((crop) => (
                <TouchableOpacity
                  key={crop.id}
                  style={[styles.cropPickerOption, formData.crop_id === crop.id && styles.cropPickerOptionActive]}
                  onPress={() => setFormData({ ...formData, crop_id: crop.id })}
                >
                  <Text
                    style={[
                      styles.cropPickerText,
                      formData.crop_id === crop.id && styles.cropPickerTextActive,
                    ]}
                  >
                    {crop.crop_type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>اخراج کی قسم</Text>
            <View style={styles.typePicker}>
              {EXPENSE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeOption, formData.expense_type === type && styles.typeOptionActive]}
                  onPress={() => setFormData({ ...formData, expense_type: type })}
                >
                  <Text
                    style={[styles.typeText, formData.expense_type === type && styles.typeTextActive]}
                  >
                    {EXPENSE_LABELS[type]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>رقم (PKR)</Text>
            <TextInput
              style={styles.input}
              placeholder="مثلاً 5000"
              keyboardType="decimal-pad"
              value={formData.amount_pkr}
              onChangeText={(text) => setFormData({ ...formData, amount_pkr: text })}
            />

            <Text style={styles.label}>تفصیل</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="اضافی معلومات (اختیاری)"
              multiline
              numberOfLines={3}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>منسوخ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={handleAddExpense}>
                <Text style={styles.submitButtonText}>شامل کریں</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getExpenseColor = (type: string): string => {
  const colors: Record<string, string> = {
    seeds: '#FF6B6B',
    fertilizer: '#4ECDC4',
    labor: '#45B7D1',
    irrigation: '#1976D2',
    machinery: '#F7B731',
    other: '#999',
  };
  return colors[type] || '#999';
};

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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  addButton: {
    backgroundColor: '#43A047',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#1B5E20',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#C8E6C9',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },
  breakdownContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  breakdownItem: {
    marginBottom: 16,
  },
  breakdownLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  breakdownType: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  breakdownPercent: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  breakdownBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  breakdownBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownAmount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  expensesList: {
    marginBottom: 20,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  expenseItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  expenseSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  expenseDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  expenseActions: {
    alignItems: 'flex-end',
    gap: 12,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1976D2',
  },
  emptyState: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  cropPicker: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  cropPickerOption: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cropPickerOptionActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#1B5E20',
  },
  cropPickerText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  cropPickerTextActive: {
    color: '#1B5E20',
  },
  typePicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  typeOptionActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#1B5E20',
  },
  typeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  typeTextActive: {
    color: '#1B5E20',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  textarea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#1B5E20',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});
