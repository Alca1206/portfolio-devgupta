"""Record one real run of the pneumonia CNN and save it as public/ml/pneumonia-demo.json.

The website replays this file in the browser: the X-ray going through the three conv blocks,
the probability, the Grad-CAM heatmap, and (with --test-dir) a live sensitivity/specificity
trade-off as the threshold moves. Nothing here is invented: every number comes from your
trained model (best_model.pth) running your model.py.

Usage (from the website folder, with the Python that has torch, torchvision and opencv):

  python scripts/export_pneumonia_demo.py ^
    --repo "C:\\Users\\devgu\\Desktop\\Git\\Pneumonia-Detection-using-CNN" ^
    --images "C:\\path\\to\\a_PNEUMONIA_xray.jpeg" "C:\\path\\to\\a_NORMAL_xray.jpeg" ^
    --test-dir "C:\\path\\to\\chest_xray\\test" ^
    --credit "Kermany et al., Chest X-Ray Images (Pneumonia), Kaggle / Mendeley Data, CC BY 4.0"

  --images    1 to 4 example X-rays to show (use the test split, never the training split).
              The folder name decides the true label (a path containing NORMAL or PNEUMONIA).
  --test-dir  folder with NORMAL/ and PNEUMONIA/ subfolders; every image is scored so the
              page can draw the threshold trade-off from real scores. Optional.
"""

from __future__ import annotations

import argparse
import base64
import io
import json
import os
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
import torch
from PIL import Image

N_CHANNELS = 8  # feature maps shown per block (the most active ones)


