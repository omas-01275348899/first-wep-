const CART_KEY = "omarx_store_cart";
const PRODUCTS_KEY = "omarx_store_products";
const ORDERS_KEY = "omarx_store_orders";
const STORE_WHATSAPP_NUMBER = "201275348899";
const DEFAULT_PRODUCT_IMAGE = "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=900&q=80";

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    if (window.localStorage) {
      return window.localStorage;
    }
  } catch (error) {
    console.warn("Local storage is unavailable.", error);
  }

  try {
    if (window.sessionStorage) {
      return window.sessionStorage;
    }
  } catch (error) {
    console.warn("Session storage is unavailable.", error);
  }

  return null;
}

function readStoredJson(key, fallback = []) {
  const storage = getStorage();

  if (!storage) {
    return fallback;
  }

  try {
    const rawValue = storage.getItem(key);

    if (!rawValue) {
      return fallback;
    }

    return JSON.parse(rawValue);
  } catch (error) {
    console.warn(`Could not read storage for ${key}.`, error);
    return fallback;
  }
}

function writeStoredJson(key, value) {
  const storage = getStorage();

  if (!storage) {
    return false;
  }

  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Could not save storage for ${key}.`, error);
    return false;
  }
}

async function getSavedProducts() {
  const storedProducts = readStoredJson(PRODUCTS_KEY, []);

  if (Array.isArray(storedProducts) && storedProducts.length > 0) {
    return storedProducts;
  }

  try {
    const response = await fetch("products.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Failed to load products from products.json");
    }

    const products = await response.json();
    writeStoredJson(PRODUCTS_KEY, products);
    return products;
  } catch (error) {
    console.warn("Falling back to default products.", error);
    return [];
  }
}

function saveProducts(products) {
  writeStoredJson(PRODUCTS_KEY, products);
}

function getOrders() {
  return readStoredJson(ORDERS_KEY, []);
}

function saveOrders(orders) {
  writeStoredJson(ORDERS_KEY, orders);
}

function getCart() {
  return readStoredJson(CART_KEY, []);
}

function saveCart(cart) {
  writeStoredJson(CART_KEY, cart);
  updateCartCount();
}

function updateCartCount() {
  const totalItems = getCart().reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll(".cart-count").forEach((count) => {
    count.textContent = totalItems;
  });
}

function getProductFromCard(card) {
  const name = card.querySelector("h3").textContent.trim();
  const priceText = card.querySelector("p").textContent.trim();
  const image = card.querySelector("img").src;
  const price = Number(priceText.replace(/[^0-9.]/g, ""));

  return {
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    price,
    image,
    quantity: 1
  };
}

function addToCart(product) {
  const cart = getCart();
  const existingProduct = cart.find((item) => item.id === product.id);

  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    cart.push(product);
  }

  saveCart(cart);
}

function setupAddToCartButtons() {
  document.querySelectorAll(".product-card:not(.preview-card) button").forEach((button) => {
    if (button.dataset.cartBound === "true") {
      return;
    }

    const originalText = button.textContent;
    button.dataset.cartBound = "true";

    button.addEventListener("click", () => {
      const card = button.closest(".product-card");
      const product = getProductFromCard(card);

      addToCart(product);
      button.textContent = "تمت الإضافة";

      setTimeout(() => {
        button.textContent = originalText;
        window.location.href = "checkout.html";
      }, 500);
    });
  });
}

function createProductCard(product) {
  const productUrl = `product-details.html?product=${encodeURIComponent(product.id)}`;

  return `
    <article class="product-card custom-product-card" data-custom-product="${product.id}">
      <a href="${productUrl}" class="product-image-link">
        <img src="${product.image}" alt="${product.name}" />
      </a>
      <h3>${product.name}</h3>
      <p>$${Number(product.price).toFixed(2)}</p>
      <button type="button">إضافة للسلة</button>
    </article>
  `;
}

async function renderSavedProductsInShop() {
  const productGrid = document.getElementById("productGrid");

  if (!productGrid) {
    return;
  }

  productGrid.querySelectorAll(".custom-product-card").forEach((card) => card.remove());

  const products = await getSavedProducts();

  if (products.length === 0) {
    return;
  }

  productGrid.insertAdjacentHTML("beforeend", products.map(createProductCard).join(""));
  setupAddToCartButtons();
}

function parseListInput(value) {
  return value
    .split(/\n|،|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getImageFromForm() {
  const imageInput = document.getElementById("productImage");
  const imageUrlInput = document.getElementById("productImageUrl");

  return new Promise((resolve, reject) => {
    const imageUrl = imageUrlInput.value.trim();

    if (imageUrl) {
      resolve(imageUrl);
      return;
    }

    const file = imageInput.files[0];

    if (!file) {
      resolve(DEFAULT_PRODUCT_IMAGE);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.readAsDataURL(file);
  });
}

function updateProductPreview() {
  const nameInput = document.getElementById("productName");
  const priceInput = document.getElementById("productPrice");
  const descriptionInput = document.getElementById("productDescription");
  const imageInput = document.getElementById("productImage");
  const imageUrlInput = document.getElementById("productImageUrl");
  const previewName = document.getElementById("previewName");
  const previewPrice = document.getElementById("previewPrice");
  const previewDescription = document.getElementById("previewDescription");
  const previewImage = document.getElementById("previewImage");

  if (!nameInput || !priceInput || !descriptionInput || !previewName) {
    return;
  }

  previewName.textContent = nameInput.value.trim() || "اسم المنتج";
  previewPrice.textContent = `$${Number(priceInput.value || 0).toFixed(2)}`;
  previewDescription.textContent = descriptionInput.value.trim() || "وصف المنتج سيظهر هنا.";

  previewImage.src = DEFAULT_PRODUCT_IMAGE;

  if (imageUrlInput.value.trim()) {
    previewImage.src = imageUrlInput.value.trim();
  }

  if (imageInput.files[0]) {
    const reader = new FileReader();
    reader.onload = () => {
      previewImage.src = reader.result;
    };
    reader.readAsDataURL(imageInput.files[0]);
  }
}

async function renderSavedProductsAdmin() {
  const savedProducts = document.getElementById("savedProducts");

  if (!savedProducts) {
    return;
  }

  const products = await getSavedProducts();

  if (products.length === 0) {
    savedProducts.innerHTML = '<div class="empty-cart"><h2>لا توجد منتجات محفوظة</h2><p>أضف أول منتج من النموذج الموجود بالأعلى.</p></div>';
    return;
  }

  savedProducts.innerHTML = products.map((product) => `
    <article class="saved-product">
      <img src="${product.image}" alt="${product.name}" />
      <div>
        <h3>${product.name}</h3>
        <p>$${Number(product.price).toFixed(2)}</p>
        <span>${product.description}</span>
      </div>
      <button type="button" data-delete-product="${product.id}">حذف</button>
    </article>
  `).join("");
}

function setupProductForm() {
  const form = document.getElementById("productForm");
  const message = document.getElementById("productMessage");
  const savedProducts = document.getElementById("savedProducts");

  if (!form) {
    return;
  }

  form.addEventListener("input", updateProductPreview);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const name = document.getElementById("productName").value.trim();
      const price = Number(document.getElementById("productPrice").value);
      const description = document.getElementById("productDescription").value.trim();
      const specs = parseListInput(document.getElementById("productSpecs").value);
      const benefits = parseListInput(document.getElementById("productBenefits").value);
      const packageItems = parseListInput(document.getElementById("productPackage").value);
      const services = parseListInput(document.getElementById("productServices").value);
      const image = await getImageFromForm();
      const products = await getSavedProducts();

      products.push({
        id: `${Date.now()}-${name.toLowerCase().replace(/\s+/g, "-")}`,
        name,
        price,
        description,
        image,
        specs: specs.length > 0 ? specs : ["منتج جديد", "متوفر الآن", "جودة عالية", "شحن سريع"],
        benefits: benefits.length > 0 ? benefits : ["جودة عالية", "دعم ممتاز", "سعر مناسب"],
        package: packageItems.length > 0 ? packageItems : ["المنتج الأساسي", "دليل الاستخدام"],
        services: services.length > 0 ? services : ["خدمة عملاء", "ضمان رسمي"]
      });

      saveProducts(products);
      form.reset();
      updateProductPreview();
      await renderSavedProductsAdmin();
      await renderSavedProductsInShop();
      message.textContent = "تم حفظ المنتج بنجاح وسيظهر في المتجر فورًا.";
    } catch (error) {
      message.textContent = error.message;
    }
  });

  if (savedProducts) {
    savedProducts.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-delete-product]");

      if (!button) {
        return;
      }

      const products = (await getSavedProducts()).filter((product) => product.id !== button.dataset.deleteProduct);
      saveProducts(products);
      await renderSavedProductsAdmin();
      await renderSavedProductsInShop();
    });
  }
}

function renderCartPage() {
  const cartItems = document.getElementById("cartItems");
  const summaryItems = document.getElementById("summaryItems");
  const summaryTotal = document.getElementById("summaryTotal");

  if (!cartItems || !summaryItems || !summaryTotal) {
    return;
  }

  const cart = getCart();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  summaryItems.textContent = itemCount;
  summaryTotal.textContent = `$${total.toFixed(2)}`;

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        <h2>السلة فارغة</h2>
        <p>أضف منتجات من صفحة المتجر حتى تظهر هنا.</p>
        <a class="primary-btn" href="shop.html">اذهب للمتجر</a>
      </div>
    `;
    return;
  }

  cartItems.innerHTML = cart.map((item) => `
    <article class="cart-item">
      <img src="${item.image}" alt="${item.name}" />
      <div>
        <h3>${item.name}</h3>
        <p>$${item.price.toFixed(2)}</p>
      </div>
      <div class="quantity-controls">
        <button type="button" data-action="decrease" data-id="${item.id}">-</button>
        <span>${item.quantity}</span>
        <button type="button" data-action="increase" data-id="${item.id}">+</button>
      </div>
      <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
      <button class="remove-item" type="button" data-action="remove" data-id="${item.id}">حذف</button>
    </article>
  `).join("");
}

