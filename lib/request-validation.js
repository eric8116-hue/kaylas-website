// Bound untrusted bodies before JSON/multipart parsing allocates more memory.
export class RequestError extends Error {
  constructor(message, status = 400, field) {
    super(message);
    this.status = status;
    this.field = field;
  }
}

export async function readLimitedBytes(request, limit) {
  const length = request.headers.get('Content-Length');
  if (length !== null && (!/^\d+$/.test(length) || !Number.isSafeInteger(Number(length)))) {
    throw new RequestError('Invalid request length.');
  }
  if (length !== null && Number(length) > limit) throw new RequestError('The submission is too large.', 413);
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel().catch(() => {});
        throw new RequestError('The submission is too large.', 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

export async function readJsonObject(request, limit = 128 * 1024) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) {
    throw new RequestError('Use a JSON submission.', 415);
  }
  const bytes = await readLimitedBytes(request, limit);
  let body;
  try { body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw new RequestError('Invalid JSON.'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new RequestError('Invalid submission.');
  return body;
}

export function privateJson(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}

export function requestFailure(error) {
  return error instanceof RequestError
    ? privateJson({ error: error.message, ...(error.field ? { field: error.field } : {}) }, error.status)
    : privateJson({ error: 'The request could not be completed. Your entries have not been cleared. Please try again.' }, 500);
}

export function textField(value, name, max, { required = false } = {}) {
  if (value === null || value === undefined) value = '';
  if (typeof value !== 'string' || value.length > max || /\u0000/.test(value)) {
    throw new RequestError(`${name} is too long or invalid.`, 400, name);
  }
  const text = value.trim();
  if (required && !text) throw new RequestError(`${name} is required.`, 400, name);
  return text;
}

export function recordId(value, name = 'client_id') {
  if ((typeof value !== 'number' && typeof value !== 'string') || !/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value))) {
    throw new RequestError(`Invalid ${name}.`, 400, name);
  }
  return Number(value);
}

export function calendarDate(value, name, { optional = false } = {}) {
  if (optional && (value === '' || value === null || value === undefined)) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RequestError(`Choose a valid ${name}.`, 400, name);
  const date = new Date(value + 'T00:00:00Z');
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) throw new RequestError(`Choose a valid ${name}.`, 400, name);
  return value;
}
