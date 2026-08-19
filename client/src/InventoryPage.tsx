import { useEffect, useMemo, useState } from "react";

interface InventoryItem {
  id: string;
  warehouseId: string;
  productId: string;
  quantity: number;
  reserved: number;
  warehouse: {
    id: string;
    name: string;
    location: string;
    capacity: number;
  };
  product: {
    id: string;
    sku: string;
    name: string;
  };
}

interface InventoryPageProps {
  token: string;
}

const API_URL = "http://localhost:5000/api";

export default function InventoryPage({
  token,
}: InventoryPageProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/inventory`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to fetch inventory"
        );
      }

      setInventory(result.data.inventory || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch inventory"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [token]);

  const filteredInventory = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) {
      return inventory;
    }

    return inventory.filter((item) =>
      [
        item.product.sku,
        item.product.name,
        item.warehouse.name,
        item.warehouse.location,
      ]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [inventory, search]);

  const getAvailable = (item: InventoryItem) =>
    item.quantity - item.reserved;

  const getThreshold = (item: InventoryItem) =>
    item.warehouse.capacity * 0.2;

  const isLowStock = (item: InventoryItem) =>
    getAvailable(item) < getThreshold(item);

  const totalUnits = inventory.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalReserved = inventory.reduce(
    (sum, item) => sum + item.reserved,
    0
  );

  const lowStockCount = inventory.filter(
    isLowStock
  ).length;

  return (
    <>
      <div className="page-heading">
        <div>
          <h2>Inventory</h2>
          <p>
            Monitor warehouse stock and inventory risk.
          </p>
        </div>

        <div className="system-status">
          <span></span>
          {inventory.length} Records
        </div>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <section className="inventory-kpi-grid">
        <div className="kpi-card">
          <span>Inventory Records</span>
          <strong>{inventory.length}</strong>
          <small>Products across warehouses</small>
        </div>

        <div className="kpi-card">
          <span>Total Units</span>
          <strong>{totalUnits}</strong>
          <small>Physical stock</small>
        </div>

        <div className="kpi-card">
          <span>Reserved Units</span>
          <strong>{totalReserved}</strong>
          <small>Currently reserved</small>
        </div>

        <div className="kpi-card">
          <span>Low Stock</span>
          <strong>{lowStockCount}</strong>
          <small>Requires attention</small>
        </div>
      </section>

      <section className="dashboard-card">
        <div className="orders-toolbar">
          <div>
            <h3>Warehouse Inventory</h3>
            <p>
              Review available stock and inventory risk.
            </p>
          </div>

          <input
            className="order-search"
            placeholder="Search inventory..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        {loading ? (
          <div className="empty-state">
            Loading inventory...
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="empty-state">
            No inventory found.
          </div>
        ) : (
          <div className="inventory-table">
            <div className="inventory-row table-header">
              <span>PRODUCT</span>
              <span>WAREHOUSE</span>
              <span>QUANTITY</span>
              <span>RESERVED</span>
              <span>AVAILABLE</span>
              <span>STATUS</span>
            </div>

            {filteredInventory.map((item) => {
              const available =
                getAvailable(item);

              const lowStock =
                isLowStock(item);

              return (
                <div
                  className="inventory-row"
                  key={item.id}
                >
                  <div>
                    <strong>
                      {item.product.sku}
                    </strong>
                    <small>
                      {item.product.name}
                    </small>
                  </div>

                  <div>
                    <strong>
                      {item.warehouse.name}
                    </strong>
                    <small>
                      {item.warehouse.location}
                    </small>
                  </div>

                  <span>
                    {item.quantity}
                  </span>

                  <span>
                    {item.reserved}
                  </span>

                  <span className="available-stock">
                    {available}
                  </span>

                  <span
                    className={`inventory-status ${
                      lowStock
                        ? "low"
                        : "healthy"
                    }`}
                  >
                    {lowStock
                      ? "LOW STOCK"
                      : "HEALTHY"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}