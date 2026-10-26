// plugins/games/arcade.js — launcher shortcut buat arcade games (tictactoe, dino, chess, dll).
// Return {type:'game', key} supaya frontend buka overlay iframe arcade.
const AVAILABLE = {
  tictactoe: { emoji:'❌⭕', name:'Tic-Tac-Toe', desc:'Lawan AI tic-tac-toe' },
  dino:      { emoji:'🦖',   name:'Dino Run',    desc:'Lompatin kaktus (chrome dino)' },
  chess:     { emoji:'♟️',   name:'Catur',       desc:'Main catur lawan AI' },
  blockblast:{ emoji:'🧩',   name:'Block Blast', desc:'Puzzle susun balok' },
  mahjong:   { emoji:'🀄',  name:'Mahjong',     desc:'Cocokin ubin mahjong' },
  piano:     { emoji:'🎹',   name:'Piano Tiles', desc:'Ketuk tuts hitam' },
  sambungkata:{emoji:'🔗',  name:'Sambung Kata',desc:'Rantai kata 3D (KBBI)' },
  speedydash:{ emoji:'💨',   name:'Speedy Dash', desc:'Lari lompat tak terbatas' },
};

const KEYS = Object.keys(AVAILABLE);

module.exports = {
  config: {
    name: 'arcade',
    alias: ['tictactoe','ttt','dino','dinorun','chess','catur','blockblast','mahjong','piano','pianotiles','sambungkata','speedydash'],
    category: 'games',
    description: 'Buka game arcade di dalam web (tictactoe, dino, chess, piano, sambungkata, dll)',
    usage: '@tictactoe | @dino | @chess | @arcade (daftar)',
    example: '@tictactoe',
    inputType: 'text',
    outputType: 'json',
    tags: ['game','arcade','tictactoe','dino','chess','main'],
  },
  run: async ({ text, command }) => {
    const cmd = String(command||'').toLowerCase();
    const aliasToKey = { ttt:'tictactoe', catur:'chess', pianotiles:'piano', dinorun:'dino' };
    const gameKey = aliasToKey[cmd] || (AVAILABLE[cmd] ? cmd : null);

    if (gameKey) {
      const g = AVAILABLE[gameKey];
      return {
        type: 'game',
        game: gameKey,
        caption: `${g.emoji} Membuka *${g.name}* — ${g.desc}`,
      };
    }

    // daftar
    const list = KEYS.map(k => {
      const g = AVAILABLE[k];
      return `${g.emoji} *${g.name}* — ${g.desc}  →  @${k}`;
    }).join('\n');
    return {
      type:'text',
      caption: `🎮 *DAFTAR ARCADE GAME*\n\n${list}\n\nKetik @namagame buat buka langsung.`,
    };
  },
};
