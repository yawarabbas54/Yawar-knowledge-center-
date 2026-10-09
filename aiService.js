'use strict';

const config = require('../config');
const { HttpError } = require('../utils/httpError');

class AIService {
  constructor({ apiKey = config.aiApiKey, baseUrl = config.aiBaseUrl, model = config.aiModel } = {}) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.model = model;
  }

  async reply({ message, history = [], knowledge = [] }) {
    if (!this.apiKey) {
      throw new HttpError(
        503,
        'AI is not configured. Add AI_API_KEY and AI_MODEL to your server environment.'
      );
    }

    const knowledgeText = knowledge.length
      ? knowledge.map((item, index) =>
          `${index + 1}. ${item.title}\n${item.content}`
        ).join('\n\n')
      : 'No saved knowledge articles were found.';

    const messages = [
      {
        role: 'system',
        content:
          'You are Yawar AI, a helpful general-purpose assistant. Be accurate, clear, and honest about uncertainty. ' +
          'Use the supplied knowledge articles when relevant, but do not claim they say something they do not say. ' +
          'If the answer is not in the articles, answer from your general knowledge and say when you are unsure.\n\n' +
          'Knowledge articles:\n' + knowledgeText
      },
      ...history.slice(-10).filter((item) =>
        item && ['user', 'assistant'].includes(item.role) &&
        typeof item.content === 'string'
      ).map(({ role, content }) => ({ role, content: content.slice(0, 4000) })),
      { role: 'user', content: message }
    ];

    let response;
    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.4
        }),
        signal: AbortSignal.timeout(45000)
      });
    } catch (error) {
      throw new HttpError(502, 'Could not reach the AI provider. Check the server connection and AI endpoint.');
    }

    if (!response.ok) {
      // Do not expose provider response bodies, which can contain sensitive diagnostics.
      throw new HttpError(502, `AI provider returned an error (HTTP ${response.status}). Check server configuration.`);
    }

    const payload = await response.json().catch(() => null);
    const content = payload?.choices?.[0]?.message?.content;

    if (typeof content !== 'string' || !content.trim()) {
      throw new HttpError(502, 'The AI provider returned an empty or unexpected response.');
    }

    return content.trim();
  }
}

module.exports = { AIService };
