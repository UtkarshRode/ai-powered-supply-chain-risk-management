import { useEffect, useMemo, useState } from "react";

interface SupplierProduct {
  id: string;
  productId: string;
  unitCost: number;
  leadTimeDays: number;
  product: {
    id: string;
    sku: string;
    name: string;
  };
}

interface Supplier {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  reliability: number;
  products: SupplierProduct[];
}

interface SupplierPageProps {
  token: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function SupplierPage({
  token,
}: SupplierPageProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(
    []
  );

  const [selectedSupplierId, setSelectedSupplierId] =
    useState("");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/suppliers`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to fetch suppliers"
        );
      }

      const fetchedSuppliers =
        result.data.suppliers || [];

      setSuppliers(fetchedSuppliers);

      if (fetchedSuppliers.length > 0) {
        setSelectedSupplierId(
          fetchedSuppliers[0].id
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch suppliers"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [token]);

  const filteredSuppliers = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) {
      return suppliers;
    }

    return suppliers.filter((supplier) =>
      [
        supplier.name,
        supplier.email ?? "",
        supplier.phone ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [suppliers, search]);

  const selectedSupplier = suppliers.find(
    (supplier) =>
      supplier.id === selectedSupplierId
  );

  /*
   * Backend stores reliability as a decimal:
   *
   * 0.92 = 92%
   * 0.75 = 75%
   * 0.50 = 50%
   *
   * Convert it to percentage only for display
   * and percentage-based classification.
   */
  const getReliabilityPercentage = (
    reliability: number
  ) => {
    return reliability * 100;
  };

  const averageReliability =
    suppliers.length > 0
      ? suppliers.reduce(
          (sum, supplier) =>
            sum +
            getReliabilityPercentage(
              supplier.reliability
            ),
          0
        ) / suppliers.length
      : 0;

  const totalProducts = suppliers.reduce(
    (sum, supplier) =>
      sum + supplier.products.length,
    0
  );

  const getReliabilityClass = (
    reliability: number
  ) => {
    const percentage =
      getReliabilityPercentage(reliability);

    if (percentage >= 80) {
      return "supplier-reliability good";
    }

    if (percentage >= 50) {
      return "supplier-reliability medium";
    }

    return "supplier-reliability poor";
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <h2>Suppliers</h2>
          <p>
            Monitor suppliers, reliability and lead
            times.
          </p>
        </div>

        <div className="system-status">
          <span></span>
          {suppliers.length} Suppliers
        </div>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <section className="supplier-kpi-grid">
        <div className="kpi-card">
          <span>Total Suppliers</span>

          <strong>
            {suppliers.length}
          </strong>

          <small>
            Active supplier records
          </small>
        </div>

        <div className="kpi-card">
          <span>Average Reliability</span>

          <strong>
            {averageReliability.toFixed(0)}%
          </strong>

          <small>
            Across all suppliers
          </small>
        </div>

        <div className="kpi-card">
          <span>Products Supplied</span>

          <strong>
            {totalProducts}
          </strong>

          <small>
            Supplier-product relationships
          </small>
        </div>

        <div className="kpi-card">
          <span>Selected Supplier</span>

          <strong>
            {selectedSupplier
              ? getReliabilityPercentage(
                  selectedSupplier.reliability
                ).toFixed(0)
              : 0}
            %
          </strong>

          <small>
            Current reliability
          </small>
        </div>
      </section>

      <section className="dashboard-card">
        <div className="orders-toolbar">
          <div>
            <h3>All Suppliers</h3>

            <p>
              Select a supplier to inspect its
              products and reliability.
            </p>
          </div>

          <input
            className="order-search"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        {loading ? (
          <div className="empty-state">
            Loading suppliers...
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="empty-state">
            No suppliers found.
          </div>
        ) : (
          <div className="supplier-table">
            <div className="supplier-row table-header">
              <span>SUPPLIER</span>
              <span>CONTACT</span>
              <span>RELIABILITY</span>
              <span>PRODUCTS</span>
            </div>

            {filteredSuppliers.map(
              (supplier) => (
                <div
                  className={`supplier-row ${
                    selectedSupplierId ===
                    supplier.id
                      ? "selected-row"
                      : ""
                  }`}
                  key={supplier.id}
                  onClick={() =>
                    setSelectedSupplierId(
                      supplier.id
                    )
                  }
                >
                  <div>
                    <strong>
                      {supplier.name}
                    </strong>

                    <small>
                      {supplier.id}
                    </small>
                  </div>

                  <div>
                    <strong>
                      {supplier.email ||
                        "No email"}
                    </strong>

                    <small>
                      {supplier.phone ||
                        "No phone"}
                    </small>
                  </div>

                  <span
                    className={getReliabilityClass(
                      supplier.reliability
                    )}
                  >
                    {getReliabilityPercentage(
                      supplier.reliability
                    ).toFixed(0)}
                    %
                  </span>

                  <span>
                    {supplier.products.length}
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {selectedSupplier && (
        <section className="dashboard-card supplier-details">
          <div className="supplier-details-header">
            <div>
              <h3>
                {selectedSupplier.name}
              </h3>

              <p>
                Supplier details and supplied
                products.
              </p>
            </div>

            <span
              className={getReliabilityClass(
                selectedSupplier.reliability
              )}
            >
              {getReliabilityPercentage(
                selectedSupplier.reliability
              ).toFixed(0)}
              % Reliability
            </span>
          </div>

          <div className="supplier-info-grid">
            <div className="supplier-info-card">
              <span>Email</span>

              <strong>
                {selectedSupplier.email ||
                  "Not provided"}
              </strong>
            </div>

            <div className="supplier-info-card">
              <span>Phone</span>

              <strong>
                {selectedSupplier.phone ||
                  "Not provided"}
              </strong>
            </div>

            <div className="supplier-info-card">
              <span>Reliability</span>

              <strong>
                {getReliabilityPercentage(
                  selectedSupplier.reliability
                ).toFixed(0)}
                %
              </strong>
            </div>

            <div className="supplier-info-card">
              <span>Products</span>

              <strong>
                {selectedSupplier.products.length}
              </strong>
            </div>
          </div>

          <div className="supplier-products">
            <h4>Supplied Products</h4>

            {selectedSupplier.products.length ===
            0 ? (
              <div className="empty-state">
                No products assigned to this
                supplier.
              </div>
            ) : (
              <div className="supplier-product-table">
                <div className="supplier-product-row table-header">
                  <span>PRODUCT</span>
                  <span>SKU</span>
                  <span>UNIT COST</span>
                  <span>LEAD TIME</span>
                </div>

                {selectedSupplier.products.map(
                  (item) => (
                    <div
                      className="supplier-product-row"
                      key={item.id}
                    >
                      <span>
                        {item.product.name}
                      </span>

                      <span>
                        {item.product.sku}
                      </span>

                      <span>
                        ₹
                        {Number(
                          item.unitCost
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </span>

                      <span>
                        {item.leadTimeDays} days
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}