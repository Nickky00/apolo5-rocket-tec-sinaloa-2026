const menuToggle=document.getElementById('menuToggle');
const mainNav=document.getElementById('mainNav');
menuToggle.addEventListener('click',()=>{const open=mainNav.classList.toggle('open');menuToggle.setAttribute('aria-expanded',String(open));menuToggle.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');});
mainNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mainNav.classList.remove('open');menuToggle.setAttribute('aria-expanded','false');}));
const progress=document.getElementById('scrollProgress');
function updateProgress(){const max=document.documentElement.scrollHeight-window.innerHeight;progress.style.width=`${max>0?window.scrollY/max*100:0}%`;}
window.addEventListener('scroll',updateProgress,{passive:true});updateProgress();
const sections=document.querySelectorAll('main section[id]');const navLinks=document.querySelectorAll('.main-nav a');
if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)navLinks.forEach(link=>link.classList.toggle('active',link.getAttribute('href')===`#${entry.target.id}`));}),{rootMargin:'-35% 0px -55% 0px'});sections.forEach(section=>observer.observe(section));}
// 07:00 in Culiacán, UTC-07:00. Fixed offset makes the target unambiguous.
const launchAt=new Date('2026-12-02T07:00:00-07:00').getTime();
const units={days:document.getElementById('days'),hours:document.getElementById('hours'),minutes:document.getElementById('minutes'),seconds:document.getElementById('seconds')};
const status=document.getElementById('countdownStatus');
function tick(){let diff=launchAt-Date.now();if(diff<=0){Object.values(units).forEach(el=>el.textContent='00');status.textContent=diff<0?'LANZAMIENTO PROGRAMADO · HORA OBJETIVO SUPERADA':'¡ES MOMENTO DEL LANZAMIENTO!';return;}const d=Math.floor(diff/86400000);diff%=86400000;const h=Math.floor(diff/3600000);diff%=3600000;const m=Math.floor(diff/60000);const s=Math.floor(diff%60000/1000);units.days.textContent=String(d).padStart(2,'0');units.hours.textContent=String(h).padStart(2,'0');units.minutes.textContent=String(m).padStart(2,'0');units.seconds.textContent=String(s).padStart(2,'0');}
tick();setInterval(tick,1000);
// Ambiente de misión sintetizado con Web Audio API. Requiere un clic del usuario.
const soundButton=document.getElementById('soundToggle');
const soundNote=document.querySelector('.sound-note');
let audioContext=null, masterGain=null, soundNodes=[], soundOn=false, stopping=false;
async function startAmbience(){
  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtx) throw new Error('Este navegador no admite Web Audio.');
  audioContext=new AudioCtx();
  // Llamar resume dentro del gesto del usuario evita que el contexto quede suspendido.
  const resumePromise=audioContext.resume();
  masterGain=audioContext.createGain();
  masterGain.gain.setValueAtTime(0.0001,audioContext.currentTime);
  masterGain.connect(audioContext.destination);

  // Ruido filtrado para crear un ambiente continuo, en lugar de dos tonos casi inaudibles.
  const length=audioContext.sampleRate*3;
  const noiseBuffer=audioContext.createBuffer(1,length,audioContext.sampleRate);
  const channel=noiseBuffer.getChannelData(0);
  for(let i=0;i<length;i++) channel[i]=(Math.random()*2-1)*0.7;
  const noise=audioContext.createBufferSource();
  noise.buffer=noiseBuffer; noise.loop=true;
  const noiseFilter=audioContext.createBiquadFilter();
  noiseFilter.type='lowpass'; noiseFilter.frequency.value=420; noiseFilter.Q.value=0.7;
  const noiseGain=audioContext.createGain(); noiseGain.gain.value=0.24;
  noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(masterGain); noise.start();

  const rumble=audioContext.createOscillator(); rumble.type='sine'; rumble.frequency.value=58;
  const rumbleGain=audioContext.createGain(); rumbleGain.gain.value=0.16;
  rumble.connect(rumbleGain); rumbleGain.connect(masterGain); rumble.start();

  const hum=audioContext.createOscillator(); hum.type='triangle'; hum.frequency.value=92;
  const humGain=audioContext.createGain(); humGain.gain.value=0.045;
  hum.connect(humGain); humGain.connect(masterGain); hum.start();
  soundNodes=[noise,rumble,hum];
  await resumePromise;
  if(audioContext.state!=='running') throw new Error('El navegador mantuvo el audio pausado.');
  masterGain.gain.setTargetAtTime(0.42,audioContext.currentTime,0.45);
}
async function stopAmbience(){
  if(!audioContext||stopping)return;
  stopping=true;
  const ctx=audioContext, gain=masterGain, nodes=[...soundNodes];
  gain.gain.setTargetAtTime(0.0001,ctx.currentTime,0.18);
  await new Promise(resolve=>setTimeout(resolve,850));
  nodes.forEach(node=>{try{node.stop();}catch(e){}});
  try{await ctx.close();}catch(e){}
  if(audioContext===ctx){audioContext=null;masterGain=null;soundNodes=[];}
  stopping=false;
}
soundButton.addEventListener('click',async()=>{
  if(soundOn){
    soundOn=false;
    soundButton.setAttribute('aria-pressed','false');
    soundButton.innerHTML='<span class="sound-icon">♫</span> ACTIVAR AMBIENTE DE MISIÓN';
    if(soundNote)soundNote.textContent='Audio ambiental apagado.';
    await stopAmbience();
    return;
  }
  soundButton.disabled=true;
  if(soundNote)soundNote.textContent='Iniciando ambiente de misión…';
  try{
    await startAmbience();
    soundOn=true;
    soundButton.setAttribute('aria-pressed','true');
    soundButton.innerHTML='<span class="sound-icon">♫</span> DESACTIVAR AMBIENTE DE MISIÓN';
    if(soundNote)soundNote.textContent='Ambiente de misión activo · Ajusta el volumen de tu dispositivo.';
  }catch(error){
    console.error('No fue posible iniciar el ambiente de misión:',error);
    if(audioContext){try{await audioContext.close();}catch(e){}}
    audioContext=null;masterGain=null;soundNodes=[];soundOn=false;
    if(soundNote)soundNote.textContent='No se pudo iniciar el audio. Prueba en otro navegador o revisa sus permisos de sonido.';
    soundButton.setAttribute('aria-pressed','false');
    soundButton.innerHTML='<span class="sound-icon">♫</span> INTENTAR DE NUEVO';
  }finally{soundButton.disabled=false;}
});

