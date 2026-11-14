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
// Música cinematográfica original + clics de reloj, sintetizados con Web Audio API.
// No requiere archivos externos ni descargas; el usuario inicia el audio con un clic.
const soundButton=document.getElementById('soundToggle');
const soundNote=document.querySelector('.sound-note');
let audioContext=null, masterGain=null, soundNodes=[], soundOn=false, stopping=false;
let musicTimer=null, clockTimer=null, musicStep=0, chordStep=0;
const progression=[
  [261.63,329.63,392.00], // C
  [196.00,246.94,293.66], // G
  [220.00,261.63,329.63], // Am
  [174.61,220.00,261.63]  // F
];
function keepNode(node){soundNodes.push(node);return node;}
function playTone(freq,when,duration,{type='sine',volume=0.08,attack=0.04,release=0.25,detune=0}={}){
  const osc=keepNode(audioContext.createOscillator());
  const gain=audioContext.createGain();
  osc.type=type;osc.frequency.setValueAtTime(freq,when);osc.detune.setValueAtTime(detune,when);
  gain.gain.setValueAtTime(0.0001,when);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002,volume),when+attack);
  gain.gain.setTargetAtTime(0.0001,when+Math.max(attack,duration-release),Math.max(0.035,release/3));
  osc.connect(gain);gain.connect(masterGain);
  osc.start(when);osc.stop(when+duration+0.12);
}
function playClockClick(){
  if(!audioContext||!masterGain||audioContext.state!=='running')return;
  const now=audioContext.currentTime;
  // Dos componentes breves para un clic digital nítido, no un ruido de motor.
  playTone(1850,now,0.055,{type:'square',volume:0.035,attack:0.003,release:0.035});
  playTone(1150,now+0.018,0.045,{type:'sine',volume:0.025,attack:0.002,release:0.03});
}
function playMusicBeat(){
  if(!audioContext||audioContext.state!=='running')return;
  const now=audioContext.currentTime+0.025;
  const chord=progression[chordStep];
  // Capa de acordes amplia y cálida: sensación cinematográfica e inspiradora.
  if(musicStep%8===0){
    chord.forEach((freq,i)=>{
      playTone(freq/2,now,3.7,{type:'sine',volume:0.045,attack:0.8,release:1.0,detune:i===1?4:-3});
      playTone(freq,now,3.5,{type:'triangle',volume:0.022,attack:0.65,release:0.9,detune:i===2?3:0});
    });
    chordStep=(chordStep+1)%progression.length;
  }
  // Arpegio ascendente que aporta movimiento y expectativa.
  const activeChord=progression[(chordStep+progression.length-1)%progression.length];
  const pattern=[0,1,2,1,2,1,0,1];
  const note=activeChord[pattern[musicStep%pattern.length]]*2;
  playTone(note,now,0.42,{type:'triangle',volume:0.055,attack:0.012,release:0.18});
  // Pulso grave suave cada dos segundos, como un latido de banda sonora.
  if(musicStep%4===0){
    const bass=keepNode(audioContext.createOscillator());const g=audioContext.createGain();
    bass.type='sine';bass.frequency.setValueAtTime(82,now);bass.frequency.exponentialRampToValueAtTime(42,now+0.24);
    g.gain.setValueAtTime(0.0001,now);g.gain.exponentialRampToValueAtTime(0.11,now+0.018);g.gain.exponentialRampToValueAtTime(0.0001,now+0.42);
    bass.connect(g);g.connect(masterGain);bass.start(now);bass.stop(now+0.45);
  }
  musicStep++;
}
async function startAmbience(){
  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtx)throw new Error('Este navegador no admite Web Audio.');
  audioContext=new AudioCtx();
  const resumePromise=audioContext.resume();
  masterGain=audioContext.createGain();
  masterGain.gain.setValueAtTime(0.0001,audioContext.currentTime);
  masterGain.connect(audioContext.destination);
  await resumePromise;
  if(audioContext.state!=='running')throw new Error('El navegador mantuvo el audio pausado.');
  // Volumen perceptible, con margen para evitar saturación.
  masterGain.gain.setTargetAtTime(0.78,audioContext.currentTime,0.35);
  musicStep=0;chordStep=0;
  playMusicBeat();playClockClick();
  musicTimer=setInterval(playMusicBeat,500); // tempo aproximado: 120 BPM
  clockTimer=setInterval(playClockClick,1000);
}
async function stopAmbience(){
  if(!audioContext||stopping)return;
  stopping=true;
  if(musicTimer){clearInterval(musicTimer);musicTimer=null;}
  if(clockTimer){clearInterval(clockTimer);clockTimer=null;}
  const ctx=audioContext,gain=masterGain,nodes=[...soundNodes];
  gain.gain.setTargetAtTime(0.0001,ctx.currentTime,0.16);
  await new Promise(resolve=>setTimeout(resolve,750));
  nodes.forEach(node=>{try{node.stop();}catch(e){}});
  try{await ctx.close();}catch(e){}
  if(audioContext===ctx){audioContext=null;masterGain=null;soundNodes=[];}
  stopping=false;
}
soundButton.addEventListener('click',async()=>{
  if(soundOn){
    soundOn=false;soundButton.setAttribute('aria-pressed','false');
    soundButton.innerHTML='<span class="sound-icon">♫</span> ACTIVAR MÚSICA Y RELOJ';
    if(soundNote)soundNote.textContent='Música y clics del reloj desactivados.';
    await stopAmbience();return;
  }
  soundButton.disabled=true;
  if(soundNote)soundNote.textContent='Iniciando banda sonora de misión…';
  try{
    await startAmbience();soundOn=true;soundButton.setAttribute('aria-pressed','true');
    soundButton.innerHTML='<span class="sound-icon">♫</span> DESACTIVAR MÚSICA Y RELOJ';
    if(soundNote)soundNote.textContent='Banda sonora y reloj activos · Ajusta el volumen de tu dispositivo.';
  }catch(error){
    console.error('No fue posible iniciar el audio:',error);
    if(musicTimer){clearInterval(musicTimer);musicTimer=null;}
    if(clockTimer){clearInterval(clockTimer);clockTimer=null;}
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
