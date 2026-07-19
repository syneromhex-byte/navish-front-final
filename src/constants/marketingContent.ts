import type { ProjectSummary, ServiceSummary, Testimonial } from '@app-types/content.types';
import { ROUTES } from '@constants/routes';

/** Fixed room-type categories shown as filter pills on Portfolio/Projects — always shown even if a category has no case study yet. */
export const SHOWCASE_CATEGORIES = ['Kitchen', 'Living Room', 'Bedroom', 'Bathroom', 'Outdoor'];

export const FEATURED_PROJECTS: ProjectSummary[] = [
  {
    id: 'meridian-residence',
    title: 'Meridian Residence',
    category: 'Living Room',
    location: 'Aspen, Colorado',
    imageUrl: '',
    href: ROUTES.viewer('meridian-residence'),
  },
  {
    id: 'obsidian-loft',
    title: 'Obsidian Loft',
    category: 'Kitchen',
    location: 'New York, NY',
    imageUrl: '',
    href: ROUTES.viewer('obsidian-loft'),
  },
  {
    id: 'harbor-pavilion',
    title: 'Harbor Pavilion',
    category: 'Outdoor',
    location: 'Seattle, Washington',
    imageUrl: '',
    href: ROUTES.viewer('harbor-pavilion'),
  },
  {
    id: 'linden-house',
    title: 'Linden House',
    category: 'Bathroom',
    location: 'Austin, Texas',
    imageUrl: '',
    href: ROUTES.viewer('linden-house'),
  },
];

export const SERVICES: ServiceSummary[] = [
  {
    id: 'scanning',
    title: '3D Capture & Scanning',
    description:
      'High-fidelity spatial capture of existing interiors, converted into fully navigable 3D environments.',
    icon: 'scan',
  },
  {
    id: 'modeling',
    title: 'Architectural Modeling',
    description:
      'Precision CAD-to-3D conversion with true-to-scale geometry, PBR materials, and physically accurate lighting.',
    icon: 'cube',
  },
  {
    id: 'vr',
    title: 'VR Walkthroughs',
    description:
      'Room-scale WebXR experiences for Quest, Pico, and Vive — no app install required.',
    icon: 'headset',
  },
  {
    id: 'customization',
    title: 'Real-Time Customization',
    description:
      "Live material, color, and furniture swaps so clients can explore every finish before it's built.",
    icon: 'palette',
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    quote:
      'Our clients walk through a space months before ground is broken. NAVISH ARC changed how we sell design.',
    author: 'Elena Marsh',
    role: 'Principal Architect, Marsh & Co.',
  },
  {
    id: 't2',
    quote:
      'The material editor alone saved us a dozen site visits. Every finish decision now happens in the browser.',
    author: 'Daniel Reyes',
    role: 'Design Director, Reyes Studio',
  },
  {
    id: 't3',
    quote:
      'VR walkthroughs closed a seven-figure commercial deal without the client ever visiting the site in person.',
    author: 'Priya Nair',
    role: 'Development Lead, Nair Group',
  },
];
