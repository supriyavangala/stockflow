from flask import Flask, jsonify

from config import Config
from extensions import db, jwt, cors


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    from routes.auth import auth_bp
    from routes.products import products_bp
    from routes.dashboard import dashboard_bp
    from routes.settings import settings_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(settings_bp)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"}), 200

    @jwt.unauthorized_loader
    def unauthorized_callback(reason):
        return jsonify({"error": "missing or invalid authentication token"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(reason):
        return jsonify({"error": "invalid authentication token"}), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"error": "authentication token has expired"}), 401

    with app.app_context():
        db.create_all()

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
