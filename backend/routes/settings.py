from flask import Blueprint, request, jsonify

from extensions import db
from utils import require_org

settings_bp = Blueprint("settings", __name__, url_prefix="/api/settings")


@settings_bp.get("")
@settings_bp.get("/")
@require_org
def get_settings(user):
    return jsonify(user.organization.to_dict()), 200


@settings_bp.put("")
@settings_bp.put("/")
@require_org
def update_settings(user):
    data = request.get_json(silent=True) or {}
    threshold = data.get("default_low_stock_threshold")

    try:
        threshold = int(threshold)
    except (TypeError, ValueError):
        return jsonify({"error": "default_low_stock_threshold must be an integer"}), 400

    if threshold < 0:
        return jsonify({"error": "default_low_stock_threshold cannot be negative"}), 400

    user.organization.default_low_stock_threshold = threshold
    db.session.commit()
    return jsonify(user.organization.to_dict()), 200
