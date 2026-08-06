let currentUser = localStorage.currentUser || null;
let editingId = null;
let pendingSignUpData = null;
let generatedCode = null;
let targetResetUser = null;
let db = null;

// -------------------------------------------------------------
// FIREBASE CONFIGURATION (Safe Auto-Initializing)
// -------------------------------------------------------------
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Safely initialize Firebase without crashing if keys are not configured yet
try {
  if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.database();
  }
} catch (e) {
  console.warn("Running in local storage fallback mode.");
}

// Global Budget Array State
let globalBudgets = [];

// Initialize Realtime Listener or Local Sync
if (db) {
  db.ref('budgets').on('value', (snapshot) => {
    const data = snapshot.val();
    globalBudgets = data ? Object.values(data) : [];
    localStorage.setItem('budget_tracker_records', JSON.stringify(globalBudgets));
    load();
  });
} else {
  try {
    globalBudgets = JSON.parse(localStorage.getItem('budget_tracker_records') || '[]');
  } catch(e) {
    globalBudgets = [];
  }
}

// Helper: View Switcher
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

// -------------------------------------------------------------
// 1. AUTHENTICATION HANDLERS
// -------------------------------------------------------------
function handleLogin() {
  let userEl = document.getElementById('loginUsername');
  let passEl = document.getElementById('loginPassword');

  let user = userEl ? userEl.value.trim() : '';
  let pass = passEl ? passEl.value.trim() : '';

  if (!user || !pass) {
    alert("Please enter both a username and password! 💕");
    return;
  }

  let users = JSON.parse(localStorage.users || '{}');
  if (!users[user]) {
    users[user] = { password: pass };
    localStorage.users = JSON.stringify(users);
  }

  if (db) {
    db.ref('users/' + user).set({ password: pass }).catch(() => {});
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
  resetForm();
}

// -------------------------------------------------------------
// 2. REGISTRATION & FORGOT PASSWORD
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// 3. CALCULATION ENGINE
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// 4. SAVE BUDGET
// -------------------------------------------------------------
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

  let subTitle = document.getElementById('sub_other_title');
  let transTitle = document.getElementById('trans_other_title');
  let billsTitle = document.getElementById('bills_other_title');

  let recId = editingId !== null ? editingId : Date.now().toString();

  let recordData = {
    id: recId,
    owner: currentUser,
    sharedWith: editingId !== null ? (globalBudgets.find(b => b.id === editingId)?.sharedWith || []) : [],
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

  if (db) {
    db.ref('budgets/' + recId).set(recordData).then(() => {
      alert("Budget saved online! 🎉");
      resetForm();
      editingId = null;
      if (saveBtn) saveBtn.textContent = '💾 Save Budget';
    }).catch(() => {
      saveLocally(recordData);
    });
  } else {
    saveLocally(recordData);
  }
}

function saveLocally(recordData) {
  let idx = globalBudgets.findIndex(b => b.id === recordData.id);
  if (idx !== -1) {
    globalBudgets[idx] = recordData;
  } else {
    globalBudgets.push(recordData);
  }
  localStorage.setItem('budget_tracker_records', JSON.stringify(globalBudgets));
  alert("Budget saved successfully! 🎉");
  resetForm();
  editingId = null;
  let saveBtn = document.getElementById('saveBtn');
  if (saveBtn) saveBtn.textContent = '💾 Save Budget';
  load();
}

// -------------------------------------------------------------
// 5. LOAD BUDGET HISTORY (WITH SHARE, EDIT & DELETE BUTTONS)
// -------------------------------------------------------------
function load() {
  if (!currentUser) return;

  let hEl = document.getElementById('h');
  if (!hEl) return;

  let userBudgets = globalBudgets.filter(r => 
    r.owner === currentUser || (r.sharedWith && r.sharedWith.includes(currentUser))
  );

  if (userBudgets.length === 0) {
    hEl.innerHTML = "<p style='text-align:center; color:#888;'>No saved or shared budgets yet!</p>";
    return;
  }

  hEl.innerHTML = userBudgets.map((r) => {
    let isOwner = r.owner === currentUser;
    let sharedBadge = !isOwner 
      ? `<div class="badge-shared">Shared by @${r.owner}</div>` 
      : (r.sharedWith && r.sharedWith.length > 0 ? `<div class="badge-shared">Shared with: ${r.sharedWith.join(', ')}</div>` : '');

    return `
      <div class="history-item">
        <div class="history-info">
          🌸 <strong>${r.date || 'No Date'}</strong> | ${r.period} <br>
          💵 Income: $${r.income} | 💖 Remaining: $${r.balance}
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

// -------------------------------------------------------------
// 6. SHARE, EDIT & DELETE FUNCTIONS
// -------------------------------------------------------------
function shareRecord(id) {
  let targetUser = prompt("Enter the username of the person you want to share this budget with: 💕");
  if (!targetUser) return;

  targetUser = targetUser.trim();

  if (targetUser === currentUser) {
    alert("You cannot share a budget with yourself! 🌸");
    return;
  }

  let item = globalBudgets.find(b => b.id === id);

  if (item) {
    let currentShared = item.sharedWith || [];
    if (currentShared.includes(targetUser)) {
      alert(`This budget is already shared with ${targetUser}! 🌸`);
      return;
    }
    currentShared.push(targetUser);
    
    if (db) {
      db.ref(`budgets/${id}/sharedWith`).set(currentShared).then(() => {
        alert(`Success! Shared live with @${targetUser}. ✨`);
      });
    } else {
      item.sharedWith = currentShared;
      localStorage.setItem('budget_tracker_records', JSON.stringify(globalBudgets));
      alert(`Success! Shared locally with @${targetUser}. ✨`);
      load();
    }
  }
}

function editRecord(id) {
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

function deleteRecord(id) {
  if (confirm("Are you sure you want to delete this budget item? 🗑️")) {
    let item = globalBudgets.find(b => b.id === id);

    if (item) {
      if (item.owner === currentUser) {
        if (db) {
          db.ref('budgets/' + id).remove();
        } else {
          globalBudgets = globalBudgets.filter(b => b.id !== id);
          localStorage.setItem('budget_tracker_records', JSON.stringify(globalBudgets));
        }
      } else {
        let updatedShared = (item.sharedWith || []).filter(u => u !== currentUser);
        if (db) {
          db.ref(`budgets/${id}/sharedWith`).set(updatedShared);
        } else {
          item.sharedWith = updatedShared;
          localStorage.setItem('budget_tracker_records', JSON.stringify(globalBudgets));
        }
      }
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
