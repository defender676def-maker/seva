// obiectul db - ne ajută să salvăm și să citim date din memoria browserului
const DB = {
  // salvează datele ca text în localStorage
  save: function(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },
  // citește datele și le transformă înapoi în obiect/array
  get: function(key) {
    try {
      var item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch(e) {
      return null;
    }
  },
  // șterge o cheie din localStorage
  remove: function(key) {
    localStorage.removeItem(key);
  }
};

// validări simple pentru formulare
const Val = {
  // verifică dacă email-ul arată corect (are @ și punct)
  email: function(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  },
  // parola trebuie să aibă minim 8 caractere
  pass: function(v) {
    return v.length >= 8;
  },
  // telefonul trebuie să aibă minim 10 cifre
  phone: function(v) {
    return /^\d{10,}$/.test(v);
  },
  // câmpul nu trebuie să fie gol sau doar spații
  required: function(v) {
    return v && v.trim().length > 0;
  }
};

// marchează un câmp cu eroare (bordură roșie + mesaj)
function markError(input, msg) {
  input.classList.remove('valid');
  input.classList.add('error');
  var err = input.parentElement.querySelector('.msg-eroare');
  if (err) {
    err.textContent = msg;
    err.classList.add('show');
  }
}

// marchează un câmp ca valid (bordură verde)
function markValid(input) {
  input.classList.remove('error');
  input.classList.add('valid');
  var err = input.parentElement.querySelector('.msg-eroare');
  if (err) err.classList.remove('show');
}

// șterge toate erorile și validările dintr-un formular
function clearErrors(form) {
  form.querySelectorAll('.error').forEach(function(el) { el.classList.remove('error'); });
  form.querySelectorAll('.valid').forEach(function(el) { el.classList.remove('valid'); });
  form.querySelectorAll('.msg-eroare').forEach(function(el) { el.classList.remove('show'); });
}

// arată un mesaj de alertă care dispare după 4 secunde
function showAlert(msg, type, containerId) {
  var alertDiv = document.getElementById(containerId);
  if (!alertDiv) return;
  alertDiv.className = 'alert alert-' + type + ' show';
  alertDiv.textContent = msg;
  setTimeout(function() { alertDiv.classList.remove('show'); }, 4000);
}

// actualizează numărul roșu de lângă butonul coș
function updateCartUI() {
  var cart = DB.get('cart') || [];
  var count = cart.reduce(function(s, i) { return s + i.qty; }, 0);
  var el = document.getElementById('cart-count');
  if (el) el.textContent = count;
}

// adaugă un produs în coș (sau mărește cantitatea dacă există deja)
function addToCart(id, name, price, qty) {
  qty = qty || 1;
  var cart = DB.get('cart') || [];
  var item = cart.find(function(i) { return i.id === id; });
  if (item) {
    item.qty += qty;
  } else {
    cart.push({ id: id, name: name, price: parseFloat(price), qty: qty });
  }
  DB.save('cart', cart);
  updateCartUI();
  alert(name + ' a fost adăugat în coș!');
}

// afișează produsele din coș în modal
function renderCart() {
  var list = document.getElementById('cos-list');
  var totalEl = document.getElementById('cos-total');
  if (!list) return;

  var cart = DB.get('cart') || [];
  list.innerHTML = '';
  var total = 0;

  if (cart.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:#888;padding:30px;">Cosul este gol.</p>';
    if (totalEl) totalEl.textContent = '0.00 lei';
    return;
  }

  cart.forEach(function(item, i) {
    total += item.price * item.qty;
    var div = document.createElement('div');
    div.className = 'cos-item';
    div.innerHTML = 
      '<div><strong>' + item.name + '</strong><br><small>' + item.price.toFixed(2) + ' lei x ' + item.qty + '</small></div>' +
      '<div class="cos-item-actions">' +
        '<button onclick="window.changeQty(' + i + ',-1)">-</button>' +
        '<button onclick="window.changeQty(' + i + ',1)">+</button>' +
        '<button onclick="window.removeItem(' + i + ')" style="color:#d32f2f;border:none;background:none;">x</button>' +
      '</div>';
    list.appendChild(div);
  });

  if (totalEl) totalEl.textContent = total.toFixed(2) + ' lei';
}

// schimbă cantitatea unui produs din coș (+ sau -)
window.changeQty = function(index, delta) {
  var cart = DB.get('cart') || [];
  if(cart[index]) {
      cart[index].qty += delta;
      if (cart[index].qty <= 0) cart.splice(index, 1);
      DB.save('cart', cart);
      renderCart();
      updateCartUI();
  }
};

// șterge un produs din coș
window.removeItem = function(index) {
  var cart = DB.get('cart') || [];
  cart.splice(index, 1);
  DB.save('cart', cart);
  renderCart();
  updateCartUI();
};

// activează butoanele +, - și "în coș" de pe carduri
function initQuantityButtons() {
  document.querySelectorAll('.plus').forEach(function(btn) {
    btn.onclick = function(e) {
      e.preventDefault();
      var card = this.closest('.card');
      var span = card.querySelector('.cantitate');
      span.textContent = parseInt(span.textContent) + 1;
    };
  });

  document.querySelectorAll('.minus').forEach(function(btn) {
    btn.onclick = function(e) {
      e.preventDefault();
      var card = this.closest('.card');
      var span = card.querySelector('.cantitate');
      var val = parseInt(span.textContent);
      if (val > 0) span.textContent = val - 1;
    };
  });

  document.querySelectorAll('.in-cos').forEach(function(link) {
    link.onclick = function(e) {
      e.preventDefault();
      var card = this.closest('.card');
      var cantitateSpan = card.querySelector('.cantitate');
      var cantitate = parseInt(cantitateSpan.textContent);
      
      if (cantitate === 0) cantitate = 1; 

      var nume = card.querySelector('h2').textContent;
      var pret = parseFloat(card.dataset.pret);
      var id = parseInt(card.dataset.id);
      
      addToCart(id, nume, pret, cantitate);
      cantitateSpan.textContent = '0';
    };
  });
}

// generează o culoare pe baza numelui produsului (doar pentru fallback)
function getColorFromName(name) {
  var colors = ['#f4a261', '#e76f51', '#2a9d8f', '#e9c46a', '#264653', '#d62828', '#457b9d', '#9c89b8'];
  var hash = 0;
  for (var i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash = hash & hash;
  }
  return colors[Math.abs(hash) % colors.length];
}

// încarcă produsele din JSON și le afișează în pagină
async function loadProductsFromJSON(categorie) {
  try {
    // cere fișierul JSON de pe server (cale relativă, fără slash la început)
    var response = await fetch('/data/produse.json');
    if (!response.ok) throw new Error('Nu s-a putut încărca JSON');
    
    var toateProdusele = await response.json();
    
    // alegem containerul în funcție de categorie
    var containerId = '';
    if(categorie === 'bere-live') containerId = 'produse-bere-live';
    else if(categorie === 'bere-artizanala') containerId = 'produse-bere-artizanala';
    else if(categorie === 'aperitive') containerId = 'gustari-container';
    
    var container = document.getElementById(containerId);
    if (!container) return;

    // filtrăm doar produsele din categoria curentă
    var produseFiltrate = toateProdusele.filter(function(p) {
      return p.categorie === categorie;
    });

    container.innerHTML = '';
    
    if (produseFiltrate.length === 0) {
      container.innerHTML = '<p>Niciun produs în această categorie.</p>';
      return;
    }

    // pentru fiecare produs, construim un card HTML
    produseFiltrate.forEach(function(p) {
      var card = document.createElement('div');
      if(categorie === 'aperitive') {
          card.className = 'card gustare-card';
      } else {
          card.className = 'card';
      }
      
      card.dataset.id = p.id;
      card.dataset.pret = p.pret;
      
      var newBadge = p.new ? '<div class="new-badge">NOU</div>' : '';
      
      // imaginea: dacă există în JSON o folosim, altfel placeholder
      var imgSrc = p.img ? p.img : 'Assets/Images/placeholder.png';
      
      // construim HTML-ul cardului (fără fundal colorat, doar alb)
      card.innerHTML =
        '<div class="poza-container">' +
          newBadge +
          '<img src="' + imgSrc + '" alt="' + p.nume + '" onerror="this.src=\'https://via.placeholder.com/200x300?text=Imagine+Indisponibila\'">' +
        '</div>' +
        '<div class="informatii">' +
          '<h2>' + p.nume + '</h2>' +
          '<div class="locatie">' + (p.locatie || 'Moldova') + '</div>' +
          '<p>' + p.desc + '</p>' +
          '<p class="specificatii">' + p.spec + '</p>' +
          '<div class="pret-rand">' +
            '<span style="font-weight:bold; font-size:18px;">' + p.pret.toFixed(2) + ' lei</span>' +
            '<span>/ ' + (p.unit || '1L') + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="jos">' +
          '<label>Cantitate:</label>' +
          '<div class="butoane">' +
            '<button class="minus">-</button>' +
            '<span class="cantitate">0</span>' +
            '<button class="plus">+</button>' +
          '</div>' +
          '<a href="#" class="in-cos">In cos</a>' +
        '</div>';
        
      container.appendChild(card);
    });

    // activăm butoanele după ce am adăugat cardurile
    initQuantityButtons();

  } catch (error) {
    console.error("Eroare la încărcarea produselor:", error);
    var containerId = (categorie === 'bere-live') ? 'produse-bere-live' : 'produse-bere-artizanala';
    var container = document.getElementById(containerId);
    if(container) container.innerHTML = '<p style="color:red;">Eroare la încărcarea datelor.</p>';
  }
}

// când pagina s-a încărcat complet, pornim tot
document.addEventListener('DOMContentLoaded', function() {
  
  var path = window.location.pathname;
  
  // verificăm pe ce pagină suntem și încărcăm produsele potrivite
  if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
    loadProductsFromJSON('bere-live');
  } 
  else if (path.includes('bere-artizanala.html')) {
    loadProductsFromJSON('bere-artizanala');
  } 
  else if (path.includes('aperitive.html')) {
    loadProductsFromJSON('aperitive');
  }

  // actualizăm numărul din coș
  updateCartUI();
  
  // logica pentru modalul coșului
  var modal = document.getElementById('modal-cos');
  var btnCos = document.getElementById('btn-cos');
  var closeSpan = document.getElementsByClassName('close-modal')[0];
  var btnGoleste = document.getElementById('btn-goleste');

  if (btnCos) {
    btnCos.onclick = function() {
      renderCart();
      if(modal) modal.style.display = "flex";
    }
  }

  if (closeSpan) {
    closeSpan.onclick = function() {
      if(modal) modal.style.display = "none";
    }
  }

  if (btnGoleste) {
    btnGoleste.onclick = function() {
        if(confirm("Sigur doresti sa golesti cosul?")) {
            DB.remove('cart');
            renderCart();
            updateCartUI();
        }
    }
  }

  // închidem modalul dacă dai click în afara lui
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }

  // verificăm dacă utilizatorul e logat
  checkAuth();
  
  // formularul de login
  var loginForm = document.getElementById('login-form');
  if(loginForm) {
      loginForm.onsubmit = function(e) {
          e.preventDefault();
          var email = document.getElementById('login-email').value;
          if(Val.email(email)) {
              var user = { name: "Utilizator", email: email };
              DB.save('user', user);
              window.location.href = 'index.html';
          } else {
              showAlert('Email invalid', 'error', 'login-alert');
          }
      }
  }
var btnPlateste = document.getElementById('btn-plateste');
if (btnPlateste) {
    btnPlateste.onclick = function() {
        var cart = DB.get('cart') || [];
        
        // Verificăm dacă coșul nu este gol
        if (cart.length === 0) {
            alert('⚠️ Coșul este gol! Adaugă produse pentru a finaliza comanda.');
            return;
        }
        
        // Calculăm totalul pentru confirmare
        var total = cart.reduce(function(sum, item) {
            return sum + (item.price * item.qty);
        }, 0).toFixed(2);
        
        // Confirmare înainte de "plată"
        if (confirm('Doriți să confirmați comanda în valoare de ' + total + ' lei?\n\nProduse: ' + cart.length)) {
            
            // Simulăm procesarea comenzii
            var comanda = {
                id: Date.now(),
                data: new Date().toLocaleString('ro-MD'),
                produse: cart,
                total: total,
                status: 'confirmată'
            };
            
            // Salvăm comanda în localStorage (simulare backend)
            var comenzi = DB.get('comenzi') || [];
            comenzi.push(comanda);
            DB.save('comenzi', comenzi);
            
            // Golim coșul după confirmare
            DB.remove('cart');
            renderCart();
            updateCartUI();
            
            // Mesaj de succes
            alert('✅ Comanda #' + comanda.id + ' a fost confirmată!\n\nTotal: ' + total + ' lei\n\nVă mulțumim pentru achiziție! 🍺');
            
            // Închidem modalul
            var modal = document.getElementById('modal-cos');
            if (modal) modal.style.display = "none";
        }
    }
}
  // formularul de înregistrare
  var regForm = document.getElementById('reg-form');
  if(regForm) {
      regForm.onsubmit = function(e) {
          e.preventDefault();
          var email = document.getElementById('reg-email').value;
          var pass = document.getElementById('reg-parola').value;
          var conf = document.getElementById('reg-confirma').value;
          
          if(!Val.email(email)) {
             showAlert('Email invalid', 'error', 'reg-alert'); return;
          }
          if(!Val.pass(pass)) {
             showAlert('Parola trebuie sa aiba minim 8 caractere', 'error', 'reg-alert'); return;
          }
          if(pass !== conf) {
             showAlert('Parolele nu coincid', 'error', 'reg-alert'); return;
          }
          var user = { name: document.getElementById('reg-nume').value, email: email };
          DB.save('user', user);
          showAlert('Cont creat cu succes!', 'success', 'reg-alert');
          setTimeout(function() { window.location.href = 'login.html'; }, 1500);
      }
  }
  
  // formularul de contact
  var contactForm = document.getElementById('contact-form');
  if(contactForm) {
      contactForm.onsubmit = function(e) {
          e.preventDefault();
          showAlert('Mesajul a fost trimis!', 'success', 'contact-alert');
          this.reset();
      }
  }
});

// verifică dacă utilizatorul e logat și afișează butoanele potrivite
function checkAuth() {
  var user = DB.get('user');
  var authBtns = document.getElementById('auth-btns');
  var userPanel = document.getElementById('user-panel');
  var userName = document.getElementById('user-name');
  var btnLogout = document.getElementById('btn-logout');
  
  if (user) {
    if(authBtns) authBtns.style.display = 'none';
    if(userPanel) userPanel.style.display = 'flex';
    if(userName) userName.textContent = user.name || user.email;
  } else {
    if(authBtns) authBtns.style.display = 'flex';
    if(userPanel) userPanel.style.display = 'none';
  }
  
  if(btnLogout) {
    btnLogout.onclick = function() {
      DB.remove('user');
      window.location.reload();
    }
  }
}
console.log("✅ Platformă încărcată. Coș și autentificare funcționale.");