Civic Issue Model - AI-Powered Civic Infrastructure Complaint System
A full-stack machine learning solution for automatically classifying and routing civic infrastructure complaints (potholes, garbage, waterlogging, etc.) to the appropriate government departments.
🎯 Features
7-Class Image Classification: Automatically categorizes civic issues using deep learning
Dead Animals
Garbage
Illegal Dumping
Potholes
Sewage Issues
Streetlight Problems
Waterlogging
Smart Routing: Automatically routes complaints to the relevant department
REST API: Flask-based API for complaint submission and prediction
Modern UI: React-based frontend with real-time feedback
Database Integration: Supabase for secure data storage
High Accuracy: Fine-tuned TensorFlow/Keras model with class balancing
🚀 Quick Start
Prerequisites
Python 3.10+
Node.js 18+ (for frontend)
Git
Virtual environment (venv/conda)
Backend Setup
Clone the repository
```bash
   git clone <repository-url>
   cd civic_model
   ```
Create and activate virtual environment
```bash
   # Windows
   python -m venv civicenv
   .\civicenv\Scripts\Activate.ps1
   
   # macOS/Linux
   python3 -m venv civicenv
   source civicenv/bin/activate
   ```
Install dependencies
```bash
   pip install -r requirements.txt
   ```
Set up environment variables
```bash
   cp .env.example .env
   # Edit .env: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (recommended for the server)
   # or SUPABASE_KEY (anon key) if you rely on permissive RLS.
   ```
Analyze dataset (optional but recommended)
```bash
   python analyze_dataset.py
   ```
Train the model
```bash
   python train_model.py
   ```
Run the API server
```bash
   python app.py
   ```
The server will start on `http://localhost:5000`
Frontend Setup
Navigate to frontend directory
```bash
   cd frontend
   ```
Install dependencies
```bash
   npm install
   ```
Set up environment variables
```bash
   # Create .env.local file with:
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   # API mode: backend (Flask) or gradio (hosted classifier)
   VITE_REPORT_API_MODE=backend

   # Only needed if mode=gradio
   VITE_GRADIO_API_URL=https://07d03f494fa57b746e.gradio.live/
   ```
Run development server
```bash
   npm run dev
   ```
The frontend will be available at `http://localhost:5173`
Build for production
```bash
   npm run build
   ```
📊 Dataset Structure
```
dataset/
├── dead_animals/
├── garbage/
├── illegal_dumping/
├── pothole/
├── sewer/
├── streetlight/
└── waterlogging/
```
Place your training images in the respective category folders.
📁 Project Structure
```
civic_model/
├── app.py                    # Main Flask application
├── config.py                 # Configuration settings
├── supabase_client.py        # Supabase integration
├── complaints_api.py         # Complaints endpoints
├── utils.py                  # Utility functions
├── train_model.py            # Model training script
├── evaluate_model.py         # Model evaluation
├── analyze_dataset.py        # Dataset analysis
├── test_predictions.py       # Test predictions
├── requirements.txt          # Python dependencies
├── civic_issue_model.h5      # Trained model (generated)
├── dataset/                  # Training data (add your images here)
├── frontend/                 # React frontend
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── templates/                # HTML templates
├── static/                   # CSS/JS assets
├── setup_db.sql             # Database setup script
└── README.md                # This file
```
🤖 Model Details
Architecture: Transfer Learning with MobileNetV2
Input Size: 224×224 pixels
Training: Two-stage fine-tuning
Stage 1: 10 epochs at 1e-4 learning rate
Stage 2: 15 epochs at 3e-5 learning rate
Batch Size: 32
Confidence Threshold: 0.60 (configurable)
🔌 API Endpoints
Base URL
```
http://localhost:5000/api
```
Submit Complaint
```
POST /complaints
Content-Type: multipart/form-data

Parameters:
- image: Image file (JPG/PNG)
- title: Complaint title
- description: Detailed description
- location: Issue location
- user_name: Reporter name
- user_email: Reporter email
```
Response:
```json
{
  "id": "uuid",
  "category": "pothole",
  "confidence": 0.95,
  "department": "Road Department",
  "status": "submitted",
  "message": "Complaint submitted successfully"
}
```
Get Prediction
```
POST /predict
Content-Type: multipart/form-data

Parameters:
- image: Image file
```
Response:
```json
{
  "predictions": {
    "pothole": 0.92,
    "garbage": 0.05,
    "sewer": 0.02
  },
  "top_category": "pothole",
  "confidence": 0.92
}
```
🔑 Environment Variables
Backend (.env)
```
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_api_key
FLASK_ENV=production
DEBUG=False
```
Frontend (.env.local)
```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```
📈 Model Performance
Expected accuracy on balanced test dataset:
Overall Accuracy: ~85-90%
Per-class metrics available in `evaluate_model.py`
🛠️ Development
Running Tests
```bash
python test_predictions.py
```
Evaluating Model
```bash
python evaluate_model.py
```
Linting Frontend
```bash
cd frontend
npm run lint
```
📝 License
MIT License - See LICENSE file for details
👥 Contributing
Fork the repository
Create a feature branch (`git checkout -b feature/amazing-feature`)
Commit changes (`git commit -m 'Add amazing feature'`)
Push to branch (`git push origin feature/amazing-feature`)
Open a Pull Request
🤝 Support
For issues or questions, please:
Check existing issues in the repository
Create a detailed issue with steps to reproduce
Include system information and error messages
🚀 Deployment
Run the Flask API with a production WSGI server (for example `gunicorn` from `requirements.txt`) and serve the built frontend (`npm run build`) from your host or CDN. Configure environment variables on the server the same way as in local `.env` / `frontend/.env.local`.
Cloud Platforms
Heroku: Use Procfile for deployment
Google Cloud: Deploy to Cloud Run
AWS: Use ElasticBeanstalk or Lambda
Azure: Deploy to App Service
Production Checklist
[ ] Set `DEBUG=False` in Flask config
[ ] Use `gunicorn` instead of Flask dev server
[ ] Set up SSL/TLS certificates
[ ] Configure CORS properly
[ ] Set up database backups
[ ] Enable request logging
[ ] Set up monitoring/alerting
📚 Additional Resources
TensorFlow Documentation
Flask Documentation
Supabase Docs
React Documentation
---
Last Updated: April 2026
