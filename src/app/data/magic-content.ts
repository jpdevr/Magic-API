import { LoreEntry, ManaCode, RuleBookSection } from '../models/mtg.models';

export const MANA_OPTIONS: Array<{
  code: ManaCode;
  name: string;
  label: string;
  tone: string;
  identity: string;
  imagePath: string;
}> = [
  { code: 'W', name: 'White', label: 'Branco', tone: 'Luz, ordem e protecao', identity: 'planos solares, cavaleiros, anjos e exercitos disciplinados', imagePath: '/assets/mana/White.webp' },
  { code: 'U', name: 'Blue', label: 'Azul', tone: 'Conhecimento, ilusao e controle', identity: 'torres arcanas, mares profundos, magos e manipulacao do tempo', imagePath: '/assets/mana/Water.webp' },
  { code: 'B', name: 'Black', label: 'Preto', tone: 'Ambicao, morte e pactos', identity: 'necropoles, vampiros, demonios e magia proibida', imagePath: '/assets/mana/Black.webp' },
  { code: 'R', name: 'Red', label: 'Vermelho', tone: 'Furia, liberdade e fogo', identity: 'montanhas, dragoes, relampagos e impulso bruto', imagePath: '/assets/mana/Red.webp' },
  { code: 'G', name: 'Green', label: 'Verde', tone: 'Natureza, forca e tradicao', identity: 'florestas antigas, feras colossais e crescimento selvagem', imagePath: '/assets/mana/Green.webp' },
  { code: 'C', name: 'Colorless', label: 'Incolor', tone: 'Artefatos, vazios e mana sem cor', identity: 'construcoes antigas, Eldrazi, terrenos especiais e magia fora do pentagono', imagePath: '/assets/mana/Colorless.webp' }
];

export const RULE_BOOK: RuleBookSection[] = [
  { number: '1', title: 'Game Concepts', description: 'Conceitos do jogo, regras de ouro, jogadores, inicio e fim de partida, cores, mana, objetos, permanentes, magicas e habilidades.' },
  { number: '2', title: 'Parts of a Card', description: 'Nome, custo de mana, ilustracao, tipos, simbolos de expansao, texto, poder, resistencia, lealdade, defesa e modificadores de mao/vida.' },
  { number: '3', title: 'Card Types', description: 'Artefatos, batalhas, criaturas, encantamentos, instantaneas, terrenos, planeswalkers, feiticos, tribais, vanguard, schemes e fenomenos.' },
  { number: '4', title: 'Zones', description: 'Biblioteca, mao, campo de batalha, cemiterio, pilha, exilio, comando, ante, mudancas de zona e informacoes publicas/ocultas.' },
  { number: '5', title: 'Turn Structure', description: 'Inicio, compra, fases principais, combate, final, etapas, acoes baseadas em turno e como prioridade entra em cada momento.' },
  { number: '6', title: 'Spells, Abilities, and Effects', description: 'Como conjurar magicas, ativar habilidades, custos, alvos, resolucao, efeitos continuos, camadas e interacoes complexas.' },
  { number: '7', title: 'Additional Rules', description: 'Palavras-chave, acoes de palavra-chave, estado, marcadores, copiar objetos, substituicao, prevencao e atalhos de torneio.' },
  { number: '8', title: 'Multiplayer Rules', description: 'Regras para multiplos jogadores, alcance de influencia, equipe, Two-Headed Giant, Emperor e variantes suportadas.' },
  { number: '9', title: 'Casual Variants', description: 'Commander, Planechase, Archenemy, Vanguard, conspiracoes, draft e outras formas oficiais/casuais de jogar.' }
];

export const PLANESWALKERS: LoreEntry[] = [
  { name: 'Gideon Jura', mana: 'W', title: 'Escudo dos inocentes', summary: 'Um guerreiro ligado ao ideal branco de coragem, sacrifício e defesa coletiva.' },
  { name: 'Teferi', mana: 'U', title: 'Mestre do tempo', summary: 'Um arquimago de controle temporal, paciência estratégica e conhecimento profundo.' },
  { name: 'Liliana Vess', mana: 'B', title: 'Necromante pactuada', summary: 'Ambiciosa, brilhante e perigosa, representa o preço do poder e a magia da morte.' },
  { name: 'Chandra Nalaar', mana: 'R', title: 'Piromante indomável', summary: 'Impulsiva e intensa, traduz o vermelho em fogo, emoção e liberdade.' },
  { name: 'Nissa Revane', mana: 'G', title: 'Voz dos mundos vivos', summary: 'Canaliza a força das terras, elementais e ecossistemas inteiros.' },
  { name: 'Nicol Bolas', mana: 'M', title: 'Dragão ancião', summary: 'Um dos vilões mais famosos de Magic, manipulador multicolorido de eras, planos e exércitos.' }
];

export const TYPE_SYMBOLS = [
  { type: 'Creature', icon: '♞', label: 'Criaturas' },
  { type: 'Instant', icon: '✦', label: 'Mágicas instantâneas' },
  { type: 'Sorcery', icon: '✧', label: 'Feitiços' },
  { type: 'Artifact', icon: '⚙', label: 'Artefatos' },
  { type: 'Enchantment', icon: '✺', label: 'Encantamentos' },
  { type: 'Land', icon: '◆', label: 'Terrenos' },
  { type: 'Planeswalker', icon: '♛', label: 'Planeswalkers' }
];
