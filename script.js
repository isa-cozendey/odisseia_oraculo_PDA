    /* =========================================================================
       1. SINTETIZADOR DE ÁUDIO PROCEDURAL (WEB AUDIO API - ESTILO ALTO'S ODYSSEY)
       ========================================================================= */
    let audioCtx = null;
    let isAudioEnabled = false;
    let ambientInterval = null;
    let masterGain = null;
    let ambientGain = null;
    let ambientSources = [];

    function initAudio() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.25;
        masterGain.connect(audioCtx.destination);
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }

    function toggleAudio() {
      initAudio();
      isAudioEnabled = !isAudioEnabled;
      const icon = document.getElementById('audio-icon');
      const label = document.getElementById('audio-label');

      if (isAudioEnabled) {
        icon.textContent = '🔊';
        label.textContent = 'Som Ambiente: On';
        startAmbientMusic();
        playSfx('crystal');
      } else {
        icon.textContent = '🔇';
        label.textContent = 'Som Ambiente: Off';
        stopAmbientMusic();
      }
    }

    function startAmbientMusic() {
      if (!audioCtx || !masterGain || ambientGain) return;
      const now = audioCtx.currentTime;
      const bus = audioCtx.createGain();
      const compressor = audioCtx.createDynamicsCompressor();
      ambientGain = bus;
      bus.gain.setValueAtTime(0.0001, now);
      bus.gain.exponentialRampToValueAtTime(1, now + 3);
      compressor.threshold.value = -18;
      compressor.knee.value = 12;
      compressor.ratio.value = 8;
      compressor.attack.value = 0.01;
      compressor.release.value = 0.25;
      bus.connect(compressor);
      compressor.connect(audioCtx.destination);

      const addDrone = (frequency, type, volume) => {
        const oscillator = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        filter.type = 'lowpass';
        filter.frequency.value = 300;
        gain.gain.value = volume;
        oscillator.connect(filter);
        filter.connect(gain);
        gain.connect(bus);
        oscillator.start(now);
        return oscillator;
      };

      const drones = [
        addDrone(55, 'sine', 0.24),
        addDrone(58.27, 'triangle', 0.16),
        addDrone(82.41, 'sine', 0.12),
        addDrone(110, 'triangle', 0.08)
      ];

      ambientSources = drones;

      const delay = audioCtx.createDelay(1.5);
      const echoGain = audioCtx.createGain();
      delay.delayTime.value = 0.72;
      echoGain.gain.value = 0.24;
      delay.connect(echoGain);
      echoGain.connect(bus);

      const notes = [130.81, 138.59, 155.56, 164.81, 207.65];
      const playEerieNote = () => {
        if (!isAudioEnabled || !audioCtx || !ambientGain) return;
        const noteTime = audioCtx.currentTime;
        const oscillator = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        oscillator.type = 'triangle';
        oscillator.frequency.value = notes[Math.floor(Math.random() * notes.length)];
        filter.type = 'lowpass';
        filter.frequency.value = 500;
        gain.gain.setValueAtTime(0.0001, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.2, noteTime + 2.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 9);
        oscillator.connect(filter);
        filter.connect(gain);
        gain.connect(bus);
        gain.connect(delay);
        oscillator.start(noteTime);
        oscillator.stop(noteTime + 9.1);
      };

      playEerieNote();
      ambientInterval = setInterval(playEerieNote, 7800);
    }

    function stopAmbientMusic() {
      if (ambientInterval) {
        clearInterval(ambientInterval);
        ambientInterval = null;
      }
      if (!ambientGain || !audioCtx) return;

      const bus = ambientGain;
      const sources = ambientSources;
      ambientSources = [];
      const now = audioCtx.currentTime;
      bus.gain.cancelScheduledValues(now);
      bus.gain.setTargetAtTime(0.0001, now, 0.25);
      ambientGain = null;
      setTimeout(() => {
        sources.forEach(source => {
          source.stop();
          source.disconnect();
        });
        bus.disconnect();
      }, 1200);
    }

    // Efeitos Sonoros para cada ação do jogo e do PDA
    function playSfx(type) {
      if (!isAudioEnabled || !audioCtx) return;
      const now = audioCtx.currentTime;

      const tone = (freq, dur, wave = 'sine', vol = 0.14, slideTo = null) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = wave;
        osc.frequency.setValueAtTime(freq, now);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + dur);

        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + dur);
      };

      switch (type) {
        case 'step':
          tone(140, 0.08, 'triangle', 0.05, 90);
          break;
        case 'crystal': // * empilha A
          tone(587.33, 0.35, 'sine', 0.14, 880);
          setTimeout(() => isAudioEnabled && tone(1174.66, 0.4, 'sine', 0.09), 70);
          break;
        case 'key': // a empilha X
          tone(440, 0.25, 'triangle', 0.14, 659.25);
          setTimeout(() => isAudioEnabled && tone(880, 0.35, 'sine', 0.1), 60);
          break;
        case 'pop': // s ou b desempilha
          tone(523.25, 0.28, 'sine', 0.14, 261.63);
          break;
        case 'barrier':
          tone(740, 0.22, 'triangle', 0.12, 370);
          break;
        case 'gate':
          tone(196, 0.16, 'square', 0.08, 130.81);
          setTimeout(() => isAudioEnabled && tone(392, 0.12, 'triangle', 0.07), 90);
          break;
        case 'accept': // c chega em q6
          [523.25, 659.25, 783.99, 1046.50].forEach((f, idx) => {
            setTimeout(() => isAudioEnabled && tone(f, 0.65, 'sine', 0.13), idx * 95);
          });
          break;
        case 'reject': // Erro / Rejeição
          tone(185, 0.45, 'sawtooth', 0.12, 110);
          setTimeout(() => isAudioEnabled && tone(146.83, 0.5, 'triangle', 0.12, 98), 110);
          break;
      }
    }

    /* =========================================================================
       2. MOTOR FORMAL DO AUTÔMATO COM PILHA (PDA - 7 ESTADOS: q0 A q6)
       ========================================================================= */
    const STATE_DESCRIPTIONS = {
      q0: 'Átrio Inicial',
      q1: 'Galeria dos Cristais',
      q2: 'Corredor Selado',
      q3: 'Salão dos Arcos',
      q4: 'Câmara de Equilíbrio',
      q5: 'Antecâmara do Portal',
      q6: 'Santuário (Final)'
    };

    let phaseIndex = 0;
    const PHASES = [
      {
        title: 'Fase 1 • O Portal Crepuscular', goalSymbol: 'c', alphabet: '*asbc', solution: '*sabc',
        goalName: 'Portal circular',
        stateNames: ['Átrio Inicial', 'Galeria dos Cristais', 'Corredor Selado', 'Salão dos Arcos', 'Câmara de Equilíbrio', 'Antecâmara do Portal', 'Santuário'],
        hints: [
          ['ACEITA', '*sabc', 'Cristal, barreira, chave, arco e portal.'],
          ['ACEITA', '**aabbssc', 'Empilha dois cristais e duas chaves; respeite o LIFO.'],
          ['REJEITA', '*sbc', 'Tenta abrir arco sem chave no topo.'],
          ['REJEITA', '**aabbc', 'Chega ao portal com cristais sobrando.']
        ]
      },
      {
        title: 'Fase 2 • A Câmara das Duas Barreiras', goalSymbol: 'c', alphabet: '*asbc', solution: '*ab*ssc',
        goalName: 'Portal circular',
        stateNames: ['Entrada da Câmara', 'Cristal e Chave', 'Arco Destravado', 'Cristal Recuperado', 'Duas Barreiras', 'Portal Liberado', 'Câmara Superada'],
        hints: [
          ['ACEITA', '*ab*ssc', 'Use a chave, recupere o cristal e abra as duas barreiras.'],
          ['ACEITA', '*aabb*ssc', 'Duas chaves e dois cristais são consumidos em ordem LIFO.'],
          ['REJEITA', '*a*bc', 'Tenta coletar cristal sobre uma chave no topo.'],
          ['REJEITA', '*ab*sc', 'Sobra um cristal antes do portal.']
        ]
      },
      {
        title: 'Fase 3 • O Tesouro do Oráculo', goalSymbol: 't', alphabet: '*asbt', solution: 'a*sbt',
        goalName: 'Baú do Tesouro',
        stateNames: ['Entrada do Tesouro', 'Chave Ancestral', 'Cristal sobre a Chave', 'Poção de Energia', 'Redemoinho Selado', 'Salão do Tesouro', 'Tesouro Encontrado'],
        hints: [
          ['ACEITA', 'a*sbt', 'Empilhe chave e cristal; consuma-os em ordem LIFO antes do baú.'],
          ['ACEITA', 'a**ssbt', 'Dois cristais exigem duas poções/barreiras antes da chave.'],
          ['REJEITA', 'a*bt', 'Tenta usar a chave enquanto o cristal ainda está no topo.'],
          ['REJEITA', 'a*sb*t', 'O roteiro continua depois da transição final.']
        ]
      }
    ];

    const PDA_RULES = [
      [
        { from: 'q0', symbol: '*', top: 'Z0', to: 'q1', operation: 'push', value: 'A', edge: 'edge-q0-q1', sfx: 'crystal', desc: 'Coleta o primeiro cristal.' },
        { from: 'q1', symbol: '*', top: 'A', to: 'q1', operation: 'push', value: 'A', edge: 'edge-q1-q1', sfx: 'crystal', desc: 'Empilha outro cristal.' },
        { from: 'q1', symbol: 'a', top: 'A', to: 'q1', operation: 'push', value: 'X', edge: 'edge-q1-q1', sfx: 'key', desc: 'Empilha uma chave sobre o cristal.' },
        { from: 'q1', symbol: 'a', top: 'X', to: 'q1', operation: 'push', value: 'X', edge: 'edge-q1-q1', sfx: 'key', desc: 'Empilha uma chave sobre outra chave.' },
        { from: 'q1', symbol: 's', top: 'A', to: 'q2', operation: 'pop', edge: 'edge-q1-q2', sfx: 'barrier', desc: 'Consome cristal para abrir a barreira.' },
        { from: 'q1', symbol: 'b', top: 'X', to: 'q3', operation: 'pop', edge: 'edge-q1-q3', sfx: 'gate', desc: 'Consome chave para abrir o arco.' },
        { from: 'q2', symbol: 'a', top: 'Z0', to: 'q3', operation: 'push', value: 'X', edge: 'edge-q2-q3', sfx: 'key', desc: 'Coleta uma chave no corredor.' },
        { from: 'q2', symbol: 'a', top: 'A', to: 'q3', operation: 'push', value: 'X', edge: 'edge-q2-q3', sfx: 'key', desc: 'Empilha chave sobre cristal.' },
        { from: 'q2', symbol: 's', top: 'A', to: 'q2', operation: 'pop', edge: 'edge-q2-q2', sfx: 'barrier', desc: 'Consome outro cristal.' },
        { from: 'q2', symbol: 'b', top: 'X', to: 'q3', operation: 'pop', edge: 'edge-q2-q3', sfx: 'gate', desc: 'Destranca o arco com uma chave.' },
        { from: 'q3', symbol: 'b', top: 'X', to: 'q4', operation: 'pop', edge: 'edge-q3-q4', sfx: 'gate', desc: 'Abre o arco principal.' },
        { from: 'q4', symbol: 'b', top: 'X', to: 'q4', operation: 'pop', edge: 'edge-q4-q4', sfx: 'gate', desc: 'Consome uma chave extra.' },
        { from: 'q4', symbol: 's', top: 'A', to: 'q4', operation: 'pop', edge: 'edge-q4-q4', sfx: 'barrier', desc: 'Consome um cristal extra.' },
        { from: 'q4', symbol: 'λ', top: 'Z0', to: 'q5', operation: 'keep', edge: 'edge-q4-q5', sfx: '', desc: 'Libera o portal com a pilha vazia.' },
        { from: 'q5', symbol: 'c', top: 'Z0', to: 'q6', operation: 'keep', edge: 'edge-q5-q6', sfx: 'accept', desc: 'Atravessa o portal circular.' }
      ],
      [
        { from: 'q0', symbol: '*', top: 'Z0', to: 'q1', operation: 'push', value: 'A', edge: 'edge-q0-q1', sfx: 'crystal', desc: 'Coleta o cristal inicial.' },
        { from: 'q1', symbol: 'a', top: 'A', to: 'q1', operation: 'push', value: 'X', edge: 'edge-q1-q1', sfx: 'key', desc: 'Empilha uma chave sobre o cristal.' },
        { from: 'q1', symbol: 'a', top: 'X', to: 'q1', operation: 'push', value: 'X', edge: 'edge-q1-q1', sfx: 'key', desc: 'Empilha outra chave.' },
        { from: 'q1', symbol: 'b', top: 'X', to: 'q2', operation: 'pop', edge: 'edge-q1-q2', sfx: 'gate', desc: 'Usa a chave para abrir o primeiro arco.' },
        { from: 'q2', symbol: 'b', top: 'X', to: 'q2', operation: 'pop', edge: 'edge-q2-q2', sfx: 'gate', desc: 'Consome uma chave extra no corredor.' },
        { from: 'q2', symbol: '*', top: 'A', to: 'q3', operation: 'push', value: 'A', edge: 'edge-q2-q3', sfx: 'crystal', desc: 'Recupera um cristal na câmara.' },
        { from: 'q3', symbol: 's', top: 'A', to: 'q4', operation: 'pop', edge: 'edge-q3-q4', sfx: 'barrier', desc: 'Abre a primeira barreira.' },
        { from: 'q4', symbol: 's', top: 'A', to: 'q4', operation: 'pop', edge: 'edge-q4-q4', sfx: 'barrier', desc: 'Abre a segunda barreira.' },
        { from: 'q4', symbol: 'λ', top: 'Z0', to: 'q5', operation: 'keep', edge: 'edge-q4-q5', sfx: '', desc: 'Libera o portal após descarregar a pilha.' },
        { from: 'q5', symbol: 'c', top: 'Z0', to: 'q6', operation: 'keep', edge: 'edge-q5-q6', sfx: 'accept', desc: 'Atravessa o portal da câmara.' }
      ],
      [
        { from: 'q0', symbol: 'a', top: 'Z0', to: 'q1', operation: 'push', value: 'X', edge: 'edge-q0-q1', sfx: 'key', desc: 'Coleta a chave ancestral.' },
        { from: 'q1', symbol: '*', top: 'X', to: 'q1', operation: 'push', value: 'A', edge: 'edge-q1-q1', sfx: 'crystal', desc: 'Empilha cristal sobre a chave.' },
        { from: 'q1', symbol: '*', top: 'A', to: 'q1', operation: 'push', value: 'A', edge: 'edge-q1-q1', sfx: 'crystal', desc: 'Empilha outro cristal.' },
        { from: 'q1', symbol: 's', top: 'A', to: 'q2', operation: 'pop', edge: 'edge-q1-q2', sfx: 'barrier', desc: 'Consome cristal na primeira poção.' },
        { from: 'q2', symbol: 's', top: 'A', to: 'q2', operation: 'pop', edge: 'edge-q2-q2', sfx: 'barrier', desc: 'Consome cristal em outra poção.' },
        { from: 'q2', symbol: 'b', top: 'X', to: 'q3', operation: 'pop', edge: 'edge-q2-q3', sfx: 'gate', desc: 'Usa a chave no redemoinho.' },
        { from: 'q3', symbol: 'λ', top: 'Z0', to: 'q4', operation: 'keep', edge: 'edge-q3-q4', sfx: '', desc: 'A pilha vazia libera a passagem.' },
        { from: 'q4', symbol: 'λ', top: 'Z0', to: 'q5', operation: 'keep', edge: 'edge-q4-q5', sfx: '', desc: 'A passagem leva ao salão do tesouro.' },
        { from: 'q5', symbol: 't', top: 'Z0', to: 'q6', operation: 'keep', edge: 'edge-q5-q6', sfx: 'accept', desc: 'Abre o baú do tesouro.' }
      ]
    ];

    function getCurrentPhase() {
      return PHASES[phaseIndex];
    }

    const PHASE_GRAPH_LABELS = [
      {
        'edge-q0-q1': '*,Z0;AZ0', 'edge-q1-q1': '*,A;AA | a,A;XA | a,X;XX',
        'edge-q1-q2': 's,A;λ', 'edge-q1-q3': 'b,X;λ', 'edge-q2-q2': 's,A;λ',
        'edge-q2-q3': 'a,Z0;XZ0 | a,A;XA | b,X;λ', 'edge-q3-q4': 'b,X;λ',
        'edge-q4-q4': 'b,X;λ | s,A;λ', 'edge-q4-q5': 'λ,Z0;Z0', 'edge-q5-q6': 'c,Z0;Z0'
      },
      {
        'edge-q0-q1': '*,Z0;AZ0', 'edge-q1-q1': 'a,A;XA | a,X;XX',
        'edge-q1-q2': 'b,X;λ', 'edge-q2-q2': 'b,X;λ', 'edge-q2-q3': '*,A;AA',
        'edge-q3-q4': 's,A;λ', 'edge-q4-q4': 's,A;λ', 'edge-q4-q5': 'λ,Z0;Z0', 'edge-q5-q6': 'c,Z0;Z0'
      },
      {
        'edge-q0-q1': 'a,Z0;XZ0', 'edge-q1-q1': '*,X;AX | *,A;AA',
        'edge-q1-q2': 's,A;λ', 'edge-q2-q2': 's,A;λ', 'edge-q2-q3': 'b,X;λ',
        'edge-q3-q4': 'λ,Z0;Z0', 'edge-q4-q5': 'λ,Z0;Z0', 'edge-q5-q6': 't,Z0;Z0'
      }
    ];

    const PHASE_GRAPH_EDGES = [
      ['edge-q0-q1', 'edge-q1-q1', 'edge-q1-q2', 'edge-q1-q3', 'edge-q2-q2', 'edge-q2-q3', 'edge-q3-q4', 'edge-q4-q4', 'edge-q4-q5', 'edge-q5-q6'],
      ['edge-q0-q1', 'edge-q1-q1', 'edge-q1-q2', 'edge-q2-q2', 'edge-q2-q3', 'edge-q3-q4', 'edge-q4-q4', 'edge-q4-q5', 'edge-q5-q6'],
      ['edge-q0-q1', 'edge-q1-q1', 'edge-q1-q2', 'edge-q2-q2', 'edge-q2-q3', 'edge-q3-q4', 'edge-q4-q5', 'edge-q5-q6']
    ];

    function renderPhaseHints() {
      const container = document.getElementById('phase-hints');
      container.innerHTML = '';
      getCurrentPhase().hints.forEach(([result, script, description], index) => {
        const accepted = result === 'ACEITA';
        const button = document.createElement('button');
        button.className = `btn-alto text-left p-2.5 rounded-xl glass-subpanel border flex items-center justify-between gap-2 group ${accepted ? 'hover:bg-emerald-500/15 border-emerald-400/30' : 'hover:bg-rose-500/15 border-rose-400/30'}`;
        button.innerHTML = `<span><span class="px-1.5 py-0.5 text-[10px] font-bold rounded ${accepted ? 'bg-emerald-500/25 text-emerald-300' : 'bg-rose-500/25 text-rose-300'}">${result}</span> <b class="font-mono-code text-sm text-[#fff0e5]">${script}</b><span class="block text-[11px] text-[#fff0e5]/70 mt-1">${index + 1}. ${description}</span></span><span class="${accepted ? 'text-emerald-300' : 'text-rose-300'}">▶</span>`;
        button.addEventListener('click', () => loadPreset(script, true));
        container.appendChild(button);
      });
    }

    function renderPhaseGraph() {
      const labels = PHASE_GRAPH_LABELS[phaseIndex];
      const activeEdges = PHASE_GRAPH_EDGES[phaseIndex];
      Object.keys(PHASE_GRAPH_LABELS[0]).forEach(edgeId => {
        const path = document.getElementById(edgeId);
        const label = document.getElementById(`label-${edgeId}`);
        const active = activeEdges.includes(edgeId);
        path.style.display = active ? '' : 'none';
        label.style.display = labels[edgeId] ? '' : 'none';
        label.textContent = labels[edgeId] || '';
      });
    }

    function renderFormalTable() {
      const body = document.getElementById('transition-table-body');
      body.innerHTML = '';
      PDA_RULES[phaseIndex].forEach(rule => {
        const replacement = rule.operation === 'push' ? `${rule.value}${rule.top}` : rule.operation === 'pop' ? 'λ' : rule.top;
        const row = document.createElement('tr');
        row.innerHTML = `<td class="p-2">${rule.from}</td><td class="p-2 font-bold">${rule.symbol}</td><td class="p-2">${rule.top}</td><td class="p-2">${replacement}</td><td class="p-2">${rule.to}</td><td class="p-2 font-sans">${rule.desc}</td>`;
        body.appendChild(row);
      });
    }

    function updatePhaseUI() {
      const phase = getCurrentPhase();
      document.getElementById('phase-indicator').textContent = `Fase ${phaseIndex + 1}/3 · ${phase.title.split(' • ')[1]}`;
      document.getElementById('goal-symbol').textContent = phase.goalSymbol;
      document.getElementById('goal-name').textContent = phase.goalName;
      document.getElementById('tape-alphabet').textContent = `Σ = {${[...phase.alphabet].join(',')}}`;
      document.getElementById('formal-phase-title').textContent = `Definição Formal da Fase ${phaseIndex + 1}: M = (Q, Σ, Γ, δ, q0, Z0, F)`;
      document.getElementById('formal-alphabet').textContent = `{${[...phase.alphabet].join(', ')}}`;
      document.getElementById('graph-phase-label').textContent = `Fase ${phaseIndex + 1} • 7 Estados • F = {q6}`;
      document.getElementById('tape-input').placeholder = `Digite símbolos: ${phase.alphabet} (ex: ${phase.solution})`;
      document.getElementById('tape-input').value = phase.solution;
      document.getElementById('victory-next').textContent = phaseIndex === PHASES.length - 1 ? 'Jogar novamente' : 'Próxima fase';
      renderPhaseHints();
      renderPhaseGraph();
      renderFormalTable();
    }

    const pda = {
      state: 'q0',
      stack: ['Z0'], // Topo é o último elemento do array: stack[stack.length - 1]
      status: 'RUNNING', // RUNNING | ACCEPTED | REJECTED
      lastEdge: null,
      history: []
    };

    function resetPDA() {
      pda.state = 'q0';
      pda.stack = ['Z0'];
      pda.status = 'RUNNING';
      pda.lastEdge = null;
      pda.history = [];
      updatePDAUI('Autômato reiniciado em <b>q0</b> com pilha <b>[Z0]</b>.');
    }

    function findTransition(state, symbol, top) {
      return PDA_RULES[phaseIndex].find(rule => rule.from === state && rule.symbol === symbol && rule.top === top);
    }

    function applyStackOperation(rule) {
      if (rule.operation === 'push') pda.stack.push(rule.value);
      if (rule.operation === 'pop') pda.stack.pop();
    }

    function applyEpsilonTransitions() {
      const applied = [];
      while (true) {
        const top = pda.stack[pda.stack.length - 1];
        const rule = findTransition(pda.state, 'λ', top);
        if (!rule) break;
        applyStackOperation(rule);
        pda.state = rule.to;
        pda.lastEdge = rule.edge;
        applied.push(rule);
      }
      return applied;
    }

    function stepPDA(symbol) {
      if (pda.status === 'REJECTED') {
        return { ok: false, reason: 'O autômato já está em estado de REJEIÇÃO. Reinicie para testar novamente.' };
      }
      if (pda.status === 'ACCEPTED') {
        pda.status = 'REJECTED';
        pda.lastEdge = null;
        updatePDAUI(`<b>REJEITADA:</b> Símbolo extra '<b>${symbol}</b>' lido após atingir o estado final <b>q6</b>.`);
        playSfx('reject');
        showRestartConfirmation();
        return { ok: false, reason: 'Símbolo extra após estado final.' };
      }

      const top = pda.stack[pda.stack.length - 1];
      const prevState = pda.state;
      const rule = findTransition(prevState, symbol, top);
      if (!rule) {
        pda.status = 'REJECTED';
        pda.lastEdge = null;
        const reason = explainRejection(prevState, symbol, top);
        updatePDAUI(`<b>SEQUÊNCIA REJEITADA:</b> ${reason}`, symbol, 'Bloqueado');
        playSfx('reject');
        showRestartConfirmation();
        return { ok: false, reason };
      }

      applyStackOperation(rule);
      pda.state = rule.to;
      pda.lastEdge = rule.edge;
      let actionDesc = rule.desc;
      const didEpsilon = applyEpsilonTransitions();
      didEpsilon.forEach(epsilonRule => {
        actionDesc += ` Transição espontânea <b>λ: ${epsilonRule.from} → ${epsilonRule.to}</b>. ${epsilonRule.desc}`;
      });

      if (pda.state === 'q6') {
        pda.status = 'ACCEPTED';
      }

      if (rule.sfx) playSfx(rule.sfx);
      updatePDAUI(`δ(${prevState}, <b>${symbol}</b>, ${top}) → <b>${pda.state}</b>. ${actionDesc}`, symbol, getSymbolShortName(symbol));
      if (pda.status === 'ACCEPTED') showVictoryModal();

      return { ok: true };
    }

    function explainRejection(state, symbol, top) {
      if (symbol === 'b' && top !== 'X') {
        return `Tentativa de abrir Arco (<b>b</b>), mas o topo da pilha é <b>${top}</b> (exige Chave <b>X</b> no topo - regra LIFO).`;
      }
      if (symbol === 's' && top !== 'A') {
        return `Tentativa de dissipar Barreira (<b>s</b>), mas o topo da pilha é <b>${top}</b> (exige Cristal <b>A</b> no topo - regra LIFO).`;
      }
      if (symbol === getCurrentPhase().goalSymbol && top !== 'Z0') {
        return `Tentativa de alcançar o objetivo (<b>${symbol}</b>), mas ainda restam itens na pilha (topo = <b>${top}</b>, exige <b>Z0</b>).`;
      }
      if (symbol === getCurrentPhase().goalSymbol && state !== 'q5') {
        return `Você tentou alcançar o objetivo (<b>${symbol}</b>) estando em <b>${state}</b>, antes de concluir os desafios anteriores.`;
      }
      return `Não existe transição definida para δ(${state}, '${symbol}', ${top}).`;
    }

    function getSymbolShortName(sym) {
      const map = { '*': 'Cristal (+A)', 'a': 'Chave (+X)', 's': 'Poção (-A)', 'b': 'Redemoinho (-X)', 'c': 'Portal (Z0)', 't': 'Baú do Tesouro' };
      return map[sym] || sym;
    }

    /* =========================================================================
       3. ATUALIZAÇÃO DA INTERFACE VISUAL (GRAFO SVG, TUBO DA PILHA E TELEMETRIA)
       ========================================================================= */
    function updatePDAUI(logHtml, currentSym = '—', actionLabel = 'Aguardando') {
      // 1. Telemetria textual
      document.getElementById('telemetry-state').textContent = pda.state;
      const stateIndex = Number(pda.state.slice(1));
      document.getElementById('telemetry-state-name').textContent = getCurrentPhase().stateNames[stateIndex] || '';
      document.getElementById('telemetry-symbol').textContent = currentSym;
      document.getElementById('telemetry-action').textContent = actionLabel;

      const reversedStack = [...pda.stack].reverse();
      document.getElementById('telemetry-stack-str').textContent = reversedStack.join(' ');
      document.getElementById('telemetry-top').textContent = pda.stack[pda.stack.length - 1];

      // 2. Log de transição
      const logBox = document.getElementById('transition-log');
      logBox.innerHTML = logHtml;

      // 3. Badge de Status (ACEITA / REJEITADA / EM CURSO)
      const badge = document.getElementById('status-badge');
      if (pda.status === 'ACCEPTED') {
        badge.className = 'px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-emerald-500/25 text-emerald-300 border border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.45)]';
        badge.textContent = '✔ SEQUÊNCIA ACEITA';
        logBox.style.borderLeftColor = '#34d399';
      } else if (pda.status === 'REJECTED') {
        badge.className = 'px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-rose-500/25 text-rose-300 border border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.45)]';
        badge.textContent = '✖ SEQUÊNCIA REJEITADA';
        logBox.style.borderLeftColor = '#fb7185';
      } else {
        badge.className = 'px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-500/20 text-amber-200 border border-amber-400/40';
        badge.textContent = '● EM PROCESSAMENTO';
        logBox.style.borderLeftColor = '#f5a673';
      }

      // 4. Atualizar Grafo SVG (Nós e Arestas)
      ['q0', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6'].forEach(st => {
        const group = document.getElementById(`node-${st}`);
        if (!group) return;
        const circles = group.querySelectorAll('circle');
        const mainCircle = circles[circles.length - 1];

        if (st === pda.state) {
          group.classList.add('node-active');
          mainCircle.setAttribute('fill', pda.status === 'REJECTED' ? '#7f1d1d' : '#d86c70');
          mainCircle.setAttribute('stroke', '#fff0e5');
          mainCircle.setAttribute('stroke-width', '3');
        } else {
          group.classList.remove('node-active');
          mainCircle.setAttribute('fill', st === 'q6' ? '#1e3a34' : '#2d1b3d');
          mainCircle.setAttribute('stroke', st === 'q6' ? '#6ee7b7' : 'rgba(255,240,229,0.45)');
          mainCircle.setAttribute('stroke-width', '2');
        }
      });

      document.querySelectorAll('#pda-graph path[id^="edge-"]').forEach(edge => {
        if (edge.id === pda.lastEdge) {
          edge.setAttribute('stroke', '#f5a673');
          edge.setAttribute('stroke-width', '3');
          edge.setAttribute('marker-end', 'url(#arrow-active)');
        } else {
          edge.setAttribute('stroke', 'rgba(255,240,229,0.32)');
          edge.setAttribute('stroke-width', '1.8');
          edge.setAttribute('marker-end', 'url(#arrow)');
        }
      });

      // 5. Renderizar Tubo da Pilha LIFO
      renderStackTube();
    }

    function renderStackTube() {
      const tube = document.getElementById('stack-tube');
      tube.innerHTML = '';

      pda.stack.forEach((item, index) => {
        const isTop = index === pda.stack.length - 1;
        const div = document.createElement('div');

        let styleClass = 'bg-white/15 border-white/30 text-[#fff0e5]';
        let label = 'Z0 • Base';
        if (item === 'A') {
          styleClass = 'bg-gradient-to-r from-amber-500/35 to-orange-400/35 border-amber-300/60 text-amber-100';
          label = 'A • Cristal';
        } else if (item === 'X') {
          styleClass = 'bg-gradient-to-r from-cyan-500/35 to-purple-500/35 border-cyan-300/60 text-cyan-100';
          label = 'X • Chave';
        }

        div.className = `stack-item-enter px-2.5 py-1.5 rounded-lg border font-mono-code text-xs font-bold flex items-center justify-between ${styleClass} ${isTop ? 'ring-2 ring-[#f5a673]' : 'opacity-85'}`;
        div.innerHTML = `
          <span>${label}</span>
          ${isTop ? '<span class="text-[9px] px-1.5 py-0.2 rounded bg-[#f5a673] text-[#211832] font-extrabold">TOPO</span>' : ''}
        `;
        tube.appendChild(div);
      });
    }

    /* =========================================================================
       4. SIMULADOR DE ROTEIRO (FITA DE ENTRADA, STEP-BY-STEP E 4 EXEMPLOS)
       ========================================================================= */
    let simTimer = null;
    let simIndex = 0;
    let simFailedIndex = -1;
    let currentTape = '';

    function sanitizeTapeInput(inputEl) {
      inputEl.value = [...inputEl.value].filter(symbol => getCurrentPhase().alphabet.includes(symbol)).join('');
      currentTape = inputEl.value;
      simIndex = 0;
      simFailedIndex = -1;
      renderTapeVisual();
    }

    function renderTapeVisual() {
      const container = document.getElementById('tape-visual');
      const counter = document.getElementById('tape-counter');
      currentTape = document.getElementById('tape-input').value;

      counter.textContent = `${Math.min(simIndex, currentTape.length)} / ${currentTape.length} símbolos lidos`;
      container.innerHTML = '';

      if (!currentTape.length) {
        container.innerHTML = '<span class="text-xs text-[#fff0e5]/40 italic px-2">Fita vazia. Caminhe com WASD ou digite símbolos...</span>';
        return;
      }

      [...currentTape].forEach((ch, idx) => {
        const cell = document.createElement('div');
        let stateClass = 'bg-white/10 border-white/20 text-[#fff0e5]';
        if (idx === simFailedIndex) {
          stateClass = 'bg-rose-500/30 border-rose-300 text-rose-100 shadow-[0_0_12px_rgba(251,113,133,0.6)]';
        } else if (idx < simIndex) {
          stateClass = 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 opacity-70';
        } else if (idx === simIndex) {
          stateClass = 'bg-[#f5a673] border-[#fff0e5] text-[#211832] scale-110 shadow-md font-extrabold';
        }

        cell.className = `w-8 h-8 shrink-0 rounded-lg border font-mono-code text-sm flex items-center justify-center transition-all ${stateClass}`;
        cell.textContent = ch;
        container.appendChild(cell);
      });
    }

    function stopSimulationTimer() {
      if (simTimer) {
        clearInterval(simTimer);
        simTimer = null;
      }
    }

    function loadPreset(scriptStr, autoStart = false) {
      if (pda.status === 'REJECTED') {
        requestRestart(() => applyPreset(scriptStr, autoStart));
        return;
      }
      applyPreset(scriptStr, autoStart);
    }

    function applyPreset(scriptStr, autoStart) {
      stopSimulationTimer();
      document.getElementById('tape-input').value = scriptStr;
      currentTape = scriptStr;
      simIndex = 0;
      simFailedIndex = -1;
      resetPDA();
      resetMapObjects();
      renderTapeVisual();

      if (autoStart) {
        runScriptSimulation();
      }
    }

    function runScriptSimulation() {
      stopSimulationTimer();
      currentTape = document.getElementById('tape-input').value.trim();
      if (!currentTape) return;

      if (pda.status === 'REJECTED') {
        requestRestart(() => {
          simIndex = 0;
          simFailedIndex = -1;
          resetPDA();
          resetMapObjects();
          beginScriptSimulation();
        });
        return;
      }
      if (pda.status === 'ACCEPTED') {
        simIndex = 0;
        simFailedIndex = -1;
        resetPDA();
        resetMapObjects();
      }
      if (simIndex >= currentTape.length) {
        simIndex = 0;
        simFailedIndex = -1;
        resetPDA();
        resetMapObjects();
      }

      beginScriptSimulation();
    }

    function beginScriptSimulation() {
      renderTapeVisual();
      const speed = parseInt(document.getElementById('sim-speed').value, 10) || 500;

      simTimer = setInterval(() => {
        const keepGoing = executeNextTapeSymbol();
        if (!keepGoing) {
          stopSimulationTimer();
        }
      }, speed);
    }

    function stepScriptSimulation() {
      stopSimulationTimer();
      currentTape = document.getElementById('tape-input').value.trim();
      if (!currentTape) return;

      if (pda.status === 'REJECTED') {
        requestRestart(() => {
          simIndex = 0;
          simFailedIndex = -1;
          resetPDA();
          resetMapObjects();
          executeNextTapeSymbol();
        });
        return;
      }
      if (pda.status === 'ACCEPTED') {
        simIndex = 0;
        simFailedIndex = -1;
        resetPDA();
        resetMapObjects();
      }
      executeNextTapeSymbol();
    }

    function executeNextTapeSymbol() {
      if (simIndex >= currentTape.length) {
        // Fim da fita: verifica se terminou no estado final q6
        if (pda.status === 'RUNNING') {
          pda.status = 'REJECTED';
          updatePDAUI(`<b>SEQUÊNCIA REJEITADA:</b> A fita terminou no estado <b>${pda.state}</b> sem alcançar o objetivo <b>${getCurrentPhase().goalName}</b> em <b>q6</b>.`);
          playSfx('reject');
          showRestartConfirmation();
        }
        renderTapeVisual();
        return false;
      }

      const sym = currentTape[simIndex];
      const res = stepPDA(sym);
      if (!res.ok) simFailedIndex = simIndex;
      else syncPlayerPositionToSymbol(sym);
      simIndex++;
      renderTapeVisual();

      if (!res.ok) return false;

      // Se leu o último símbolo da fita e não está em q6, rejeita
      if (simIndex === currentTape.length && pda.state !== 'q6') {
        pda.status = 'REJECTED';
        updatePDAUI(`<b>SEQUÊNCIA REJEITADA:</b> Fim do roteiro atingido em <b>${pda.state}</b> com pilha <b>[${[...pda.stack].reverse().join(' ')}]</b>. É necessário chegar em <b>q6</b>.`);
        playSfx('reject');
        showRestartConfirmation();
        return false;
      }

      return pda.state !== 'q6';
    }

    /* =========================================================================
       5. CENÁRIO INTERATIVO DO JOGO (CANVAS GRID + MOVIMENTAÇÃO WASD)
       ========================================================================= */
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const BASE_MAPS = [
      [
        ['#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#'],
        ['#', 'P', '.', '*', '.', 's', '.', 'a', '.', 'b', '#'],
        ['#', '.', '*', '.', '#', '.', '.', '.', '#', '.', '#'],
        ['#', '.', 'a', '.', 'b', '.', 's', '.', '.', 'c', '#'],
        ['#', '.', '.', 'a', '.', '.', 'b', '.', '.', '.', '#'],
        ['#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#']
      ],
      [
        ['#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#'],
        ['#', 'P', '.', '*', '.', 'a', 'a', 'b', '.', 's', '#'],
        ['#', '*', '.', '.', '#', '.', '.', '.', '#', '.', '#'],
        ['#', '.', '.', '.', 'b', '.', 's', '.', '.', 'c', '#'],
        ['#', '.', '.', '.', '.', '.', '.', '.', '.', '.', '#'],
        ['#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#']
      ],
      [
        ['#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#'],
        ['#', 'P', '.', 'a', '.', 's', '.', '*', '.', 'b', '#'],
        ['#', '.', '.', '.', '#', '.', '.', '*', '#', '.', '#'],
        ['#', '.', '.', '.', '.', 's', '.', '.', '.', 't', '#'],
        ['#', '.', '.', '.', '.', '.', '.', '.', '.', '.', '#'],
        ['#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#']
      ]
    ];

    let gridMap = [];
    let scriptSymbolVisits = {};
    let player = { x: 1, y: 1, facing: 1, scarfPhase: 0 };
    let particles = [];

    function resetMapObjects() {
      gridMap = BASE_MAPS[phaseIndex].map(row => [...row]);
      player.x = 1;
      player.y = 1;
      scriptSymbolVisits = {};
    }

    function syncPlayerPositionToSymbol(symbol) {
      const symbolPaths = [
        {
          '*': [{ x: 3, y: 1 }, { x: 2, y: 2 }], 'a': [{ x: 7, y: 1 }, { x: 2, y: 3 }, { x: 3, y: 4 }],
          's': [{ x: 5, y: 1 }, { x: 6, y: 3 }], 'b': [{ x: 9, y: 1 }, { x: 4, y: 3 }, { x: 6, y: 4 }], 'c': [{ x: 9, y: 3 }]
        },
        {
          '*': [{ x: 3, y: 1 }, { x: 1, y: 2 }], 'a': [{ x: 5, y: 1 }, { x: 6, y: 1 }],
          's': [{ x: 9, y: 1 }, { x: 6, y: 3 }], 'b': [{ x: 7, y: 1 }, { x: 4, y: 3 }], 'c': [{ x: 9, y: 3 }]
        },
        {
          'a': [{ x: 3, y: 1 }], '*': [{ x: 7, y: 1 }, { x: 7, y: 2 }],
          's': [{ x: 5, y: 1 }, { x: 5, y: 3 }], 'b': [{ x: 9, y: 1 }], 't': [{ x: 9, y: 3 }]
        }
      ][phaseIndex];
      const path = symbolPaths[symbol];
      if (!path) return;

      const visit = scriptSymbolVisits[symbol] || 0;
      const destination = path[visit % path.length];
      scriptSymbolVisits[symbol] = visit + 1;
      player.x = destination.x;
      player.y = destination.y;
      if (symbol !== getCurrentPhase().goalSymbol && gridMap[destination.y][destination.x] === symbol) {
        gridMap[destination.y][destination.x] = '.';
      }
      spawnParticles(player.x, player.y, symbol === 'c' ? '#6ee7b7' : '#f5a673');
    }

    function spawnParticles(gx, gy, color) {
      for (let i = 0; i < 14; i++) {
        particles.push({
          gx: gx + 0.5,
          gy: gy + 0.5,
          vx: (Math.random() - 0.5) * 0.08,
          vy: (Math.random() - 0.5) * 0.08,
          life: 1.0,
          color
        });
      }
    }

    // Movimentação via Teclas WASD / Setas / Botões na tela
    function handleMoveInput(dx, dy) {
      stopSimulationTimer();
      if (dx !== 0) player.facing = dx;

      // Se o jogo já terminou (ACEITA ou REJEITADA), reinicia ao andar
      if (pda.status === 'REJECTED') {
        requestRestart(() => {
          performResetAll();
          handleMoveInput(dx, dy);
        });
        return;
      }
      if (pda.status === 'ACCEPTED') {
        performResetAll();
      }

      const nx = player.x + dx;
      const ny = player.y + dy;
      if (ny < 0 || ny >= gridMap.length || nx < 0 || nx >= gridMap[0].length) return;

      const cell = gridMap[ny][nx];
      if (cell === '#') {
        playSfx('step');
        return;
      }

      // Se pisar em um símbolo do alfabeto Σ = {*, a, s, b, c}
      if (['*', 'a', 's', 'b', 'c', 't'].includes(cell) && getCurrentPhase().alphabet.includes(cell)) {
        // Anexa símbolo na fita em tempo real
        const inputEl = document.getElementById('tape-input');
        if (simIndex === 0 && pda.state === 'q0' && inputEl.value === getCurrentPhase().solution) {
          inputEl.value = ''; // Limpa o exemplo inicial ao começar a explorar manualmente
        }
        inputEl.value += cell;
        currentTape = inputEl.value;
        simIndex = currentTape.length;

        const result = stepPDA(cell);
        if (!result.ok) simFailedIndex = simIndex - 1;
        renderTapeVisual();

        if (result.ok) {
          player.x = nx;
          player.y = ny;
          if (cell !== getCurrentPhase().goalSymbol) {
            gridMap[ny][nx] = '.'; // Coleta item ou abre passagem
          }
          spawnParticles(nx, ny, cell === 'c' ? '#6ee7b7' : '#f5a673');
        } else {
          // Bloqueia passagem e gera partículas vermelhas de rejeição
          spawnParticles(nx, ny, '#fb7185');
        }
      } else {
        // Passo livre na areia
        player.x = nx;
        player.y = ny;
        playSfx('step');
      }
    }

    window.addEventListener('keydown', (e) => {
      if (document.activeElement.tagName === 'INPUT') return;
      const key = e.key.toLowerCase();
      if (key === 'w' || e.key === 'ArrowUp') { e.preventDefault(); handleMoveInput(0, -1); }
      if (key === 's' || e.key === 'ArrowDown') { e.preventDefault(); handleMoveInput(0, 1); }
      if (key === 'a' || e.key === 'ArrowLeft') { e.preventDefault(); handleMoveInput(-1, 0); }
      if (key === 'd' || e.key === 'ArrowRight') { e.preventDefault(); handleMoveInput(1, 0); }
    });

    // Redimensionamento responsivo do Canvas
    function resizeCanvas() {
      const container = canvas.parentElement;
      const w = container.clientWidth;
      const h = Math.max(250, Math.min(340, Math.round(w * 0.48)));
      canvas.width = w;
      canvas.height = h;
    }

    function renderGameLoop() {
      const w = canvas.width;
      const h = canvas.height;
      const cols = gridMap[0].length;
      const rows = gridMap.length;
      const tileW = w / cols;
      const tileH = h / rows;

      ctx.clearRect(0, 0, w, h);

      // Fundo gradiente do chão do templo
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#271738');
      bgGrad.addColorStop(1, '#3d2042');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Desenhar células do grid
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * tileW;
          const y = r * tileH;
          const cell = gridMap[r][c];

          // Grade sutil
          ctx.strokeStyle = 'rgba(255, 240, 229, 0.06)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, tileW, tileH);

          if (cell === '#') {
            // Blocos de Ruínas Minimalistas (Silhueta Alto's Odyssey)
            ctx.fillStyle = '#160d24';
            ctx.fillRect(x + 2, y + 2, tileW - 4, tileH - 4);
            ctx.fillStyle = 'rgba(245, 166, 115, 0.08)';
            ctx.fillRect(x + 2, y + 2, tileW - 4, 4);
          } else if (cell === '*') {
            drawCrystal(x + tileW / 2, y + tileH / 2, Math.min(tileW, tileH) * 0.28);
          } else if (cell === 'a') {
            drawKey(x + tileW / 2, y + tileH / 2, Math.min(tileW, tileH) * 0.28);
          } else if (cell === 's') {
            drawEnergyBarrier(x, y, tileW, tileH);
          } else if (cell === 'b') {
            drawStoneArch(x, y, tileW, tileH);
          } else if (cell === 'c') {
            drawOraclePortal(x + tileW / 2, y + tileH / 2, Math.min(tileW, tileH) * 0.34);
          } else if (cell === 't') {
            drawTreasureChest(x, y, tileW, tileH);
          }
        }
      }

      // Desenhar Viajante (Personagem com cachecol esvoaçante estilo Alto)
      drawTraveler(
        (player.x + 0.5) * tileW,
        (player.y + 0.5) * tileH,
        Math.min(tileW, tileH) * 0.32
      );

      // Partículas
      particles = particles.filter(p => p.life > 0);
      particles.forEach(p => {
        p.gx += p.vx;
        p.gy += p.vy;
        p.life -= 0.03;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.gx * tileW, p.gy * tileH, 3.2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      requestAnimationFrame(renderGameLoop);
    }

    function drawCrystal(cx, cy, r) {
      const pulse = Math.sin(Date.now() * 0.005) * 2;
      ctx.save();
      ctx.shadowColor = '#f5a673';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(cx, cy - r - pulse);
      ctx.lineTo(cx + r * 0.75, cy);
      ctx.lineTo(cx, cy + r + pulse);
      ctx.lineTo(cx - r * 0.75, cy);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fff0e5';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText('*', cx, cy + r + 12);
      ctx.restore();
    }

    function drawKey(cx, cy, r) {
      ctx.save();
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(cx - r * 0.35, cy, r * 0.42, 0, Math.PI * 2);
      ctx.moveTo(cx + r * 0.05, cy);
      ctx.lineTo(cx + r * 0.85, cy);
      ctx.lineTo(cx + r * 0.85, cy + r * 0.35);
      ctx.stroke();

      ctx.fillStyle = '#67e8f9';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText('a', cx, cy + r + 12);
      ctx.restore();
    }

    function drawEnergyBarrier(x, y, w, h) {
      const cx = x + w / 2;
      const cy = y + h * 0.43;
      const size = Math.min(w, h);
      const bottleSize = size * 0.8;
      ctx.save();
      ctx.shadowColor = '#fb3f83';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#be185d';
      ctx.beginPath();
      ctx.moveTo(cx - bottleSize * 0.12, cy - bottleSize * 0.35);
      ctx.lineTo(cx + bottleSize * 0.12, cy - bottleSize * 0.35);
      ctx.lineTo(cx + bottleSize * 0.12, cy - bottleSize * 0.18);
      ctx.quadraticCurveTo(cx + bottleSize * 0.3, cy - bottleSize * 0.06, cx + bottleSize * 0.3, cy + bottleSize * 0.1);
      ctx.lineTo(cx + bottleSize * 0.3, cy + bottleSize * 0.29);
      ctx.quadraticCurveTo(cx + bottleSize * 0.3, cy + bottleSize * 0.39, cx + bottleSize * 0.19, cy + bottleSize * 0.39);
      ctx.lineTo(cx - bottleSize * 0.19, cy + bottleSize * 0.39);
      ctx.quadraticCurveTo(cx - bottleSize * 0.3, cy + bottleSize * 0.39, cx - bottleSize * 0.3, cy + bottleSize * 0.29);
      ctx.lineTo(cx - bottleSize * 0.3, cy + bottleSize * 0.1);
      ctx.quadraticCurveTo(cx - bottleSize * 0.3, cy - bottleSize * 0.06, cx - bottleSize * 0.12, cy - bottleSize * 0.18);
      ctx.closePath();
      const potion = ctx.createLinearGradient(0, cy - bottleSize * 0.2, 0, cy + bottleSize * 0.4);
      potion.addColorStop(0, '#f472b6');
      potion.addColorStop(1, '#e11d48');
      ctx.fillStyle = potion;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffe4f0';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx - bottleSize * 0.15, cy - bottleSize * 0.44, bottleSize * 0.3, bottleSize * 0.12);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillRect(cx - bottleSize * 0.18, cy + bottleSize * 0.08, bottleSize * 0.055, bottleSize * 0.16);
      ctx.fillStyle = '#fff0e5';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText('s (-A)', cx, y + h * 0.91);
      ctx.restore();
    }

    function drawStoneArch(x, y, w, h) {
      const cx = x + w / 2;
      const cy = y + h * 0.43;
      const radius = Math.min(w, h) * 0.34;
      const rotation = Date.now() * 0.003;
      ctx.save();
      ctx.shadowColor = '#e879f9';
      ctx.shadowBlur = 22;
      const vortex = ctx.createRadialGradient(cx, cy, 1, cx, cy, radius);
      vortex.addColorStop(0, '#22d3ee');
      vortex.addColorStop(0.42, '#a855f7');
      vortex.addColorStop(1, '#581c87');
      ctx.fillStyle = vortex;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = Math.max(2, radius * 0.16);
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#f0abfc';
      ctx.shadowColor = '#f0abfc';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.72, rotation, rotation + Math.PI * 1.55);
      ctx.stroke();
      ctx.strokeStyle = '#a5f3fc';
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.38, -rotation * 1.4, -rotation * 1.4 + Math.PI * 1.45);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff0e5';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText('b (-X)', cx, y + h * 0.91);
      ctx.restore();
    }

    function drawOraclePortal(cx, cy, r) {
      const rot = Date.now() * 0.0025;
      const top = cy - r * 0.92;
      const bottom = cy + r * 0.82;
      const halfWidth = r * 0.72;
      const doorway = ctx.createLinearGradient(cx - halfWidth, cy, cx + halfWidth, cy);
      doorway.addColorStop(0, '#0f766e');
      doorway.addColorStop(0.5, '#164e63');
      doorway.addColorStop(1, '#0f766e');
      ctx.save();
      ctx.shadowColor = '#5eead4';
      ctx.shadowBlur = 22;
      ctx.fillStyle = doorway;
      ctx.beginPath();
      ctx.moveTo(cx - halfWidth, bottom);
      ctx.lineTo(cx - halfWidth, cy - r * 0.1);
      ctx.quadraticCurveTo(cx - halfWidth, top, cx, top);
      ctx.quadraticCurveTo(cx + halfWidth, top, cx + halfWidth, cy - r * 0.1);
      ctx.lineTo(cx + halfWidth, bottom);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#99f6e4';
      ctx.lineWidth = Math.max(3, r * 0.2);
      ctx.beginPath();
      ctx.moveTo(cx - halfWidth, bottom);
      ctx.lineTo(cx - halfWidth, cy - r * 0.1);
      ctx.quadraticCurveTo(cx - halfWidth, top, cx, top);
      ctx.quadraticCurveTo(cx + halfWidth, top, cx + halfWidth, cy - r * 0.1);
      ctx.lineTo(cx + halfWidth, bottom);
      ctx.stroke();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = Math.max(1.5, r * 0.07);
      ctx.beginPath();
      ctx.moveTo(cx - halfWidth * 0.65, bottom);
      ctx.lineTo(cx - halfWidth * 0.65, cy - r * 0.1);
      ctx.quadraticCurveTo(cx - halfWidth * 0.65, top + r * 0.16, cx, top + r * 0.16);
      ctx.quadraticCurveTo(cx + halfWidth * 0.65, top + r * 0.16, cx + halfWidth * 0.65, cy - r * 0.1);
      ctx.lineTo(cx + halfWidth * 0.65, bottom);
      ctx.stroke();
      ctx.fillStyle = 'rgba(153,246,228,0.7)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 0.25, halfWidth * 0.5, r * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a5f3fc';
      ctx.lineWidth = Math.max(1.5, r * 0.08);
      ctx.beginPath();
      ctx.arc(cx, cy - r * 0.08, r * 0.31, rot, rot + Math.PI * 1.65);
      ctx.stroke();
      ctx.fillStyle = '#ecfeff';
      ctx.beginPath();
      ctx.arc(cx, cy - r * 0.08, Math.max(2, r * 0.09), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(cx, top - r * 0.02, Math.max(2, r * 0.1), 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = Math.max(2, r * 0.13);
      ctx.strokeStyle = '#99f6e4';
      ctx.beginPath();
      ctx.moveTo(cx - halfWidth, bottom + 1);
      ctx.lineTo(cx + halfWidth, bottom + 1);
      ctx.stroke();
      ctx.fillStyle = '#99f6e4';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText('c (Z0)', cx, cy + r + 11);
      ctx.restore();
    }

    function drawMapEmoji(emoji, label, cx, cy, size, glow) {
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 10;
      ctx.font = `${Math.max(22, size * 1.45)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, cx, cy - 3);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff0e5';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.fillText(label, cx, cy + size * 0.75);
      ctx.restore();
    }

    function drawTreasureChest(x, y, w, h) {
      const cx = x + w / 2;
      const top = y + h * 0.25;
      const chestWidth = w * 0.48;
      const chestHeight = h * 0.34;
      ctx.save();
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.roundRect(cx - chestWidth / 2, top + chestHeight * 0.42, chestWidth, chestHeight * 0.72, 4);
      ctx.fill();
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.roundRect(cx - chestWidth / 2, top, chestWidth, chestHeight * 0.55, 7);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(cx - 2, top + chestHeight * 0.48, 4, chestHeight * 0.64);
      ctx.beginPath();
      ctx.arc(cx, top + chestHeight * 0.7, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff0e5';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText('t • TESOURO', cx, y + h * 0.82);
      ctx.restore();
    }

    function drawTraveler(cx, cy, r) {
      const bob = Math.sin(Date.now() * 0.008) * 2;
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff0e5';
      ctx.strokeStyle = '#f5a673';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#f5a673';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(cx, cy + bob, r * 1.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.font = `${Math.max(24, r * 2.15)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🧙', cx, cy + bob);
      ctx.restore();
    }

    /* =========================================================================
       6. UTILITÁRIOS DE MODAL, ESTRELAS DE FUNDO E INICIALIZAÇÃO
       ========================================================================= */
    function generateStars() {
      const container = document.getElementById('stars-layer');
      for (let i = 0; i < 55; i++) {
        const star = document.createElement('div');
        const size = Math.random() * 2.5 + 1;
        star.style.position = 'absolute';
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.borderRadius = '50%';
        star.style.backgroundColor = '#fff0e5';
        star.style.top = `${Math.random() * 52}%`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.animation = `twinkle ${2.5 + Math.random() * 4}s infinite ease-in-out ${Math.random() * 3}s`;
        container.appendChild(star);
      }
    }

    function openModal(id) {
      const m = document.getElementById(id);
      m.classList.remove('hidden');
      m.classList.add('flex');
    }

    function closeModal(id) {
      const m = document.getElementById(id);
      m.classList.add('hidden');
      m.classList.remove('flex');
    }

    let pendingRestartAction = null;

    function showRestartConfirmation() {
      requestRestart(performResetAll);
    }

    function requestRestart(action) {
      pendingRestartAction = action;
      const modal = document.getElementById('modal-restart');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function dismissRestartConfirmation() {
      const modal = document.getElementById('modal-restart');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      pendingRestartAction = null;
    }

    function confirmRestart() {
      const action = pendingRestartAction;
      dismissRestartConfirmation();
      if (action) action();
    }

    function showVictoryModal() {
      const modal = document.getElementById('modal-victory');
      const finalPhase = phaseIndex === PHASES.length - 1;
      document.getElementById('victory-title').textContent = finalPhase ? 'Vitória final! O tesouro é seu.' : `Fase ${phaseIndex + 1} concluída!`;
      document.getElementById('victory-copy').textContent = finalPhase
        ? 'Você completou as três fases e abriu o baú do Oráculo. Quer jogar novamente desde o início?'
        : `${getCurrentPhase().goalName} alcançado. Prepare-se para o próximo desafio!`;
      document.getElementById('victory-next').textContent = finalPhase ? 'Jogar novamente' : 'Próxima fase';
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function dismissVictory() {
      const modal = document.getElementById('modal-victory');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    function advancePhaseOrReplay() {
      dismissVictory();
      phaseIndex = phaseIndex === PHASES.length - 1 ? 0 : phaseIndex + 1;
      stopSimulationTimer();
      simIndex = 0;
      simFailedIndex = -1;
      currentTape = '';
      updatePhaseUI();
      resetPDA();
      resetMapObjects();
      currentTape = document.getElementById('tape-input').value;
      renderTapeVisual();
    }

    function resetAll() {
      if (pda.status === 'REJECTED') {
        requestRestart(performResetAll);
        return;
      }
      performResetAll();
    }

    function performResetAll() {
      stopSimulationTimer();
      simIndex = 0;
      simFailedIndex = -1;
      document.getElementById('tape-input').value = '';
      currentTape = '';
      resetPDA();
      resetMapObjects();
      renderTapeVisual();
    }

    window.addEventListener('resize', resizeCanvas);

    window.onload = function () {
      generateStars();
      updatePhaseUI();
      resetMapObjects();
      resetPDA();
      renderTapeVisual();
      resizeCanvas();
      renderGameLoop();
    };
