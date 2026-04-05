# ✅ Civic Model Upgrade - Quick Start Commands

## 📊 1. Analyze Your Dataset
```powershell
python analyze_dataset.py
```
**What it does:**
- Checks class distribution
- Detects corrupted files
- Shows image statistics
- Generates `dataset_distribution.png`

**Expected output:**
```
CLASS DISTRIBUTION
potholes:              234 (18.50%)
garbage:               198 (15.65%)
...
Class Imbalance Ratio: 2.45:1
✅ Class distribution is reasonably balanced
```

---

## 🧠 2. Train Improved Model
```powershell
# Activate environment
& .\civicenv\Scripts\Activate.ps1

# Run training with all improvements
python train_model.py
```

**Key improvements:**
- ✅ Fine-tuning (last 30 layers unfrozen)
- ✅ Fine-tuning (last 30 layers unfrozen)
- ✅ BatchNormalization
- ✅ EarlyStopping (prevents overfitting)
- ✅ Learning rate reduction
- ✅ Class weight balancing
- ✅ Better data augmentation

**Expected output:**
```
UPGRADED CIVIC ISSUE MODEL TRAINING
============================================================
Training with fine-tuning enabled...
Epoch 1/30
...[training progress]...
Epoch 12/30
✅ Model saved as 'civic_issue_model.h5'
Final validation accuracy: 0.8750 (87.50%)
```

---

## 📈 3. Evaluate Performance
```powershell
python evaluate_model.py
```

**What it does:**
- Calculates accuracy, precision, recall, F1-score
- Per-class performance breakdown
- Confidence distribution analysis
- Generates `confusion_matrix.png` and `confidence_distribution.png`

**Target metrics:**
```
EVALUATION METRICS
============================================================
Accuracy:  0.8750 (87.50%)  ← Target: ≥85%
Precision: 0.8650 (86.50%)
Recall:    0.8620 (86.20%)
F1-Score:  0.8635
```

---

## 🧪 4. Test Predictions
```powershell
python test_predictions.py
```

**What it does:**
- Tests prediction logic
- Shows confidence threshold behavior
- Validates department routing
- Tests top-3 predictions per image

**Expected output:**
```
[potholes]
  Image: pothole_001.jpg
  Confidence: 0.9234 (92.34%)
  Is Confident: True
  Predicted: potholes
  Department: Road Department
  Top 3 predictions:
    1. potholes: 0.9234
    2. road_damage: 0.0512
    3. construction_issue: 0.0254

[garbage]
  Confidence: 0.5123 (51.23%)  ← LOW CONFIDENCE!
  Is Confident: False
  Predicted: needs_manual_review
  Department: Manual Review Queue
```

---

## 🚀 5. Run the Application

### **Terminal 1 - Backend (Flask API)**
```powershell
cd c:\Users\haris\OneDrive\Desktop\civic_model
& .\civicenv\Scripts\Activate.ps1
python app.py
```

**Expected output:**
```
Loading AI model architecture...
Loading pretrained weights...
✅ Model loaded successfully.
 * Running on http://127.0.0.1:5000
```

### **Terminal 2 - Frontend (React + Vite)**
```powershell
cd c:\Users\haris\OneDrive\Desktop\civic_model\frontend
npm run dev
```

**Expected output:**
```
  VITE v8.0.1  ready in 500 ms

  ➜  Local:   http://localhost:5173/
```

---

## ✅ Complete Pipeline (One by One)

```powershell
# 1. Analyze dataset
python analyze_dataset.py

# 2. Train model (takes time - go grab coffee!)
python train_model.py

# 3. Evaluate performance
python evaluate_model.py

# 4. Test predictions
python test_predictions.py

# 5. Start backend (keep running)
python app.py

# 6. Start frontend (new terminal)
cd frontend && npm run dev
```

---

## 🎯 Key Configuration

**Confidence Threshold** (in `app.py` line ~40):
```python
CONFIDENCE_THRESHOLD = 0.60  # Adjust 0.50-0.80
```
- **0.50**: More auto routing, less manual review
- **0.60**: Balanced (RECOMMENDED)
- **0.80**: Conservative, more manual review

---

## 📊 Expected Improvements

| Before | After |
|--------|-------|
| No fine-tuning | ✅ Fine-tuning enabled |
| No early stopping | ✅ Prevents overfitting |
| Fixed 15 epochs | ✅ Dynamic with EarlyStopping |
| Model reloaded per request | ✅ Cached at startup |
| No confidence handling | ✅ Threshold-based routing |
| No logging | ✅ Complete logging |
| Basic error handling | ✅ Comprehensive error handling |

---

## 🐛 Troubleshooting

### ❌ "Model not found"
```
Fix: Make sure civic_issue_model.h5 exists
- If not, run: python train_model.py
```

### ❌ "Low accuracy" (< 80%)
```
Steps:
1. Run: python analyze_dataset.py
   → Check if enough data (>50 images per class)
   → Check class imbalance (ratio > 5:1)

2. If data is low quality:
   → Collect more images
   → Clean up dataset (remove corrupted files)

3. Run training again:
   → python train_model.py
```

### ❌ "Too many manual reviews" (>40% routed)
```
Solution: Choose one:
- Option A: Lower threshold (0.55→0.50)
- Option B: Retrain with more data
- Option C: Enable more fine-tuning (increase unfrozen layers)
```

### ❌ "CUDA/GPU errors"
```
The model will use CPU automatically if GPU unavailable
Training will be slower but will work fine
```

---

## 📈 Monitoring Performance

**Weekly checks:**
1. Review manually-reviewed complaints
2. Check for common misclassifications
3. Monitor confidence distribution
4. Check department routing accuracy

**Monthly actions:**
1. Collect feedback from department officers
2. Retrain with corrected labels if needed
3. Run `evaluate_model.py` to track improvements
4. Adjust `CONFIDENCE_THRESHOLD` if needed

---

## 💡 Pro Tips

1. **Faster training**: Use GPU if available
   ```python
   # Check TensorFlow sees GPU
   python -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"
   ```

2. **Check training progress**: Open `train_model.py` and look for plots
   ```
   The file shows real-time metrics
   ```

3. **Save evaluation results**: Keep the PNG files from evaluation
   ```
   confusion_matrix.png → Compare across retrainings
   confidence_distribution.png → Track improvements
   ```

4. **Monitor production**: Check `app.py` logs for:
   - Low confidence predictions
   - Errors and exceptions
   - Processing time per request

---

## ✨ What's New in This Upgrade

### Code Changes Summary:
1. **train_model.py**: +40 lines (fine-tuning, callbacks, class weights)
2. **app.py**: +50 lines (logging, confidence threshold, better error handling)
3. **evaluate_model.py**: NEW (comprehensive evaluation script)
4. **analyze_dataset.py**: NEW (dataset quality analysis)
5. **test_predictions.py**: NEW (prediction testing with threshold)

### Performance Improvements:
- ✅ Better accuracy (fine-tuning + normalization)
- ✅ Faster inference (model caching)
- ✅ Better reliability (error handling + logging)
- ✅ Production-ready (confidence threshold + monitoring)

---

**Ready to get started? Start with `python analyze_dataset.py`! 🚀**
