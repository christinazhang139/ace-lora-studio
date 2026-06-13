export const VALID_LANGUAGES = [
  "ar","az","bg","bn","ca","cs","da","de","el","en",
  "es","fa","fi","fr","he","hi","hr","ht","hu","id",
  "is","it","ja","ko","la","lt","ms","ne","nl","no",
  "pa","pl","pt","ro","ru","sa","sk","sr","sv","sw",
  "ta","te","th","tl","tr","uk","ur","vi","yue","zh",
  "unknown",
] as const;

export const KEYSCALE_NOTES = ["A","B","C","D","E","F","G"] as const;
export const KEYSCALE_ACCIDENTALS = ["","#","b"] as const;
export const KEYSCALE_MODES = ["major","minor"] as const;

export const VALID_KEYSCALES: string[] = [];
for (const note of KEYSCALE_NOTES) {
  for (const acc of KEYSCALE_ACCIDENTALS) {
    for (const mode of KEYSCALE_MODES) {
      VALID_KEYSCALES.push(`${note}${acc} ${mode}`);
    }
  }
}

export const BPM_MIN = 30;
export const BPM_MAX = 300;
export const DURATION_MIN = 10;
export const DURATION_MAX = 600;
export const VALID_TIME_SIGNATURES = [2, 3, 4, 6] as const;

export const TASK_TYPES = [
  "text2music","repaint","cover","cover-nofsq","extract","lego","complete",
] as const;

export const TASK_TYPES_BASE = TASK_TYPES;
export const TASK_TYPES_TURBO = ["text2music","repaint","cover","cover-nofsq"] as const;

export const TRACK_NAMES = [
  "woodwinds","brass","fx","synth","strings","percussion",
  "keyboard","guitar","bass","drums","backing_vocals","vocals",
] as const;

export const AUDIO_FORMATS = ["mp3","flac","wav","opus","aac","wav32"] as const;

export const LANGUAGE_LABELS: Record<string, string> = {
  en: "English", zh: "中文", ja: "日本語", ko: "한국어",
  es: "Español", fr: "Français", de: "Deutsch", it: "Italiano",
  pt: "Português", ru: "Русский", ar: "العربية", hi: "हिन्दी",
  th: "ไทย", vi: "Tiếng Việt", yue: "粵語", unknown: "Auto",
};
