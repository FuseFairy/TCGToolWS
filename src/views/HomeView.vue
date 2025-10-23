<template>
  <div class="d-flex justify-center align-center fill-height">
    <h1 class="rainbow-text">Ciallo~ (∠・ω &lt;) ⌒ ☆</h1>
  </div>
</template>

<script setup></script>

<style scoped>
.rainbow-text {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: bold;
  white-space: nowrap;
  background: linear-gradient(
    90deg,
    #ffb3ba,
    #ffdfba,
    #ffffba,
    #baffc9,
    #bae1ff,
    #d4baff,
    #ffb3f0,
    #ffb3ba
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: rainbow 3s linear infinite;
}

@keyframes rainbow {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
}

@media (max-width: 599.98px) {
  .rainbow-text {
    font-size: clamp(1.5rem, 5vw, 3rem);
  }
}
</style>
