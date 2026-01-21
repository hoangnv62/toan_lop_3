from flask import Flask
from flask_cors import CORS
from config import app_secret_key
from routes.auth import auth_bp
from routes.classes import classes_bp
from routes.dashboard import dashboard_bp
from routes.exam import exam_bp
from routes.question import question_bp
from routes.student import student_bp
from routes.lesson import lesson_bp

app = Flask(__name__)
app.secret_key = app_secret_key
CORS(app)

# Register blueprints (nhóm routes)
app.register_blueprint(auth_bp)
app.register_blueprint(classes_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(exam_bp)
app.register_blueprint(question_bp)
app.register_blueprint(student_bp)
app.register_blueprint(lesson_bp)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
