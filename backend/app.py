from flask import Flask, jsonify
from flask_cors import CORS
from config import app_secret_key, DATABASE_URL
from extensions import db
from errors import AppError

from routes.auth         import auth_bp
from routes.classes      import classes_bp
from routes.dashboard    import dashboard_bp
from routes.exam         import exam_bp
from routes.question     import question_bp
from routes.student      import student_bp
from routes.lesson       import lesson_bp
from routes.relatives    import relatives_bp
from routes.question_bank import question_bank_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.secret_key = app_secret_key

    app.config["SQLALCHEMY_DATABASE_URI"]        = DATABASE_URL
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ENGINE_OPTIONS"]      = {
        "pool_size": 10,
        "pool_recycle": 3600,
        "pool_pre_ping": True,
    }

    db.init_app(app)

    CORS(app, origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ], allow_headers=["Content-Type", "Authorization"])

    app.register_blueprint(auth_bp)
    app.register_blueprint(classes_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(exam_bp)
    app.register_blueprint(question_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(lesson_bp)
    app.register_blueprint(relatives_bp)
    app.register_blueprint(question_bank_bp)

    @app.errorhandler(AppError)
    def handle_app_error(e: AppError):
        return jsonify({"success": False, "message": e.message}), e.status_code

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
