let currentUser = localStorage.currentUser || null;
let editingId = null;
let pendingSignUpData = null;
let generatedCode = null;
let targetResetUser = null;

// Auth View Switcher
function showView(viewId) {
  const views = ['loginForm', 'signupForm', 'verifySignUpForm', 'forgotForm', 'resetPasswordForm'];
  views.forEach(id => {
    let el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  let target = document.getElementById(viewId);
  if (target) target.classList.remove('hidden');
}

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Local Storage Helper Functions
function getBudgets() {
  try {
    return JSON.parse(localStorage.getItem('budget_tracker_records') || '[]');
  } catch (e) {
    return [];
  }
}

function saveBudgets(data) {
  localStorage.setItem('budget_tracker_records', JSON.stringify(data));
}

// 1. Login Handler
function handleLogin() {
  let userEl = document.getElementById('loginUsername');
  let passEl = document.getElementById('loginPassword');
  let user = userEl ? userEl.value.trim() : '';
  let pass = passEl ? passEl.value.trim() : '';
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
  resetForm();
}

// Budget Calculation
function calc() {
  let iEl = document.getElementById('i');
  let bEl = document.getElementById('b');
  let inc = iEl ? (+iEl.value || 0) : 0;
  let t = 0;
  
  document.querySelectorAll('.e').forEach(x => t += (+x.value || 0));
  if (bEl) bEl.textContent = (inc - t).toFixed(2);
}

// Attach Event Listeners Safely
document.addEventListener('DOMContentLoaded', () => {
  let iEl = document.getElementById('i');
  if (iEl) iEl.oninput = calc;
  document.querySelectorAll('.e').forEach(x => x.oninput = calc);
  calc();
  if (currentUser) loginUser(currentUser);
});

// SAVE BUDGET FUNCTION
function save() {
  if (!currentUser) {
    alert("Please log in first! 💕");
    return;
  }

  let dEl = document.getElementById('d');
  let pEl = document.getElementById('p');
  let iEl = document.getElementById('i');
  let bEl = document.getElementById('b');
  let saveBtn = document.getElementById('saveBtn');

  let dateVal = dEl ? dEl.value : '';
  let periodVal = pEl ? pEl.value : 'Weekly';
  let incomeVal = iEl ? (+iEl.value || 0) : 0;
  let balVal = bEl ? (+bEl.textContent || 0) : 0;

  let expenses = Array.from(document.querySelectorAll('.e')).map(x => +x.value || 0);
  let globalBudgets = getBudgets();

  let subTitle = document.getElementById('sub_other_title');
  let transTitle = document.getElementById('trans_other_title');
  let billsTitle = document.getElementById('bills_other_title');

  if (editingId !== null) {
    let idx = globalBudgets.findIndex(item => item.id === editingId);
    if (idx !== -1) {
      globalBudgets[idx].date = dateVal;
      globalBudgets[idx].period = periodVal;
      globalBudgets[idx].income = incomeVal;
      globalBudgets[idx].balance = balVal;
      globalBudgets[idx].expenses = expenses;
      globalBudgets[idx].customs = {
        sub: subTitle ? subTitle.value : '',
        trans: transTitle ? transTitle.value : '',
        bills: billsTitle ? billsTitle.value : ''
      };
    }
    editingId = null;
    if (saveBtn) saveBtn.textContent = '💾 Save Budget';
  } else {
    let rec = {
      id: Date.now().toString(),
      owner: currentUser,
      sharedWith: [],
      date: dateVal,
      period: periodVal,
      income: incomeVal,
      balance: balVal,
      expenses: expenses,
      customs: {
        sub: subTitle ? subTitle.value : '',
        trans: transTitle ? transTitle.value : '',
        bills: billsTitle ? billsTitle.value : ''
      }
    };
    globalBudgets.push(rec);
  }

  saveBudgets(globalBudgets);
  resetForm();
  load();
  alert("Budget saved successfully! 🎉");
}

// LOAD BUDGETS FUNCTION
function load() {
  if (!currentUser) return;

  let hEl = document.getElementById('h');
  if (!hEl) return;

  let globalBudgets = getBudgets();
  let userBudgets = globalBudgets.filter(r => r.owner === currentUser || (r.sharedWith && r.sharedWith.includes(currentUser)));

  if (userBudgets.length === 0) {
    hEl.innerHTML = "<p style='text-align:center; color:#888;'>No saved or shared budgets yet!</p>";
    return;
  }
  
  hEl.innerHTML = userBudgets.map((r) => {
    let isOwner = r.owner === currentUser;
    let sharedBadge = !isOwner ? `<span class="badge-shared">Shared by @${r.owner}</span>` : 
      (r.sharedWith && r.sharedWith.length > 0 ? `<span class="badge-shared">Shared with: ${r.sharedWith.join(', ')}</span>` : '');

    return `
      <div class="history-item" style="background:#fff0f5; padding:12px; margin-top:10px; border-radius:10px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          🌸 <strong>${r.date || 'No Date'}</strong> | ${r.period} | 💵 Income: $${r.income} | 💖 Remaining: $${r.balance}
          ${sharedBadge}
        </div>
        <div class="history-actions" style="display:flex; gap:5px;">
          <button onclick="shareRecord('${r.id}')" style="background:#ff77a9; color:white; border:none; padding:5px 10px; border-radius:6px; cursor:pointer;">🤝 Share</button>
          <button onclick="editRecord('${r.id}')" style="background:#4a90e2; color:white; border:none; padding:5px 10px; border-radius:6px; cursor:pointer;">✏️ Edit</button>
          <button onclick="deleteRecord('${r.id}')" style="background:#e74c3c; color:white; border:none; padding:5px 10px; border-radius:6px; cursor:pointer;">🗑️ Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

// SHARE RECORD
function shareRecord(id) {
  let targetUser = prompt("Enter the username of the person you want to share this budget with: 💕");
  if (!targetUser) return;

  targetUser = targetUser.trim();

  if (targetUser === currentUser) {
    alert("You cannot share a budget with yourself! 🌸");
    return;
  }

  let globalBudgets = getBudgets();
  let item = globalBudgets.find(b => b.id === id);

  if (item) {
    if (!item.sharedWith) item.sharedWith = [];
    if (item.sharedWith.includes(targetUser)) {
      alert(`This budget is already shared with ${targetUser}! 🌸`);
      return;
    }
    item.sharedWith.push(targetUser);
    saveBudgets(globalBudgets);
    alert(`Success! Budget shared with @${targetUser}. ✨`);
    load();
  }
}

// EDIT RECORD
function editRecord(id) {
  let globalBudgets = getBudgets();
  let item = globalBudgets.find(b => b.id === id);
  if (!item) return;

  let dEl = document.getElementById('d');
  let pEl = document.getElementById('p');
  let iEl = document.getElementById('i');
  let saveBtn = document.getElementById('saveBtn');

  if (dEl) dEl.value = item.date || '';
  if (pEl) pEl.value = item.period || 'Weekly';
  if (iEl) iEl.value = item.income || 0;

  let expInputs = document.querySelectorAll('.e');
  if (item.expenses) {
    item.expenses.forEach((val, i) => {
      if (expInputs[i]) expInputs[i].value = val;
    });
  }

  let subTitle = document.getElementById('sub_other_title');
  let transTitle = document.getElementById('trans_other_title');
  let billsTitle = document.getElementById('bills_other_title');

  if (item.customs) {
    if (subTitle) subTitle.value = item.customs.sub || '';
    if (transTitle) transTitle.value = item.customs.trans || '';
    if (billsTitle) billsTitle.value = item.customs.bills || '';
  }

  calc();
  editingId = id;
  if (saveBtn) saveBtn.textContent = '🔄 Update Shared Budget';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// DELETE RECORD
function deleteRecord(id) {
  if (confirm("Are you sure you want to delete this budget item? 🗑️")) {
    let globalBudgets = getBudgets();
    let idx = globalBudgets.findIndex(b => b.id === id);

    if (idx !== -1) {
      let item = globalBudgets[idx];
      if (item.owner === currentUser) {
        globalBudgets.splice(idx, 1);
      } else {
        item.sharedWith = item.sharedWith.filter(u => u !== currentUser);
      }
      saveBudgets(globalBudgets);
    }

    let saveBtn = document.getElementById('saveBtn');
    if (editingId === id) {
      resetForm();
      editingId = null;
      if (saveBtn) saveBtn.textContent = '💾 Save Budget';
    }
    load();
  }
}

function resetForm() {
  let dEl = document.getElementById('d');
  let iEl = document.getElementById('i');
  if (dEl) dEl.value = '';
  if (iEl) iEl.value = 0;
  document.querySelectorAll('.e').forEach(x => x.value = 0);
  document.querySelectorAll('.custom-input').forEach(x => x.value = '');
  calc();
}

// Initial Run Fallback
if (currentUser) {
  setTimeout(() => loginUser(currentUser), 100);
}
