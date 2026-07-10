import { createAccountDeletionHandler } from '../../../lib/account/accountApi';
import { authenticateClerkRequest } from '../../../lib/auth/authenticateRequest';

export const DELETE = createAccountDeletionHandler(authenticateClerkRequest);
