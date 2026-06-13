import { apiPost, apiGet } from "@ace/ui";
import type {
  ScanDirectoryRequest,
  DatasetSample,
  AutoLabelRequest,
  AutoLabelStatus,
  PreprocessRequest,
  PreprocessStatus,
  StartTrainingRequest,
  StartLoKRRequest,
  TrainingStatus,
  ExportLoRARequest,
  LoraStatus,
  GenerateMusicRequest,
  ReleaseTaskResponse,
  QueryResultItem,
} from "@ace/ui";

export async function scanDirectory(req: ScanDirectoryRequest) {
  return apiPost<{ samples: DatasetSample[] }>("/v1/dataset/scan", req);
}

export async function loadDataset(path: string) {
  return apiPost<{ samples: DatasetSample[] }>("/v1/dataset/load", { dataset_path: path });
}

export async function saveDataset(datasetName: string, savePath?: string) {
  const resolvedPath = savePath || `${datasetName}.json`;
  return apiPost<{ save_path: string }>("/v1/dataset/save", {
    save_path: resolvedPath,
    dataset_name: datasetName,
  });
}

export async function getSamples() {
  return apiGet<{ samples: DatasetSample[] }>("/v1/dataset/samples");
}

export async function updateSample(idx: number, sample: Partial<DatasetSample>) {
  return apiPost(`/v1/dataset/sample/${idx}`, sample);
}

export async function startAutoLabel(req: AutoLabelRequest) {
  return apiPost<{ task_id: string }>("/v1/dataset/auto_label_async", req);
}

export async function getAutoLabelStatus() {
  return apiGet<AutoLabelStatus>("/v1/dataset/auto_label_status");
}

export async function startPreprocess(req: PreprocessRequest) {
  return apiPost<{ task_id: string }>("/v1/dataset/preprocess_async", req);
}

export async function getPreprocessStatus() {
  return apiGet<PreprocessStatus>("/v1/dataset/preprocess_status");
}

export async function startTraining(req: StartTrainingRequest) {
  return apiPost<{ status: string }>("/v1/training/start", req);
}

export async function startLoKRTraining(req: StartLoKRRequest) {
  return apiPost<{ status: string }>("/v1/training/start_lokr", req);
}

export async function getTrainingStatus() {
  return apiGet<TrainingStatus>("/v1/training/status");
}

export async function stopTraining() {
  return apiPost("/v1/training/stop");
}

export async function exportLora(req: ExportLoRARequest) {
  return apiPost<{ export_path: string }>("/v1/training/export", req);
}

export async function loadLora(path: string) {
  return apiPost("/v1/lora/load", { lora_path: path });
}

export async function unloadLora() {
  return apiPost("/v1/lora/unload");
}

export async function getLoraStatus() {
  return apiGet<LoraStatus>("/v1/lora/status");
}

export async function toggleLora(useLora: boolean) {
  return apiPost<{ message: string; use_lora: boolean }>("/v1/lora/toggle", { use_lora: useLora });
}

export async function releaseTask(req: GenerateMusicRequest) {
  return apiPost<ReleaseTaskResponse>("/release_task", req);
}

export async function queryResult(taskIds: string[]) {
  return apiPost<QueryResultItem[]>("/query_result", { task_id_list: taskIds });
}
