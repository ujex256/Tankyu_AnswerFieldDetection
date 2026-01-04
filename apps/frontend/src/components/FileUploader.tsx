import { createSignal } from "solid-js";

export default function FileUploader() {
  const [files, setFiles] = createSignal<File[] | null>(null);

  return (
    <div class="mx-4 mb-4 flex-1 flex flex-col gap-8">
      <div class="w-full flex justify-between gap-4">
        <label
          for="upload-from-cam"
          class="cursor-pointer text-center flex-1 bg-gray-400 text-white rounded-sm hover:bg-gray-500 transition"
        >
          カメラから撮影
        </label>
        <label
          for="upload-from-file"
          class="cursor-pointer text-center flex-1 bg-gray-400 text-white rounded-sm hover:bg-gray-500 transition"
        >
          ファイルから選択
        </label>
      </div>
      <div class="flex-1">ここに表示</div>
      <div class="flex justify-center">
        <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
          処理を開始する
        </button>
      </div>
      <div class="hidden">
        <input
          id="upload-from-cam"
          type="file"
          accept="image/*"
          capture="user"
          class="hidden"
          onChange={handleFileChange}
        />
        <input
          id="upload-from-file"
          type="file"
          accept="image/*"
          class="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
