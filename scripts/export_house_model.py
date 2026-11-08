"""Export the trained house-price model so the website can run it in the browser.

Usage:  python scripts/export_house_model.py <path-to-housing_price_prediction-repo> <commit>

Reads  <repo>/model/full_model_package.pkl  (weights, scaler, column order) and
       <repo>/data/kc_house_data.csv        (only for slider ranges and zipcode locations).
Writes public/ml/house-price-model.json.
Needs: joblib, scikit-learn, pandas, numpy, torch.
"""
import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import torch

repo = Path(sys.argv[1])
commit = sys.argv[2]
out = Path(__file__).resolve().parent.parent / "public" / "ml" / "house-price-model.json"


def r(x, nd=6):
    return round(float(x), nd)


def sig(x):
    return float(f"{float(x):.9g}")


pkg = joblib.load(repo / "model" / "full_model_package.pkl")
columns, scaler, state = pkg["columns"], pkg["scaler"], pkg["model_state"]
df = pd.read_csv(repo / "data" / "kc_house_data.csv")
df["zipcode"] = df["zipcode"].astype(str)

# Slider ranges: the 0.5th to 99.5th percentile, so a few extreme rows (for example a
# house with 33 bedrooms) do not stretch the sliders.
# (name, label, kind, step, group, default)  default = the notebook's sample house
SPEC = [
    ("bedrooms", "Bedrooms", "int", 1, "main", 3),
    ("bathrooms", "Bathrooms", "float", 0.25, "main", 2.5),
    ("sqft_living", "Living area (sq ft)", "int", 10, "main", 2500),
    ("sqft_lot", "Lot size (sq ft)", "int", 100, "main", 6000),
    ("floors", "Floors", "float", 0.5, "main", 2.0),
    ("grade", "Grade (1 to 13)", "int", 1, "main", 8),
    ("condition", "Condition (1 to 5)", "int", 1, "main", 3),
    ("yr_built", "Year built", "int", 1, "main", 2005),
    ("view", "View (0 to 4)", "int", 1, "more", 0),
    ("waterfront", "Waterfront (0 no, 1 yes)", "int", 1, "more", 0),
    ("sqft_basement", "Basement (sq ft)", "int", 10, "more", 500),
    ("yr_renovated", "Year renovated (0 = never)", "int", 1, "more", 0),
    ("sqft_living15", "Neighbours' living area (sq ft)", "int", 10, "more", 2000),
    ("sqft_lot15", "Neighbours' lot size (sq ft)", "int", 100, "more", 6000),
]
features = []
for name, label, kind, step, group, default in SPEC:
    lo, hi = df[name].quantile(0.005), df[name].quantile(0.995)
    if name in ("sqft_lot", "sqft_lot15"):
        hi = df[name].quantile(0.95)  # lots are very skewed; keep the slider usable
    if name == "yr_renovated":
        lo, hi = df.loc[df[name] > 0, name].min(), df[name].max()  # the page adds a "never" switch
    if name in ("waterfront",):
        lo, hi = 0, 1
    lo = float(np.floor(lo / step) * step)
    hi = float(np.ceil(hi / step) * step)
    features.append(dict(name=name, label=label, kind=kind, step=step, group=group,
                         min=lo, max=hi, default=default))

zips = (df.groupby("zipcode")[["lat", "long"]].median().round(4)
        .reset_index().sort_values("zipcode"))
zipcodes = [dict(zip=z, lat=float(a), long=float(b)) for z, a, b in zips.itertuples(index=False)]

layers = []
for i in (1, 2, 3):
    w = state[f"fc{i}.weight"].numpy()
    b = state[f"fc{i}.bias"].numpy()
    layers.append(dict(w=[[r(v) for v in row] for row in w], b=[r(v) for v in b]))


class Net(torch.nn.Module):
    def __init__(self, d):
        super().__init__()
        self.fc1 = torch.nn.Linear(d, 64)
        self.fc2 = torch.nn.Linear(64, 32)
        self.fc3 = torch.nn.Linear(32, 1)

    def forward(self, x):
        return self.fc3(torch.relu(self.fc2(torch.relu(self.fc1(x)))))


net = Net(len(columns))
net.load_state_dict(state)
net.eval()
COLS = ["bedrooms", "bathrooms", "sqft_living", "sqft_lot", "floors", "waterfront", "view",
        "condition", "grade", "sqft_basement", "yr_built", "yr_renovated", "zipcode", "lat",
        "long", "sqft_living15", "sqft_lot15"]


def predict(row):
    d = pd.DataFrame([{c: row[c] for c in COLS}])
    e = pd.get_dummies(d, columns=["zipcode"]).reindex(columns=columns, fill_value=0)
    x = torch.tensor(scaler.transform(e.astype(float))).float()
    with torch.no_grad():
        return float(net(x).item())


sample = dict(bedrooms=3, bathrooms=2.5, sqft_living=2500, sqft_lot=6000, floors=2.0, waterfront=0,
              view=0, condition=3, grade=8, sqft_basement=500, yr_built=2005, yr_renovated=0,
              zipcode="98003", lat=47.32, long=-122.31, sqft_living15=2000, sqft_lot15=6000)
refs = [sample] + [
    {c: (str(v) if c == "zipcode" else (v.item() if hasattr(v, "item") else v)) for c, v in row.items()}
    for row in df.sample(4, random_state=7)[COLS].to_dict("records")
]
reference = [dict(inputs=x, price=round(predict(x), 2)) for x in refs]

# How active each neuron is on average over all houses, and how many fire for a typical house.
# The page draws these as the "average" next to the neurons for the house being tried.
allx = pd.get_dummies(df[COLS], columns=["zipcode"]).reindex(columns=columns, fill_value=0).astype(float)
with torch.no_grad():
    z = torch.tensor(scaler.transform(allx)).float()
    a1 = torch.relu(net.fc1(z))
    a2 = torch.relu(net.fc2(a1))
activity = dict(
    hidden1=[round(float(v), 4) for v in a1.mean(0)],
    hidden2=[round(float(v), 4) for v in a2.mean(0)],
    typicalFiring1=round(float((a1 > 0).sum(1).float().mean()), 1),
    typicalFiring2=round(float((a2 > 0).sum(1).float().mean()), 1),
    houses=int(len(df)),
)

doc = dict(
    schemaVersion=1,
    source=dict(repo="https://github.com/Alca1206/housing_price_prediction", commit=commit),
    columns=list(columns),
    mean=[sig(v) for v in scaler.mean_],
    scale=[sig(v) for v in scaler.scale_],
    layers=layers,
    features=features,
    zipcodes=zipcodes,
    reference=reference,
    activity=activity,
)
out.write_text(json.dumps(doc, separators=(",", ":")))
print("wrote", out, out.stat().st_size, "bytes;", len(columns), "columns;", len(zipcodes), "zipcodes")
print("reference prices:", [x["price"] for x in reference])
