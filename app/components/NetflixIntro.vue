<script setup lang="ts">
const emit = defineEmits<{ done: [] }>();

onMounted(() => {
  // zoom-in: 0.5s delay + 3.5s duration = 4s total
  // give a tiny buffer after zoom completes
  setTimeout(() => emit("done"), 4200);
});
</script>

<template>
  <div class="intro-wrap">
    <div class="intro-letter letter-n">
      <!-- helper-1: left vertical bar (has brush + lumieres) -->
      <div class="helper-1">
        <div class="effect-brush">
          <span class="fur-31"></span><span class="fur-30"></span>
          <span class="fur-29"></span><span class="fur-28"></span>
          <span class="fur-27"></span><span class="fur-26"></span>
          <span class="fur-25"></span><span class="fur-24"></span>
          <span class="fur-23"></span><span class="fur-22"></span>
          <span class="fur-21"></span><span class="fur-20"></span>
          <span class="fur-19"></span><span class="fur-18"></span>
          <span class="fur-17"></span><span class="fur-16"></span>
          <span class="fur-15"></span><span class="fur-14"></span>
          <span class="fur-13"></span><span class="fur-12"></span>
          <span class="fur-11"></span><span class="fur-10"></span>
          <span class="fur-9"></span><span class="fur-8"></span>
          <span class="fur-7"></span><span class="fur-6"></span>
          <span class="fur-5"></span><span class="fur-4"></span>
          <span class="fur-3"></span><span class="fur-2"></span>
          <span class="fur-1"></span>
        </div>
        <div class="effect-lumieres">
          <span class="lamp-1"></span><span class="lamp-2"></span>
          <span class="lamp-3"></span><span class="lamp-4"></span>
          <span class="lamp-5"></span><span class="lamp-6"></span>
          <span class="lamp-7"></span><span class="lamp-8"></span>
          <span class="lamp-9"></span><span class="lamp-10"></span>
          <span class="lamp-11"></span><span class="lamp-12"></span>
          <span class="lamp-13"></span><span class="lamp-14"></span>
          <span class="lamp-15"></span><span class="lamp-16"></span>
          <span class="lamp-17"></span><span class="lamp-18"></span>
          <span class="lamp-19"></span><span class="lamp-20"></span>
          <span class="lamp-21"></span><span class="lamp-22"></span>
          <span class="lamp-23"></span><span class="lamp-24"></span>
          <span class="lamp-25"></span><span class="lamp-26"></span>
          <span class="lamp-27"></span><span class="lamp-28"></span>
        </div>
      </div>
      <!-- helper-3: diagonal stroke -->
      <div class="helper-3">
        <div class="effect-brush">
          <span class="fur-31"></span><span class="fur-30"></span>
          <span class="fur-29"></span><span class="fur-28"></span>
          <span class="fur-27"></span><span class="fur-26"></span>
          <span class="fur-25"></span><span class="fur-24"></span>
          <span class="fur-23"></span><span class="fur-22"></span>
          <span class="fur-21"></span><span class="fur-20"></span>
          <span class="fur-19"></span><span class="fur-18"></span>
          <span class="fur-17"></span><span class="fur-16"></span>
          <span class="fur-15"></span><span class="fur-14"></span>
          <span class="fur-13"></span><span class="fur-12"></span>
          <span class="fur-11"></span><span class="fur-10"></span>
          <span class="fur-9"></span><span class="fur-8"></span>
          <span class="fur-7"></span><span class="fur-6"></span>
          <span class="fur-5"></span><span class="fur-4"></span>
          <span class="fur-3"></span><span class="fur-2"></span>
          <span class="fur-1"></span>
        </div>
      </div>
      <!-- helper-2: right vertical bar -->
      <div class="helper-2">
        <div class="effect-brush">
          <span class="fur-31"></span><span class="fur-30"></span>
          <span class="fur-29"></span><span class="fur-28"></span>
          <span class="fur-27"></span><span class="fur-26"></span>
          <span class="fur-25"></span><span class="fur-24"></span>
          <span class="fur-23"></span><span class="fur-22"></span>
          <span class="fur-21"></span><span class="fur-20"></span>
          <span class="fur-19"></span><span class="fur-18"></span>
          <span class="fur-17"></span><span class="fur-16"></span>
          <span class="fur-15"></span><span class="fur-14"></span>
          <span class="fur-13"></span><span class="fur-12"></span>
          <span class="fur-11"></span><span class="fur-10"></span>
          <span class="fur-9"></span><span class="fur-8"></span>
          <span class="fur-7"></span><span class="fur-6"></span>
          <span class="fur-5"></span><span class="fur-4"></span>
          <span class="fur-3"></span><span class="fur-2"></span>
          <span class="fur-1"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Variables ─────────────────────────────────────────────── */
