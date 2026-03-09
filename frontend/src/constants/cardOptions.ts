import type { Priority, CardType, CardStatus } from '../types';

export const CARD_STATUSES: CardStatus[] = ['not-started', 'in-progress', 'blocked', 'testing', 'done'];
export const PRIORITIES: Priority[] = ['must-have', 'should-have', 'could-have', 'wont-have'];
export const ESTIMATES = ['XS', 'S', 'M', 'L', 'XL'] as const;
export const CARD_TYPES: CardType[] = ['activity', 'step', 'story', 'annotation'];
