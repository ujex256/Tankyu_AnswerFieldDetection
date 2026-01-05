import { type SetStoreFunction } from "solid-js/store";

type Props = {
  files: File[];
  setFiles: SetStoreFunction<File[]>;
  onExecute: () => void;
};

export default function FileUploader(props: Props) {
  const handleUploadBtn = (from: "cam" | "file") => {
    const inputId = from === "cam" ? "upload-from-cam" : "upload-from-file";
    const inputElem = document.getElementById(inputId) as HTMLInputElement;
    inputElem.click();
    inputElem.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        const fileList = Array.from(target.files);
        props.setFiles((prev) => [...prev, ...fileList]);
      }
    };
  }
  return (
    <div class="flex-1 flex flex-col gap-4">
      <div class="px-4 w-full flex justify-between gap-4">
        <button
          class="cursor-pointer py-1 text-center flex-1 bg-gray-400 text-white rounded-sm hover:bg-gray-500 transition"
          onClick={() => handleUploadBtn("cam")}
        >
          <div class="flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24"><path fill="#fff" d="M12 17.5q1.875 0 3.188-1.312T16.5 13t-1.312-3.187T12 8.5T8.813 9.813T7.5 13t1.313 3.188T12 17.5m0-2q-1.05 0-1.775-.725T9.5 13t.725-1.775T12 10.5t1.775.725T14.5 13t-.725 1.775T12 15.5M4 21q-.825 0-1.412-.587T2 19V7q0-.825.588-1.412T4 5h3.15L8.4 3.65q.275-.3.663-.475T9.875 3h4.25q.425 0 .813.175t.662.475L16.85 5H20q.825 0 1.413.588T22 7v12q0 .825-.587 1.413T20 21zm0-2h16V7h-4.05l-1.825-2h-4.25L8.05 7H4zm8-6"/></svg>
          </div>
          カメラから撮影
        </button>
        <button
          class="cursor-pointer text-center flex-1 bg-gray-400 text-white rounded-sm hover:bg-gray-500 transition"
          onClick={() => handleUploadBtn("file")}
        >
          <div class="flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24"><path fill="#fff" d="M6 20q-.825 0-1.412-.587T4 18v-2q0-.425.288-.712T5 15t.713.288T6 16v2h12v-2q0-.425.288-.712T19 15t.713.288T20 16v2q0 .825-.587 1.413T18 20zm5-12.15L9.125 9.725q-.3.3-.712.288T7.7 9.7q-.275-.3-.288-.7t.288-.7l3.6-3.6q.15-.15.325-.212T12 4.425t.375.063t.325.212l3.6 3.6q.3.3.288.7t-.288.7q-.3.3-.712.313t-.713-.288L13 7.85V15q0 .425-.288.713T12 16t-.712-.288T11 15z"/></svg>
          </div>
          ファイルを選択
        </button>
      </div>
      <div class="flex-1">
        {props.files.length > 0 ? (
          <>
            <p>追加された画像({props.files.length})</p>
            <div class="grid grid-cols-3 gap-4">
              {props.files.map((file) => (
                <div class="border border-blue-400 rounded overflow-hidden shadow-sm">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    class="object-cover w-full h-20"
                  />
                  <p class="px-2 py-1 text-sm break-all bg-blue-50 text-blue-800">
                    {file.name}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div class="h-full flex justify-center items-center border-2 border-dashed border-gray-400 rounded">
            <p class="text-gray-400">画像が追加されていません</p>
          </div>
        )}
      </div>
      <div class="flex justify-center">
        <button
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          onClick={props.onExecute}
          disabled={props.files.length === 0}
        >
          処理を開始する
        </button>
      </div>
      <div class="hidden">
        <input
          id="upload-from-cam"
          type="file"
          accept="image/*"
          capture="environment"
        />
        <input
          id="upload-from-file"
          type="file"
          accept="image/*"
          multiple
        />
      </div>
    </div>
  );
}
