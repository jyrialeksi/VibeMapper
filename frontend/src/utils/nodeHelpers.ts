import type { CardType } from '../types';

export function getNodeTypeForCard(cardType: CardType): string {
  switch (cardType) {
    case 'activity': return 'activity';
    case 'step': return 'step';
    case 'annotation': return 'annotation';
    default: return 'storyCard';
  }
}
