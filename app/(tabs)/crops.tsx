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
import { Plus, CreditCard as Edit2, Trash2, Leaf } from 'lucide-react-native';

interface Crop {
  id: string;
  crop_type: string;
  acres_allocated: number;
  plantation_date: string;
  expected_harvest_date: string;
  growth_stage: string;
  is_active: boolean;
}

const CROP_TYPES = ['Wheat', 'Rice', 'Maize', 'Mustard', 'Sesame'];
const GROWTH_STAGES = ['seed', 'growing', 'mature', 'harvest'];

export default function CropsScreen() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);

  const [formData, setFormData] = useState({
    crop_type: CROP_TYPES[0],
    acres_allocated: '',
    plantation_date: '',
    expected_harvest_date: '',
    growth_stage: GROWTH_STAGES[0],
  });

  useFocusEffect(() => {
    loadCrops();
  });

  const loadCrops = async () => {
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
        const { data } = await supabase.from('crops').select('*').eq('farm_id', farm.id);
        setCrops(data || []);
      }
    } catch (error) {
      console.error('Error loading crops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCrop = async () => {
    if (!farmId || !formData.crop_type || !formData.acres_allocated || !formData.plantation_date) {
      Alert.alert('خرابی', 'براہ کرم تمام معلومات بھریں');
      return;
    }

    try {
      const cropData = {
        farm_id: farmId,
        crop_type: formData.crop_type,
        acres_allocated: parseFloat(formData.acres_allocated),
        plantation_date: formData.plantation_date,
        expected_harvest_date: formData.expected_harvest_date || formData.plantation_date,
        growth_stage: formData.growth_stage,
        expected_yield_kg: 1000,
      };

      if (editingCrop) {
        await supabase.from('crops').update(cropData).eq('id', editingCrop.id);
      } else {
        await supabase.from('crops').insert(cropData);
      }

      loadCrops();
      setModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert('خرابی', 'فصل شامل کرتے وقت خرابی ہوئی');
    }
  };

  const handleDeleteCrop = async (id: string) => {
    Alert.alert('تصدیق', 'کیا آپ یہ فصل ڈیلیٹ کرنا چاہتے ہیں؟', [
      { text: 'منسوخ', onPress: () => {} },
      {
        text: 'ڈیلیٹ کریں',
        onPress: async () => {
          try {
            await supabase.from('crops').delete().eq('id', id);
            loadCrops();
          } catch (error) {
            Alert.alert('خرابی', 'فصل ڈیلیٹ کرتے وقت خرابی ہوئی');
          }
        },
      },
    ]);
  };

  const handleEditCrop = (crop: Crop) => {
    setEditingCrop(crop);
    setFormData({
      crop_type: crop.crop_type,
      acres_allocated: crop.acres_allocated.toString(),
      plantation_date: crop.plantation_date,
      expected_harvest_date: crop.expected_harvest_date,
      growth_stage: crop.growth_stage,
    });
    setModalVisible(true);
  };

  const resetForm = () => {
    setFormData({
      crop_type: CROP_TYPES[0],
      acres_allocated: '',
      plantation_date: '',
      expected_harvest_date: '',
      growth_stage: GROWTH_STAGES[0],
    });
    setEditingCrop(null);
  };

  const getCropColor = (cropType: string): string => {
    const colors: Record<string, string> = {
      Wheat: '#D4A574',
      Rice: '#90EE90',
      Maize: '#FFD700',
      Mustard: '#FFB347',
      Sesame: '#DEB887',
    };
    return colors[cropType] || '#8B7355';
  };

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
        <Text style={styles.headerTitle}>فصل کی دستاویزات</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Plus size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {crops.length === 0 ? (
          <View style={styles.emptyState}>
            <Leaf size={48} color="#CCC" />
            <Text style={styles.emptyText}>کوئی فصل شامل نہیں</Text>
            <Text style={styles.emptySubtext}>شروع کرنے کے لیے نئی فصل شامل کریں</Text>
          </View>
        ) : (
          crops.map((crop) => (
            <View key={crop.id} style={styles.cropCard}>
              <View style={[styles.cropIndicator, { backgroundColor: getCropColor(crop.crop_type) }]} />

              <View style={styles.cropContent}>
                <Text style={styles.cropName}>{crop.crop_type}</Text>
                <Text style={styles.cropDetail}>{crop.acres_allocated} ایکڑ</Text>
                <View style={styles.stageBadge}>
                  <Text style={styles.stageText}>{crop.growth_stage}</Text>
                </View>
              </View>

              <View style={styles.cropActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditCrop(crop)}
                >
                  <Edit2 size={18} color="#1976D2" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteCrop(crop.id)}
                >
                  <Trash2 size={18} color="#E53935" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingCrop ? 'فصل میں ترمیم' : 'نئی فصل شامل کریں'}</Text>

            <Text style={styles.label}>فصل کی قسم</Text>
            <View style={styles.picker}>
              {CROP_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.pickerOption, formData.crop_type === type && styles.pickerOptionActive]}
                  onPress={() => setFormData({ ...formData, crop_type: type })}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      formData.crop_type === type && styles.pickerOptionTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>ایکڑ کی تعداد</Text>
            <TextInput
              style={styles.input}
              placeholder="مثلاً 2.5"
              keyboardType="decimal-pad"
              value={formData.acres_allocated}
              onChangeText={(text) => setFormData({ ...formData, acres_allocated: text })}
            />

            <Text style={styles.label}>بوائی کی تاریخ</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.plantation_date}
              onChangeText={(text) => setFormData({ ...formData, plantation_date: text })}
            />

            <Text style={styles.label}>فصل کی حالت</Text>
            <View style={styles.picker}>
              {GROWTH_STAGES.map((stage) => (
                <TouchableOpacity
                  key={stage}
                  style={[styles.pickerOption, formData.growth_stage === stage && styles.pickerOptionActive]}
                  onPress={() => setFormData({ ...formData, growth_stage: stage })}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      formData.growth_stage === stage && styles.pickerOptionTextActive,
                    ]}
                  >
                    {stage}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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
              <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={handleAddCrop}>
                <Text style={styles.submitButtonText}>{editingCrop ? 'محفوظ کریں' : 'شامل کریں'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  emptyState: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
  },
  cropCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cropIndicator: {
    width: 8,
    height: 60,
    borderRadius: 4,
    marginRight: 16,
  },
  cropContent: {
    flex: 1,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  cropDetail: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  stageBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  stageText: {
    fontSize: 11,
    color: '#1B5E20',
    fontWeight: '600',
  },
  cropActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
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
    maxHeight: '80%',
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
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  picker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  pickerOptionActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#1B5E20',
  },
  pickerOptionText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  pickerOptionTextActive: {
    color: '#1B5E20',
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
