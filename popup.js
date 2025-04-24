const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const numberChars = "0123456789";
const symbolChars = "!@#$%^&*()_+{}[]|:;<>,.?/~";

// DOM elements
const lengthSlider = document.getElementById("length");
const sliderValue = document.getElementById("slider-value");
const lowercaseCheckbox = document.getElementById("lowercase");
const uppercaseCheckbox = document.getElementById("uppercase");
const numberCheckbox = document.getElementById("numbers");
const symbolCheckbox = document.getElementById("symbols");
const output = document.getElementById("password-output");
const generateBtn = document.getElementById("generate-btn");
const copyBtn = document.getElementById("copy-btn");
const saveBtn = document.getElementById("save-password-btn");
const siteInput = document.getElementById("site");
const userInput = document.getElementById("username");
const clearHistoryBtn = document.getElementById("clear-history");
const searchInput = document.getElementById("search-input");

// Event Listeners
lengthSlider.addEventListener("input", () => {
  sliderValue.textContent = lengthSlider.value;
});

generateBtn.addEventListener("click", generatePassword);
copyBtn.addEventListener("click", copyPassword);
saveBtn.addEventListener("click", savePassword);
clearHistoryBtn.addEventListener("click", clearHistory);
searchInput.addEventListener("input", searchPasswords);

// Initialize
document.addEventListener("DOMContentLoaded", init);

function init() {
  // Load saved passwords
  chrome.storage.local.get(["passwords"], (result) => {
    renderPasswordList(result.passwords || []);
  });

  // Try to get current domain
  getCurrentTabDomain();
}

function getCurrentTabDomain() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0] && tabs[0].url) {
      try {
        const url = new URL(tabs[0].url);
        const domain = url.hostname.replace(/^www\./, "");
        siteInput.value = domain;
      } catch (e) {
        console.warn("Could not parse URL:", e);
      }
    }
  });
}

function generatePassword() {
  const length = parseInt(lengthSlider.value);
  let charset = "";

  if (lowercaseCheckbox.checked) charset += lowercaseChars;
  if (uppercaseCheckbox.checked) charset += uppercaseChars;
  if (numberCheckbox.checked) charset += numberChars;
  if (symbolCheckbox.checked) charset += symbolChars;

  if (!charset) {
    output.value = "";
    alert("Select at least one character type!");
    return;
  }

  let password = "";
  for (let i = 0; i < length; i++) {
    const randomChar = charset[Math.floor(Math.random() * charset.length)];
    password += randomChar;
  }

  output.value = password;
}

function copyPassword() {
  if (!output.value) return;
  
  navigator.clipboard.writeText(output.value).then(() => {
    const originalHTML = copyBtn.innerHTML;
    copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check" viewBox="0 0 16 16"><path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/></svg>';
    setTimeout(() => {
      copyBtn.innerHTML = originalHTML;
    }, 1000);
  });
}

function savePassword() {
  const site = siteInput.value.trim();
  const username = userInput.value.trim();
  const password = output.value.trim();

  if (!site || !username || !password) {
    alert("Please fill out site, username, and generate a password.");
    return;
  }

  chrome.storage.local.get(["passwords"], (result) => {
    const passwords = result.passwords || [];
    passwords.push({ site, username, password });
    chrome.storage.local.set({ passwords }, () => {
      siteInput.value = "";
      userInput.value = "";
      output.value = "";
      renderPasswordList(passwords);
    });
  });
}

function clearHistory() {
  if (confirm("Are you sure you want to delete all saved passwords?")) {
    chrome.storage.local.remove("passwords", () => {
      renderPasswordList([]);
    });
  }
}

function searchPasswords() {
  const term = this.value.toLowerCase();
  chrome.storage.local.get(["passwords"], (result) => {
    const filtered = (result.passwords || []).filter(
      p =>
        p.site.toLowerCase().includes(term) ||
        p.username.toLowerCase().includes(term)
    );
    renderPasswordList(filtered);
  });
}

