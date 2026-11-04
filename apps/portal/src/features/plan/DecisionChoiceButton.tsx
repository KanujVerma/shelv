import type {ComponentProps} from 'react';
import {Button} from '../../ui/index.ts';
import type {DecisionCommand} from './types.ts';

export interface DecisionChoiceButtonProps extends Pick<ComponentProps<typeof Button>,'disabled'|'busy'|'onClick'> {
    choice:DecisionCommand['choice'];
    purchase:boolean;
}
/** Presentation only. Interactive callers retain their exact handlers and
 * disabled/busy state; a preview supplies disabled and no handler. */
export function DecisionChoiceButton({choice,purchase,disabled,busy,onClick}:DecisionChoiceButtonProps){
    return <Button variant={choice==='deferred'?'secondary':choice==='declined'?'ghost':undefined} busy={busy} disabled={disabled} onClick={onClick}>
        {choice==='approved'?purchase?'approve product':'approve decision':choice==='deferred'?'decide later':'decline'}
    </Button>;
}
