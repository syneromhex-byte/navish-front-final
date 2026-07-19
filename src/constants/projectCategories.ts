import type { ProjectCategory } from '@app-types/project.types';

export const PROJECT_CATEGORIES: { value: ProjectCategory; label: string }[] = [
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'living-room', label: 'Living Room' },
  { value: 'bedroom', label: 'Bedroom' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'dining', label: 'Dining' },
  { value: 'office', label: 'Office' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'custom', label: 'Custom Room' },
  { value: 'other', label: 'Other' },
];

export function categoryLabel(category: ProjectCategory): string {
  return PROJECT_CATEGORIES.find((entry) => entry.value === category)?.label ?? category;
}
