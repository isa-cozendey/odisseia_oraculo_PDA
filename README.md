# 🏜️ Odisseia do Oráculo — Autômato com Pilha (PDA)

> **Trabalho 02 — Teoria da Computação / Linguagens Formais e Autômatos**  
> Aplicação web interativa que gamifica o funcionamento de um **Autômato com Pilha (Pushdown Automaton — PDA)** com visualização em tempo real da fita de entrada, diagrama de estados, pilha LIFO e síntese sonora.

🔗 **Jogar Online (GitHub Pages):** `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/` *(substitua pelo link após ativar o GitHub Pages)*

---

## 📖 Sobre o Projeto e Enredo

Em **Odisseia do Oráculo**, o jogador controla um explorador atravessando as câmaras crepusculares de um templo antigo até alcançar o **Santuário Final**. Diferente de um simples jogo de labirinto, toda a progressão é governada estritamente pelas regras de um **Autômato com Pilha (PDA)**:

- **Cristais (`*`)** e **Chaves (`a`)** são armazenados em uma mochila mágica que funciona exatamente como uma **pilha (LIFO — Last-In, First-Out)**[cite: 2].
- Para abrir **Passagens (`s`)** ou destrancar **Portas (`b`)**, o item correspondente precisa estar obrigatoriamente no **topo da pilha**[cite: 2].
- O **Portal Final (`c`)** exige equilíbrio energético: ele só aceita a entrada se a pilha estiver completamente descarregada (contendo apenas o símbolo inicial de fundo $Z_0$)[cite: 2, 4].

A direção de arte e a paleta crepuscular foram inspiradas na estética minimalista de *Alto's Odyssey*, combinadas com efeitos sonoros e trilha ambiente gerados proceduralmente via **Web Audio API**.

---

## ⚙️ Definição Formal do Autômato ($M$)

O autômato implementado é definido pela 7-upla:

$$M = (Q, \Sigma, \Gamma, \delta, q_0, Z_0, F)$$

- **Conjunto de Estados ($Q$):** $\{q_0, q_1, q_2, q_3, q_4, q_5, q_6\}$ (7 estados)
  - $q_0$: **Átrio Inicial** (início da jornada)
  - $q_1$: **Galeria dos Cristais** (coleta de cristais e chaves)
  - $q_2$: **Corredor Selado** (após consumir o primeiro cristal)
  - $q_3$: **Salão das Portas** (preparação para destrancar acessos)
  - $q_4$: **Câmara de Equilíbrio** (descarregamento de chaves e cristais restantes)
  - $q_5$: **Antecâmara do Portal** (alcançado via transição espontânea $\lambda$ quando a pilha está vazia)
  - $q_6$: **Santuário Final** (estado de aceitação)
- **Alfabeto de Entrada ($\Sigma$):** $\{*, a, s, b, c\}$[cite: 2]
- **Alfabeto da Pilha ($\Gamma$):** $\{Z_0, A, X\}$
  - $Z_0$: Símbolo inicial de fundo da pilha
  - $A$: Cristal de energia empilhado
  - $X$: Chave antiga empilhada
- **Estado Inicial:** $q_0$
- **Símbolo Inicial da Pilha:** $Z_0$
- **Conjunto de Estados Finais ($F$):** $\{q_6\}$ (aceitação por estado final)[cite: 4]

### 🗺️ Legenda dos Símbolos de Entrada ($\Sigma$)

| Símbolo | Ação no Jogo | Operação na Pilha |
| :---: | :--- | :--- |
| `*` | Coletar Cristal de Energia | Empilha `A` (`PUSH A`) |
| `a` | Coletar Chave Antiga | Empilha `X` (`PUSH X`) |
| `s` | Abrir Passagem de Energia | Desempilha `A` (`POP A`) |
| `b` | Destrancar Porta | Desempilha `X` (`POP X`) |
| `c` | Atravessar o Portal Final | Lê `Z0` e mantém `Z0` (conclui em $q_6$) |

### 🔄 Função de Transição ($\delta$) — Padrão JFLAP

Notação: `(leitura, topo_da_pilha ; novo_topo)` onde $\lambda$ representa a palavra vazia.

