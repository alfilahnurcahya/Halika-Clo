/**
 * Fitur generatif tambahan: merapikan bahasa jawaban dengan LLM proprietary (Gemini).
 * - Hanya MERAPIKAN kalimat dari jawaban template; data tetap dari database.
 * - Jika API key kosong, error, lambat, atau kuota habis -> kembali null (pakai template).
 * - Guardrail: semua angka di jawaban template wajib muncul lagi di hasil LLM.
 */
import axios from 'axios';
import env from '../../config/env.js';
import { buildPrompt, isFaithful } from './llmGuard.js';

export const isLlmEnabled = () => Boolean(env.llm.apiKey);

export async function rephrase(question, draft) {
  if (!isLlmEnabled()) return null;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.llm.model}:generateContent`;
    const { data } = await axios.post(
      url,
      {
        contents: [{ role: 'user', parts: [{ text: buildPrompt(question, draft) }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 256 },
      },
      { timeout: env.llm.timeoutMs, headers: { 'x-goog-api-key': env.llm.apiKey } },
    );
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim();
    if (!isFaithful(draft, text)) {
      console.warn('[llm] Hasil LLM ditolak guardrail, memakai template.');
      return null;
    }
    return text;
  } catch (err) {
    const status = err.response?.status;
    console.warn('[llm] Gagal/kuota habis, memakai template:', status || err.code || err.message);
    return null;
  }
}
