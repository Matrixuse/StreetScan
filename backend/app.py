import os
from datetime import timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

from models import db, User, Comment
# ML predictor (lazy import)
try:
    from ml.infer_classifier import Predictor
except Exception:
    Predictor = None

load_dotenv()

def create_app():
    app = Flask(__name__)

    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///./data.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

    db.init_app(app)
    jwt = JWTManager(app)
    # Allow localhost for development and Render domains for production
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        os.getenv('FRONTEND_URL', ''),  # Set via Render env var
    ]
    allowed_origins = [origin for origin in allowed_origins if origin]  # Remove empty strings
    CORS(app, origins=allowed_origins, supports_credentials=True)

    @app.route('/api/ping')
    def ping():
        return jsonify({'ok': True, 'message': 'pong'})

    @app.route('/api/signup', methods=['POST'])
    def signup():
        data = request.get_json() or {}
        name = data.get('name', '').strip()
        email = (data.get('email') or '').strip().lower()
        password = data.get('password') or ''

        if not name or not email or not password:
            return jsonify({'error': 'name, email, and password required'}), 400

        with app.app_context():
            if User.query.filter_by(email=email).first():
                return jsonify({'error': 'user with this email already exists'}), 409

            password_hash = generate_password_hash(password)
            user = User(name=name, email=email, password_hash=password_hash)
            db.session.add(user)
            db.session.commit()

            access_token = create_access_token(identity=user.id)
            return jsonify({'user': user.to_dict(), 'access_token': access_token}), 201

    @app.route('/api/login', methods=['POST'])
    def login():
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        password = data.get('password') or ''

        if not email or not password:
            return jsonify({'error': 'email and password required'}), 400

        with app.app_context():
            user = User.query.filter_by(email=email).first()
            if not user or not check_password_hash(user.password_hash, password):
                return jsonify({'error': 'invalid credentials'}), 401

            access_token = create_access_token(identity=user.id)
            return jsonify({'user': user.to_dict(), 'access_token': access_token})

    @app.route('/api/me')
    @jwt_required()
    def me():
        user_id = get_jwt_identity()
        with app.app_context():
            user = User.query.get(user_id)
            if not user:
                return jsonify({'error': 'user not found'}), 404
            return jsonify({'user': user.to_dict()})

    # Comments endpoints
    @app.route('/api/reports/<int:report_id>/comments', methods=['GET'])
    def get_comments(report_id):
        with app.app_context():
            comments = Comment.query.filter_by(report_id=report_id).order_by(Comment.created_at.desc()).all()
            return jsonify([c.to_dict() for c in comments])

    @app.route('/api/reports/<int:report_id>/comments', methods=['POST'])
    @jwt_required()
    def post_comment(report_id):
        user_id = get_jwt_identity()
        data = request.get_json() or {}
        text = (data.get('text') or '').strip()
        if not text:
            return jsonify({'error': 'text required'}), 400

        with app.app_context():
            user = User.query.get(user_id)
            if not user:
                return jsonify({'error': 'user not found'}), 404
            comment = Comment(report_id=report_id, user_id=user.id, user_name=user.name, user_email=user.email, text=text)
            db.session.add(comment)
            db.session.commit()
            return jsonify(comment.to_dict()), 201

    # Simple image inference endpoint (classifier)
    @app.route('/api/infer', methods=['POST'])
    def infer():
        # Accepts multipart/form-data with field 'image'
        if 'image' not in request.files:
            return jsonify({'error': 'image file required (form field "image")'}), 400
        img_file = request.files['image']
        img_bytes = img_file.read()

        if Predictor is None:
            return jsonify({'error': 'ML predictor not available on server. Ensure ml package exists and dependencies are installed.'}), 500

        try:
            predictor = app.config.get('PREDICTOR')
            if predictor is None:
                predictor = Predictor()
                app.config['PREDICTOR'] = predictor
            result = predictor.predict_image(img_bytes)
            return jsonify(result)
        except FileNotFoundError as e:
            return jsonify({'error': str(e), 'note': 'Train a classifier first. See backend/ml/README.md for instructions.'}), 500
        except Exception as e:
            return jsonify({'error': 'inference failed', 'detail': str(e)}), 500

    return app


if __name__ == '__main__':
    application = create_app()
    port = int(os.getenv('PORT', 5000))
    # When running directly, ensure DB exists
    with application.app_context():
        from sqlalchemy.exc import OperationalError
        try:
            db.create_all()
        except OperationalError:
            pass
    application.run(host='0.0.0.0', port=port, debug=(os.getenv('FLASK_ENV') == 'development'))
