# 以前作ったコード

import math
from pathlib import Path
from pprint import pprint

import numpy as np
import cv2
from PIL import Image
from pdf2image.pdf2image import convert_from_path


def is_similar_color(target_rgb, compare_rgb, threshold=50):
    # ターゲットの色とのユークリッド距離
    r1, g1, b1 = target_rgb
    r2, g2, b2 = compare_rgb
    distance = math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
    return distance <= threshold


def convert_to_cv2(img: Image.Image):
    open_cv_image = np.array(img.convert("RGB"))
    open_cv_image = open_cv_image[:, :, ::-1].copy()
    return open_cv_image


def delete_red(img, colormap=None):
    _img = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    mask = cv2.inRange(_img, (145, 5, 45), (180, 255, 255))  # 赤色のマスク画像を作成
    mask2 = cv2.inRange(_img, (0, 5, 200), (10, 110, 255))

    dst = _img
    dst[mask > 0] = [180, 0, 255]
    dst[mask2 > 0] = [180, 0, 255]
    return cv2.cvtColor(dst, cv2.COLOR_HSV2BGR)


def show_img(img, convert_code=None):
    # cv2.imwrite(f"{random.random()}.png", img)
    _img = img.copy()
    if convert_code:
        _img = cv2.cvtColor(_img, convert_code)
    cv2.imshow("dst", _img)
    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    DEL_RED_ONLY = True
    path = Path(input("ファイルのフルパス(pdf or image)>> ").replace("\"", "") or "img.jpg")
    if not path.exists():
        raise FileNotFoundError("file does not exist")
    is_pdf = path.suffix == ".pdf"

    if is_pdf:
        images = [convert_to_cv2(i) for i in convert_from_path(path)]
    else:
        images = [convert_to_cv2(Image.open(path))]

    new_images = []
    for index, i in enumerate(images):
        print(f"#-----{index+1}ページ目-----#")
        dst = delete_red(i)
        show_img(dst)  # 丸付け後の線を削除
        if DEL_RED_ONLY:
            new_images.append(dst)
            print("[END]")
            continue

        # 何故か大津の二値化はHSVのほうがうまく行った
        # adaptiveThreshold()のほうが良いかも
        ret, ex = cv2.threshold(cv2.cvtColor(dst, cv2.COLOR_BGR2HSV)[:, :, 1], 0, 255, cv2.THRESH_OTSU)
        print("閾値:", ret)
        binarization_img = cv2.dilate(ex, cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3)))
        binarization_img = cv2.morphologyEx(binarization_img, cv2.MORPH_OPEN, np.ones((2, 1), np.uint8))  # 軽くオープニング処理
        show_img(binarization_img)

        contours, hierarchy = cv2.findContours(binarization_img, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)  # 問題の枠を検出
        filtered_contours_index = [ind for ind, j in enumerate(contours)
                                   if cv2.contourArea(j) >= 10000 and cv2.contourArea(j) < 200000]
        print("検出された図形の数:", len(contours))

        count = 0
        for j in filtered_contours_index:
            contour = contours[j]
            cnt = cv2.approxPolyDP(contour, 0.05*cv2.arcLength(contour, True), True)
            if len(cnt) == 4:
                count += 1
                cv2.drawContours(dst, [contour], 0, (255, 255, 255), -1)
        print("四角形の数:", count)
        show_img(dst)
        # show_img(cv2.drawContours(cv2.cvtColor(i, cv2.COLOR_HSV2BGR), contours, -1, (0, 0, 255), 1))
        # colors = np.unique(dst.reshape(-1, dst.shape[-1]), axis=0)
        # with open("a.txt", 'w') as f:
        #     f.write("\n".join(list(map(str, colors.tolist()))))
        print()
        new_images.append(dst)

    pillow_images = [Image.fromarray(cv2.cvtColor(i, cv2.COLOR_BGR2RGB)) for i in new_images]
    if len(pillow_images) == 1:
        pillow_images[0].save(path.parent / f"Out_{path.name}")
    else:
        pillow_images[0].save(
            path.parent / f"Out_{path.stem}.pdf",
            format="PDF",
            quality=3000,
            save_all=True,
            append_images=pillow_images[1:]
        )
