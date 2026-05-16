<template>
  <n-config-provider>
    <n-message-provider>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </n-message-provider>
  </n-config-provider>
</template>

<style>
:root {
  --modal-margin-inline: 24px;
  --modal-margin-block: 24px;
  --app-scrollbar-track: #f8fafc;
  --app-scrollbar-thumb: #cbd5e1;
  --app-scrollbar-thumb-hover: #b8c5d6;
}

@media (max-width: 389px) {
  :root {
    --modal-margin-inline: 16px;
    --modal-margin-block: clamp(16px, 3vh, 20px);
  }
}

@media (min-width: 390px) and (max-width: 430px) {
  :root {
    --modal-margin-inline: 20px;
    --modal-margin-block: clamp(20px, 3.5vh, 24px);
  }
}

.n-modal-body-wrapper {
  padding: var(--modal-margin-block) var(--modal-margin-inline);
  box-sizing: border-box;
  overflow: auto;
}

.n-modal-scroll-content {
  min-height: 100%;
  box-sizing: border-box;
}

.n-modal {
  max-width: calc(100vw - (2 * var(--modal-margin-inline)));
  max-height: calc(100vh - (2 * var(--modal-margin-block)));
  overflow: visible;
  box-sizing: border-box;
}

.inline-icon-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

* {
  scrollbar-width: thin;
  scrollbar-color: var(--app-scrollbar-thumb) var(--app-scrollbar-track);
}

*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

*::-webkit-scrollbar-track {
  background: var(--app-scrollbar-track);
}

*::-webkit-scrollbar-thumb {
  background: var(--app-scrollbar-thumb);
  border-radius: 999px;
  border: 2px solid var(--app-scrollbar-track);
}

*::-webkit-scrollbar-thumb:hover {
  background: var(--app-scrollbar-thumb-hover);
}
</style>
