import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '@/utils/supabase';
import { getWeatherByCoords, getPakistanWeather } from '@/utils/weatherService';
import { formatPKR } from '@/utils/farmCalculations';
import DashboardHeader from '@/components/DashboardHeader';
import StatCard from '@/components/StatCard';
import CropDistributionChart from '@/components/CropDistributionChart';
import { Zap, CircleAlert as AlertCircle, TrendingUp } from 'lucide-react-native';

interface CropData {
  id: string;
  crop_type: string;
  acres_allocated: number;
  expected_yield_kg: number;
}

interface ExpenseData {
  amount_pkr: number;
  crop_id: string;
}

export default function Dashboard() {
  const [crops, setCrops] = useState<CropData[]>([]);
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState({ temp: 28, desc: 'صاف آسمان', rain: 20 });
  const [farmId, setFarmId] = useState<string | null>(null);

  useFocusEffect(() => {
    loadDashboardData();
  });

  useEffect(() => {
    loadWeather();
  }, []);

  const loadDashboardData = async () => {
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

      if (!farm) {
        const { data: newFarm } = await supabase
          .from('farms')
          .insert({ user_id: user.id, total_acres: 6 })
          .select()
          .single();

        if (newFarm) setFarmId(newFarm.id);
      } else {
        setFarmId(farm.id);
      }

      if (farm?.id || farm?.id) {
        const farmToUse = farm?.id || (await supabase.from('farms').select('id').eq('user_id', user.id).single()).data?.id;

        const { data: cropsData } = await supabase
          .from('crops')
          .select('*')
          .eq('farm_id', farmToUse)
          .eq('is_active', true);

        const { data: expensesData } = await supabase
          .from('expenses')
          .select('amount_pkr, crop_id')
          .in('crop_id', (cropsData || []).map((c: any) => c.id));

        setCrops(cropsData || []);
        setExpenses(expensesData || []);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWeather = async () => {
    try {
      const weatherData = await getPakistanWeather();
      if (weatherData) {
        setWeather({
          temp: Math.round(weatherData.temp),
          desc: weatherData.description,
          rain: Math.round(weatherData.rainProbability),
        });
      }
    } catch (error) {
      console.error('Weather error:', error);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount_pkr || 0), 0);
  const totalAcres = crops.reduce((sum, c) => sum + (c.acres_allocated || 0), 0);

  const chartData = crops.map((crop) => ({
    name: crop.crop_type,
    acres: crop.acres_allocated,
    color: getCropChartColor(crop.crop_type),
  }));

  const expectedProfit = calculateExpectedProfit();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DashboardHeader
        temperature={weather.temp}
        weatherDescription={weather.desc}
        rainProbability={weather.rain}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsContainer}>
          <StatCard
            icon={Zap}
            label="کل اخراجات"
            value={formatPKR(totalExpenses)}
            color="#E53935"
            subtext={`${crops.length} فصلوں کے لیے`}
          />
          <StatCard
            icon={TrendingUp}
            label="متوقع منافع"
            value={formatPKR(Math.max(0, expectedProfit))}
            color="#43A047"
            subtext={expectedProfit < 0 ? 'خطرہ' : 'اچھا'}
          />
          <StatCard
            icon={AlertCircle}
            label="کل فصلیں"
            value={crops.length.toString()}
            color="#1976D2"
            subtext={`${totalAcres.toFixed(1)} ایکڑ میں`}
          />
        </View>

        {chartData.length > 0 ? (
          <CropDistributionChart crops={chartData} totalAcres={6} />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>ابھی کوئی فصل شامل نہیں کی گئی ہے</Text>
            <Text style={styles.emptyStateSubtext}>فصلیں ٹیب سے فصل شامل کریں</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const getCropChartColor = (cropType: string): string => {
  const colors: Record<string, string> = {
    Wheat: '#D4A574',
    Rice: '#90EE90',
    Maize: '#FFD700',
    Mustard: '#FFB347',
    Sesame: '#DEB887',
  };
  return colors[cropType] || '#8B7355';
};

const calculateExpectedProfit = (): number => {
  return 150000;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  statsContainer: {
    marginBottom: 20,
  },
  emptyState: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
});
