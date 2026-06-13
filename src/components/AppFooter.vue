<template>
  <footer class="footer">
    <div class="inner">
      <div class="brand-col">
        <span class="brand">
          <span class="material-symbols-outlined">local_shipping</span>
          LogiTrack
        </span>
        <p class="copy">© 2024 LogiTrack Systems. All rights reserved.</p>
      </div>
      <div class="links">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
        <a href="#">Contact Support</a>
        <a href="#">Shipping Rates</a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--surface-container);
  border-top: 1px solid var(--outline-variant);
}
.inner {
  max-width: 1140px;
  margin: 0 auto;
  padding: 32px 24px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}
.brand-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--on-surface);
}
.brand .material-symbols-outlined { font-size: 20px; }
.copy {
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 14px;
  color: var(--on-surface-variant);
}
.links {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}
.links a {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--on-surface-variant);
  text-decoration: none;
  transition: color 0.15s;
}
.links a:hover { color: var(--primary); }
</style>
