/**
 * 複数サイズの PNG (Vista 以降がサポートする ICO 内 PNG 直埋め込み形式) から
 * .ico ファイルを組み立てる最小限のエンコーダー。外部ライブラリ不要。
 */
export async function buildIco(pngBlobsBySize: { size: number; blob: Blob }[]): Promise<Blob> {
  const buffers = await Promise.all(pngBlobsBySize.map((p) => p.blob.arrayBuffer()));

  const headerSize = 6;
  const entrySize = 16;
  const dirSize = headerSize + entrySize * pngBlobsBySize.length;
  const totalSize = dirSize + buffers.reduce((sum, b) => sum + b.byteLength, 0);

  const out = new Uint8Array(totalSize);
  const view = new DataView(out.buffer);

  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type: 1 = icon
  view.setUint16(4, pngBlobsBySize.length, true);

  let offset = dirSize;
  pngBlobsBySize.forEach((p, i) => {
    const entryOffset = headerSize + i * entrySize;
    const dim = p.size >= 256 ? 0 : p.size; // 0 は 256px を意味する
    view.setUint8(entryOffset, dim); // width
    view.setUint8(entryOffset + 1, dim); // height
    view.setUint8(entryOffset + 2, 0); // color count
    view.setUint8(entryOffset + 3, 0); // reserved
    view.setUint16(entryOffset + 4, 1, true); // planes
    view.setUint16(entryOffset + 6, 32, true); // bit count
    view.setUint32(entryOffset + 8, buffers[i].byteLength, true); // bytes in resource
    view.setUint32(entryOffset + 12, offset, true); // image offset

    out.set(new Uint8Array(buffers[i]), offset);
    offset += buffers[i].byteLength;
  });

  return new Blob([out], { type: "image/x-icon" });
}