:root {
  --c-red: #e40913;
  --c-bg: #000000;
}

/* ── Full-screen backdrop ──────────────────────────────────── */
.intro-wrap {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  z-index: 9999;
}

/* ── Letter container ──────────────────────────────────────── */
.intro-letter {
  display: block;
  position: relative;
  width: 300px;
  height: 300px;
  overflow: hidden;
  animation: zoom-in 3.5s ease-in 0.5s forwards;
}

.intro-letter::before {
  content: "";
  position: absolute;
  display: block;
  background-color: #000;
  width: 150%;
  height: 30%;
  left: -25%;
  bottom: -27%;
  border-radius: 50%;
  z-index: 5;
}

/* ── N-specific layout ─────────────────────────────────────── */
.letter-n {
  transform-origin: 30% center;
}

/* helper-1: left vertical bar */
.letter-n .helper-1 {
  width: 19.5%;
  height: 100%;
  background-color: rgba(228, 9, 19, 0.5);
  left: 22.4%;
  top: 0;
  transform: rotate(180deg);
  animation: fading-lumieres-box 2s 0.6s forwards;
}
.letter-n .helper-1 .effect-brush {
  animation: brush-moving 2.5s 1.2s forwards;
}
.letter-n .helper-1 .effect-brush [class*="fur-"] {
  bottom: 0;
  height: 40%;
}

/* helper-3: diagonal stroke */
.letter-n .helper-3 {
  width: 19%;
  height: 150%;
  left: 40.5%;
  top: -25%;
  transform: rotate(-19.5deg);
  box-shadow: 0px 0px 35px -12px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}
.letter-n .helper-3 .effect-brush {
  animation: brush-moving 2s 0.8s forwards;
}

/* helper-2: right vertical bar */
.letter-n .helper-2 {
  width: 19.5%;
  height: 100%;
  left: 57.8%;
  top: 0;
  transform: rotate(180deg);
  overflow: hidden;
}
.letter-n .helper-2 .effect-brush {
  animation: brush-moving 2s 0.5s forwards;
}

/* ── All helper-* shared base ──────────────────────────────── */
[class*="helper-"] {
  position: absolute;
}

/* ── Effect brush ──────────────────────────────────────────── */
.effect-brush {
  position: absolute;
  width: 100%;
  height: 300%;
  top: 0;
  overflow: hidden;
}
.effect-brush::before {
  display: block;
  content: "";
  position: absolute;
  background-color: #e40913;
  width: 100%;
  height: 70%;
  box-shadow: 0px 0px 29px 24px #e40913;
}

/* ── Fur elements ──────────────────────────────────────────── */
[class*="fur-"] {
  display: block;
  position: absolute;
  bottom: 10%;
  height: 30%;
}

