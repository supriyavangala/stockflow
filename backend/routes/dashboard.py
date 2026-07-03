from flask import Blueprint, jsonify
from sqlalchemy import func

from extensions import db
from models import Product
from utils import require_org

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@dashboard_bp.get("")
@dashboard_bp.get("/")
@require_org
def dashboard(user):
    org_default = user.organization.default_low_stock_threshold

    products = Product.query.filter_by(organization_id=user.organization_id).all()

    total_products = len(products)
    total_quantity = sum(p.quantity_on_hand for p in products)

    low_stock = [p for p in products if p.is_low_stock(org_default)]
    low_stock_sorted = sorted(low_stock, key=lambda p: p.quantity_on_hand)

    return jsonify({
        "total_products": total_products,
        "total_quantity_on_hand": total_quantity,
        "low_stock_count": len(low_stock),
        "low_stock_items": [
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "quantity_on_hand": p.quantity_on_hand,
                "low_stock_threshold": p.effective_threshold(org_default),
            }
            for p in low_stock_sorted
        ],
    }), 200
