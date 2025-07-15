/**
 * Splits a long text into smaller chunks of roughly maxLength characters.
 * Uses sentence boundaries to keep chunks semantically coherent.
 *
 * @param {string} text       - The input text to chunk.
 * @param {number} maxLength  - Approximate maximum length (in characters) per chunk.
 * @returns {string[]}        - An array of text chunks.
 */
export function chunkText(text, maxLength = 500) {
  // Split on sentence-ending punctuation (English and Chinese)
  const sentences = text.split(/(?<=[。！？.!?])\s+/);
  const chunks = [];
  let chunk = '';

  for (const sentence of sentences) {
    // If adding this sentence exceeds maxLength, flush the existing chunk
    if (chunk.length + sentence.length > maxLength) {
      if (chunk.trim()) {
        chunks.push(chunk.trim());
      }
      chunk = '';
    }
    chunk += sentence + ' ';
  }

  // Push any remaining text as the last chunk
  if (chunk.trim()) {
    chunks.push(chunk.trim());
  }

  return chunks;
}