| Estado Atual | Entrada | Topo da Pilha | Substituição na Pilha | Próximo Estado | Descrição |
| :---: | :---: | :---: | :---: | :---: | :--- |
| **$q_0$** | `*` | $Z_0$ | $A Z_0$ | **$q_1$** | Coleta o 1º cristal e entra na galeria |
| **$q_1$** | `*` | $A$ | $A A$ | **$q_1$** | Empilha cristais adicionais |
| **$q_1$** | `a` | $A$ | $X A$ | **$q_1$** | Empilha chave sobre cristal |
| **$q_1$** | `a` | $X$ | $X X$ | **$q_1$** | Empilha chaves adicionais |
| **$q_1$** | `s` | $A$ | $\lambda$ | **$q_2$** | Consome 1 cristal para abrir passagem |
| **$q_1$** | `b` | $X$ | $\lambda$ | **$q_3$** | Consome 1 chave para abrir porta diretamente |
| **$q_2$** | `a` | $Z_0$ | $X Z_0$ | **$q_3$** | Coleta chave no corredor (pilha vazia) |
| **$q_2$** | `a` | $A$ | $X A$ | **$q_3$** | Coleta chave no corredor (com cristal na pilha) |
| **$q_3$** | `b` | $X$ | $\lambda$ | **$q_4$** | Consome chave na porta principal |
| **$q_4$** | `b` | $X$ | $\lambda$ | **$q_4$** | Descarrega chaves extras em portas secundárias |
| **$q_4$** | `s` | $A$ | $\lambda$ | **$q_4$** | Descarrega cristais extras em barreiras |
| **$q_4$** | $\lambda$ | $Z_0$ | $Z_0$ | **$q_5$** | Transição espontânea quando a pilha esvazia |
| **$q_5$** | `c` | $Z_0$ | $Z_0$ | **$q_6$** | Entra no portal e atinge o estado final |

---

## 🧪 Casos de Teste Disponíveis na Interface

A interface possui botões de carregamento rápido para **4 situações demonstrativas** (2 aceitas e 2 rejeitadas):

1. **Exemplo 1 — Caminho Padrão (`*asbc`) $\rightarrow$ ✅ ACEITA**
   - Coleta cristal (`*`), coleta chave (`a`), usa chave (`b`), usa cristal (`s`) e cruza o portal (`c`) com a pilha limpa ($Z_0$).
2. **Exemplo 2 — Ordem LIFO Múltipla (`**aabbssc`) $\rightarrow$ ✅ ACEITA**
   - Empilha 2 cristais (`**`) e depois 2 chaves (`aa`), formando `X X A A Z0`. Demonstra a regra LIFO: obrigatoriamente precisa gastar as 2 chaves (`bb`) antes de conseguir acessar e gastar os 2 cristais (`ss`) que estavam na base da pilha.
3. **Exemplo 3 — Porta Sem Chave (`*sbc`) $\rightarrow$ ❌ REJEITADA**
   - Coleta cristal (`*`), abre passagem (`s`) e tenta destrancar uma porta (`b`) com a pilha contendo apenas $Z_0$. O autômato rejeita por ausência de transição válida para `(q2, b, Z0)`.
4. **Exemplo 4 — Energia Sobrando (`**absc`) $\rightarrow$ ❌ REJEITADA**
   - Coleta 2 cristais e 1 chave, mas gasta apenas 1 chave e 1 cristal. Ao tentar acionar o portal (`c`), ainda resta um cristal `A` na pilha, impedindo a transição espontânea $\lambda$ para $q_5$.

---

## 🎮 Funcionalidades Implementadas

- **Modo Exploração (Teclado WASD / Setas):** Movimente o personagem pelo grid do templo; cada interação com itens, portas ou barreiras gera automaticamente a fita de entrada e executa o PDA em tempo real[cite: 2, 3].
- **Modo Simulador de Roteiro:** Digite qualquer sequência composta por `*`, `a`, `s`, `b`, `c` (ou selecione um dos 4 exemplos) e acompanhe a execução passo a passo com velocidade ajustável[cite: 2, 3].
- **Inspetor Visual do PDA:**
  - Diagrama interativo de estados ($q_0$ a $q_6$) destacando o estado atual e as transições em tempo real.
  - Representação visual da pilha vertical com animações de `PUSH` e `POP`.
  - Fita de caracteres destacando o símbolo em processamento e histórico de transições[cite: 3].
- **Áudio Procedural:** Trilha ambiente suave e efeitos sonoros sintetizados via **Web Audio API** (sem necessidade de arquivos `.mp3` externos).

---

## 🚀 Como Executar e Publicar

### Localmente
Como o projeto foi construído em **HTML5, CSS3 e JavaScript puro** em um único arquivo (`index.html`), basta clonar o repositório e abrir o `index.html` em qualquer navegador moderno[cite: 3]:

```bash
git clone [https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git](https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git)
cd SEU-REPOSITORIO
