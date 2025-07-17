// public/main.js

const API_URL = '/api/ask';
const form    = document.getElementById('askForm');
const qEl     = document.getElementById('question');
const answerEl= document.getElementById('answer');
const fbEl    = document.getElementById('feedback');
const accEl   = document.getElementById('accuracy-rating');
const hlpEl   = document.getElementById('helpfulness-rating');
const subBtn  = document.getElementById('submit-feedback');
const msgEl   = document.getElementById('feedback-message');

// Ratings state
const ratings = { accuracy: 0, helpfulness: 0 };

// Render 1–10 buttons for a given rating category
function renderRating(container, key) {
  container.innerHTML = '';
  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.addEventListener('click', () => {
      ratings[key] = i;
      // Highlight selected
      Array.from(container.children).forEach((child, idx) => {
        child.classList.toggle('selected', idx + 1 === i);
      });
    });
    container.appendChild(btn);
  }
}

// Show feedback UI and initialize ratings
function showFeedback() {
  renderRating(accEl, 'accuracy');
  renderRating(hlpEl, 'helpfulness');
  msgEl.textContent = '';
  fbEl.style.display = 'block';
}

// Handle question submission
async function doAsk(event) {
  event.preventDefault();
  const question = qEl.value.trim();
  if (!question) return;

  answerEl.textContent = '⏳ Thinking…';
  fbEl.style.display = 'none';

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt);
    }
    const { answer, error } = await res.json();
    if (error) throw new Error(error);

    answerEl.textContent = answer;
    showFeedback();
  } catch (err) {
    answerEl.textContent = '❌ ' + err.message;
  }
}

// Handle feedback submission
// Handle feedback submission
async function submitFeedback() {
  // 1) Validate
  if (!ratings.accuracy || !ratings.helpfulness) {
    msgEl.style.color = 'red';
    msgEl.textContent = 'Please rate both fields before submitting.';
    return;
  }

  // 2) Show “submitting” state
  msgEl.style.color = 'blue';
  msgEl.textContent = `Submitting feedback… (Q="${qEl.value.trim()}", accuracy=${ratings.accuracy}, helpfulness=${ratings.helpfulness})`;

  // 3) Send to backend
  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: qEl.value.trim(),
        accuracy: ratings.accuracy,
        helpfulness: ratings.helpfulness
      })
    });

    if (!res.ok) {
      // get any error message from JSON
      const { error } = await res.json();
      throw new Error(error || res.statusText);
    }

    // 4a) Success
    msgEl.style.color = 'green';
    msgEl.textContent = '✅ Thanks for your feedback!';
  } catch (e) {
    // 4b) Error
    msgEl.style.color = 'red';
    msgEl.textContent = '❌ Error submitting feedback: ' + e.message;
  }
}


// Event listeners
form.addEventListener('submit', doAsk);
subBtn.addEventListener('click', submitFeedback);
qEl.addEventListener('keydown', e => {
  if (e.key === 'Enter') doAsk(e);
});
