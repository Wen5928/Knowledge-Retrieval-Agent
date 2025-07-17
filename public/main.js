const form  = document.getElementById('askForm');
const qEl   = document.getElementById('question');
const ansEl = document.getElementById('answer');
const fbEl  = document.getElementById('feedback');
const accEl = document.getElementById('accuracy-rating');
const hlpEl = document.getElementById('helpfulness-rating');
const subBtn = document.getElementById('submit-feedback');
const msgEl  = document.getElementById('feedback-message');

askBtn.addEventListener('click', doAsk);
qEl.addEventListener('keydown', e => { if (e.key==='Enter') doAsk(); });

async function doAsk() {
  const question = qEl.value.trim();
  if (!question) return;
  ansEl.textContent = '⏳ Thinking…';
  fbEl.style.display = 'none';
  msgEl.textContent = '';

  // … your existing fetch to /api/ask …
  const res = await fetch(API_URL, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ question })
  });
  const { answer, error } = await res.json();
  ansEl.textContent = answer ?? `❌ ${error}`;

  // initialize feedback UI
  renderRating(accEl, 'accuracy');
  renderRating(hlpEl, 'helpfulness');
  fbEl.style.display = 'block';
}

// helper to render ten buttons and capture selection
const ratings = { accuracy: 0, helpfulness: 0 };
function renderRating(container, key) {
  container.innerHTML = '';
  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.addEventListener('click', () => {
      ratings[key] = i;
      // update selected styling
      Array.from(container.children).forEach((b, idx) => {
        b.classList.toggle('selected', idx+1 === i);
      });
    });
    container.appendChild(btn);
  }
}

// submit feedback handler
subBtn.addEventListener('click', () => {
  if (!ratings.accuracy || !ratings.helpfulness) {
    msgEl.style.color = 'red';
    msgEl.textContent = 'Please rate both fields before submitting.';
    return;
  }
  // here you could POST to /api/feedback or just log:
  console.log('Feedback submitted:', ratings);
  msgEl.style.color = 'green';
  msgEl.textContent = 'Thanks for your feedback!';
  // optionally hide the feedback UI:
  // fbEl.style.display = 'none';
});
