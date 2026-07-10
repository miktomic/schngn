import { createAccountTripHandlers } from '../../../../lib/account/accountApi';
import { authenticateClerkRequest } from '../../../../lib/auth/authenticateRequest';

const handlers = createAccountTripHandlers(authenticateClerkRequest);

export const GET = handlers.GET;
export const PUT = handlers.PUT;

