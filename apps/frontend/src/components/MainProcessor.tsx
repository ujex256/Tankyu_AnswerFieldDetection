import FileUploader from "./FileUploader";
import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import cvModule from "@techstark/opencv-js";

// https://github.com/TechStark/opencv-js?tab=readme-ov-file#basic-usage
async function getOpenCv(): Promise<{ cv: typeof cvModule }> {
  let cv;
  if (cvModule instanceof Promise) {
    cv = await cvModule;
  } else {
    if (cvModule.Mat) {
      cv = cvModule;
    } else {
      await new Promise<void>((resolve) => {
        cvModule.onRuntimeInitialized = () => resolve();
      });
      cv = cvModule;
    }
  }
  return { cv };
}

type ProcessedImage = {
  name: string;
  url: string;
};

export default function Processor() {
  const [files, setFiles] = createStore<File[]>([]);
  const [processedImages, setProcessedImages] = createStore<ProcessedImage[]>(
    []
  );
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [highlightImage, setHighlightImage] = createSignal<string | null>(null);

  const readFileAsDataUrl = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () =>
        reject(new Error("ファイルの読み込みに失敗しました"));
      reader.readAsDataURL(file);
    });
  };

  const processSingleImage = async (file: File): Promise<ProcessedImage> => {
    const { cv } = await getOpenCv();
    const dataUrl = await readFileAsDataUrl(file);

    const img = new Image();
    img.src = dataUrl;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("キャンバスの作成に失敗しました");
    ctx.drawImage(img, 0, 0, img.width, img.height);

    const orig = cv.imread(canvas);
    // @ts-ignore
    const dst = orig.mat_clone();
    const rgbSrc = new cv.Mat();
    cv.cvtColor(orig, rgbSrc, cv.COLOR_RGBA2RGB);
    cv.convertScaleAbs(rgbSrc, rgbSrc, 0.8, 0);
    const hsvSrc = new cv.Mat();
    cv.cvtColor(rgbSrc, hsvSrc, cv.COLOR_RGB2HSV);
    const hsvChannels = new cv.MatVector();
    const binarizationDst = new cv.Mat();

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    try {
      cv.GaussianBlur(hsvSrc, hsvSrc, new cv.Size(3, 3), 0);
      cv.split(hsvSrc, hsvChannels);
      const extractedChannel = hsvChannels.get(2);
      cv.bitwise_not(extractedChannel, extractedChannel);
      cv.threshold(extractedChannel, binarizationDst, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
      cv.dilate(binarizationDst, binarizationDst, cv.Mat.ones(2, 2, cv.CV_8U));

      // @ts-ignore
      const vertical = new cv.Mat();
      const vKernel = cv.getStructuringElement(
        cv.MORPH_RECT,
        new cv.Size(1, 25) // ← 縦に長い
      );
      cv.morphologyEx(binarizationDst, vertical, cv.MORPH_OPEN, vKernel);

      // @ts-ignore
      const horizontal = new cv.Mat();
      const hKernel = cv.getStructuringElement(
        cv.MORPH_RECT,
        new cv.Size(15, 1) // ← 横に長い
      );
      cv.morphologyEx(binarizationDst, horizontal, cv.MORPH_OPEN, hKernel);

      const mask = new cv.Mat();
      cv.bitwise_or(vertical, horizontal, mask);
      // cv.bitwise_and(binarizationDst, mask, binarizationDst);

      cv.erode(mask, mask, cv.Mat.ones(2, 2, cv.CV_8U));
      cv.dilate(mask, mask, cv.Mat.ones(5, 5, cv.CV_8U));
      // cv.imshow(canvas, mask);
      // cv.erode(binarizationDst, binarizationDst, cv.Mat.ones(2, 2, cv.CV_8U));
      // cv.dilate(binarizationDst, binarizationDst, cv.Mat.ones(5, 5, cv.CV_8U));

      // cv.morphologyEx(binarizationDst, binarizationDst, cv.MORPH_OPEN, cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 1)));

      cv.findContours(mask, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
      let detectedCount = 0;
      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const matVector = new cv.MatVector();
        matVector.push_back(contour);

        const points = new cv.Mat();
        const area = cv.contourArea(contour);
        if (area < 1000 || area > 3000000) {
          continue;
        }
        cv.approxPolyDP(contour, points, 0.05 * cv.arcLength(contour, true), true);
        if (points.rows < 3) {
          points.delete();
          continue;
        }
        cv.drawContours(dst, matVector, 0, new cv.Scalar(255, 255, 255, 255), -1);
        detectedCount++;
        points.delete();
        matVector.delete();
      }
      console.log(detectedCount)
      cv.imshow(canvas, dst);
      const processedUrl = canvas.toDataURL("image/png");
      extractedChannel.delete();
      return { name: file.name, url: processedUrl };
    } finally {
      binarizationDst.delete();
      hsvChannels.delete();
      contours.delete();
      hierarchy.delete();
      dst.delete();
      rgbSrc.delete();
      hsvSrc.delete();
      orig.delete();
    }
  };

  const handler = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const results = await Promise.all(
        files.map((file) => processSingleImage(file))
      );
      setProcessedImages(results);
    } catch (error) {
      console.error(error);
      alert("処理中にエラーが発生しました。リロードして再度お試しください。");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (img: ProcessedImage) => {
    const link = document.createElement("a");
    link.href = img.url;
    link.download = `processed-${img.name}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div class="relative mx-4 mb-4 flex-1 flex flex-col gap-6">
      <FileUploader files={files} setFiles={setFiles} onExecute={handler} />

      {processedImages.length > 0 && (
        <div class="flex flex-col gap-2">
          <p class="font-semibold">処理結果 ({processedImages.length})</p>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            {processedImages.map((img) => (
              <div class="border border-blue-400 rounded overflow-hidden shadow-sm">
                <img
                  src={img.url}
                  alt={img.name}
                  class="w-full h-40 object-cover"
                  onClick={() => {setHighlightImage(img.url)}}
                />
                <div class="px-2 py-1 text-sm break-all bg-blue-50 text-blue-800 flex items-center justify-between gap-2">
                  <span class="truncate">{img.name}</span>
                  <button
                    class="cursor-pointer text-blue-700 underline text-xs hover:text-blue-900"
                    onClick={() => handleDownload(img)}
                  >
                    ダウンロード
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {highlightImage() && (
        <div
          class="fixed top-0 left-0 w-full h-full bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={() => {setHighlightImage(null)}}
        >
          <img
            src={highlightImage()!}
            alt="Highlighted"
            class="max-w-4xl max-h-dvh object-contain border-4 border-white shadow-lg"
          />
        </div>
      )}
      <div
        class="absolute top-0 left-0 flex flex-col items-center justify-center gap-6 w-full h-full bg-white opacity-90"
        hidden={!isProcessing()}
      >
        処理中です！
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="72"
          height="72"
          viewBox="0 0 24 24"
        >
          <g stroke="#50b8ff" stroke-width="1">
            <circle
              cx="12"
              cy="12"
              r="9.5"
              fill="none"
              stroke-linecap="round"
              stroke-width="3"
            >
              <animate
                attributeName="stroke-dasharray"
                calcMode="spline"
                dur="1.5s"
                keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1"
                keyTimes="0;0.475;0.95;1"
                repeatCount="indefinite"
                values="0 150;42 150;42 150;42 150"
              />
              <animate
                attributeName="stroke-dashoffset"
                calcMode="spline"
                dur="1.5s"
                keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1"
                keyTimes="0;0.475;0.95;1"
                repeatCount="indefinite"
                values="0;-16;-59;-59"
              />
            </circle>
            <animateTransform
              attributeName="transform"
              dur="2s"
              repeatCount="indefinite"
              type="rotate"
              values="0 12 12;360 12 12"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
