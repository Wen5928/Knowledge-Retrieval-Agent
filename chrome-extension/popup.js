document.getElementById('ask').addEventListener('click', async () => {
  const qEl = document.getElementById('question');
  const answerEl = document.getElementById('answer');
  const question = qEl.value.trim();
  if (!question) return;

  answerEl.textContent = '⏳ Thinking…';
  try {
    const res = await fetch('http://localhost:3000/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    const json = await res.json();
    answerEl.textContent = json.answer || json.error;
  } catch (err) {
    answerEl.textContent = '❌ ' + err.message;
  }
});