function updateCartItem(id, action) {
  let cart = getCart();
  const item = cart.find((product) => product.id === id);

  if (!item) {
    return;
  }

  if (action === "increase") {
    item.quantity += 1;
  }

  if (action === "decrease") {
    item.quantity -= 1;
  }

  if (action === "remove" || item.quantity <= 0) {
    cart = cart.filter((product) => product.id !== id);
  }

  saveCart(cart);
  renderCartPage();
}

function setupCartPageActions() {
  const cartItems = document.getElementById("cartItems");
  const clearCartBtn = document.getElementById("clearCartBtn");
  const checkoutBtn = document.getElementById("checkoutBtn");

  if (cartItems) {
    cartItems.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");

      if (button) {
        updateCartItem(button.dataset.id, button.dataset.action);
      }
    });
  }

  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", () => {
      saveCart([]);
      renderCartPage();
    });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      const cart = getCart();

      if (cart.length === 0) {
        alert("السلة فارغة.");
        return;
      }

      window.location.href = "checkout.html";
    });
  }
}

function renderCheckoutPage() {
  const checkoutItems = document.getElementById("checkoutItems");
  const checkoutTotal = document.getElementById("checkoutTotal");

  if (!checkoutItems || !checkoutTotal) {
    return;
  }

  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  checkoutTotal.textContent = `$${total.toFixed(2)}`;

  if (cart.length === 0) {
    checkoutItems.innerHTML = `
      <div class="empty-cart">
        <h2>السلة فارغة</h2>
        <p>أضف منتج أولًا، ثم أكمل الطلب.</p>
        <a class="primary-btn" href="shop.html">اذهب للمتجر</a>
      </div>
    `;
    return;
  }

  checkoutItems.innerHTML = cart.map((item) => `
    <article class="checkout-item">
      <img src="${item.image}" alt="${item.name}" />
      <div>
        <h3>${item.name}</h3>
        <p>${item.quantity} x $${item.price.toFixed(2)}</p>
      </div>
      <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
    </article>
  `).join("");
}

