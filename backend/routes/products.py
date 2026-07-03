from flask import Blueprint, request, jsonify
from sqlalchemy import or_

from extensions import db
from models import Product
from utils import require_org

products_bp = Blueprint("products", __name__, url_prefix="/api/products")


def _org_default(user):
    return user.organization.default_low_stock_threshold


def _parse_decimal(value):
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        raise ValueError("must be a number")


@products_bp.get("")
@products_bp.get("/")
@require_org
def list_products(user):
    search = request.args.get("search", "").strip()
    query = Product.query.filter_by(organization_id=user.organization_id)
    if search:
        like = f"%{search}%"
        query = query.filter(or_(Product.name.ilike(like), Product.sku.ilike(like)))
    products = query.order_by(Product.created_at.desc()).all()
    org_default = _org_default(user)
    return jsonify([p.to_dict(org_default) for p in products]), 200


@products_bp.post("")
@products_bp.post("/")
@require_org
def create_product(user):
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    sku = (data.get("sku") or "").strip()

    if not name or not sku:
        return jsonify({"error": "name and sku are required"}), 400

    existing = Product.query.filter_by(organization_id=user.organization_id, sku=sku).first()
    if existing:
        return jsonify({"error": "a product with this SKU already exists"}), 409

    try:
        cost_price = _parse_decimal(data.get("cost_price"))
        selling_price = _parse_decimal(data.get("selling_price"))
    except ValueError:
        return jsonify({"error": "cost_price and selling_price must be numbers"}), 400

    quantity = data.get("quantity_on_hand", 0)
    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return jsonify({"error": "quantity_on_hand must be an integer"}), 400

    threshold = data.get("low_stock_threshold")
    if threshold not in (None, ""):
        try:
            threshold = int(threshold)
        except (TypeError, ValueError):
            return jsonify({"error": "low_stock_threshold must be an integer"}), 400
    else:
        threshold = None

    product = Product(
        organization_id=user.organization_id,
        name=name,
        sku=sku,
        description=(data.get("description") or "").strip() or None,
        quantity_on_hand=quantity,
        cost_price=cost_price,
        selling_price=selling_price,
        low_stock_threshold=threshold,
        last_updated_by=user.email,
    )
    db.session.add(product)
    db.session.commit()
    return jsonify(product.to_dict(_org_default(user))), 201


def _get_scoped_product(user, product_id):
    return Product.query.filter_by(
        id=product_id, organization_id=user.organization_id
    ).first()


@products_bp.get("/<product_id>")
@require_org
def get_product(user, product_id):
    product = _get_scoped_product(user, product_id)
    if not product:
        return jsonify({"error": "product not found"}), 404
    return jsonify(product.to_dict(_org_default(user))), 200


@products_bp.put("/<product_id>")
@require_org
def update_product(user, product_id):
    product = _get_scoped_product(user, product_id)
    if not product:
        return jsonify({"error": "product not found"}), 404

    data = request.get_json(silent=True) or {}

    if "sku" in data:
        new_sku = (data.get("sku") or "").strip()
        if not new_sku:
            return jsonify({"error": "sku cannot be empty"}), 400
        clash = Product.query.filter(
            Product.organization_id == user.organization_id,
            Product.sku == new_sku,
            Product.id != product.id,
        ).first()
        if clash:
            return jsonify({"error": "a product with this SKU already exists"}), 409
        product.sku = new_sku

    if "name" in data:
        new_name = (data.get("name") or "").strip()
        if not new_name:
            return jsonify({"error": "name cannot be empty"}), 400
        product.name = new_name

    if "description" in data:
        product.description = (data.get("description") or "").strip() or None

    if "quantity_on_hand" in data:
        try:
            product.quantity_on_hand = int(data.get("quantity_on_hand"))
        except (TypeError, ValueError):
            return jsonify({"error": "quantity_on_hand must be an integer"}), 400

    if "cost_price" in data:
        try:
            product.cost_price = _parse_decimal(data.get("cost_price"))
        except ValueError:
            return jsonify({"error": "cost_price must be a number"}), 400

    if "selling_price" in data:
        try:
            product.selling_price = _parse_decimal(data.get("selling_price"))
        except ValueError:
            return jsonify({"error": "selling_price must be a number"}), 400

    if "low_stock_threshold" in data:
        threshold = data.get("low_stock_threshold")
        if threshold in (None, ""):
            product.low_stock_threshold = None
        else:
            try:
                product.low_stock_threshold = int(threshold)
            except (TypeError, ValueError):
                return jsonify({"error": "low_stock_threshold must be an integer"}), 400

    product.last_updated_by = user.email
    db.session.commit()
    return jsonify(product.to_dict(_org_default(user))), 200


@products_bp.delete("/<product_id>")
@require_org
def delete_product(user, product_id):
    product = _get_scoped_product(user, product_id)
    if not product:
        return jsonify({"error": "product not found"}), 404
    db.session.delete(product)
    db.session.commit()
    return jsonify({"success": True}), 200


@products_bp.post("/<product_id>/adjust")
@require_org
def adjust_stock(user, product_id):
    """Inline stock adjustment: body { delta: int, note: str }"""
    product = _get_scoped_product(user, product_id)
    if not product:
        return jsonify({"error": "product not found"}), 404

    data = request.get_json(silent=True) or {}
    try:
        delta = int(data.get("delta"))
    except (TypeError, ValueError):
        return jsonify({"error": "delta must be an integer"}), 400

    new_qty = product.quantity_on_hand + delta
    if new_qty < 0:
        return jsonify({"error": "resulting quantity cannot be negative"}), 400

    product.quantity_on_hand = new_qty
    product.last_updated_by = user.email
    db.session.commit()
    return jsonify(product.to_dict(_org_default(user))), 200
