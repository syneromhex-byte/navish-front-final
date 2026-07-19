export interface ProjectSummary {
  id: string;
  title: string;
  category: string;
  location: string;
  imageUrl: string;
  href: string;
}

export interface ServiceSummary {
  id: string;
  title: string;
  description: string;
  icon: 'scan' | 'cube' | 'headset' | 'palette';
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
}
