import type { ModuleId } from '../types';
import { WhatIsPhageModule } from './WhatIsPhage';
import { PhageLifecycleModule } from './PhageLifecycle';

export type ModuleComponent = () => JSX.Element;

export interface ModuleMeta {
  id: ModuleId;
  title: string;
  description: string;
  estimatedMinutes: number;
  component: ModuleComponent;
}

export const FOUNDATION_MODULES: ModuleMeta[] = [
  {
    id: 'intro-to-phages',
    title: 'What is a bacteriophage?',
    description: 'Structure, lifecycle overview, historical milestones, and why phages matter.',
    estimatedMinutes: 8,
    component: WhatIsPhageModule,
  },
  {
    id: 'phage-lifecycle',
    title: 'Phage Lifecycle',
    description: 'Lytic and lysogenic cycles, temperate vs virulent phages, Lambda decision circuit.',
    estimatedMinutes: 12,
    component: PhageLifecycleModule,
  },
];

export { WhatIsPhageModule } from './WhatIsPhage';
export { PhageLifecycleModule } from './PhageLifecycle';
