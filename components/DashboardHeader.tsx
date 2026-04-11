import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Cloud, Droplets } from 'lucide-react-native';

interface DashboardHeaderProps {
  temperature?: number;
  weatherDescription?: string;
  rainProbability?: number;
}

export default function DashboardHeader({
  temperature = 28,
  weatherDescription = 'صاف آسمان',
  rainProbability = 20,
}: DashboardHeaderProps) {
  return (
    <SafeAreaView>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.greeting}>السلام علیکم</Text>
          <Text style={styles.subtitle}>آپ کے کھیت میں خوش آمدید</Text>
        </View>

        <View style={styles.weatherWidget}>
          <View style={styles.weatherInfo}>
            <Cloud size={24} color="#2E7D32" />
            <View style={styles.weatherText}>
              <Text style={styles.temp}>{temperature}°C</Text>
              <Text style={styles.description}>{weatherDescription}</Text>
            </View>
          </View>

          <View style={styles.rainInfo}>
            <Droplets size={18} color="#1976D2" />
            <Text style={styles.rainChance}>{rainProbability}%</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  content: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#C8E6C9',
    marginTop: 4,
  },
  weatherWidget: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  weatherText: {
    marginLeft: 12,
    flex: 1,
  },
  temp: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  description: {
    fontSize: 12,
    color: '#E8F5E9',
    marginTop: 2,
  },
  rainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25,118,210,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rainChance: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E3F2FD',
    marginLeft: 6,
  },
});
