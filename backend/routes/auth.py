from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token

from extensions import db
from models import User, Organization

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/signup")
def signup():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    org_name = (data.get("organization_name") or "").strip()

    if not email or not password or not org_name:
        return jsonify({"error": "email, password, and organization_name are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "password must be at least 6 characters"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "an account with this email already exists"}), 409

    org = Organization(name=org_name)
    db.session.add(org)
    db.session.flush()  # get org.id before commit

    user = User(email=email, organization_id=org.id)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=user.id)
    return jsonify({
        "token": token,
        "user": user.to_dict(),
        "organization": org.to_dict(),
    }), 201


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "invalid email or password"}), 401

    token = create_access_token(identity=user.id)
    return jsonify({
        "token": token,
        "user": user.to_dict(),
        "organization": user.organization.to_dict(),
    }), 200
