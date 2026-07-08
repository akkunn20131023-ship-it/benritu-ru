import pdfParse from "pdf-parse";

/** PDF バイナリからテキストを抽出する。クイズ生成プラグイン等が利用する */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer);
  return result.text;
}
