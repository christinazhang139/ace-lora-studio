// === Generation API Types ===

export interface GenerateMusicRequest {
  prompt?: string;
  global_caption?: string;
  lyrics?: string;
  thinking?: boolean;
  sample_mode?: boolean;
  sample_query?: string;
  use_format?: boolean;
  model?: string;
  bpm?: number | null;
  key_scale?: string;
  time_signature?: string;
  vocal_language?: string;
  inference_steps?: number;
  guidance_scale?: number;
  use_random_seed?: boolean;
  seed?: number | string;
  reference_audio_path?: string | null;
  src_audio_path?: string | null;
  audio_duration?: number | null;
  batch_size?: number | null;
  repainting_start?: number;
  repainting_end?: number | null;
  instruction?: string;
  audio_cover_strength?: number;
  cover_noise_strength?: number;
  task_type?: string;
  repaint_mode?: "conservative" | "balanced" | "aggressive";
  repaint_strength?: number;
  audio_format?: string;
  infer_method?: string;
  shift?: number;
  timesteps?: string | null;
  lm_temperature?: number;
  lm_cfg_scale?: number;
  lm_top_p?: number | null;
  use_cot_caption?: boolean;
  use_cot_language?: boolean;
}

export interface ReleaseTaskResponse {
  task_id: string;
  status: string;
  queue_position: number;
}

export interface ResultMetas {
  prompt?: string;
  caption?: string;
  bpm?: string | number;
  duration?: string | number;
  genres?: string;
  keyscale?: string;
  timesignature?: string;
  language?: string;
}

export interface QueryResultItem {
  task_id: string;
  result: string;
  status: number;
  progress_text?: string;
}

export interface ParsedResult {
  file: string;
  status: number;
  prompt: string;
  lyrics: string;
  metas: ResultMetas;
  raw_audio_paths?: string[];
  audio_codes?: string;
  generation_info?: string;
}

export interface CreateSampleResponse {
  caption: string;
  lyrics: string;
  bpm: number | null;
  keyscale: string;
  duration: number | null;
  timesignature: string;
  vocal_language: string;
}

export interface FormatInputResponse {
  caption: string;
  lyrics: string;
  bpm: number | null;
  key_scale: string;
  time_signature: string;
  duration: number | null;
  vocal_language: string;
}

// === Model / Health Types ===

export interface ModelInfo {
  name: string;
  is_default: boolean;
  is_loaded: boolean;
  supported_task_types: string[];
}

export interface LmModelInfo {
  name: string;
  is_loaded: boolean;
}

export interface ModelInventory {
  models: ModelInfo[];
  default_model: string | null;
  lm_models: LmModelInfo[];
  loaded_lm_model: string | null;
  llm_initialized: boolean;
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  models_initialized: boolean;
  llm_initialized: boolean;
  loaded_model: string | null;
  loaded_lm_model: string | null;
}

// === LoRA Types ===

export interface LoraStatus {
  lora_loaded: boolean;
  use_lora: boolean;
  lora_scale: number;
  adapter_type: string | null;
  scales: Record<string, number>;
  active_adapter: string | null;
  adapters: string[];
}

// === Dataset Types ===

export interface DatasetSample {
  index: number;
  filename: string;
  audio_path: string;
  duration: number;
  caption: string;
  genre: string;
  prompt_override: "caption" | "genre" | null;
  lyrics: string;
  bpm: number | null;
  keyscale: string;
  timesignature: string;
  language: string;
  is_instrumental: boolean;
  labeled: boolean;
}

export interface ScanDirectoryRequest {
  audio_dir: string;
  dataset_name?: string;
  custom_tag?: string;
  tag_position?: "prepend" | "append" | "replace";
  all_instrumental?: boolean;
}

export interface LoadDatasetRequest {
  dataset_path: string;
}

export interface SaveDatasetRequest {
  save_path: string;
  dataset_name?: string;
  custom_tag?: string | null;
  tag_position?: string | null;
  all_instrumental?: boolean | null;
}

export interface UpdateSampleRequest {
  caption?: string;
  genre?: string;
  prompt_override?: "caption" | "genre" | null;
  lyrics?: string;
  bpm?: number | null;
  keyscale?: string;
  timesignature?: string;
  language?: string;
  is_instrumental?: boolean;
}

export interface AutoLabelRequest {
  skip_metas?: boolean;
  format_lyrics?: boolean;
  transcribe_lyrics?: boolean;
  only_unlabeled?: boolean;
  lm_model_path?: string | null;
  save_path?: string | null;
  chunk_size?: number;
  batch_size?: number;
}

export interface AutoLabelStatus {
  task_id: string | null;
  status: "idle" | "running" | "completed" | "failed";
  progress: string;
  current: number;
  total: number;
  error: string | null;
}

export interface PreprocessRequest {
  output_dir: string;
  skip_existing?: boolean;
}

export interface PreprocessStatus {
  task_id: string | null;
  status: "idle" | "running" | "completed" | "failed";
  progress: string;
  current: number;
  total: number;
  error: string | null;
}

// === Training Types ===

export interface StartTrainingRequest {
  tensor_dir: string;
  lora_rank?: number;
  lora_alpha?: number;
  lora_dropout?: number;
  learning_rate?: number;
  train_epochs?: number;
  train_batch_size?: number;
  gradient_accumulation?: number;
  save_every_n_epochs?: number;
  training_shift?: number;
  training_seed?: number;
  lora_output_dir?: string;
  use_fp8?: boolean;
  gradient_checkpointing?: boolean;
}

export interface StartLoKRRequest {
  tensor_dir: string;
  lokr_linear_dim?: number;
  lokr_linear_alpha?: number;
  lokr_factor?: number;
  lokr_decompose_both?: boolean;
  lokr_use_tucker?: boolean;
  lokr_use_scalar?: boolean;
  lokr_weight_decompose?: boolean;
  learning_rate?: number;
  train_epochs?: number;
  train_batch_size?: number;
  gradient_accumulation?: number;
  save_every_n_epochs?: number;
  training_shift?: number;
  training_seed?: number;
  output_dir?: string;
  gradient_checkpointing?: boolean;
}

export interface LossEntry {
  step: number;
  loss: number;
}

export interface TrainingStatus {
  is_training: boolean;
  should_stop: boolean;
  current_step: number;
  current_loss: number | null;
  status: string;
  config: Record<string, unknown>;
  tensor_dir: string;
  loss_history: LossEntry[];
  tensorboard_url: string | null;
  tensorboard_logdir: string | null;
  training_log: string;
  start_time: number | null;
  current_epoch: number;
  steps_per_second: number;
  estimated_time_remaining: number;
  error: string | null;
}

export interface ExportLoRARequest {
  export_path: string;
  lora_output_dir: string;
}
