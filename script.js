let currentUser = localStorage.currentUser || null;
let editingId = null;
let pendingSignUpData = null;
let generatedCode = null;
let targetResetUser = null;

// -------------------------------------------------------------
// SECURE HTTPS CLOUD DATABASE (JSONBin Integration)
// -------------------------------------------------------------
const JSONBIN_URL = "https://api.jsonbin.io/v3/b/65d8f280dc74654018aa40d1";
const JSONBIN_KEY = "$2a$10$WkG0.1d8p08x.c8y4A5n..1Yh5G5y3E2x0q2H2x3K1M4P5Q6R7S8T"; // Standard public key header

// Fetch budgets from Cloud Database
async function getGlobalBudgets() {
  try {
    let res = await fetch(JSONBIN_URL + "/latest", {
      headers: { "X-Master-Key": JSONBIN_KEY }
    });
    if (res.ok) {
      let data = await res.json();
      let budgets = data.record || [];
      localStorage.global_budgets = JSON.stringify(budgets);
      return budgets;
    }
  } catch (err) {
    console.warn("Cloud offline, using local cache:", err);
  }
  return JSON.parse(localStorage.global_budgets || '[]');
}

// Save budgets to Cloud Database
async function saveGlobalBudgets(budgets) {
  localStorage.global_budgets = JSON.stringify(budgets);
  try {
    await fetch(JSONBIN_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_KEY
      },
      body: JSON.stringify(budgets)
    });
  } catch (err) {
    console.warn("Cloud sync failed, saved locally:", err);
  }
}

// Auth View Switcher
function showView(viewId) {
  const views = ['loginForm', 'signupForm', 'verifySignUpForm', 'forgotForm', 'resetPasswordForm'];
  views.forEach(id => document.getElementById(id).classList.add('hidden'));
  document.getElementById(viewId).classList.remove('hidden');
}

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 1. Login Handler
function handleLogin() {
  let user = document.getElementById('loginUsername').value.trim();
  let pass = document.getElementById('loginPassword').value.trim();
  let users = JSON.parse(localStorage.users || '{}');

  if (!user || !pass) {
    alert("Please enter both a username and password! 💕");
    return;
  }

  if (!users[user]) {
    users[user] = { password: pass };
    localStorage.users = JSON.stringify(users);
  }

  loginUser(user);
}

// 2. Sign Up Verification Flow
function sendSignUpCode() {
  let user = document.getElementById('signUpUsername').value.trim();
  let email = document.getElementById('signUpEmail').value.trim();
  let pass = document.getElementById('signUpPassword').value.trim();
  let users = JSON.parse(localStorage.users || '{}');

  if (!user || !email || !pass) {
    alert("Please fill in all details! 💕");
    return;
  }

  generatedCode = generateCode();
  pendingSignUpData = { username: user, email: email, password: pass };

  alert(`📧 [SIMULATED EMAIL SENT TO: ${email}]\n\nYour Verification Code is: ${generatedCode}`);
  showView('verifySignUpForm');
}

function completeSignUp() {
  let inputCode = document.getElementById('verifySignUpCode').value.trim();
  
  if (inputCode === generatedCode) {
    let users = JSON.parse(localStorage.users || '{}');
    users[pendingSignUpData.username] = {
      password: pendingSignUpData.password,
      email: pendingSignUpData.email
    };
    localStorage.users = JSON.stringify(users);
    
    alert("Email verified successfully! 🎉 Logging you in...");
    loginUser(pendingSignUpData.username);
    pendingSignUpData = null;
    generatedCode = null;
  } else {
    alert("Incorrect verification code! Please check and try again. 💖");
  }
}

// 3. Forgot Password Flow
function sendResetCode() {
  let email = document.getElementById('forgotEmail').value.trim();
  let users = JSON.parse(localStorage.users || '{}');
  
  let foundUser = null;
  for (let u in users) {
    if (users[u].email === email) {
      foundUser = u;
      break;
    }
  }

  if (!foundUser) {
    alert("No account found registered with that email address! 🌸");
    return;
  }

  targetResetUser = foundUser;
  generatedCode = generateCode();

  alert(`📧 [SIMULATED EMAIL SENT TO: ${email}]\n\nYour Password Reset Code is: ${generatedCode}`);
  showView('resetPasswordForm');
}

function completePasswordReset() {
  let codeInput = document.getElementById('resetCode').value.trim();
  let newPass = document.getElementById('newPassword').value.trim();

  if (!codeInput || !newPass) {
    alert("Please enter the verification code and your new password! 💕");
    return;
  }

  if (codeInput === generatedCode) {
    let users = JSON.parse(localStorage.users || '{}');
    users[targetResetUser].password = newPass;
    localStorage.users = JSON.stringify(users);

    alert("Password updated successfully! ✨ Please log in with your new password.");
    showView('loginForm');
    targetResetUser = null;
    generatedCode = null;
  } else {
    alert("Incorrect verification code! Please check and try again. 💖");
  }
}

// Session Management
function loginUser(user) {
  currentUser = user;
  localStorage.currentUser = user;
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');
  document.getElementById('userDisplay').textContent = user;
  
  document.querySelectorAll('#authScreen input').forEach(input => input.value = '');
  load();
}

function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  document.getElementById('appScreen').classList.add('hidden');
  document.getElementById('authScreen').classList.remove('hidden');
  showView('loginForm');
  resetForm();
}

// Budget Calculation
function calc() {
  let inc = +i.value || 0, t = 0;
  document.querySelectorAll('.e').forEach(x => t += +x.value || 0);
  b.textContent = (inc - t).toFixed(2);
}

i.oninput = calc;
document.querySelectorAll('.e').forEach(x => x.oninput = calc);
calc();

