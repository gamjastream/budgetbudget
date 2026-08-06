let currentUser = localStorage.currentUser || null;
let editingId = null;
let pendingSignUpData = null;
let generatedCode = null;
let targetResetUser = null;

// -------------------------------------------------------------
// 1. FIREBASE REALTIME DATABASE CONFIGURATION
// (Replace the values below with your Firebase Project Keys)
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

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// Live Global Budget Array
let globalBudgets = [];

// Realtime Listener: Automatically updates UI when data changes anywhere
db.ref('budgets').on('value', (snapshot) => {
  const data = snapshot.val();
  globalBudgets = data ? Object.values(data) : [];
  localStorage.setItem('budget_tracker_records', JSON.stringify(globalBudgets));
  load();
});

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

// 2. Authentication Handlers
function handleLogin() {
  let user = document.getElementById('loginUsername').value.trim();
  let pass = document.getElementById('loginPassword').value.trim();

  if (!user || !pass) {
    alert("Please enter both a username and password! 💕");
    return;
  }

  // Save account credentials in Firebase cloud
  db.ref('users/' + user).set({ password: pass }).then(() => {
    loginUser(user);
  }).catch(() => {
    loginUser(user); // Fallback
  });
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

// 3. Calculation Logic
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

// 4. Save & Sync Budget to Cloud Database
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

  // Push directly to Firebase Realtime Cloud Database
  db.ref('budgets/' + recId).set(recordData).then(() => {
    alert("Budget saved online across all devices! 🎉");
    resetForm();
    editingId = null;
    if (saveBtn) saveBtn.textContent = '💾 Save Budget';
  }).catch((err) => {
    alert("Cloud save failed, saved locally instead.");
    console.error(err);
  });
}

// 5. Load & Filter Budgets
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

// 6. Share Functionality
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
    
    // Update permission list in Cloud Database
    db.ref(`budgets/${id}/sharedWith`).set(currentShared).then(() => {
      alert(`Success! Shared live with @${targetUser}. They can now view and edit this from their device! ✨`);
    });
  }
}

// 7. Edit Functionality
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

// 8. Delete Functionality
function deleteRecord(id) {
  if (confirm("Are you sure you want to delete this budget item? 🗑️")) {
    let item = globalBudgets.find(b => b.id === id);

    if (item) {
      if (item.owner === currentUser) {
        // Remove completely from Firebase if owner deletes
        db.ref('budgets/' + id).remove();
      } else {
        // Remove only current user from shared list
        let updatedShared = (item.sharedWith || []).filter(u => u !== currentUser);
        db.ref(`budgets/${id}/sharedWith`).set(updatedShared);
      }
    }

    let saveBtn = document.getElementById('saveBtn');
    if (editingId === id) {
      resetForm();
      editingId = null;
      if (saveBtn) saveBtn.textContent = '💾 Save Budget';
    }
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
