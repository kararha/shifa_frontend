import { translateText } from './translation';

export interface ProviderTranslations {
  en: {
    title: string;
    description: string;
    rating: string;
    rate: string;
  };
  ar: {
    title: string;
    description: string;
    rating: string;
    rate: string;
  };
}

const specialtyDescriptions = {
  "Caring for young patients with chronic conditions": {
    ar: "رعاية المرضى الصغار المصابين بأمراض مزمنة"
  },
  "Providing emotional and physical support": {
    ar: "تقديم الدعم العاطفي والجسدي"
  },
  "Passionate about providing quality home care": {
    ar: "شغف بتقديم رعاية منزلية عالية الجودة"
  },
  "Dedicated to respiratory health and care": {
    ar: "متخصص في الصحة والرعاية التنفسية"
  },
  "Helping patients recover safely at home": {
    ar: "مساعدة المرضى على التعافي بأمان في المنزل"
  },
  "Committed to helping patients regain independence": {
    ar: "ملتزم بمساعدة المرضى على استعادة استقلاليتهم"
  },
  "Helping patients regain strength and mobility": {
    ar: "مساعدة المرضى على استعادة قوتهم وقدرتهم على الحركة"
  }
};

// Define specialty translations
const specialtyTranslations = {
  "Certified in pediatric home care and nutrition": {
    ar: {
      title: "متخصص في رعاية الأطفال المنزلية والتغذية",
      description: "رعاية المرضى الصغار وتقديم الدعم الغذائي المناسب",
    }
  },
  "Experienced caregiver specializing in senior companionship": {
    ar: {
      title: "مقدم رعاية ذو خبرة متخصص في مرافقة كبار السن",
      description: "تقديم الدعم العاطفي والجسدي للمسنين",
    }
  },
  "Certified nurse with specialization in elderly care": {
    ar: {
      title: "ممرض معتمد متخصص في رعاية المسنين",
      description: "تقديم رعاية صحية متخصصة لكبار السن",
    }
  },
  "Certified respiratory therapist for home ventilation needs": {
    ar: {
      title: "معالج تنفسي معتمد لاحتياجات التنفس المنزلي",
      description: "رعاية متخصصة في المشاكل التنفسية",
    }
  },
  "Skilled in chronic illness management and palliative care": {
    ar: {
      title: "متخصص في إدارة الأمراض المزمنة والرعاية التلطيفية",
      description: "رعاية شاملة للمرضى ذوي الأمراض المزمنة",
    }
  }
};

const bioTranslations = {
  "Striving to improve comfort and well-being": {
    ar: "نسعى لتحسين الراحة والرفاهية"
  },
  "Dedicated to improving patients' quality of life": {
    ar: "ملتزمون بتحسين جودة حياة المرضى"
  },
  "Providing compassionate care for elderly patients": {
    ar: "تقديم رعاية حانية للمرضى كبار السن"
  },
  "Caring for young patients with chronic conditions": {
    ar: "رعاية المرضى الصغار المصابين بأمراض مزمنة"
  },
  "Providing emotional and physical support": {
    ar: "تقديم الدعم العاطفي والجسدي"
  },
  "Passionate about providing quality home care": {
    ar: "شغف بتقديم رعاية منزلية عالية الجودة"
  },
  "Dedicated to respiratory health and care": {
    ar: "متخصص في الصحة والرعاية التنفسية"
  },
  "Helping patients recover safely at home": {
    ar: "مساعدة المرضى على التعافي بأمان في المنزل"
  },
  "Committed to helping patients regain independence": {
    ar: "ملتزم بمساعدة المرضى على استعادة استقلاليتهم"
  },
  "Helping patients regain strength and mobility": {
    ar: "مساعدة المرضى على استعادة قوتهم وقدرتهم على الحركة"
  },
  "Striving to improve comfort and well-being.": {
    ar: "نسعى جاهدين لتحسين الراحة والرفاهية."
  },
  "Caring for young patients with chronic conditions.": {
    ar: "رعاية المرضى الصغار المصابين بأمراض مزمنة."
  },
  "Providing emotional and physical support.": {
    ar: "تقديم الدعم العاطفي والجسدي."
  },
  "Passionate about providing quality home care.": {
    ar: "شغف بتقديم رعاية منزلية عالية الجودة."
  },
  "Dedicated to respiratory health and care.": {
    ar: "متخصص في الصحة والرعاية التنفسية."
  },
  "Helping patients recover safely at home.": {
    ar: "مساعدة المرضى على التعافي بأمان في المنزل."
  },
  "Committed to helping patients regain independence.": {
    ar: "ملتزم بمساعدة المرضى على استعادة استقلاليتهم."
  },
  "Helping patients regain strength and mobility.": {
    ar: "مساعدة المرضى على استعادة قوتهم وحركتهم."
  }
};

export function generateProviderTranslations(provider: any): ProviderTranslations {
  const hourlyRate = provider.hourly_rate || 0;
  const rating = provider.rating || 0;
  const specialty = provider.specialty || '';
  const bio = provider.bio || '';

  // Get specialty translations if available
  const specialtyMatch = specialtyTranslations[specialty];
  const bioMatch = bioTranslations[bio];

  // Generate translations
  return {
    en: {
      title: provider.name || specialty || 'Healthcare Provider',
      description: bio || specialty || 'Professional healthcare provider',
      rating: `Rating: ${rating.toFixed(1)}`,
      rate: `$${hourlyRate}/hour`
    },
    ar: {
      title: specialtyMatch?.ar.title || provider.name || 'مقدم رعاية صحية',
      description: bioMatch?.ar || specialtyMatch?.ar.description || 'خدمات رعاية صحية منزلية',
      rating: `التقييم: ${rating.toFixed(1)}`,
      rate: `${hourlyRate} ريال/ساعة`
    }
  };
}
