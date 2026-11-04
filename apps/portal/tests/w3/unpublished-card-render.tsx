import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {UnpublishedDecisionCard} from '../../src/features/plan/UnpublishedDecisionCard.tsx';
import type {UnpublishedDecisionCardProps} from '../../src/features/plan/UnpublishedDecisionCard.tsx';
import {DecisionChoiceButton} from '../../src/features/plan/DecisionChoiceButton.tsx';
import type {DecisionChoiceButtonProps} from '../../src/features/plan/DecisionChoiceButton.tsx';

// Deliberately no navigation/overlay provider, transport or application shell.
export function renderCard(props:UnpublishedDecisionCardProps){
  return renderToStaticMarkup(createElement(UnpublishedDecisionCard,props));
}
export function renderChoice(props:DecisionChoiceButtonProps){
  return renderToStaticMarkup(createElement(DecisionChoiceButton,props));
}
