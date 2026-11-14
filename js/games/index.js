// 미니게임 목록
import { playFind } from './find.js';
import { playDig } from './dig.js';
import { playTrace } from './trace.js';
import { playFish } from './fish.js';
import { playBridge } from './bridge.js';
import { playOrb } from './orb.js';
import { playHidden } from './hidden.js';

export const GAMES = { find: playFind, dig: playDig, trace: playTrace, fish: playFish, bridge: playBridge, orb: playOrb, hidden: playHidden };
