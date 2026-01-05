import FileUploader from "./FileUploader"
import { createSignal } from "solid-js";
import { createStore } from "solid-js/store"

export default function Processor() {
  const [files, setFiles] = createStore<File[]>([]);
  const [processedFiles, setProcessedFiles] = createStore<File[]>([]);
  const [isProcessing, setIsProcessing] = createSignal(false);

  const handler = () => {
    console.log("Processing files:", files);
    // ここにファイル処理のロジックを追加
    // alert(`${files.length} 個のファイルを処理しました。`);
    setIsProcessing(true);
  }
  return (
    <div class="relative mx-4 mb-4 flex-1 flex">
      <FileUploader files={files} setFiles={setFiles} onExecute={handler} />
      <div class="absolute top-0 left-0 flex flex-col items-center justify-center gap-6 w-full h-full bg-white opacity-90" hidden={!isProcessing()}>
        処理中です！
        <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 24 24"><g stroke="#50b8ff" stroke-width="1"><circle cx="12" cy="12" r="9.5" fill="none" stroke-linecap="round" stroke-width="3"><animate attributeName="stroke-dasharray" calcMode="spline" dur="1.5s" keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1" keyTimes="0;0.475;0.95;1" repeatCount="indefinite" values="0 150;42 150;42 150;42 150"/><animate attributeName="stroke-dashoffset" calcMode="spline" dur="1.5s" keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1" keyTimes="0;0.475;0.95;1" repeatCount="indefinite" values="0;-16;-59;-59"/></circle><animateTransform attributeName="transform" dur="2s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></g></svg>
      </div>
    </div>
  )
}
