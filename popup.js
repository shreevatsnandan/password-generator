const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const numberChars = "0123456789";
const symbolChars = "!@#$%^&*()_+{}[]|:;<>,.?/~";

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

lengthSlider.addEventListener("input", () => {
  sliderValue.textContent = lengthSlider.value;
});

generateBtn.addEventListener("click", () => {
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
});

copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(output.value).then(() => {
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1000);
  });
});

saveBtn.addEventListener("click", () => {
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
});

clearHistoryBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all saved passwords?")) {
    chrome.storage.local.remove("passwords", () => {
      renderPasswordList([]);
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["passwords"], (result) => {
    renderPasswordList(result.passwords || []);
  });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    try {
      const url = new URL(tabs[0].url);
      const domain = url.hostname.replace(/^www\./, "");
      document.getElementById("site").value = domain;
    } catch (e) {
      console.warn("Could not get tab URL.");
    }
  });
});

searchInput.addEventListener("input", function () {
  const term = this.value.toLowerCase();
  chrome.storage.local.get(["passwords"], (result) => {
    const filtered = (result.passwords || []).filter(
      p =>
        p.site.toLowerCase().includes(term) ||
        p.username.toLowerCase().includes(term)
    );
    renderPasswordList(filtered);
  });
});

function renderPasswordList(passwords) {
  const list = document.getElementById("saved-passwords");
  list.innerHTML = "";

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
    copyBtn.textContent = "Copy";
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(entry.password).then(() => {
        copyBtn.textContent = "Copied!";
        setTimeout(() => (copyBtn.textContent = "Copy"), 1000);
      });
    };

    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-sm btn-outline-secondary";
    editBtn.textContent = "Edit";
    editBtn.onclick = () => renderEditForm(entry, index);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-sm btn-outline-danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = () => {
      passwords.splice(index, 1);
      chrome.storage.local.set({ passwords });
      renderPasswordList(passwords);
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

  const userInput = document.createElement("input");
  userInput.className = "form-control mb-2";
  userInput.value = entry.username;

  const passInput = document.createElement("input");
  passInput.className = "form-control mb-2";
  passInput.value = entry.password;

  const saveBtn = document.createElement("button");
  saveBtn.className = "btn btn-sm btn-success me-2";
  saveBtn.textContent = "Save";
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
      chrome.storage.local.set({ passwords });
      renderPasswordList(passwords);
    });
  };

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "btn btn-sm btn-secondary";
  cancelBtn.textContent = "Cancel";
  cancelBtn.onclick = () => {
    chrome.storage.local.get(["passwords"], (result) => {
      renderPasswordList(result.passwords || []);
    });
  };

  li.appendChild(siteInput);
  li.appendChild(userInput);
  li.appendChild(passInput);
  li.appendChild(saveBtn);
  li.appendChild(cancelBtn);
  list.appendChild(li);
}
