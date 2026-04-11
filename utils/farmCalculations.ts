export interface CropData {
  id: string;
  crop_type: string;
  acres_allocated: number;
  expected_yield_kg: number;
  actual_yield_kg: number | null;
}

export interface ExpenseData {
  amount_pkr: number;
  expense_type: string;
}

export const calculateTotalExpenses = (expenses: ExpenseData[]): number => {
  return expenses.reduce((sum, expense) => sum + (expense.amount_pkr || 0), 0);
};

export const calculateExpectedProfit = (
  crops: CropData[],
  expenses: Map<string, number>
): number => {
  const totalCost = Array.from(expenses.values()).reduce((a, b) => a + b, 0);

  const estimatedRevenue = crops.reduce((sum, crop) => {
    const yieldKg = crop.expected_yield_kg || 0;
    const pricePerKg = getCropPricePerKg(crop.crop_type);
    return sum + (yieldKg * pricePerKg);
  }, 0);

  return estimatedRevenue - totalCost;
};

export const getCropPricePerKg = (cropType: string): number => {
  const prices: Record<string, number> = {
    'Wheat': 35,
    'Rice': 50,
    'Maize': 40,
    'Mustard': 65,
    'Sesame': 85,
  };
  return prices[cropType] || 0;
};

export const getCropColor = (cropType: string): string => {
  const colors: Record<string, string> = {
    'Wheat': '#D4A574',
    'Rice': '#90EE90',
    'Maize': '#FFD700',
    'Mustard': '#FFB347',
    'Sesame': '#DEB887',
  };
  return colors[cropType] || '#8B7355';
};

export const getGrowthStageLabel = (stage: string): string => {
  const labels: Record<string, string> = {
    'seed': 'بیج کی تیاری',
    'growing': 'نشو و نما',
    'mature': 'بالغ',
    'harvest': 'کٹائی',
  };
  return labels[stage] || stage;
};

export const getGrowthStageProgress = (stage: string): number => {
  const progress: Record<string, number> = {
    'seed': 0,
    'growing': 33,
    'mature': 66,
    'harvest': 100,
  };
  return progress[stage] || 0;
};

export const calculateDaysUntilHarvest = (harvestDate: string): number => {
  const today = new Date();
  const harvest = new Date(harvestDate);
  const diff = harvest.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const formatPKR = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ur-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