function setupCheckoutForm() {
  const form = document.getElementById("checkoutForm");
  const message = document.getElementById("checkoutMessage");

  if (!form) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const cart = getCart();

    if (cart.length === 0) {
      message.textContent = "السلة فارغة. أضف منتج أولًا.";
      return;
    }

    const order = {
      id: Date.now(),
      name: document.getElementById("customerName").value.trim(),
      phone: document.getElementById("customerPhone").value.trim(),
      address: document.getElementById("customerAddress").value.trim(),
      items: cart,
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      createdAt: new Date().toISOString()
    };

    const orders = getOrders();
    orders.push(order);
    saveOrders(orders);
    saveCart([]);
    renderCheckoutPage();
    form.reset();

    const whatsappUrl = createWhatsAppOrderUrl(order);
    window.open(whatsappUrl, "_blank");
    message.innerHTML = `تم حفظ الطلب بنجاح. <a href="${whatsappUrl}" target="_blank">إرسال على واتساب</a> أو <a href="orders.html">عرض الطلبات</a>`;
  });
}

function createWhatsAppOrderMessage(order) {
  const itemsText = order.items.map((item, index) => (
    `${index + 1}. ${item.name}\nQuantity: ${item.quantity}\nPrice: $${Number(item.price).toFixed(2)}\nSubtotal: $${(item.price * item.quantity).toFixed(2)}`
  )).join("\n\n");

  return `طلب جديد - متجر عمر إكس

بيانات العميل:
الاسم: ${order.name}
الهاتف: ${order.phone}
العنوان: ${order.address}

المنتجات:
${itemsText}

الإجمالي: $${Number(order.total).toFixed(2)}
رقم الطلب: ${order.id}`;
}

