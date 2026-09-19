<template>
  <div
    class="login-puppy"
    :class="{
      'is-watching': field === 'email',
      'is-covering': field === 'password',
      'is-peeking': field === 'password' && peeking,
      'is-happy': happy,
    }"
    :style="pose"
    aria-hidden="true"
  >
    <svg viewBox="0 0 200 200" fill="none" focusable="false">
      <circle cx="100" cy="100" r="98" fill="#eaf6ef" />
      <circle cx="151" cy="47" r="17" fill="#d9eee1" />
      <circle cx="42" cy="115" r="9" fill="#d9eee1" />
      <path d="M27 163Q100 139 173 163" stroke="#d2e8d9" stroke-width="2" stroke-linecap="round" />

      <g stroke="#654d40" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path class="puppy-tail" d="M141 174C180 172 175 137 163 139C154 140 168 157 139 153" fill="#bd865c" />
        <path d="M53 201L57 163C60 140 77 130 100 130C123 130 140 141 143 163L148 201" fill="#e8bd8e" />
        <path d="M76 201L78 166Q100 145 122 166L126 201" fill="#fff5e6" stroke="none" />
        <path d="M70 141Q100 153 130 141L127 151Q100 164 73 151Z" fill="#29976b" />
        <circle cx="100" cy="157" r="7" fill="#f3cb70" stroke-width="2" />
        <path d="M100 154V160M97 157H103" stroke-width="1.5" />

        <g class="puppy-head">
          <g class="puppy-ear puppy-ear-left">
            <path d="M65 53C45 43 33 60 32 82C30 109 36 128 48 126C62 124 68 86 72 65Z" fill="#bd865c" />
            <path d="M48 66Q38 88 44 110" stroke="#a5714f" />
          </g>
          <g class="puppy-ear puppy-ear-right">
            <path d="M135 53C155 43 167 60 168 82C170 109 164 128 152 126C138 124 132 86 128 65Z" fill="#bd865c" />
            <path d="M152 66Q162 88 156 110" stroke="#a5714f" />
          </g>
          <path d="M54 87C54 62 69 45 90 43L87 34L101 40L109 32L113 43C137 48 147 64 146 89L150 108L143 107C140 132 121 146 100 146C79 146 60 132 57 107L50 108Z" fill="#e8bd8e" />
          <path d="M96 48C82 66 98 82 84 99L115 102C100 83 115 65 105 47Z" fill="#fff5e6" stroke="none" />
          <path class="puppy-brow puppy-brow-left" d="M70 78Q76 74 82 77" />
          <path class="puppy-brow puppy-brow-right" d="M118 77Q124 74 130 78" />

          <g class="puppy-eyes">
            <ellipse cx="78" cy="91" rx="9" ry="11" fill="#fffdf8" stroke="none" />
            <ellipse cx="122" cy="91" rx="9" ry="11" fill="#fffdf8" stroke="none" />
            <g class="puppy-pupils" fill="#403d35" stroke="none">
              <ellipse cx="79" cy="92" rx="4.5" ry="6" />
              <ellipse cx="121" cy="92" rx="4.5" ry="6" />
              <circle cx="80.5" cy="90" r="1.5" fill="white" />
              <circle cx="122.5" cy="90" r="1.5" fill="white" />
            </g>
          </g>
          <ellipse cx="67" cy="108" rx="7" ry="4" fill="#de9b7c" stroke="none" opacity=".65" />
          <ellipse cx="133" cy="108" rx="7" ry="4" fill="#de9b7c" stroke="none" opacity=".65" />
          <path d="M100 107C83 96 70 104 72 117C74 130 89 132 100 127C111 132 126 130 128 117C130 104 117 96 100 107Z" fill="#fff5e6" stroke="none" />
          <g class="puppy-smile">
            <path d="M88 121Q100 126 112 121C111 141 89 141 88 121Z" fill="#654d40" stroke-width="2" />
            <path d="M94 132Q100 127 106 132V136Q100 144 94 136Z" fill="#ec9a9a" stroke="none" />
          </g>
          <path class="puppy-mouth" d="M88 121Q94 127 100 121Q106 127 112 121" />
          <path d="M100 113V121" />
          <path d="M92 106Q100 102 108 106Q110 110 100 116Q90 110 92 106Z" fill="#403d35" stroke="#403d35" />
          <path d="M97 107H101" stroke="#858376" stroke-width="2" />
        </g>

        <g class="puppy-paw puppy-paw-left">
          <path d="M53 204C47 176 46 145 52 135C57 126 75 126 80 136C86 151 79 180 83 204" fill="#e8bd8e" />
          <path d="M52 145C45 133 48 121 55 120C56 109 65 108 70 115C77 109 85 114 84 122C94 123 94 134 86 144C78 155 60 156 52 145Z" fill="#fff5e6" />
          <path d="M57 123L59 129M68 119V127M79 123L77 129" stroke="#ba9473" stroke-width="2" />
          <path d="M60 141C60 133 75 130 78 139C82 149 62 151 60 141Z" fill="#d8a17f" stroke="none" />
        </g>
        <g class="puppy-paw puppy-paw-right">
          <path d="M147 204C153 176 154 145 148 135C143 126 125 126 120 136C114 151 121 180 117 204" fill="#e8bd8e" />
          <path d="M148 145C155 133 152 121 145 120C144 109 135 108 130 115C123 109 115 114 116 122C106 123 106 134 114 144C122 155 140 156 148 145Z" fill="#fff5e6" />
          <path d="M143 123L141 129M132 119V127M121 123L123 129" stroke="#ba9473" stroke-width="2" />
          <path d="M140 141C140 133 125 130 122 139C118 149 138 151 140 141Z" fill="#d8a17f" stroke="none" />
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  field: 'email' | 'password' | null;
  progress: number;
  happy: boolean;
  peeking: boolean;
}>();

