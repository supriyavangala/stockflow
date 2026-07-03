import uuid
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

from extensions import db


def gen_uuid():
    return str(uuid.uuid4())


class Organization(db.Model):
    __tablename__ = "organizations"

    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    name = db.Column(db.String(255), nullable=False)
    default_low_stock_threshold = db.Column(db.Integer, nullable=False, default=5)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    users = db.relationship("User", backref="organization", lazy=True)
    products = db.relationship(
        "Product", backref="organization", lazy=True, cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "default_low_stock_threshold": self.default_low_stock_threshold,
        }


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    organization_id = db.Column(
        db.String(36), db.ForeignKey("organizations.id"), nullable=False
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "organization_id": self.organization_id,
        }


class Product(db.Model):
    __tablename__ = "products"
    __table_args__ = (
        db.UniqueConstraint("organization_id", "sku", name="uq_org_sku"),
    )

    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    organization_id = db.Column(
        db.String(36), db.ForeignKey("organizations.id"), nullable=False
    )
    name = db.Column(db.String(255), nullable=False)
    sku = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    quantity_on_hand = db.Column(db.Integer, nullable=False, default=0)
    cost_price = db.Column(db.Numeric(10, 2), nullable=True)
    selling_price = db.Column(db.Numeric(10, 2), nullable=True)
    low_stock_threshold = db.Column(db.Integer, nullable=True)
    last_updated_by = db.Column(db.String(36), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def effective_threshold(self, org_default):
        if self.low_stock_threshold is not None:
            return self.low_stock_threshold
        return org_default

    def is_low_stock(self, org_default):
        return self.quantity_on_hand <= self.effective_threshold(org_default)

    def to_dict(self, org_default=None):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "name": self.name,
            "sku": self.sku,
            "description": self.description,
            "quantity_on_hand": self.quantity_on_hand,
            "cost_price": float(self.cost_price) if self.cost_price is not None else None,
            "selling_price": float(self.selling_price) if self.selling_price is not None else None,
            "low_stock_threshold": self.low_stock_threshold,
            "is_low_stock": (
                self.is_low_stock(org_default) if org_default is not None else None
            ),
            "last_updated_by": self.last_updated_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
