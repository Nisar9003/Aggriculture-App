import { View, Text, StyleSheet, Dimensions } from 'react-native';

interface CropData {
  name: string;
  acres: number;
  color: string;
}

interface CropDistributionChartProps {
  crops: CropData[];
  totalAcres: number;
}

export default function CropDistributionChart({ crops, totalAcres }: CropDistributionChartProps) {
  const width = Dimensions.get('window').width - 40;
  const barHeight = 200;

  const maxCrops = Math.max(...crops.map(c => c.acres), 1);
  const scale = barHeight / maxCrops;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>فصل کی تقسیم - کل {totalAcres} ایکڑ</Text>

      <View style={styles.legendContainer}>
        {crops.map((crop) => (
          <View key={crop.name} style={styles.legendItem}>
            <View style={[styles.colorBox, { backgroundColor: crop.color }]} />
            <Text style={styles.legendLabel}>{crop.name}</Text>
          </View>
        ))}
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.yAxis}>
          <Text style={styles.yLabel}>0</Text>
          <Text style={styles.yLabel}>{Math.ceil(maxCrops / 2)}</Text>
          <Text style={styles.yLabel}>{Math.ceil(maxCrops)}</Text>
        </View>

        <View style={styles.barsContainer}>
          {crops.map((crop) => {
            const barHeight_ = crop.acres * scale;
            const percentage = ((crop.acres / totalAcres) * 100).toFixed(1);

            return (
              <View key={crop.name} style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight_,
                      backgroundColor: crop.color,
                    },
                  ]}
                >
                  <Text style={styles.barLabel}>{percentage}%</Text>
                </View>
                <Text style={styles.barName}>{crop.name}</Text>
                <Text style={styles.barAcres}>{crop.acres} ایکڑ</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.statsGrid}>
        {crops.map((crop) => {
          const percentage = ((crop.acres / totalAcres) * 100).toFixed(1);
          return (
            <View key={`stat-${crop.name}`} style={styles.statItem}>
              <Text style={styles.statCrop}>{crop.name}</Text>
              <Text style={[styles.statValue, { color: crop.color }]}>{crop.acres}</Text>
              <Text style={styles.statUnit}>ایکڑ ({percentage}%)</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 16,
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  chartContainer: {
    flexDirection: 'row',
    height: 220,
    marginBottom: 20,
    paddingRight: 8,
  },
  yAxis: {
    width: 35,
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  yLabel: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
    fontWeight: '500',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingBottom: 20,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#E0E0E0',
    paddingLeft: 12,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: '70%',
    borderRadius: 6,
    marginBottom: 8,
    justifyContent: 'flex-start',
    paddingTop: 8,
    alignItems: 'center',
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
  },
  barName: {
    fontSize: 11,
    color: '#333',
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  barAcres: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  statItem: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statCrop: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  statUnit: {
    fontSize: 10,
    color: '#999',
  },
});