function createWhatsAppOrderUrl(order) {
  const message = encodeURIComponent(createWhatsAppOrderMessage(order));

  if (STORE_WHATSAPP_NUMBER.trim()) {
    return `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${message}`;
  }

  return `https://wa.me/?text=${message}`;
}

function formatOrderDate(value) {
  return new Date(value).toLocaleString();
}

function renderOrdersPage() {
  const ordersList = document.getElementById("ordersList");

  if (!ordersList) {
    return;
  }

  const orders = getOrders();

  if (orders.length === 0) {
    ordersList.innerHTML = `
      <div class="empty-cart">
        <h2>لا توجد طلبات حتى الآن</h2>
        <p>طلبات العملاء ستظهر هنا بعد إكمال الطلب.</p>
        <a class="primary-btn" href="shop.html">اذهب للمتجر</a>
      </div>
    `;
    return;
  }

  ordersList.innerHTML = orders.slice().reverse().map((order) => `
    <article class="order-card">
      <div class="order-header">
        <div>
          <h2>طلب رقم ${order.id}</h2>
          <p>${formatOrderDate(order.createdAt)}</p>
        </div>
        <strong>$${Number(order.total).toFixed(2)}</strong>
      </div>

      <div class="customer-details">
        <p><strong>الاسم:</strong> ${order.name}</p>
        <p><strong>الهاتف:</strong> ${order.phone}</p>
        <p><strong>العنوان:</strong> ${order.address}</p>
      </div>

      <div class="order-products">
        ${order.items.map((item) => `
          <div class="order-product">
            <img src="${item.image}" alt="${item.name}" />
            <div>
              <h3>${item.name}</h3>
              <p>${item.quantity} x $${Number(item.price).toFixed(2)}</p>
            </div>
            <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
          </div>
        `).join("")}
      </div>
    </article>
  `).join("");
}

function setupOrdersPageActions() {
  const clearOrdersBtn = document.getElementById("clearOrdersBtn");

  if (!clearOrdersBtn) {
    return;
  }

  clearOrdersBtn.addEventListener("click", () => {
    saveOrders([]);
    renderOrdersPage();
  });
}

async function initStore() {
  await renderSavedProductsInShop();
  setupProductForm();
  await renderSavedProductsAdmin();
  setupAddToCartButtons();
  setupCartPageActions();
  renderCartPage();
  renderCheckoutPage();
  setupCheckoutForm();
  renderOrdersPage();
  setupOrdersPageActions();
  updateCartCount();
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  initStore();
}
