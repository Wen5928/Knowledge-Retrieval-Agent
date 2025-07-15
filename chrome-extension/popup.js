const API_URL = 'https://knowledge-retrieval-agent.vercel.app/api/ask';
const qEl     = document.getElementById('question');
const askBtn  = document.getElementById('ask');
const ansEl   = document.getElementById('answer');

// Submit on button click
askBtn.addEventListener('click', doAsk);

// …or on Enter key
qEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doAsk();
});

async function doAsk() {
  const question = qEl.value.trim();
  if (!question) return;

  ansEl.textContent = '⏳ Thinking…';

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });

    if (!res.ok) {
      const txt = await res.text();
      ansEl.textContent = `❌ ${txt}`;
      return;
    }

    const { answer, error } = await res.json();
    ansEl.textContent = answer ?? `❌ ${error}`;
  } catch (err) {
    ansEl.textContent = '❌ ' + err.message;
  }
}