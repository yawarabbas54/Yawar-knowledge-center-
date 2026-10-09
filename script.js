'use strict';

const form = document.querySelector('#chat-form');
const input = document.querySelector('#message');
const sendButton = document.querySelector('#send-button');
const chatArea = document.querySelector('#chat-area');
const welcome = document.querySelector('#welcome');
const newChatButton = document.querySelector('#new-chat');
const toast = document.querySelector('#toast');

const history = [];
let busy = false;
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3800);
}

function addMessage(role, content, className = '') {
  welcome?.remove();
  const row = document.createElement('div');
  row.className = `message-row ${role} ${className}`.trim();

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = role === 'user' ? 'Y' : 'AI';
  avatar.setAttribute('aria-hidden', 'true');

  const body = document.createElement('div');
  body.className = 'message-content';

  const label = document.createElement('span');
  label.className = 'message-label';
  label.textContent = role === 'user' ? 'You' : 'Yawar AI';

  const text = document.createElement('div');
  text.className = 'message-text';
  // textContent prevents model output from being interpreted as executable HTML.
  text.textContent = content;

  body.append(label, text);
  row.append(avatar, body);
  chatArea.append(row);
  row.scrollIntoView({ behavior: 'smooth', block: 'end' });
  return { row, text };
}

function setBusy(value) {
  busy = value;
  sendButton.disabled = value;
  input.disabled = value;
  sendButton.textContent = value ? '…' : '↑';
}

async function sendMessage(rawMessage) {
  const message = rawMessage.trim();
  if (!message || busy) return;

  addMessage('user', message);
  input.value = '';
  input.style.height = 'auto';
  setBusy(true);

  const pending = addMessage('assistant', 'Thinking…', 'pending');
  pending.text.classList.add('typing');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);

    pending.row.remove();
    addMessage('assistant', payload.reply || 'The AI returned an empty response.');
    history.push({ role: 'user', content: message }, { role: 'assistant', content: payload.reply || '' });
    if (history.length > 10) history.splice(0, history.length - 10);
  } catch (error) {
    pending.row.remove();
    addMessage('assistant', `I couldn't complete that request. ${error.message}`);
    showToast(error.message);
  } finally {
    setBusy(false);
    input.focus();
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  sendMessage(input.value);
});

input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 180)}px`;
});

input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

document.querySelectorAll('.suggestion').forEach((button) => {
  button.addEventListener('click', () => sendMessage(button.textContent));
});

newChatButton?.addEventListener('click', () => {
  history.length = 0;
  chatArea.replaceChildren();
  const freshWelcome = document.createElement('div');
  freshWelcome.className = 'welcome';
  freshWelcome.innerHTML = '<div class="welcome-icon" aria-hidden="true">✦</div><h2>Welcome to Yawar AI</h2><p>Ask a question, explore an idea, or get help understanding a topic.</p>';
  chatArea.append(freshWelcome);
  input.focus();
});
