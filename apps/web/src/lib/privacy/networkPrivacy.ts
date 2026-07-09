export interface ObservedNetworkRequest {
  url: string;
  method?: string;
  postData?: string | null;
}

export interface PrivacyScanFinding {
  request: ObservedNetworkRequest;
  forbiddenValue: string;
  location: 'url' | 'postData';
}

export function findForbiddenNetworkPayloads(
  requests: ObservedNetworkRequest[],
  forbiddenValues: string[]
): PrivacyScanFinding[] {
  const normalizedForbiddenValues = forbiddenValues
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  const findings: PrivacyScanFinding[] = [];

  for (const request of requests) {
    findings.push(...findForbiddenValuesInLocation(request, request.url, 'url', normalizedForbiddenValues));
    findings.push(
      ...findForbiddenValuesInLocation(request, request.postData ?? '', 'postData', normalizedForbiddenValues)
    );
  }

  return findings;
}

function findForbiddenValuesInLocation(
  request: ObservedNetworkRequest,
  haystack: string,
  location: PrivacyScanFinding['location'],
  forbiddenValues: string[]
): PrivacyScanFinding[] {
  const decodedHaystack = decodeLoosely(haystack);
  return forbiddenValues
    .filter((forbiddenValue) => decodedHaystack.includes(forbiddenValue))
    .map((forbiddenValue) => ({ request, forbiddenValue, location }));
}

function decodeLoosely(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function assertNoForbiddenNetworkPayloads(
  requests: ObservedNetworkRequest[],
  forbiddenValues: string[]
): void {
  const findings = findForbiddenNetworkPayloads(requests, forbiddenValues);
  if (findings.length > 0) {
    const summary = findings
      .map((finding) => `${finding.location} leaked ${finding.forbiddenValue} via ${finding.request.method ?? 'GET'} ${finding.request.url}`)
      .join('\n');
    throw new Error(`Forbidden private travel data appeared in network payloads:\n${summary}`);
  }
}