.fur-1  { left: 0%;     width: 3.8%; background: linear-gradient(to bottom, #e40913 0%, #e40913 15%, rgba(0,0,0,0) 81%, rgba(0,0,0,0) 100%); }
.fur-2  { left: 3.8%;   width: 2.8%; background: linear-gradient(to bottom, #e40913 0%, #e40913 10%, rgba(0,0,0,0) 62%, rgba(0,0,0,0) 100%); }
.fur-3  { left: 6.6%;   width: 4.8%; background: linear-gradient(to bottom, #e40913 0%, #e40913 37%, rgba(0,0,0,0) 100%); }
.fur-4  { left: 11.4%;  width: 4%;   background: linear-gradient(to bottom, #e40913 0%, #e40913 23%, rgba(0,0,0,0) 100%); }
.fur-5  { left: 15.4%;  width: 4%;   background: linear-gradient(to bottom, #e40913 0%, #e40913 15%, rgba(0,0,0,0) 86%, rgba(0,0,0,0) 100%); }
.fur-6  { left: 19.4%;  width: 2.5%; background: linear-gradient(to bottom, #e40913 0%, #e40913 27%, rgba(0,0,0,0) 89%, rgba(0,0,0,0) 100%); }
.fur-7  { left: 21.9%;  width: 4%;   background: linear-gradient(to bottom, #e40913 0%, #e40913 20%, rgba(0,0,0,0) 100%); }
.fur-8  { left: 25.9%;  width: 2%;   background: linear-gradient(to bottom, #e40913 0%, #e40913 30%, rgba(0,0,0,0) 100%); }
.fur-9  { left: 27.9%;  width: 4%;   background: linear-gradient(to bottom, #e40913 0%, #e40913 35%, rgba(0,0,0,0) 95%, rgba(0,0,0,0) 100%); }
.fur-10 { left: 31.9%;  width: 3.5%; background: linear-gradient(to bottom, #e40913 0%, #e40913 39%, rgba(0,0,0,0) 95%, rgba(0,0,0,0) 100%); }
.fur-11 { left: 35.4%;  width: 2%;   background: linear-gradient(to bottom, #e40913 0%, #e40913 34%, rgba(0,0,0,0) 95%, rgba(0,0,0,0) 100%); }
.fur-12 { left: 37.4%;  width: 2.6%; background: linear-gradient(to bottom, #e40913 0%, #e40913 22%, rgba(0,0,0,0) 95%, rgba(0,0,0,0) 100%); }
.fur-13 { left: 40%;    width: 6%;   background: linear-gradient(to bottom, #e40913 0%, #e40913 47%, rgba(0,0,0,0) 100%); }
.fur-14 { left: 46%;    width: 2%;   background: linear-gradient(to bottom, #e40913 0%, #e40913 36%, rgba(0,0,0,0) 100%); }
.fur-15 { left: 48%;    width: 5.5%; background: linear-gradient(to bottom, #e40913 0%, #e40913 29%, rgba(0,0,0,0) 100%); }
.fur-16 { left: 53.5%;  width: 3%;   background: linear-gradient(to bottom, #e40913 0%, #e40913 39%, rgba(0,0,0,0) 95%, rgba(0,0,0,0) 100%); }
.fur-17 { left: 56.5%;  width: 4.1%; background: linear-gradient(to bottom, #e40913 0%, #e40913 45%, rgba(0,0,0,0) 100%); }
.fur-18 { left: 60.6%;  width: 2.4%; background: linear-gradient(to bottom, #e40913 0%, #e40913 34%, rgba(0,0,0,0) 100%); }
.fur-19 { left: 63%;    width: 4%;   background: linear-gradient(to bottom, #e40913 0%, #e40913 47%, rgba(0,0,0,0) 100%); }
.fur-20 { left: 67%;    width: 1.5%; background: linear-gradient(to bottom, #e40913 0%, #e40913 27%, rgba(0,0,0,0) 95%, rgba(0,0,0,0) 100%); }
.fur-21 { left: 68.5%;  width: 2.8%; background: linear-gradient(to bottom, #e40913 0%, #e40913 37%, rgba(0,0,0,0) 100%); }
.fur-22 { left: 71.3%;  width: 2.3%; background: linear-gradient(to bottom, #e40913 0%, #e40913 9%,  rgba(0,0,0,0) 100%); }
.fur-23 { left: 73.6%;  width: 2.2%; background: linear-gradient(to bottom, #e40913 0%, #e40913 28%, rgba(0,0,0,0) 92%, rgba(0,0,0,0) 100%); }
.fur-24 { left: 75.8%;  width: 1%;   background: linear-gradient(to bottom, #e40913 0%, #e40913 37%, rgba(0,0,0,0) 100%); }
.fur-25 { left: 76.8%;  width: 2.1%; background: linear-gradient(to bottom, #e40913 0%, #e40913 28%, rgba(0,0,0,0) 100%); }
.fur-26 { left: 78.9%;  width: 4.1%; background: linear-gradient(to bottom, #e40913 0%, #e40913 34%, rgba(0,0,0,0) 100%); }
.fur-27 { left: 83%;    width: 2.5%; background: linear-gradient(to bottom, #e40913 0%, #e40913 21%, rgba(0,0,0,0) 100%); }
.fur-28 { left: 85.5%;  width: 4.5%; background: linear-gradient(to bottom, #e40913 0%, #e40913 39%, rgba(0,0,0,0) 100%); }
.fur-29 { left: 90%;    width: 2.8%; background: linear-gradient(to bottom, #e40913 0%, #e40913 30%, rgba(0,0,0,0) 100%); }
.fur-30 { left: 92.8%;  width: 3.5%; background: linear-gradient(to bottom, #e40913 0%, #e40913 19%, rgba(0,0,0,0) 100%); }
.fur-31 { left: 96.3%;  width: 3.7%; background: linear-gradient(to bottom, #e40913 0%, #e40913 37%, rgba(0,0,0,0) 100%); }

/* ── Effect lumieres (light streaks on helper-1 only) ──────── */
.effect-lumieres {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  animation: showing-lumieres 2s 1.6s forwards;
}

[class*="lamp-"] {
  position: absolute;
  display: block;
  height: 100%;
  box-shadow: 0px 0px 10px 0px rgba(228, 9, 19, 0.75);
  background: var(--color);
}
[class*="lamp-"]::before {
  position: absolute;
  content: " ";
  display: block;
  width: 100%;
  height: 100%;
  background: var(--color);
  box-shadow: 0px 0px 10px 0px rgba(228, 9, 19, 0.75);
}

/* lamp positions & colors */
.lamp-1  { --color: #ff0100; left: 0.7%;  width: 1%;   }
.lamp-2  { --color: #ffde01; left: 2.2%;  width: 1.4%; }
.lamp-3  { --color: #ff00cc; left: 5.8%;  width: 2.1%; }
.lamp-4  { --color: #04fd8f; left: 10.1%; width: 2%;   }
.lamp-5  { --color: #ff0100; left: 12.9%; width: 1.4%; }
.lamp-6  { --color: #ff9600; left: 15.3%; width: 2.8%; }
.lamp-7  { --color: #0084ff; left: 21.2%; width: 2.5%; }
.lamp-8  { --color: #f84006; left: 25%;   width: 2.5%; }
.lamp-9  { --color: #ffc601; left: 30.5%; width: 3%;   }
.lamp-10 { --color: #ff4800; left: 36.3%; width: 3%;   }
.lamp-11 { --color: #fd0100; left: 41%;   width: 2.2%; }
.lamp-12 { --color: #01ffff; left: 44.2%; width: 2.6%; }
.lamp-13 { --color: #ffc601; left: 51.7%; width: 0.5%; }
.lamp-14 { --color: #ffc601; left: 52.1%; width: 1.8%; }
.lamp-15 { --color: #0078fe; left: 53.8%; width: 2.3%; }
.lamp-16 { --color: #0080ff; left: 57.2%; width: 2%;   }
.lamp-17 { --color: #ffae01; left: 62.3%; width: 2.9%; }
.lamp-18 { --color: #ff00bf; left: 65.8%; width: 1.7%; }
.lamp-19 { --color: #a601f4; left: 72.8%; width: 0.8%; }
.lamp-20 { --color: #f30b34; left: 74.3%; width: 2%;   }
.lamp-21 { --color: #ff00bf; left: 79.8%; width: 2%;   }
.lamp-22 { --color: #04fd8f; left: 78.2%; width: 2%;   }
.lamp-23 { --color: #01ffff; left: 78.5%; width: 2%;   }
.lamp-24 { --color: #a201ff; left: 85.3%; width: 1.1%; }
.lamp-25 { --color: #ec0014; left: 86.9%; width: 1.1%; }
.lamp-26 { --color: #0078fe; left: 88.8%; width: 2%;   }
.lamp-27 { --color: #ff0036; left: 92.4%; width: 2.4%; }
.lamp-28 { --color: #06f98c; left: 96.2%; width: 2.1%; }

/* odd lamps → move left */
.lamp-1::before  { left: 40%; animation: lumieres-moving-left 5.5s forwards; }
.lamp-3::before  { left: 20%; animation: lumieres-moving-left 5.5s forwards; }
.lamp-5::before  { left: 60%; animation: lumieres-moving-left 5.5s forwards; }
.lamp-7::before  { left: 30%; animation: lumieres-moving-left 5.5s forwards; }
.lamp-9::before  { left: 80%; animation: lumieres-moving-left 5.5s forwards; }
.lamp-11::before { left: 50%; animation: lumieres-moving-left 5.5s forwards; }
.lamp-13::before { left: 10%; animation: lumieres-moving-left 5.5s forwards; }
.lamp-15::before { left: 70%; animation: lumieres-moving-left 5.5s forwards; }
.lamp-17::before { left: 40%; animation: lumieres-moving-left 5.5s forwards; }
.lamp-19::before { left: 90%; animation: lumieres-moving-left 5.5s forwards; }
.lamp-21::before { left: 20%; animation: lumieres-moving-left 5.5s forwards; }
.lamp-23::before { left: 60%; animation: lumieres-moving-left 5.5s forwards; }
.lamp-25::before { left: 30%; animation: lumieres-moving-left 5.5s forwards; }
.lamp-27::before { left: 110%; animation: lumieres-moving-left 5.5s forwards; }

/* even lamps → move right */
.lamp-2::before  { left: 50%; animation: lumieres-moving-right 5.5s forwards; }
.lamp-4::before  { left: 80%; animation: lumieres-moving-right 5.5s forwards; }
.lamp-6::before  { left: 20%; animation: lumieres-moving-right 5.5s forwards; }
.lamp-8::before  { left: 60%; animation: lumieres-moving-right 5.5s forwards; }
.lamp-10::before { left: 40%; animation: lumieres-moving-right 5.5s forwards; }
.lamp-12::before { left: 100%; animation: lumieres-moving-right 5.5s forwards; }
.lamp-14::before { left: 30%; animation: lumieres-moving-right 5.5s forwards; }
.lamp-16::before { left: 70%; animation: lumieres-moving-right 5.5s forwards; }
.lamp-18::before { left: 10%; animation: lumieres-moving-right 5.5s forwards; }
.lamp-20::before { left: 50%; animation: lumieres-moving-right 5.5s forwards; }
.lamp-22::before { left: 80%; animation: lumieres-moving-right 5.5s forwards; }
.lamp-24::before { left: 20%; animation: lumieres-moving-right 5.5s forwards; }
.lamp-26::before { left: 60%; animation: lumieres-moving-right 5.5s forwards; }
.lamp-28::before { left: 0%;  animation: lumieres-moving-right 5.5s forwards; }

.lamp-1,  .lamp-3,  .lamp-5,  .lamp-7,  .lamp-9,  .lamp-11,
.lamp-13, .lamp-15, .lamp-17, .lamp-19, .lamp-21, .lamp-23,
.lamp-25, .lamp-27 { animation: lumieres-moving-left  5s forwards; }

.lamp-2,  .lamp-4,  .lamp-6,  .lamp-8,  .lamp-10, .lamp-12,
.lamp-14, .lamp-16, .lamp-18, .lamp-20, .lamp-22, .lamp-24,
.lamp-26, .lamp-28 { animation: lumieres-moving-right 5s forwards; }

/* ── Keyframes ─────────────────────────────────────────────── */
@keyframes brush-moving {
  0%   { transform: translateY(0); }
  100% { transform: translateY(-100%); }
}

@keyframes fading-out {
  0%   { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes fading-lumieres-box {
  0%   { background-color: rgba(228, 9, 19, 0.5); }
  100% { background-color: rgba(228, 9, 19, 0); }
}

@keyframes showing-lumieres {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes lumieres-moving-left {
  0%   { transform: translate(0); }
  40%  { transform: translate(10px) scaleX(1); }
  50%  { transform: translate(60px); }
  100% { transform: translate(120px) scaleX(3); }
}

@keyframes lumieres-moving-right {
  0%   { transform: translate(0); }
  40%  { transform: translate(-10px) scaleX(1); }
  50%  { transform: translate(-60px); }
  100% { transform: translate(-120px) scaleX(3); }
}

@keyframes zoom-in {
  0%   { transform: scale(1); }
  100% { transform: scale(15); }
}
</style>
