import { MatchOnOkError } from './errors';

// @ts-expect-error The constructor requires the name of the Err-only method that was called on an Ok.
new MatchOnOkError();

new MatchOnOkError('matchError');
