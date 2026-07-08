/** fetch の Response.body (ReadableStream) を1行ずつ非同期にyieldするヘルパー。SSE・NDJSON共通で使う */
export async function* iterateLines(response: Response): AsyncGenerator<string> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) yield line;
    }
    if (buffer) yield buffer;
  } finally {
    reader.releaseLock();
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

export async function assertOk(res: Response, providerLabel: string): Promise<void> {
  if (!res.ok) {
    throw new Error(`${providerLabel} API エラー: ${res.status} ${await safeText(res)}`);
  }
}
