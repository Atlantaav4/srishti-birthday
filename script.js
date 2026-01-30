const candlesEl = document.getElementById("candles");
const startMicBtn = document.getElementById("startMic");
const relightBtn = document.getElementById("relight");
const openLetterBtn = document.getElementById("openLetter");

const modal = document.getElementById("modal");
const closeModal = document.getElementById("closeModal");

const letterInput = document.getElementById("letterInput");
const typeBtn = document.getElementById("typeBtn");
const typePreview = document.getElementById("typePreview");
const confettiBtn = document.getElementById("confetti");

const meterFill = document.getElementById("meterFill");

const canvas = document.getElementById("confettiCanvas");
const ctx = canvas.getContext("2d");

const CANDLE_COUNT = 7;
let candles = [];

const LETTER_KEY = "SRISHTI_LETTER";

const DEFAULT_LETTER = `Dear Srishti 💖,

Happy Birthdayyy 🎂✨

I hope your life becomes more beautiful every year.
Stay happy, stay strong, and keep shining ✨

You are truly special.

Happy Birthday again ❤️`;

function buildCandles(){
  candlesEl.innerHTML = "";
  candles = [];

  for(let i=0;i<CANDLE_COUNT;i++){
    const candle = document.createElement("div");
    candle.className = "candle";

    const wick = document.createElement("div");
    wick.className = "wick";

    const flame = document.createElement("div");
    flame.className = "flame";

    candle.appendChild(wick);
    candle.appendChild(flame);
    candlesEl.appendChild(candle);

    candles.push({ flame, on:true });
  }
}
buildCandles();

function relight(){
  candles.forEach(c=>{
    c.on=true;
    c.flame.classList.remove("off");
  });
}

function allOut(){
  return candles.every(c=>!c.on);
}

function blowOne(){
  const onCandles = candles
    .map((c,i)=>({c,i}))
    .filter(x=>x.c.on);

  if(onCandles.length===0) return;
  const pick = onCandles[Math.floor(Math.random()*onCandles.length)];

  pick.c.on=false;
  pick.c.flame.classList.add("off");
}

/* LETTER */
function openLetter(){
  modal.classList.add("show");
}
function closeLetter(){
  modal.classList.remove("show");
}

openLetterBtn.addEventListener("click", openLetter);
closeModal.addEventListener("click", closeLetter);
modal.addEventListener("click", (e)=>{
  if(e.target===modal) closeLetter();
});

/* SAVE LETTER */
function loadLetter(){
  const saved = localStorage.getItem(LETTER_KEY);
  letterInput.value = saved || DEFAULT_LETTER;
}
function saveLetter(){
  localStorage.setItem(LETTER_KEY, letterInput.value);
}
letterInput.addEventListener("input", saveLetter);
loadLetter();

/* TYPEWRITER */
let typing=false;
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function typewriter(text){
  if(typing) return;
  typing=true;
  typePreview.textContent = "";

  for(let i=0;i<text.length;i++){
    typePreview.textContent += text[i];
    await sleep(18);
  }
  typing=false;
}

typeBtn.addEventListener("click", ()=>{
  const msg = letterInput.value.trim();
  if(!msg){
    typePreview.textContent="Write something first 🙂";
    return;
  }
  typewriter(msg + "\n\n— Alen");
});

/* MIC BLOW DETECTION */
let audioContext, analyser, micStream;
let dataArray;
let micEnabled=false;
let blowStreak=0;

function getRMS(samples){
  let sum=0;
  for(let i=0;i<samples.length;i++){
    const v=(samples[i]-128)/128;
    sum += v*v;
  }
  return Math.sqrt(sum/samples.length);
}

async function enableMic(){
  try{
    micStream = await navigator.mediaDevices.getUserMedia({audio:true});
    audioContext = new (window.AudioContext||window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;

    const source = audioContext.createMediaStreamSource(micStream);
    source.connect(analyser);

    dataArray = new Uint8Array(analyser.fftSize);
    micEnabled=true;

    startMicBtn.textContent="🎙 Mic Enabled (Blow Now)";
    startMicBtn.disabled=true;

    listenLoop();
  }catch(err){
    alert("Mic not allowed. Use Live Server + allow mic permission.");
    console.log(err);
  }
}

function listenLoop(){
  if(!micEnabled) return;

  analyser.getByteTimeDomainData(dataArray);
  const rms = getRMS(dataArray);
  const power = Math.min(1, rms*7);

  meterFill.style.width = `${Math.floor(power*100)}%`;

  if(power > 0.22){
    blowStreak++;
    if(blowStreak % 6 === 0){
      blowOne();
    }
  }else{
    blowStreak = Math.max(0, blowStreak-1);
  }

  if(allOut()){
    openLetter();
    confettiBurst();
  }else{
    requestAnimationFrame(listenLoop);
  }
}

startMicBtn.addEventListener("click", enableMic);
relightBtn.addEventListener("click", ()=>{
  relight();
  meterFill.style.width="0%";
  if(micEnabled) requestAnimationFrame(listenLoop);
});

/* CONFETTI */
function resizeCanvas(){
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
}
resizeCanvas();
addEventListener("resize", resizeCanvas);

let pieces=[];
let running=false;

function spawn(){
  pieces=[];
  for(let i=0;i<200;i++){
    pieces.push({
      x: Math.random()*canvas.width,
      y: -Math.random()*canvas.height*0.3,
      vx:(-2+Math.random()*4)*devicePixelRatio,
      vy:(3+Math.random()*7)*devicePixelRatio,
      r:4+Math.random()*8,
      life:250+Math.random()*200,
      rot:Math.random()*Math.PI,
      vr:(-0.2+Math.random()*0.4)
    });
  }
}

function draw(){
  if(!running) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  for(const p of pieces){
    p.x+=p.vx;
    p.y+=p.vy;
    p.rot+=p.vr;
    p.life--;

    ctx.save();
    ctx.translate(p.x,p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = Math.max(0,p.life/300);
    ctx.fillStyle = `hsl(${Math.random()*360},95%,60%)`;
    ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r*1.6);
    ctx.restore();
  }

  pieces = pieces.filter(p=>p.life>0 && p.y<canvas.height+50);
  if(pieces.length===0){
    running=false;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    return;
  }
  requestAnimationFrame(draw);
}

function confettiBurst(){
  running=true;
  spawn();
  draw();
}

confettiBtn.addEventListener("click", confettiBurst);

