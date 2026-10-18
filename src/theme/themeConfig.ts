export type AppThemeId = 'yellow-black' | 'formal' | 'minimal' | 'love' | 'cyberpunk';

export interface ThemeConfig {
  id: AppThemeId;
  name: string;
  nameEn: string;
  tagline: string;
  primary: string; // Hex for primary accents
  glow: string;
  bgHex: string;
  surfaceHex: string;
  cardHex: string;
  borderHex: string;
  textAccentHex: string;
  swatch: string[]; // 4 colors for preview dots
  // Tailwind class mapping
  appBgClass: string;
  borderAccentClass: string;
  textAccentClass: string;
  buttonAccentClass: string;
}

export const APP_THEMES: Record<AppThemeId, ThemeConfig> = {
  'yellow-black': {
    id: 'yellow-black',
    name: '1. เหลืองดำ (Yellow & Black)',
    nameEn: 'Cyberpunk Bumblebee',
    tagline: 'นีออนสีเหลืองดุดัน ตัดกับสีดำคาร์บอน สไตล์ MPC & เกสรผึ้งไฮเทค',
    primary: '#facc15',
    glow: 'rgba(250, 204, 21, 0.55)',
    bgHex: '#080808',
    surfaceHex: '#121212',
    cardHex: '#181818',
    borderHex: '#facc15',
    textAccentHex: '#facc15',
    swatch: ['#facc15', '#eab308', '#000000', '#262626'],
    appBgClass: 'bg-[#080808]',
    borderAccentClass: 'border-[#facc15]',
    textAccentClass: 'text-[#facc15]',
    buttonAccentClass: 'bg-[#facc15] text-black hover:bg-[#eab308]',
  },
  'formal': {
    id: 'formal',
    name: '2. ทางการ (Professional Slate)',
    nameEn: 'Executive Dark Studio',
    tagline: 'โทนสีเทาดำสเลท เรียบหรู สุขุม สไตล์ห้องอัดเสียงระดับมืออาชีพ',
    primary: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.4)',
    bgHex: '#0b0f19',
    surfaceHex: '#131b2e',
    cardHex: '#1e293b',
    borderHex: '#475569',
    textAccentHex: '#38bdf8',
    swatch: ['#38bdf8', '#64748b', '#0f172a', '#1e293b'],
    appBgClass: 'bg-[#0b0f19]',
    borderAccentClass: 'border-[#38bdf8]',
    textAccentClass: 'text-[#38bdf8]',
    buttonAccentClass: 'bg-[#38bdf8] text-slate-950 hover:bg-[#0284c7]',
  },
  'minimal': {
    id: 'minimal',
    name: '3. มินิมอล (Clean Minimal)',
    nameEn: 'Monochrome Studio',
    tagline: 'ขาว-เทา-ดำ มินิมอลคลีน สะอาดตา ไร้แสงกวนใจ โฟกัสกับจังหวะล้วนๆ',
    primary: '#ffffff',
    glow: 'rgba(255, 255, 255, 0.35)',
    bgHex: '#111111',
    surfaceHex: '#191919',
    cardHex: '#222222',
    borderHex: '#525252',
    textAccentHex: '#ffffff',
    swatch: ['#ffffff', '#a3a3a3', '#171717', '#404040'],
    appBgClass: 'bg-[#111111]',
    borderAccentClass: 'border-white',
    textAccentClass: 'text-white',
    buttonAccentClass: 'bg-white text-black hover:bg-neutral-200',
  },
  'love': {
    id: 'love',
    name: '4. ความรัก (Romantic Love)',
    nameEn: 'Sweet Pink Heart',
    tagline: 'สีชมพูมาเจนต้า หวานซึ้ง โรแมนติก สไตล์ Lo-Fi Love Beats & R&B',
    primary: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.6)',
    bgHex: '#130409',
    surfaceHex: '#200810',
    cardHex: '#2d0e19',
    borderHex: '#fb7185',
    textAccentHex: '#fb7185',
    swatch: ['#f43f5e', '#ec4899', '#fda4af', '#130409'],
    appBgClass: 'bg-[#130409]',
    borderAccentClass: 'border-[#f43f5e]',
    textAccentClass: 'text-[#fb7185]',
    buttonAccentClass: 'bg-[#f43f5e] text-white hover:bg-[#e11d48]',
  },
  'cyberpunk': {
    id: 'cyberpunk',
    name: 'ไซเบอร์พังค์ (Cyberpunk Cyan)',
    nameEn: 'Electric Cyan Neon',
    tagline: 'สีฟ้าเทอร์ควอยซ์นีออนดั้งเดิม แสงเลเซอร์สว่างสดใส',
    primary: '#00f0ff',
    glow: 'rgba(0, 240, 255, 0.55)',
    bgHex: '#0c0d10',
    surfaceHex: '#14161f',
    cardHex: '#1a1d28',
    borderHex: '#00f0ff',
    textAccentHex: '#00f0ff',
    swatch: ['#00f0ff', '#38bdf8', '#0c0d10', '#1e293b'],
    appBgClass: 'bg-[#0c0d10]',
    borderAccentClass: 'border-[#00f0ff]',
    textAccentClass: 'text-[#00f0ff]',
    buttonAccentClass: 'bg-[#00f0ff] text-black hover:bg-[#00d2ff]',
  },
};

export const DEFAULT_THEME_ID: AppThemeId = 'yellow-black';

export function getSavedTheme(): AppThemeId {
  try {
    const saved = localStorage.getItem('koala_sampler_theme') as AppThemeId;
    if (saved && APP_THEMES[saved]) {
      return saved;
    }
  } catch {}
  return DEFAULT_THEME_ID;
}

export function saveTheme(themeId: AppThemeId): void {
  try {
    localStorage.setItem('koala_sampler_theme', themeId);
  } catch {}
}