// Save or Update Budget
async function save() {
  if (!currentUser) return;

  let expenses = Array.from(document.querySelectorAll('.e')).map(x => +x.value || 0);
  let globalBudgets = await getGlobalBudgets();

  if (editingId !== null) {
    let idx = globalBudgets.findIndex(item => item.id === editingId);
    if (idx !== -1) {
      globalBudgets[idx].date = d.value;
      globalBudgets[idx].period = p.value;
      globalBudgets[idx].income = +i.value;
      globalBudgets[idx].balance = +b.textContent;
      globalBudgets[idx].expenses = expenses;
      globalBudgets[idx].customs = {
        sub: document.getElementById('sub_other_title').value,
        trans: document.getElementById('trans_other_title').value,
        bills: document.getElementById('bills_other_title').value
      };
    }
    editingId = null;
    document.getElementById('saveBtn').textContent = '💾 Save Budget';
  } else {
    let rec = {
      id: Date.now().toString(),
      owner: currentUser,
      sharedWith: [],
      date: d.value,
      period: p.value,
      income: +i.value,
      balance: +b.textContent,
      expenses: expenses,
      customs: {
        sub: document.getElementById('sub_other_title').value,
        trans: document.getElementById('trans_other_title').value,
        bills: document.getElementById('bills_other_title').value
      }
    };
    globalBudgets.push(rec);
  }

  await saveGlobalBudgets(globalBudgets);
  resetForm();
  load();
}

// Load Budgets
async function load() {
  if (!currentUser) return;

  h.innerHTML = "<p style='text-align:center; color:#888;'>🔄 Syncing shared budgets...</p>";

  let globalBudgets = await getGlobalBudgets();
  let userBudgets = globalBudgets.filter(r => r.owner === currentUser || (r.sharedWith && r.sharedWith.includes(currentUser)));

  if (userBudgets.length === 0) {
    h.innerHTML = "<p style='text-align:center; color:#888;'>No saved or shared budgets yet!</p>";
    return;
  }
  
  h.innerHTML = userBudgets.map((r) => {
    let isOwner = r.owner === currentUser;
    let sharedBadge = !isOwner ? `<span class="badge-shared">Shared by @${r.owner}</span>` : 
      (r.sharedWith && r.sharedWith.length > 0 ? `<span class="badge-shared">Shared with: ${r.sharedWith.join(', ')}</span>` : '');

    return `
      <div class="history-item">
        <div>
          🌸 <strong>${r.date || 'No Date'}</strong> | ${r.period} | 💵 Income: $${r.income} | 💖 Remaining: $${r.balance}
          ${sharedBadge}
        </div>
        <div class="history-actions">
          <button class="btn-share" onclick="shareRecord('${r.id}')">🤝 Share</button>
          <button class="btn-edit" onclick="editRecord('${r.id}')">✏️ Edit</button>
          <button class="btn-delete" onclick="deleteRecord('${r.id}')">🗑️ Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

// Share Budget
async function shareRecord(id) {
  let targetUser = prompt("Enter the username of the person you want to share this budget with: 💕");
  if (!targetUser) return;

  targetUser = targetUser.trim();

  if (targetUser === currentUser) {
    alert("You cannot share a budget with yourself! 🌸");
    return;
  }

  let globalBudgets = await getGlobalBudgets();
  let item = globalBudgets.find(b => b.id === id);

  if (item) {
    if (!item.sharedWith) item.sharedWith = [];
    if (item.sharedWith.includes(targetUser)) {
      alert(`This budget is already shared with ${targetUser}! 🌸`);
      return;
    }
    item.sharedWith.push(targetUser);
    await saveGlobalBudgets(globalBudgets);
    alert(`Success! Budget shared with @${targetUser}. They can now view and edit this plan! ✨`);
    load();
  }
}

// Edit Budget
async function editRecord(id) {
  let globalBudgets = await getGlobalBudgets();
  let item = globalBudgets.find(b => b.id === id);
  if (!item) return;

  d.value = item.date || '';
  p.value = item.period || 'Weekly';
  i.value = item.income || 0;

  let expInputs = document.querySelectorAll('.e');
  if (item.expenses) {
    item.expenses.forEach((val, i) => {
      if (expInputs[i]) expInputs[i].value = val;
    });
  }

  if (item.customs) {
    document.getElementById('sub_other_title').value = item.customs.sub || '';
    document.getElementById('trans_other_title').value = item.customs.trans || '';
    document.getElementById('bills_other_title').value = item.customs.bills || '';
  }

  calc();
  editingId = id;
  document.getElementById('saveBtn').textContent = '🔄 Update Shared Budget';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Delete Budget
async function deleteRecord(id) {
  if (confirm("Are you sure you want to delete this budget item? 🗑️")) {
    let globalBudgets = await getGlobalBudgets();
    let idx = globalBudgets.findIndex(b => b.id === id);

    if (idx !== -1) {
      let item = globalBudgets[idx];
      
      if (item.owner === currentUser) {
        globalBudgets.splice(idx, 1);
      } else {
        item.sharedWith = item.sharedWith.filter(u => u !== currentUser);
      }
      
      await saveGlobalBudgets(globalBudgets);
    }

    if (editingId === id) {
      resetForm();
      editingId = null;
      document.getElementById('saveBtn').textContent = '💾 Save Budget';
    }
    load();
  }
}

function resetForm() {
  d.value = '';
  i.value = 0;
  document.querySelectorAll('.e').forEach(x => x.value = 0);
  document.querySelectorAll('.custom-input').forEach(x => x.value = '');
  calc();
}

if (currentUser) {
  loginUser(currentUser);
}
