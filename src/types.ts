export interface Product {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  originalPrice: number;
  salePrice: number;
  isSale: boolean;
  buttonText: string;
  buttonLink: string;
  successLink?: string; // Link to be opened after successful payment
  timerDuration: number; // in minutes
  isTimerEnabled: boolean;
  demoVideoLinks?: string[]; // Links to be opened when clicking "Demo Video"
  packNumber?: number; // Internal sorting number for Admin panel
  customization?: {
    themeColor?: string;
    headingText?: string;
    showTimer?: boolean;
    showVideos?: boolean;
  };
  createdAt?: any;
}

export interface PaymentSubmission {
  id: string;
  productId: string;
  productTitle: string;
  accessCode: string;
  amount: number;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: any;
}

export interface Admin {
  uid: string;
  email: string;
  role: 'admin';
}

export interface SiteSettings {
  shopTitle: string;
  adminPassword?: string;
  profileImageUrl?: string;
  announcementText?: string;
  instagramUrl?: string;
  telegramUrl?: string;
  whatsappUrl?: string;
  howToAccessUrl?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
}

export interface PreviewVideo {
  id: string;
  title: string;
  videoUrl: string;
  createdAt: any;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  text: string;
  rating: number;
  createdAt: any;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
  createdAt: any;
}

export interface EarningsProof {
  id: string;
  imageUrl: string;
  caption: string;
  createdAt: any;
}
