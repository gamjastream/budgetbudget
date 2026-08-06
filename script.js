let currentUser = localStorage.currentUser || null;

// Helper to switch view screens
function showView(viewId) {
  const views = ['loginForm', 'signupForm', 'verifySignUpForm', 'forgotForm', 'resetPasswordForm'];
  views.forEach(id => {
    let el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  let target = document.getElementById(viewId);
  if (target) target.classList.remove('hidden');
}

// 1. Direct Login Handler
function handleLogin() {
  let userEl = document.getElementById('loginUsername');
  let passEl = document.getElementById('loginPassword');

  let user = userEl ? userEl.value.trim() : '';
  let pass = passEl ? passEl.value.trim() : '';

  if (!user || !pass) {
    alert("Please enter both a username and password! 💕");
    return;
  }

  loginUser(user);
}

function loginUser(user) {
  currentUser = user;
  localStorage.currentUser = user;

  let auth = document.getElementById('authScreen');
  let app = document.getElementById('appScreen');
  let uDisp = document.getElementById('userDisplay');

  if (auth) auth.classList.add('hidden');
  if (app) app.classList.remove('hidden');
  if (uDisp) uDisp.textContent = user;

  document.querySelectorAll('#authScreen input').forEach(input => input.value = '');
  load();
}

function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  let auth = document.getElementById('authScreen');
  let app = document.getElementById('appScreen');

  if (app) app.classList.add('hidden');
  if (auth) auth.classList.remove('hidden');
  showView('loginForm');
}

// 2. Budget Logic
function calc() {
  let iEl = document.getElementById('i');
  let bEl = document.getElementById('b');
  let inc = iEl ? (+iEl.value || 0) : 0;
  let t = 0;

  document.querySelectorAll('.e').forEach(x => t += (+x.value || 0));
  if (bEl) bEl.textContent = (inc - t).toFixed(2);
}

document.addEventListener('DOMContentLoaded', () => {
  let iEl = document.getElementById('i');
  if (iEl) iEl.oninput = calc;
  document.querySelectorAll('.e').forEach(x => x.oninput = calc);
  calc();
  if (currentUser) loginUser(currentUser);
});

function save() {
  if (!currentUser) {
    alert("Please log in first! 💕");
    return;
  }

  let dEl = document.getElementById('d');
  let pEl = document.getElementById('p');
  let iEl = document.getElementById('i');
  let bEl = document.getElementById('b');

  let dateVal = dEl ? dEl.value : '';
  let periodVal = pEl ? pEl.value : 'Weekly';
  let incomeVal = iEl ? (+iEl.value || 0) : 0;
  let balVal = bEl ? (+bEl.textContent || 0) : 0;
  let expenses = Array.from(document.querySelectorAll('.e')).map(x => +x.value || 0);

  let globalBudgets = JSON.parse(localStorage.getItem('budget_tracker_records') || '[]');
  
  globalBudgets.push({
    id: Date.now().toString(),
    owner: currentUser,
    date: dateVal,
    period: periodVal,
    income: incomeVal,
    balance: balVal,
    expenses: expenses
  });

  localStorage.setItem('budget_tracker_records', JSON.stringify(globalBudgets));
  alert("Budget saved successfully! 🎉");
  load();
}

function load() {
  if (!currentUser) return;
  let hEl = document.getElementById('h');
  if (!hEl) return;

  let globalBudgets = JSON.parse(localStorage.getItem('budget_tracker_records') || '[]');
  let userBudgets = globalBudgets.filter(r => r.owner === currentUser);

  if (userBudgets.length === 0) {
    hEl.innerHTML = "<p style='text-align:center; color:#888;'>No saved budgets yet!</p>";
    return;
  }

  hEl.innerHTML = userBudgets.map(r => `
    <div style="background:#fff0f5; padding:12px; margin-top:10px; border-radius:10px;">
      🌸 <strong>${r.date || 'No Date'}</strong> | ${r.period} | 💵 Income: $${r.income} | 💖 Remaining: $${r.balance}
    </div>
  `).join('');
}
