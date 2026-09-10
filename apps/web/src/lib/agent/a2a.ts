import { authProps, grantActive, readAgentTrips, readGuide, type RemoteAgentEnvironment } from './remote';
import { AGENT_NO_STORE, agentAccessError, agentError } from './consent';
import { boundedText } from '../../../agent-readiness/body.mjs';
const object = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
export async function handleA2a(request: Request, env: RemoteAgentEnvironment): Promise<Response> {
  if (!authProps(env)) return agentAccessError('invalid_token');
  try { if (!await grantActive(env)) return agentAccessError('invalid_token'); } catch { return agentError('authorization_unavailable', 503); }
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { ...AGENT_NO_STORE, Allow: 'POST' } });
  let body: unknown; let id: string | number | null = null;
  const reply = (value: unknown) => Response.json({ jsonrpc: '2.0', id, ...value as object }, { headers: { ...AGENT_NO_STORE, 'A2A-Version': '1.0' } });
  const error = (code: number, message: string) => reply({ error: { code, message } });
  let raw: string;
  try { raw = await boundedText(request, 16384); } catch { return agentError('request_too_large', 413); }
  try { body = JSON.parse(raw); } catch { return error(-32700, 'Invalid JSON payload'); }
  if (!object(body) || body.jsonrpc !== '2.0' || typeof body.method !== 'string' || !(['string', 'number'].includes(typeof body.id)) || (typeof body.id === 'string' && body.id.length > 128)) return error(-32600, 'Invalid request');
  id = body.id;
  if (request.headers.get('A2A-Version') !== '1.0') return error(-32009, 'Version not supported');
  if (body.method.includes('PushNotification')) return error(-32003, 'Push notifications are not supported');
  if (['SendStreamingMessage', 'SubscribeToTask', 'GetExtendedAgentCard'].includes(body.method)) return error(-32004, 'Operation is not supported');
  if (['GetTask', 'CancelTask'].includes(body.method)) return error(-32001, 'Task not found');
  if (body.method === 'ListTasks') return reply({ result: { tasks: [], nextPageToken: '', pageSize: 0, totalSize: 0 } });
  if (body.method !== 'SendMessage') return error(-32601, 'Method not found');
  const params = body.params;
  const message = params?.message;
  if (!object(params) || Object.keys(params).some(key => !['message', 'configuration'].includes(key)) || !object(message) || message.role !== 'ROLE_USER' || typeof message.messageId !== 'string' || !message.messageId.length || message.messageId.length > 128 || Object.keys(message).some(key => !['role', 'messageId', 'parts'].includes(key))) return error(-32602, 'Invalid parameters');
  const configuration = params.configuration;
  if (configuration !== undefined && (!object(configuration) || Object.keys(configuration).some(key => !['acceptedOutputModes', 'returnImmediately', 'historyLength', 'taskPushNotificationConfig'].includes(key)) || (configuration.acceptedOutputModes !== undefined && (!Array.isArray(configuration.acceptedOutputModes) || !configuration.acceptedOutputModes.every((value: unknown) => typeof value === 'string'))) || (configuration.historyLength !== undefined && (!Number.isSafeInteger(configuration.historyLength) || configuration.historyLength < 0)) || (configuration.returnImmediately !== undefined && typeof configuration.returnImmediately !== 'boolean'))) return error(-32602, 'Invalid parameters');
  if (params.configuration?.taskPushNotificationConfig) return error(-32003, 'Push notifications are not supported');
  if (params.configuration?.returnImmediately) return error(-32004, 'Only immediate stateless responses are supported');
  if (params.configuration?.acceptedOutputModes && !params.configuration.acceptedOutputModes.includes('application/json')) return error(-32005, 'Output content type is not supported');
  if (!Array.isArray(message.parts) || message.parts.length !== 1 || !object(message.parts[0]) || Object.keys(message.parts[0]).some(key => !['data', 'mediaType'].includes(key))) return error(-32005, 'Send one structured operation; free text, files and trip inputs are not accepted');
  const data = message.parts[0].data;
  if (!object(data)) return error(-32602, 'Invalid parameters');
  let output: unknown;
  if (data.operation === 'read_guide') {
    if (!authProps(env)!.scopes.includes('docs:read')) return agentAccessError('insufficient_scope', 'docs:read');
    if (Object.keys(data).some(key => !['operation', 'topic', 'locale'].includes(key))) return error(-32602, 'Invalid parameters');
    const guide = await readGuide(env, { topic: data.topic, locale: data.locale ?? 'en' });
    output = 'isError' in guide && guide.isError ? { error: JSON.parse(guide.content[0].text).error } : { markdown: guide.content[0].text };
  } else if (data.operation === 'read_saved_trips') {
    if (Object.keys(data).some(key => !['operation', 'offset'].includes(key))) return error(-32602, 'Invalid parameters');
    const response = await readAgentTrips(env, data.offset ?? 0);
    if (!response.ok) return response;
    output = await response.json();
  } else return error(-32602, 'Unknown operation');
  // Immediate read-only responses deliberately create no retained task or conversation history.
  return reply({ result: { message: { messageId: crypto.randomUUID(), contextId: crypto.randomUUID(), role: 'ROLE_AGENT', parts: [{ data: output, mediaType: 'application/json' }] } } });
}
