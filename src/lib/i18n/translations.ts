export const translations = {
  en: {
    hero: {
      title: "Complete Healthcare Solutions",
      subtitle: "Connect with top healthcare professionals and home care providers for comprehensive care.",
      findDoctor: "Find a Doctor",
      findCare: "Find Home Care"
    },
    nav: {
      home: "Home",
      doctors: "Find Doctors",
      providers: "Care Providers",
      about: "About",
      login: "Login",
      register: "Register"
    },
    sections: {
      doctors: "Medical Professionals",
      specialties: "Our Medical Specialties",
      services: "Home Care Services",
      featured: "Featured Care Providers"
    }
  },
  ar: {
    hero: {
      title: "حلول الرعاية الصحية المتكاملة",
      subtitle: "تواصل مع أفضل المتخصصين في الرعاية الصحية ومقدمي الرعاية المنزلية",
      findDoctor: "ابحث عن طبيب",
      findCare: "ابحث عن رعاية منزلية"
    },
    nav: {
      home: "الرئيسية",
      doctors: "البحث عن أطباء",
      providers: "مقدمي الرعاية",
      about: "حول",
      login: "تسجيل الدخول",
      register: "تسجيل"
    },
    sections: {
      doctors: "الأطباء المتخصصون",
      specialties: "تخصصاتنا الطبية",
      services: "خدمات الرعاية المنزلية",
      featured: "مقدمو الرعاية المميزون"
    }
  }
};

export type SupportedLanguages = keyof typeof translations;
