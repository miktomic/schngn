import type { RequestHandler } from '@sveltejs/kit';
import { handleContactRequest, type ContactEnvironment } from '$lib/contact/contactApi';

export const POST: RequestHandler = ({ request, platform, fetch }) =>
  handleContactRequest(request, platform?.env as ContactEnvironment | undefined, { fetch });
