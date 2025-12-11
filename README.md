# StreetScan: AI-Powered Pothole Detection System

A full-stack application that uses deep learning (ResNet-18 CNN) to detect potholes from images and crowdsource road damage reports.

## 🎯 Features
- 🤖 **AI-Powered Detection**: ResNet-18 CNN trained on ~1,900 pothole images
- 📍 **Geolocation**: Automatic GPS location capture on report submission
- 📱 **Responsive UI**: React + Vite frontend with Tailwind CSS
- 🔐 **User Authentication**: JWT-based login/signup system
- 💾 **Local Storage**: LocalStorage-based data persistence
- 🗳️ **Community Voting**: Upvote important pothole reports
- 🗑️ **Report Management**: Delete your own submitted reports
- ✅ **Image Validation**: Model checks if uploaded image is actually a pothole before submission

## 🛠️ Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Flask, SQLAlchemy, Flask-CORS, Flask-JWT-Extended
- **ML**: PyTorch, torchvision, ResNet-18 transfer learning
- **Database**: SQLite
- **GPU**: CUDA 13.0 (RTX 5050 tested)

## 📁 Project Structure
```
STREET SCAN/
├── frontend/                     # React Vite app
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx        # User login + geolocation prompt
│   │   │   ├── Signup.jsx       # User registration
│   │   │   ├── Report.jsx       # Upload pothole report with ML validation
│   │   │   ├── Gallery.jsx      # View all pothole reports
│   │   │   ├── MyReports.jsx    # View & delete your reports
│   │   │   └── ReportDetail.jsx # Report details & comments
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/                      # Flask API + ML pipeline
│   ├── app.py                    # Flask server with /api/infer endpoint
│   ├── models.py                 # Database models
│   ├── init_db.py
│   ├── ml/
│   │   ├── train_classifier.py   # Train ResNet-18 with GPU support
│   │   ├── infer_classifier.py   # Load model & predict
│   │   ├── test_infer.py         # Inference test script
│   │   ├── convert_yolo_to_imagefolder.py
│   │   └── weights/
│   │       └── classifier.pth    # Trained model weights (~50 MB)
│   ├── requirements.txt
│   └── README.md
├── dataset/
│   ├── imagefolder_train/        # ImageFolder dataset structure
│   │   ├── Potholes/             # ~1,304 pothole images
│   │   └── NonPotholes/          # ~605 non-pothole images
│   ├── Dataset_Info.csv
│   └── data.yaml
├── instance/                     # Flask instance folder
├── .gitignore
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites
- Python 3.11+ (3.11 recommended for PyTorch compatibility)
- Node.js 18+
- Git
- NVIDIA GPU with CUDA 13.0 (optional, for GPU training)

### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install PyTorch with GPU support (CUDA 13.0)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu130

# Install dependencies
pip install -r requirements.txt

# Initialize database
python init_db.py
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install
```

## 🎮 Running the Application

### Start Backend Server
```bash
cd backend
python app.py
# Runs on http://127.0.0.1:5000
```

### Start Frontend Dev Server
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

Then open your browser to **http://localhost:5173**

## 🧠 Training the Model

If you want to retrain the model:

```bash
cd backend/ml

python train_classifier.py \
  --data_dir ../../dataset/imagefolder_train \
  --epochs 20 \
  --batch 32 \
  --num_workers 4 \
  --pretrained \
  --balanced \
  --val_split 0.1
```

### Training Parameters
- `--epochs`: Number of training epochs (default: 20)
- `--batch`: Batch size (default: 32)
- `--num_workers`: DataLoader workers (default: 4)
- `--pretrained`: Use ImageNet pretrained weights (default: True)
- `--balanced`: Use weighted sampling for class balance (default: True)
- `--val_split`: Validation split ratio (default: 0.1)

## 🔍 Testing Inference

```bash
cd backend

# Set PYTHONPATH and run test
set PYTHONPATH=.
python ml/test_infer.py --image path/to/image.jpg
```

Example output:
```json
{
  "classes": ["NonPothole", "Pothole"],
  "pothole_confidence": 0.9998,
  "nonpothole_confidence": 0.0002,
  "pothole_present": true
}
```

## 📡 API Endpoints

### Authentication
- `POST /api/register` — Register new user
- `POST /api/login` — User login

### Pothole Detection
- `POST /api/infer` — Classify image for pothole detection
  ```bash
  curl -X POST http://localhost:5000/api/infer \
    -F "image=@pothole.jpg"
  ```

## 🧠 Model Details

| Property | Value |
|----------|-------|
| Architecture | ResNet-18 (ImageNet pretrained) |
| Classes | 2 (Pothole, Non-Pothole) |
| Training Samples | ~1,300 pothole + ~600 non-pothole |
| Validation Split | 10% |
| Optimizer | AdamW |
| Learning Rate | 1e-4 |
| Mixed Precision | Enabled (AMP) |
| Sampling | Weighted (class balanced) |
| Weights File | `backend/ml/weights/classifier.pth` |
| Model Size | ~50 MB |

## 💡 How It Works

1. **User Login**: User logs in and optionally provides geolocation
2. **Report Creation**: User uploads a pothole image and location details
3. **AI Validation**: Model classifies the image:
   - If pothole detected → ✅ Report submitted
   - If non-pothole → ❌ Error message shown
4. **Community**: Users view all reports, upvote important ones, and comment
5. **Management**: Users can delete their own reports

## 🔐 Security Notes
- Passwords are hashed using JWT
- Reports stored in localStorage (client-side)
- No external API calls (offline capable)

## 🚧 Future Enhancements
- [ ] Persistent database (PostgreSQL/MongoDB)
- [ ] Real-time map with clustering
- [ ] Mobile app (React Native/Flutter)
- [ ] Admin dashboard for report verification
- [ ] Model serving with TensorFlow/ONNX
- [ ] Docker containerization
- [ ] CI/CD pipeline (GitHub Actions)

## 📝 License
MIT License

## 👤 Author
[Your Name/Organization]

## 🤝 Contributing
Contributions are welcome! Please fork and submit a pull request.

## 📧 Contact
For issues or questions, please open a GitHub issue.