// Secuencia interactiva de lanzamiento visual (sin efectos peligrosos ni descargas externas).
const launchDemo=document.getElementById('launchDemo');
const rocketStage=document.getElementById('rocketStage');
const rocketState=document.getElementById('rocketState');
const rocketAltitude=document.getElementById('rocketAltitude');
const rocketSequence=document.getElementById('rocketSequence');
let launchTimer=null;
launchDemo?.addEventListener('click',()=>{
  if(launchTimer) clearInterval(launchTimer);
  rocketStage.classList.remove('launching');
  void rocketStage.offsetWidth;
  rocketStage.classList.add('launching');
  launchDemo.disabled=true;
  launchDemo.innerHTML='SECUENCIA EN CURSO <span>↗</span>';
  rocketState.textContent='ASCENSO SIMULADO';
  let elapsed=0;
  launchTimer=setInterval(()=>{
    elapsed++;
    rocketSequence.textContent=`00:${String(elapsed).padStart(2,'0')}`;
    rocketAltitude.textContent=`${Math.min(120,elapsed*12).toString().padStart(3,'0')} KM`;
    if(elapsed>=6){
      clearInterval(launchTimer);launchTimer=null;
      rocketState.textContent='SECUENCIA COMPLETADA';
      rocketAltitude.textContent='120 KM';
      launchDemo.disabled=false;
      launchDemo.innerHTML='REPETIR SECUENCIA <span>↻</span>';
    }
  },1000);
});