const pose = computed(() => {
  const direction = Math.min(1, Math.max(0, props.progress)) * 2 - 1;
  const watching = props.field === 'email';
  return {
    '--head-x': `${watching ? direction * 4 : 0}px`,
    '--head-y': `${watching ? 4 : 0}px`,
    '--head-angle': `${watching ? direction * 6 : 0}deg`,
    '--eyes-x': `${watching ? direction * 3 : props.peeking && props.field === 'password' ? 2 : 0}px`,
    '--eyes-y': `${watching || (props.peeking && props.field === 'password') ? 3 : 0}px`,
  };
});
</script>

<style scoped>
.login-puppy {
  width: 144px;
  height: 144px;
  margin: 0 auto 24px;
  overflow: hidden;
  border: 2px solid #b8d8c6;
  border-radius: 50%;
  background: #eaf6ef;
  isolation: isolate;
  pointer-events: none;
}

.login-puppy svg {
  display: block;
  width: 100%;
  height: 100%;
}

.puppy-head {
  transform-origin: 100px 135px;
  transform: translate(var(--head-x), var(--head-y)) rotate(var(--head-angle));
  transition: transform 260ms ease-out;
}

.puppy-pupils {
  transform: translate(var(--eyes-x), var(--eyes-y));
  transition: transform 180ms ease-out;
}

.puppy-eyes {
  transform-origin: 100px 91px;
  animation: puppy-blink 6s infinite;
}

.puppy-ear {
  transition: transform 400ms ease;
}

.puppy-ear-left { transform-origin: 65px 55px; }
.puppy-ear-right { transform-origin: 135px 55px; }
.is-watching .puppy-ear-left { transform: rotate(7deg); }
.is-watching .puppy-ear-right { transform: rotate(-7deg); }

.puppy-tail {
  transform-origin: 141px 174px;
  animation: puppy-wag 2.4s ease-in-out infinite;
}

.is-happy .puppy-tail { animation-duration: 450ms; }

.puppy-smile {
  opacity: 0;
  transform: scaleY(.4);
  transform-origin: 100px 121px;
  transition: opacity 180ms ease, transform 240ms ease;
}

.puppy-mouth { transition: opacity 180ms ease; }
.is-happy .puppy-smile { opacity: 1; transform: scaleY(1); }
.is-happy .puppy-mouth { opacity: 0; }

.puppy-paw {
  transition: transform 480ms cubic-bezier(.22, 1, .36, 1);
}

.puppy-paw-left {
  transform: translate(-9px, 64px) rotate(-12deg);
  transform-origin: 65px 170px;
}

.puppy-paw-right {
  transform: translate(9px, 64px) rotate(12deg);
  transform-origin: 135px 170px;
  transition-delay: 70ms;
}

.is-covering .puppy-paw-left { transform: translate(10px, -39px) rotate(-6deg); }
.is-covering .puppy-paw-right { transform: translate(-10px, -39px) rotate(6deg); }
.is-covering .puppy-ear-left { transform: rotate(-5deg); }
.is-covering .puppy-ear-right { transform: rotate(5deg); }

.is-peeking .puppy-paw-left { transform: translate(-3px, -15px) rotate(-18deg); }
.is-peeking .puppy-brow-left { transform: translateY(-3px); }
.puppy-brow { transition: transform 280ms ease; }

@keyframes puppy-blink {
  0%, 43%, 47%, 100% { transform: scaleY(1); }
  45% { transform: scaleY(.08); }
}

@keyframes puppy-wag {
  0%, 100% { transform: rotate(-8deg); }
  50% { transform: rotate(9deg); }
}

@media (prefers-reduced-motion: reduce) {
  .login-puppy *, .login-puppy *::before, .login-puppy *::after {
    animation: none !important;
    transition: none !important;
  }
}
</style>
