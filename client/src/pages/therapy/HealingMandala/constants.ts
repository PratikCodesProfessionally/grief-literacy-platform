import { ColorPalettes } from './types';

export const COLOR_PALETTES: ColorPalettes = {
  warmEarth: {
    name: 'Warm Earth',
    colors: ['#E8B4A4', '#D4A59A', '#C4948B', '#9B7E7A', '#705D56', '#DEB887', '#CD853F', '#8B4513', '#A0522D', '#D2691E']
  },
  coolBlues: {
    name: 'Cool Blues',
    colors: ['#A8DADC', '#457B9D', '#1D3557', '#81B2CA', '#5A8FB4', '#6495ED', '#4682B4', '#5F9EA0', '#4A90A4', '#87CEEB']
  },
  natureGreen: {
    name: 'Nature Green',
    colors: ['#B7CE63', '#8FB339', '#6A994E', '#52734D', '#344E41', '#90EE90', '#3CB371', '#2E8B57', '#228B22', '#006400']
  },
  sunset: {
    name: 'Sunset Glow',
    colors: ['#FF6B6B', '#FF8E53', '#FFA45B', '#FFB84D', '#F9CA24', '#FF7F50', '#FF6347', '#FFA07A', '#FA8072', '#E9967A']
  },
  zen: {
    name: 'Zen Gray',
    colors: ['#F5F5F5', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#757575', '#616161', '#424242', '#2D3436', '#1A1A1A', '#000000']
  }
};

export const DEFAULT_TEMPLATE = 'traditional-floral';
export const DEFAULT_PETALS = 16;
export const DEFAULT_RINGS = 6;
export const DEFAULT_STROKE = 2;
export const DEFAULT_LINE_COLOR = '#2D3436';
export const DEFAULT_SELECTED_COLOR = '#FF8E53';
export const DEFAULT_PALETTE = 'sunset';
export const DEFAULT_SYMMETRY_MODE = 1;

export const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
export const MAX_HISTORY_SESSIONS = 50;
export const MANDALA_HISTORY_KEY = 'mandala-history';
export const NS = 'http://www.w3.org/2000/svg';
