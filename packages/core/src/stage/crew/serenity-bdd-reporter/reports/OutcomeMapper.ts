import { match } from 'tiny-types';

import {
    ExecutionCompromised,
    ExecutionFailedWithAssertionError,
    ExecutionFailedWithError,
    ExecutionIgnored,
    ExecutionSkipped,
    ImplementationPending,
    Outcome,
} from '../../../../model';
import { ErrorDetails } from '../SerenityBDDJsonSchema';
import { ErrorRenderer } from './ErrorRenderer';

/** @access package */
export class OutcomeMapper {
    private static errorRenderer = new ErrorRenderer();

    public mapOutcome(outcome: Outcome, mapAs: (result: string, error?: ErrorDetails) => void) {
        const render = OutcomeMapper.errorRenderer.render;

        return match<Outcome, void>(outcome).
            when(ExecutionCompromised,              ({ error }: ExecutionCompromised)               => mapAs('COMPROMISED', render(error))).
            when(ExecutionFailedWithError,          ({ error }: ExecutionFailedWithError)           => mapAs('ERROR', render(error))).
            when(ExecutionFailedWithAssertionError, ({ error }: ExecutionFailedWithAssertionError)  => mapAs('FAILURE', render(error))).
            when(ExecutionSkipped,      _ => mapAs('SKIPPED')).
            when(ExecutionIgnored,      _ => mapAs('IGNORED')).
            when(ImplementationPending, _ => mapAs('PENDING')).
            else(/* ExecutionSuccessful */ _ => /* ignore */ mapAs('SUCCESS'));
    }
}