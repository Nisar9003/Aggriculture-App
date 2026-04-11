const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

export interface AdvisoryResponse {
  advice: string;
  isAIGenerated: boolean;
}

const rulesBasedAdvisory: Record<string, Record<string, string>> = {
  'Wheat': {
    'pani': 'گندم کو اکتوبر سے اپریل تک ہر 25-30 دن بعد پانی دینا چاہیے۔ سردی میں کم پانی دیں۔ موسم بہار میں روزانہ چیک کریں۔',
    'khad': 'گندم میں 60 کلوگرام نائٹروجن، 40 کلوگرام فاسفورس، 40 کلوگرام پوٹاشیم فی ایکڑ استعمال کریں۔ بوائی سے پہلے 1/3 نائٹروجن ڈالیں۔',
    'yield': 'اچھی صفائی، مناسب پانی، اور صحیح کھاد سے 40-50 من فی ایکڑ حاصل ہو سکتا ہے۔',
  },
  'Rice': {
    'pani': 'چاول کو مئی سے نومبر تک زیادہ پانی چاہیے۔ پودوں کے گرد ہمیشہ 5-8 سینٹی میٹر پانی رکھیں۔',
    'khad': 'چاول میں 90 کلوگرام نائٹروجن استعمال کریں۔ تقسیم میں ڈالیں: بوائی سے پہلے، 30 دن بعد، 45 دن بعد۔',
    'yield': 'اچھی کاشت سے 35-40 من فی ایکڑ پیداوار مل سکتی ہے۔',
  },
  'Maize': {
    'pani': 'مکئی کو موسم گرما میں 5-6 بار پانی دیں۔ پھول آتے وقت زیادہ پانی دیں۔ شمال میں 3-4 بار کافی ہے۔',
    'khad': 'مکئی میں 80 کلوگرام نائٹروجن، 40 کلوگرام فاسفورس استعمال کریں۔ نائٹروجن کو دو حصوں میں ڈالیں۔',
    'yield': 'اچھی کاشت سے 25-30 من فی ایکڑ حاصل ہو سکتا ہے۔',
  },
  'Mustard': {
    'pani': 'سردی میں بنود کو کم پانی چاہیے۔ بوائی سے پہلے ایک بار پانی دیں۔ پھول آتے وقت ایک اور بار۔',
    'khad': 'سردی میں 40 کلوگرام نائٹروجن استعمال کریں۔ فاسفورس اور پوٹاشیم 20 کلوگرام ہر ایک کافی ہے۔',
    'yield': 'اچھی دیکھ بھال سے 10-15 من فی ایکڑ بنود کی پیداوار ہو سکتی ہے۔',
  },
  'Sesame': {
    'pani': 'تل کو موسم گرما میں 2-3 پانیاں کافی ہیں۔ بہت زیادہ پانی سے پوری فصل خراب ہو سکتی ہے۔',
    'khad': 'تل میں 30 کلوگرام نائٹروجن اور 20 کلوگرام فاسفورس استعمال کریں۔ اچھی مٹی میں یہ کافی ہے۔',
    'yield': 'موسم سازگار ہو تو 8-12 من فی ایکڑ تل کی پیداوار ہو سکتی ہے۔',
  },
};

export const getFarmAdvice = async (question: string, cropType?: string): Promise<AdvisoryResponse> => {
  try {
    if (!OPENAI_API_KEY) {
      return getOfflineAdvice(question, cropType);
    }

    const systemPrompt = `You are a Pakistani agricultural expert helping farmers with advice in Urdu and Roman Urdu.
    Keep responses simple, practical, and focused on the farmer's question.
    Include both Urdu script and Roman Urdu transliteration for clarity.
    Focus on local Pakistani farming practices and crop types (Wheat, Rice, Maize, Mustard, Sesame).
    If the question is about a specific crop, tailor the advice to that crop.
    Keep responses concise (2-3 sentences max).`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      return getOfflineAdvice(question, cropType);
    }

    const data = await response.json();
    const advice = data.choices[0]?.message?.content || '';

    return {
      advice: advice || 'براہ کرم دوبارہ کوشش کریں۔ Please try again.',
      isAIGenerated: true,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return getOfflineAdvice(question, cropType);
  }
};

const getOfflineAdvice = (question: string, cropType?: string): AdvisoryResponse => {
  const lowerQuestion = question.toLowerCase();
  const crop = cropType || 'Wheat';

  if (lowerQuestion.includes('pani') || lowerQuestion.includes('پانی') || lowerQuestion.includes('water')) {
    return {
      advice: rulesBasedAdvisory[crop]?.pani || 'معاف کریں، یہ معلومات دستیاب نہیں ہے۔',
      isAIGenerated: false,
    };
  }

  if (lowerQuestion.includes('khad') || lowerQuestion.includes('کھاد') || lowerQuestion.includes('fertilizer')) {
    return {
      advice: rulesBasedAdvisory[crop]?.khad || 'معاف کریں، یہ معلومات دستیاب نہیں ہے۔',
      isAIGenerated: false,
    };
  }

  if (lowerQuestion.includes('yield') || lowerQuestion.includes('paidavar') || lowerQuestion.includes('پیدا')) {
    return {
      advice: rulesBasedAdvisory[crop]?.yield || 'معاف کریں، یہ معلومات دستیاب نہیں ہے۔',
      isAIGenerated: false,
    };
  }

  return {
    advice: 'براہ کرم اپنی سوال مختلف انداز میں رکھیں۔ مثلاً: پانی، کھاد، یا پیداوار کے بارے میں پوچھیں۔',
    isAIGenerated: false,
  };
};