def png_data_uri(arr: np.ndarray) -> str:
    """8-bit grayscale or RGB array -> small PNG as a data URI."""
    buf = io.BytesIO()
    Image.fromarray(arr).save(buf, format="PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def to_u8(a: np.ndarray) -> np.ndarray:
    """Scale one 2-D map to 0..255 on its own range."""
    lo, hi = float(a.min()), float(a.max())
    return np.uint8(255 * (a - lo) / (hi - lo + 1e-8))


def git_commit(repo: Path) -> str | None:
    try:
        out = subprocess.run(
            ["git", "-C", str(repo), "rev-parse", "HEAD"], capture_output=True, text=True, check=True
        )
        return out.stdout.strip()
    except Exception:
        return None


def true_label(path: str) -> str | None:
    up = path.upper()
    if "PNEUMONIA" in up:
        return "PNEUMONIA"
    if "NORMAL" in up:
        return "NORMAL"
    return None


def gradcam(model, tensor: torch.Tensor, sign: float, size: int) -> np.ndarray:
    """Grad-CAM on the last conv layer (block3[0]), as app.py does it.

    The network outputs ONE logit and sigmoid(logit) = P(NORMAL). sign=+1 explains the logit
    (what pushes towards NORMAL, which is what app.py draws); sign=-1 explains the opposite
    (what pushes towards PNEUMONIA).
    """
    store = {}

    def fwd(_m, _i, out):
        store["act"] = out
        out.register_hook(lambda g: store.__setitem__("grad", g))

    handle = model.block3[0].register_forward_hook(fwd)
    x = tensor.clone().requires_grad_(True)
    model.zero_grad()
    out = model(x)
    (sign * out.sum()).backward()
    handle.remove()

    grad, act = store["grad"].detach().cpu(), store["act"].detach().cpu()
    weights = grad.mean(dim=(2, 3), keepdim=True)
    cam = torch.clamp((weights * act).sum(dim=1).squeeze(), min=0).numpy()
    cam = cv2.resize(cam, (size, size))
    return (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)


def overlay(gray: np.ndarray, cam: np.ndarray) -> np.ndarray:
    heat = cv2.cvtColor(cv2.applyColorMap(np.uint8(255 * cam), cv2.COLORMAP_JET), cv2.COLOR_BGR2RGB)
    rgb = cv2.cvtColor(gray, cv2.COLOR_GRAY2RGB)
    return cv2.addWeighted(rgb, 0.5, heat, 0.5, 0)


def top_channels(act: torch.Tensor, k: int) -> list[int]:
    """Indices of the k channels with the highest mean activation."""
    means = act.squeeze(0).mean(dim=(1, 2))
    return [int(i) for i in torch.argsort(means, descending=True)[:k]]


def record_example(model, mod, path: str, size: int, threshold: float) -> dict:
    tensor = mod.preprocess_image(path)
    gray = np.uint8(np.clip(tensor.squeeze().cpu().numpy() * 255.0, 0, 255).round())

    # Run block by block so each stage's output can be saved.
    stages = {}
    with torch.no_grad():
        x = tensor
        for name in ("block1", "block2", "block3"):
            block = getattr(model, name)
            conv_bn_relu = block[:3](x)  # conv -> batchnorm -> relu (before pooling)
            x = block[3:](conv_bn_relu)  # pool -> dropout (off in eval mode)
            ch = top_channels(conv_bn_relu, N_CHANNELS)
            maps = [png_data_uri(to_u8(conv_bn_relu[0, c].cpu().numpy())) for c in ch]
            stages[name] = {
                "channels_total": int(conv_bn_relu.shape[1]),
                "map_size": int(conv_bn_relu.shape[2]),
                "pooled_size": int(x.shape[2]),
                "shown_channels": ch,
                "maps": maps,
            }
        logit = float(model.classifier(x).item())
    prob_normal = float(torch.sigmoid(torch.tensor(logit)).item())

    cam_normal = gradcam(model, tensor, +1.0, size)
    cam_pneu = gradcam(model, tensor, -1.0, size)
    return {
        "name": os.path.basename(path),
        "true_label": true_label(path),
        "input": png_data_uri(gray),
        "stages": stages,
        "logit": logit,
        "prob_normal": prob_normal,
        "predicted_at_threshold": "NORMAL" if prob_normal >= threshold else "PNEUMONIA",
        "gradcam_normal": png_data_uri(overlay(gray, cam_normal)),
        "gradcam_pneumonia": png_data_uri(overlay(gray, cam_pneu)),
    }


def score_folder(model, mod, folder: Path) -> list[list]:
    """[[true_label_is_normal (1/0), prob_normal], ...] for every image under folder."""
    rows = []
    exts = {".jpg", ".jpeg", ".png"}
    for label, is_normal in (("NORMAL", 1), ("PNEUMONIA", 0)):
        d = folder / label
        if not d.is_dir():
            sys.exit(f"Missing folder: {d}")
        files = sorted(p for p in d.iterdir() if p.suffix.lower() in exts)
        print(f"  scoring {len(files)} {label} images ...")
        for p in files:
            t = mod.preprocess_image(str(p))
            with torch.no_grad():
                pn = float(torch.sigmoid(model(t)).item())
            rows.append([is_normal, round(pn, 5)])
    return rows


def build_demo(model, mod, images: list[str], test_dir: Path | None, credit: str | None,
               commit: str | None) -> dict:
    size = int(mod.IMG_SIZE)
    threshold = float(mod.THRESHOLD)
    demo = {
        "model": {
            "repo_commit": commit,
            "img_size": size,
            "threshold": threshold,
            "class_names": list(mod.CLASS_NAMES),
            "note": "One output logit; sigmoid(logit) = P(NORMAL). Label is NORMAL if P(NORMAL) >= threshold.",
            "parameters": int(sum(p.numel() for p in model.parameters())),
        },
        "credit": credit,
        "examples": [],
        "test_scores": None,
    }
    for path in images:
        print(f"recording {path}")
        demo["examples"].append(record_example(model, mod, path, size, threshold))
    if test_dir is not None:
        print(f"scoring test folder {test_dir}")
        demo["test_scores"] = score_folder(model, mod, test_dir)
    return demo


def load_repo_module(repo: Path):
    sys.path.insert(0, str(repo))
    os.chdir(repo)  # model.py loads weights by relative path
    import model as mod  # the project's own model.py

    return mod


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--repo", required=True, help="folder with model.py and best_model.pth")
    ap.add_argument("--images", nargs="+", required=True, help="1 to 4 example X-rays")
    ap.add_argument("--test-dir", default=None, help="folder with NORMAL/ and PNEUMONIA/ subfolders")
    ap.add_argument("--credit", default=None)
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    if not 1 <= len(args.images) <= 4:
        sys.exit("Give 1 to 4 images.")
    out = Path(args.out) if args.out else Path(__file__).resolve().parent.parent / "public" / "ml" / "pneumonia-demo.json"
    images = [str(Path(p).resolve()) for p in args.images]
    test_dir = Path(args.test_dir).resolve() if args.test_dir else None
    repo = Path(args.repo).resolve()

    mod = load_repo_module(repo)
    model = mod.load_model("best_model.pth")
    model.eval()
    demo = build_demo(model, mod, images, test_dir, args.credit, git_commit(repo))

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(demo, separators=(",", ":")), encoding="utf-8")
    print(f"\nWrote {out} ({out.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
