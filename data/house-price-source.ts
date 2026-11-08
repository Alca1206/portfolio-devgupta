// Code copied from the repository at a fixed commit, so the demo shows real lines.
// (Generated from the repo; the line numbers refer to that commit.)
export const HOUSE_REPO = "https://github.com/Alca1206/housing_price_prediction";
export const HOUSE_COMMIT = "474fcdd74ccee8bc615b26184d2aba35c310500c";

export type CodeSnippet = {
  file: string;
  /** First and last line in the file, or null for a notebook cell. */
  lines: [number, number] | null;
  code: string;
  /** Repository and commit the lines come from. Defaults to the house-price repository. */
  repo?: string;
  commit?: string;
};

export function snippetUrl(s: CodeSnippet): string {
  const base = `${s.repo ?? HOUSE_REPO}/blob/${s.commit ?? HOUSE_COMMIT}/${s.file}`;
  return s.lines ? `${base}#L${s.lines[0]}-L${s.lines[1]}` : base;
}

export const formCode: CodeSnippet = {
  file: "src/app.py",
  lines: [14, 17],
  code: "    bedrooms = st.number_input(\"Bedrooms\", min_value=0, max_value=33, value=None, placeholder=\"Enter number of bedrooms (e.g. 3)\", step=1)\n    bathrooms = st.number_input(\"Bathrooms\", min_value=0.0, max_value=8.0, value=None, placeholder=\"Enter Number of bathrooms (e.g. 2.5)\", step=0.25)\n    floors = st.number_input(\"Floors\", min_value=1.0, max_value=3.5, value=None, placeholder=\"Enter Floors (e.g. 1.5)\", step=0.5)\n    zipcode = st.text_input(\"Zipcode\", value=None, placeholder=\"Enter zipcode (e.g. 98001)\")",
};

export const postCode: CodeSnippet = {
  file: "src/app.py",
  lines: [65, 70],
  code: "        try:\n            response = requests.post(\"http://api:8000/predict\", json=input_data)\n            if response.status_code == 200:\n                result = response.json()\n                price = result[\"predicted_price\"]\n                st.success(f\"### Estimated Price: ${price:,.2f}\")",
};

export const schemaCode: CodeSnippet = {
  file: "src/main.py",
  lines: [21, 38],
  code: "class HouseData(BaseModel):\n    bedrooms: int\n    bathrooms: float\n    sqft_living: int\n    sqft_lot: int\n    floors: float\n    waterfront: int\n    view: int\n    condition: int\n    grade: int\n    sqft_basement: int\n    yr_built: int\n    yr_renovated: int\n    zipcode: str\n    lat: float\n    long: float\n    sqft_living15: int\n    sqft_lot15: int",
};

export const reindexCode: CodeSnippet = {
  file: "src/main.py",
  lines: [62, 67],
  code: "@app.post(\"/predict\")\ndef predict_price(house_data: HouseData):\n    df = pd.DataFrame([house_data.dict()])\n\n    df_encoded = pd.get_dummies(df, columns=[\"zipcode\"])\n    df_encoded = df_encoded.reindex(columns=model_columns, fill_value=0)",
};

export const scaleCode: CodeSnippet = {
  file: "src/main.py",
  lines: [69, 69],
  code: "    scaled_data = scaler.transform(df_encoded)",
};

export const modelCode: CodeSnippet = {
  file: "src/main.py",
  lines: [9, 19],
  code: "class HousePricePredictor(torch.nn.Module):\n    def __init__(self, input_dim):\n        super(HousePricePredictor, self).__init__()\n        self.fc1 = torch.nn.Linear(input_dim, 64)\n        self.fc2 = torch.nn.Linear(64, 32)\n        self.fc3 = torch.nn.Linear(32, 1)\n\n    def forward(self, x):\n        x = torch.relu(self.fc1(x))\n        x = torch.relu(self.fc2(x))\n        return self.fc3(x)",
};

export const predictCode: CodeSnippet = {
  file: "src/main.py",
  lines: [70, 74],
  code: "    input_tensor = torch.tensor(scaled_data).float()\n    with torch.no_grad():\n        prediction = model(input_tensor)\n\n    return {\"predicted_price\": prediction.item()}",
};

export const trainingCode: CodeSnippet = {
  file: "notebooks/housing_price_prediction.ipynb",
  lines: null,
  code: "loss_fn = nn.MSELoss()\noptimizer = torch.optim.Adam(model.parameters(), lr=0.01)\n\nepochs = 3000\n\ntrain_losses = []\n\nfor epoch in range(epochs):\n    model.train()\n    \n    \n    y_pred = model(X_train_tensor)\n    loss = loss_fn(y_pred, y_train_tensor)\n    train_losses.append(loss.item())\n    optimizer.zero_grad()\n    \n    loss.backward()\n    optimizer.step()\n    \n    if (epoch+1) % 50 == 0:\n        print(f'Epoch [{epoch+1}/{epochs}], Loss: {loss.item():.4f}')",
};

// Training loss (MSE, printed every 50 epochs) copied from the notebook's output.
export const trainingLoss: [number, number][] = [[50, 13782563840.0], [100, 13743734784.0], [150, 13704278016.0], [200, 13665794048.0], [250, 13627750400.0], [300, 13589407744.0], [350, 13549981696.0], [400, 13510730752.0], [450, 13472226304.0], [500, 13433828352.0], [550, 13396092928.0], [600, 13358396416.0], [650, 13320594432.0], [700, 13283518464.0], [750, 13246801920.0], [800, 13209923584.0], [850, 13172014080.0], [900, 13134099456.0], [950, 13097515008.0], [1000, 13059172352.0], [1050, 13019437056.0], [1100, 12979230720.0], [1150, 12941184000.0], [1200, 12902010880.0], [1250, 12864118784.0], [1300, 12825222144.0], [1350, 12784821248.0], [1400, 12747231232.0], [1450, 12710474752.0], [1500, 12672686080.0], [1550, 12633151488.0], [1600, 12592813056.0], [1650, 12552287232.0], [1700, 12510294016.0], [1750, 12466744320.0], [1800, 12422301696.0], [1850, 12377857024.0], [1900, 12335088640.0], [1950, 12294974464.0], [2000, 12253941760.0], [2050, 12212311040.0], [2100, 12168013824.0], [2150, 12123993088.0], [2200, 12081103872.0], [2250, 12037455872.0], [2300, 11993113600.0], [2350, 11949242368.0], [2400, 11908468736.0], [2450, 11868460032.0], [2500, 11825822720.0], [2550, 11782817792.0], [2600, 11738996736.0], [2650, 11686064128.0], [2700, 11622021120.0], [2750, 11557377024.0], [2800, 11489024000.0], [2850, 11419815936.0], [2900, 11355375616.0], [2950, 11293112320.0], [3000, 11228916736.0]];
