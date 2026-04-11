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
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '@/utils/supabase';
import { Plus, Trash2, CircleCheck as CheckCircle2, Circle, Calendar } from 'lucide-react-native';

interface Task {
  id: string;
  crop_id?: string;
  task_type: string;
  title: string;
  description?: string;
  due_date: string;
  completed: boolean;
}

interface Crop {
  id: string;
  crop_type: string;
}

const TASK_TYPES = ['watering', 'fertilizer', 'pest_control', 'harvest', 'other'];

const TASK_LABELS: Record<string, string> = {
  watering: 'پانی دینا',
  fertilizer: 'کھاد ڈالنا',
  pest_control: 'کیڑوں سے بچاؤ',
  harvest: 'کٹائی',
  other: 'دیگر',
};

const TASK_COLORS: Record<string, string> = {
  watering: '#1976D2',
  fertilizer: '#43A047',
  pest_control: '#E53935',
  harvest: '#F57C00',
  other: '#757575',
};

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterCompleted, setFilterCompleted] = useState(false);

  const [formData, setFormData] = useState({
    task_type: TASK_TYPES[0],
    title: '',
    description: '',
    due_date: new Date().toISOString().split('T')[0],
    crop_id: '',
  });

  useFocusEffect(() => {
    loadTasks();
  });

  const loadTasks = async () => {
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

        const { data: tasksData } = await supabase
          .from('tasks')
          .select('*')
          .eq('farm_id', farm.id)
          .order('due_date', { ascending: true });

        setCrops(cropsData || []);
        setTasks(tasksData || []);

        if (cropsData && cropsData.length > 0) {
          setFormData((prev) => ({ ...prev, crop_id: cropsData[0].id }));
        }
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!farmId || !formData.title || !formData.task_type) {
      Alert.alert('خرابی', 'براہ کرم مطلوبہ معلومات بھریں');
      return;
    }

    try {
      const taskData = {
        farm_id: farmId,
        crop_id: formData.crop_id || null,
        task_type: formData.task_type,
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date,
        completed: false,
      };

      await supabase.from('tasks').insert(taskData);
      loadTasks();
      setModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert('خرابی', 'کام شامل کرتے وقت خرابی ہوئی');
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id);
      loadTasks();
    } catch (error) {
      Alert.alert('خرابی', 'کام اپ ڈیٹ کرتے وقت خرابی ہوئی');
    }
  };

  const handleDeleteTask = async (id: string) => {
    Alert.alert('تصدیق', 'کیا آپ یہ کام ڈیلیٹ کرنا چاہتے ہیں؟', [
      { text: 'منسوخ', onPress: () => {} },
      {
        text: 'ڈیلیٹ کریں',
        onPress: async () => {
          try {
            await supabase.from('tasks').delete().eq('id', id);
            loadTasks();
          } catch (error) {
            Alert.alert('خرابی', 'کام ڈیلیٹ کرتے وقت خرابی ہوئی');
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setFormData({
      task_type: TASK_TYPES[0],
      title: '',
      description: '',
      due_date: new Date().toISOString().split('T')[0],
      crop_id: crops.length > 0 ? crops[0].id : '',
    });
  };

  const getCropName = (cropId?: string): string => {
    if (!cropId) return 'عام کام';
    return crops.find((c) => c.id === cropId)?.crop_type || 'نامعلوم';
  };

  const isOverdue = (dueDate: string): boolean => {
    return new Date(dueDate) < new Date();
  };

  const filteredTasks = tasks.filter((task) => {
    if (filterCompleted) {
      return task.completed;
    }
    return !task.completed;
  });

  const completedCount = tasks.filter((t) => t.completed).length;

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
        <Text style={styles.headerTitle}>کام کی فہرست</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Plus size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{tasks.length}</Text>
          <Text style={styles.statLabel}>کل کام</Text>
        </View>
        <View style={[styles.statItem, styles.statItemBorder]}>
          <Text style={styles.statValue}>{completedCount}</Text>
          <Text style={styles.statLabel}>مکمل</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{tasks.length - completedCount}</Text>
          <Text style={styles.statLabel}>باقی</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, !filterCompleted && styles.filterButtonActive]}
          onPress={() => setFilterCompleted(false)}
        >
          <Text
            style={[
              styles.filterButtonText,
              !filterCompleted && styles.filterButtonTextActive,
            ]}
          >
            زیرِ التوا
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterCompleted && styles.filterButtonActive]}
          onPress={() => setFilterCompleted(true)}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterCompleted && styles.filterButtonTextActive,
            ]}
          >
            مکمل شدہ
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {filterCompleted ? 'کوئی مکمل کام نہیں' : 'کوئی زیرِ التوا کام نہیں'}
            </Text>
          </View>
        ) : (
          filteredTasks.map((task) => (
            <View key={task.id} style={[styles.taskCard, task.completed && styles.taskCardCompleted]}>
              <TouchableOpacity
                style={styles.taskCheckbox}
                onPress={() => handleToggleTask(task)}
              >
                {task.completed ? (
                  <CheckCircle2 size={24} color="#43A047" />
                ) : (
                  <Circle size={24} color="#DDD" />
                )}
              </TouchableOpacity>

              <View style={styles.taskContent}>
                <View style={styles.taskHeader}>
                  <View
                    style={[
                      styles.taskTypeBadge,
                      { backgroundColor: TASK_COLORS[task.task_type] + '20', borderLeftColor: TASK_COLORS[task.task_type] },
                    ]}
                  >
                    <Text
                      style={[
                        styles.taskTypeText,
                        { color: TASK_COLORS[task.task_type] },
                      ]}
                    >
                      {TASK_LABELS[task.task_type]}
                    </Text>
                  </View>
                  {isOverdue(task.due_date) && !task.completed && (
                    <View style={styles.overdueBadge}>
                      <Text style={styles.overdueText}>تاخیر سے</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                  {task.title}
                </Text>

                {task.description && (
                  <Text style={styles.taskDescription}>{task.description}</Text>
                )}

                <View style={styles.taskFooter}>
                  <View style={styles.taskDateContainer}>
                    <Calendar size={14} color="#999" />
                    <Text style={styles.taskDate}>{task.due_date}</Text>
                  </View>
                  <Text style={styles.taskCrop}>{getCropName(task.crop_id)}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteTask(task.id)}
              >
                <Trash2 size={16} color="#E53935" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>نیا کام شامل کریں</Text>

            <Text style={styles.label}>کام کی قسم</Text>
            <View style={styles.typePicker}>
              {TASK_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeOption, formData.task_type === type && styles.typeOptionActive]}
                  onPress={() => setFormData({ ...formData, task_type: type })}
                >
                  <Text
                    style={[
                      styles.typeText,
                      formData.task_type === type && styles.typeTextActive,
                    ]}
                  >
                    {TASK_LABELS[type]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>کام کا عنوان</Text>
            <TextInput
              style={styles.input}
              placeholder="مثلاً: گندم میں کھاد ڈالیں"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />

            <Text style={styles.label}>تفصیل</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="اضافی تفصیلات (اختیاری)"
              multiline
              numberOfLines={3}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
            />

            <Text style={styles.label}>موعد</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.due_date}
              onChangeText={(text) => setFormData({ ...formData, due_date: text })}
            />

            <Text style={styles.label}>فصل (اختیاری)</Text>
            <View style={styles.cropPicker}>
              <TouchableOpacity
                style={[styles.cropOption, !formData.crop_id && styles.cropOptionActive]}
                onPress={() => setFormData({ ...formData, crop_id: '' })}
              >
                <Text
                  style={[
                    styles.cropOptionText,
                    !formData.crop_id && styles.cropOptionTextActive,
                  ]}
                >
                  عام
                </Text>
              </TouchableOpacity>
              {crops.map((crop) => (
                <TouchableOpacity
                  key={crop.id}
                  style={[styles.cropOption, formData.crop_id === crop.id && styles.cropOptionActive]}
                  onPress={() => setFormData({ ...formData, crop_id: crop.id })}
                >
                  <Text
                    style={[
                      styles.cropOptionText,
                      formData.crop_id === crop.id && styles.cropOptionTextActive,
                    ]}
                  >
                    {crop.crop_type}
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
              <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={handleAddTask}>
                <Text style={styles.submitButtonText}>شامل کریں</Text>
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
  statsBar: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statItem: {
    alignItems: 'center',
  },
  statItemBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 20,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B5E20',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#FFF',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#1B5E20',
    borderColor: '#1B5E20',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
  },
  taskCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  taskCardCompleted: {
    opacity: 0.6,
    backgroundColor: '#F9F9F9',
  },
  taskCheckbox: {
    marginRight: 12,
    marginTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  taskTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderLeftWidth: 2,
  },
  taskTypeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  overdueBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  overdueText: {
    fontSize: 11,
    color: '#E53935',
    fontWeight: '600',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskDate: {
    fontSize: 11,
    color: '#999',
  },
  taskCrop: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deleteButton: {
    marginLeft: 8,
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
  cropPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cropOption: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cropOptionActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#1B5E20',
  },
  cropOptionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  cropOptionTextActive: {
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