function renderPasswordList(passwords) {
  const list = document.getElementById("saved-passwords");
  list.innerHTML = "";

  if (passwords.length === 0) {
    const li = document.createElement("li");
    li.className = "list-group-item text-muted text-center";
    li.textContent = "No saved passwords";
    list.appendChild(li);
    return;
  }

  passwords.forEach((entry, index) => {
    const li = document.createElement("li");
    li.className = "list-group-item";

    const viewDiv = document.createElement("div");
    viewDiv.innerHTML = `
      <strong>${entry.site}</strong><br>
      <small>${entry.username}</small><br>
      <span class="d-block mt-1 hiddenText" style="word-break: break-all;">${entry.password}</span>
    `;

    const btnGroup = document.createElement("div");
    btnGroup.className = "d-flex justify-content-end gap-2 mt-2";

    const copyBtn = document.createElement("button");
    copyBtn.className = "btn btn-sm btn-outline-primary";
    copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg> Copy';
    
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(entry.password).then(() => {
        copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check" viewBox="0 0 16 16"><path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/></svg> Copied!';
        setTimeout(() => {
          copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg> Copy';
        }, 1000);
      });
    };

    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-sm btn-outline-secondary";
    editBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/></svg> Edit';
    editBtn.onclick = () => renderEditForm(entry, index);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-sm btn-outline-danger";
    deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg> Delete';
    deleteBtn.onclick = () => {
      if (confirm("Are you sure you want to delete this password?")) {
        chrome.storage.local.get(["passwords"], (result) => {
          const passwords = result.passwords || [];
          passwords.splice(index, 1);
          chrome.storage.local.set({ passwords }, () => {
            renderPasswordList(passwords);
          });
        });
      }
    };

    btnGroup.append(copyBtn, editBtn, deleteBtn);
    li.appendChild(viewDiv);
    li.appendChild(btnGroup);
    list.appendChild(li);
  });
}

function renderEditForm(entry, index) {
  const list = document.getElementById("saved-passwords");
  list.innerHTML = "";

  const li = document.createElement("li");
  li.className = "list-group-item";

  const siteInput = document.createElement("input");
  siteInput.className = "form-control mb-2";
  siteInput.value = entry.site;
  siteInput.placeholder = "Site name";

  const userInput = document.createElement("input");
  userInput.className = "form-control mb-2";
  userInput.value = entry.username;
  userInput.placeholder = "Username";

  const passInput = document.createElement("input");
  passInput.className = "form-control mb-3";
  passInput.value = entry.password;
  passInput.placeholder = "Password";

  const btnGroup = document.createElement("div");
  btnGroup.className = "d-flex justify-content-end gap-2";

  const saveBtn = document.createElement("button");
  saveBtn.className = "btn btn-sm btn-success";
  saveBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle me-1" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/></svg> Save';
  
  saveBtn.onclick = () => {
    if (!siteInput.value || !userInput.value || !passInput.value) {
      alert("All fields are required.");
      return;
    }

    chrome.storage.local.get(["passwords"], (result) => {
      const passwords = result.passwords || [];
      passwords[index] = {
        site: siteInput.value.trim(),
        username: userInput.value.trim(),
        password: passInput.value.trim()
      };
      chrome.storage.local.set({ passwords }, () => {
        renderPasswordList(passwords);
      });
    });
  };

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "btn btn-sm btn-secondary";
  cancelBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle me-1" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg> Cancel';
  cancelBtn.onclick = () => {
    chrome.storage.local.get(["passwords"], (result) => {
      renderPasswordList(result.passwords || []);
    });
  };

  btnGroup.append(saveBtn, cancelBtn);
  li.appendChild(siteInput);
  li.appendChild(userInput);
  li.appendChild(passInput);
  li.appendChild(btnGroup);
  list.appendChild(li);
}